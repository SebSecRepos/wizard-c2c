import React from 'react'
import { FaGithub, FaLinkedin } from "react-icons/fa";
import './Footer.css'


export default function Footer() {
  return (
    <footer className="footer">
      <a
        href="https://github.com/SebSecRepos/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaGithub size={24} className='footer-icon'/>
      </a>
      <a
        href="https://www.linkedin.com/in/sebastián-belettieri-775125275"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaLinkedin size={24} className='s'/>
      </a>
      <p>Belettieri Sebastián</p>
    </footer>
  );
}
