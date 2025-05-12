import React, { useState, useEffect } from 'react';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import './Nav.css';

export default function Nav() {
  const [userEmail, setUserEmail] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if the user is logged in
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
  }, []);

  // Check if dark mode is enabled and apply it when the page loads
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true'; // Get saved theme from localStorage
    setIsDarkMode(savedMode);
    if (savedMode) {
      document.body.classList.add('dark-mode'); // Apply dark mode styles to body
    } else {
      document.body.classList.remove('dark-mode'); // Remove dark mode styles
    }
  }, []);

  // Handle logout functionality
  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    setUserEmail(null);
    window.location.href = '/';
  };

  // Toggle dark mode and save to localStorage
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode); // Save theme preference to localStorage

    if (newMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  return (
    <div className="container-fluid py-2 sticky-top" id="header-cf">
      <div className="container">
        <nav className="navbar navbar-expand-lg">
          <a className="navbar-brand" href="/">
            <h2 className='text-info' id='logo'>Ka<span className="">IRA</span></h2>
          </a>

          <button
            className="navbar-toggler border border-white"
            type="button"
            data-toggle="collapse"
            data-target="#collapsibleNavbar"
          >
            <span className="navbar-toggler-icon text-white font-weight-bolder">
              <DensityMediumIcon />
            </span>
          </button>

          <div className="collapse navbar-collapse header-nav" id="collapsibleNavbar">
            <ul className="navbar-nav mr-auto d-flex justify-content-end">
              <li className="nav-item active">
                <a className="nav-link" href="/">Home</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/aboutpage">About</a>
              </li>

              {!userEmail ? (
                <li className="nav-item">
                  <a className="nav-link" href="/login">Signin</a>
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <span className="nav-link">{userEmail}</span>
                  </li>
                  <li className="nav-item">
                    <button
                      className="btn btn-link nav-link text-danger"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </li>
                </>
              )}

              <li className="nav-item">
                <a className="nav-link" onClick={toggleDarkMode} style={{ cursor: 'pointer' }}>
                  <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} py-3`}></i>
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}
