import React from 'react';
import {  Link } from 'react-router-dom';
import { useAuthStore } from '../hooks';

import './Navbar.css'

const Navbar = () => {

  const { startLogOut } = useAuthStore();

  return (
    <>
      <ul className="navbar">
        <Link to="/implants/" style={{ textDecoration: 'none' }}><li>Implantes</li></Link>
        <button onClick={startLogOut}>►</button>
      </ul>
    </>
  );
};

export default Navbar;