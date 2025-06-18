import { useDispatch, useSelector } from "react-redux"
import { login, registerUser } from "../api";
import { clearErrorMessage, onChecking, onLogin, onLogout } from "../Store";
import Cookies from 'js-cookie';


export const useAuthStore = () =>{

    const {status, user, errorMessage} = useSelector( state => state.auth );
    const dispatch = useDispatch();

    const startLogin = async(data) => {

        try {

            if(data){
                const resp = await login(data);
                dispatch( onChecking() );
                
                if (!resp.ok) {
                    dispatch( onLogout(resp.errors) );
                    alert(`Error: ${resp.errors || 'Algo salió mal'}`);
                    console.log(resp.errors);
                    setTimeout(()=>{
                        dispatch( clearErrorMessage() )
                    },10)
                } else {
                    Cookies.set('x-token', resp.jwt, { expires: 14 }); // Expira en 7 días
                    dispatch( onLogin(resp.data) );
                }
                
            }
        } catch (error) {
            console.error('Error al enviar datos:', error);
            alert('Error fatal');
            dispatch( onLogout(['Error fatal']) );
            setTimeout(()=>{
                dispatch( clearErrorMessage() )
            },10)
        }
    }
    const startRegister = async(data) => {

        try {

            if(data){
                const resp = await registerUser(data);
                dispatch( onChecking() );
                
                if (!resp.ok) {
                    alert(`Error: ${resp.msg || 'Algo salió mal al registrar'}`);
                    setTimeout(()=>{
                        dispatch( clearErrorMessage() )
                    },3)
                    window.location.reload();
                } else {

                    alert("Usuario registrado exitosamente");
                    window.location.reload();
                }
                
            }
        } catch (error) {
            console.error('Error al enviar datos:', error);
            alert('Error fatal');
            dispatch( onLogout(['Error fatal']) );
            setTimeout(()=>{
                dispatch( clearErrorMessage() )
            },10)
        }
    }

    const checkAuthToken=async()=>{
        const token = Cookies.get('x-token');

        if(!token) return dispatch( onLogout() );

        try {

            const resp = await fetch("http://localhost:4000/api/auth/renew", {
                method:'PUT',
                headers:{
                    "Content-Type": "application/json",
                    "x-token": token
                }
            })
            const result = await resp.json();

            if (!result.ok) {
                Cookies.remove('x-token');
                dispatch( onLogout(result.errors) );
                console.log(result.errors);
                setTimeout(()=>{
                    dispatch( clearErrorMessage() )
                },10)
            } else {
                Cookies.set('x-token', result.jwt, { expires: 14 }); // Expira en 7 días
                dispatch( onLogin(result.data) );
            }


        } catch (error) {
            Cookies.remove('x-token');
            console.error('Error al enviar datos:', error);
            alert('Error fatal');
            dispatch( onLogout(['Error fatal']) );
            setTimeout(()=>{
                dispatch( clearErrorMessage() )
            },10)
        }
    }

    const startLogOut=()=>{
        Cookies.remove('x-token');
        dispatch(onLogout());
    }

    return {
        status,
        user,
        errorMessage,
        startLogin,
        startRegister,
        checkAuthToken,
        startLogOut
    }

}