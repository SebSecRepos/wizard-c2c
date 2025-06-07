import React, { useState } from 'react';
import { Login, Register } from '../Components'


export const Auth =()=>{
    const [auth, setAuth] = useState("login");
    const [text, setText] = useState("Registrase usuario");


    const change_panel=()=>{

        if(auth === "login"){
            setAuth("register");
            setText(" Iniciar sesión");

        }else if(auth === "register"){
            setAuth("login");
            setText("¿No tienes cuenta? / Registrase");
        }else{
            setAuth("login");
            setText("¿No tienes cuenta? / Registrase");
        }
    }



    const renderVista = () => {
        switch (auth) {
          case 'login':
            return <Login /> ;
          case 'register':
            return <Register />;
          default:
            return <Login />;
        }
      };

    return (

        <div className=" login-container">

            {
                renderVista()
            }


            <button type="button" onClick={change_panel}>{text}</button>
        </div>  
    )
}