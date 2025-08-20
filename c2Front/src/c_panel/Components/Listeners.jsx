import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import './BottomBar.css'
import { useAuthStore } from '../../hooks';
import { toast, ToastContainer } from 'react-toastify';
import AlertModal from '../../util-components/AlertModal';
import './Listeners.css';




export const Listeners=()=> {


    const [ listeners, setListeners ] = useState([]);



    const getListeners=async()=>{
        try {
            const req = await fetch(`${import.meta.env.VITE_API_URL}/api/listener`,{
                headers:{
                  "Content-Type":"application/json",
                  "x-token": Cookies.get('x-token')
                }
            })

            const data = await req.json();

            console.log(data);
            
        } catch (error) {
            console.log(error);
            
        }
    }


    useEffect(()=>{
      getListeners()
    },[])





    return(
        <>
            
            <div className='listener-cpanel'>
                <button>Create listener</button>
                <button>Create implant</button>
                <h1>listeners</h1>

                <ul>
                    <li>Type port url</li>
                    <li>listener1</li>
                    <li>listener2</li>
                    <li>listener3</li>
                </ul>
            </div>


            <ToastContainer
            position="top-center"
            autoClose={4000}
            hideProgressBar={true}
            newestOnTop={false}
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            />

        </>
  );
}

