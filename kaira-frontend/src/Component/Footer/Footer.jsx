import React, { useState } from 'react';
import './Footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return alert("Please enter your email.");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/subscribe/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Thanks for subscribing!");
        setEmail('');
      } else {
        alert("Failed to subscribe: " + data.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <>
      <div className="container-fluid py-5" id="footer-cf">
        <div className="container py-2">
          <h2>Contact us</h2>
          <hr className="bg-white" />
          <div className="row py-2">
            <div className="col-lg-7 col-md-6 col-sm-12">
              <h4>Social Media</h4>
              <ul className="px-0 py-2">
                <li><a href="/"><i className="fa-brands fa-youtube"></i></a></li>
                <li><a href="/"><i className="fa-brands fa-facebook-f"></i></a></li>
                <li><a href="/"><i className="fa-brands fa-instagram"></i></a></li>
                <li><a href="/"><i className="fa-brands fa-x-twitter"></i></a></li>
                <li><a href="/"><i className="fa-brands fa-linkedin-in"></i></a></li>
              </ul>
            </div>
            <div className="col-lg-5 col-md-6 col-sm-12" id="form">
              <h4>Subscribe</h4>
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email.."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className="btn btn-info mt-2" type="submit">Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="container-fluid py-3" id="copyright">
        <div className="container">
          <p className="text-center">All Rights Reserved © - 2024 By Kaira</p>
        </div>
      </div>
    </>
  );
}
