import { useDispatch, useSelector } from "react-redux"
import { login, registerUser } from "../api";
import { clearErrorMessage, onChecking, onLogin, onLogout } from "../Store";
import Cookies from 'js-cookie';
import { toast } from "react-toastify";


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
                    toast.error(`Error: ${resp.errors || 'Algo salió mal'}`);
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
            toast.error('Error fatal');
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
                
                if (!resp.ok) {
                    toast.error(`Error: ${resp.msg || 'Algo salió mal al registrar'}`);
                    toast.error(`Error: ${resp.msg || 'Algo salió mal al registrar'}`);
                    setTimeout(()=>{
                        dispatch( clearErrorMessage() )
                    },3)
                    window.location.reload();
                } else {
                    
                    toast.success("Usuario registrado exitosamente");
                   // window.location.reload();
                }
                
            }
        } catch (error) {
            toast.error(error);
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

            const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/renew`, {
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
            toast.error(error);
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