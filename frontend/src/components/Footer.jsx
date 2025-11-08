import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#0D47A1"/>
      <path d="M11 20.5L16.5 26L29 14" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Footer() {
    return (
        <footer className="bg-neutral text-neutral-content">
            <div className="footer max-w-7xl mx-auto p-10">
                <aside>
                    <Logo />
                    <p className="font-bold text-lg">
                      eGov Civic Tracker
                    </p>
                    <p>Improving communities, one report at a time.</p>
                    <p>© {new Date().getFullYear()} eGov Tracker. All rights reserved.</p>
                </aside> 
                <nav>
                    <h6 className="footer-title">Quick Links</h6> 
                    <Link to="/" className="link link-hover">Dashboard</Link>
                    <Link to="/public-map" className="link link-hover">Public Map</Link>
                    <Link to="/report-issue" className="link link-hover">Report an Issue</Link>
                </nav> 
                <nav>
                    <h6 className="footer-title">Account</h6> 
                    <Link to="/login" className="link link-hover">Login</Link>
                    <Link to="/signup" className="link link-hover">Sign Up</Link>
                    <Link to="/profile" className="link link-hover">Edit Profile</Link>
                </nav> 
                <nav>
                    <h6 className="footer-title">Legal</h6> 
                    <a className="link link-hover">Terms of use</a>
                    <a className="link link-hover">Privacy policy</a>
                    <a className="link link-hover">Cookie policy</a>
                </nav>
            </div>
        </footer>
    );
}