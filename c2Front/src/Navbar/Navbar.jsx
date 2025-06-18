import React from 'react';
import {  Link } from 'react-router-dom';
import { useAuthStore } from '../hooks';

import './Navbar.css'

const Navbar = () => {

  const { startLogOut, user } = useAuthStore();

  return (
    <>
      <ul className="navbar">
        <Link to="/implants/" style={{ textDecoration: 'none' }}><li>Implantes</li></Link>
        <Link to="/botnet/" style={{ textDecoration: 'none' }}><li>Botnet</li></Link>
        {
          user.role === "admin" &&  <Link to="/create_user/" style={{ textDecoration: 'none' }}><li>Crear usuario</li></Link>
        }
       
        <button onClick={startLogOut}>►</button>
      </ul>
    </>
  );
};

export default Navbar;