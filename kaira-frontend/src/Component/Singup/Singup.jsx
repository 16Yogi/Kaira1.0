import React, { useState } from "react";
import './Singup.css'

export default function Signup() {
  // Initialize form state with field names matching backend expectation
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form Data Submitted:", formData);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || "Signup failed");
      }

      const result = await response.json();
      console.log("Signup Success:", result);
      alert("Signup successful!");
      window.location.assign('http://localhost:5173/Chat');
    } catch (error) {
      console.error("Error:", error.message);
      alert("Signup failed: " + error.message);
    }
  };

  return (
    <div className="container-fluid" id="signup-form">
      <div className="container">
        <div className="login-page">
          <div className="form">
            <form className="login-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Full Name"
                name="name"   // Changed from 'fullname' to 'name'
                value={formData.name}
                onChange={handleChange}
                required
              />
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
              <button className="btn-info" type="submit">
                Create
              </button>
              <p className="message">
                Already registered?{" "}
                <a href="/login" className="text-info">
                  Sign In
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
