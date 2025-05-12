import React, { useState } from 'react';
import './Login.css';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loggedIn, setLoggedIn] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("userEmail", formData.email);

      alert(data.message || "Login successful!");
      setLoggedIn(true);

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }

    } catch (error) {
      console.error("Error:", error.message);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="container-fluid" id="login-form">
      <div className="container">
        <div className="login-page">
          <div className="form">
            <form className="login-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email Address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button className="btn-info" type="submit">Login</button>
              {!loggedIn && (
                <p className="message">
                  Not registered? <a href="/singup" className="text-info">Create an account</a>
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
