import React, { useState } from 'react';
import Webcam from 'react-webcam';
import { marked } from 'marked';
import './Chatarea.css';

export default function Chatarea() {
  const [conversation, setConversation] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [speakingIndex, setSpeakingIndex] = useState(null);

  const speakText = (text, index) => {
    // Stop any ongoing speech first
    window.speechSynthesis.cancel();
  
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingIndex(null); // Reset after speech ends
    window.speechSynthesis.speak(utterance);
    setSpeakingIndex(index); // Track which index is speaking
  };
  
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  };

  
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { role: 'user', text: inputMessage };
    setConversation((prev) => [...prev, userMessage]);
    setInputMessage('');

    const payload = { message: userMessage.text };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Chat API failed");
      }

      const data = await response.json();
      const aiMessage = { role: 'ai', text: data.response };
      setConversation((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat API error:", error.message);
      const errorMessage = { role: 'ai', text: "Error: " + error.message };
      setConversation((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // Copy text to clipboard
const handleCopy = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => alert("Copied to clipboard!"))
    .catch((err) => console.error("Copy failed:", err));
};

// Export to Word document
const handleExportToWord = (text) => {
  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' 
                      xmlns:w='urn:schemas-microsoft-com:office:word' 
                      xmlns='http://www.w3.org/TR/REC-html40'>
                    <head><meta charset='utf-8'><title>Export HTML to Word</title></head><body>`;
  const footer = "</body></html>";
  const sourceHTML = header + `<p>${text}</p>` + footer;

  const blob = new Blob(['\ufeff', sourceHTML], {
    type: 'application/msword'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'chat_response.doc';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  return (
    <div className="container-fluid py-3" id="chat-cf">
      <div className="container">
        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-3 col-md-4 col-sm-12">
            <div className="col" id="webcam-container">
              <Webcam className="p-0 m-0" />
            </div>
            <div className="col py-2 history mt-3">
              {[...Array(6)].map((_, index) => (
                <div className="his-item" key={index}>
                  <p>Lorem ipsum dolor sit amet</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-lg-8 col-md-8 col-sm-12" id="chat-area">
            <div className="col py-3 chatshow">
              {conversation.map((msg, index) => (
                <div
                className={`py-0 message-wrapper ${msg.role === 'user' ? 'user-msg' : 'ai-msg'}`}
                key={index}
              >
                {msg.role === 'ai' ? (
                  <div
                    className={`message-text ai-bg`}
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}
                  />
                ) : (
                  <p className={`message-text user-bg`}>{msg.text}</p>
                )}
              
              {msg.role === 'ai' && (
  <div className="icons">
    <i
      className="fa-regular fa-copy text-success px-2"
      onClick={() => handleCopy(msg.text)}
      style={{ cursor: 'pointer' }}
    ></i>
    <i
      className="fa-solid fa-file text-warning px-2"
      onClick={() => handleExportToWord(msg.text)}
      style={{ cursor: 'pointer' }}
    ></i>

    {speakingIndex !== index ? (
      <i
        className="fa-solid fa-volume-low text-dark px-2"
        style={{ cursor: 'pointer' }}
        onClick={() => speakText(msg.text, index)}
      ></i>
    ) : (
      <i
        className="fa-solid fa-volume-xmark text-danger px-2"
        style={{ cursor: 'pointer' }}
        onClick={stopSpeaking}
      ></i>
    )}
  </div>
)}

              </div>
              
              ))}
            </div>

            {/* Input Section */}
            <div className="prompt mt-3 p-2 d-flex align-items-center">
              <i className="fa-solid fa-plus"></i>
              <input
                type="text"
                placeholder="How can I help you..."
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              <i className="fa-solid fa-arrow-up" onClick={handleSend} style={{ cursor: 'pointer' }}></i>
            </div>

            {/* Tool Options */}
            <div className="tools py-4 text-center">
              <span><i className="fa-solid fa-file-lines mr-2 text-warning"></i> Summarize text</span>
              <span><i className="fa-solid fa-lightbulb mr-2 text-success"></i> Get advice</span>
              <span><i className="fa-solid fa-hat-cowboy mr-2 text-danger"></i> Cyber Security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
