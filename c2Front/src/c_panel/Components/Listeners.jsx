import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import './BottomBar.css'
import { useAuthStore } from '../../hooks';
import { toast, ToastContainer } from 'react-toastify';
import AlertModal from '../../util-components/AlertModal';
import './Listeners.css';




export const Listeners=()=> {


    const [ listeners, setListeners ] = useState([]);
    const [ listenerPanel, setListenerPanel ] = useState(false);
    const [ implantPanel, setImplantPanel ] = useState(false);
    const [ ssl_tls, setSsl_tls ] = useState(false);
    const [ formData, setFormData ] = useState({
        type:"ws",
        url:"",
        bind:"0.0.0.0",
        port:0,
        cert:"",
        key:""
    });


    const handleChange=(e)=>{
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.files[0]
        }));
    }

    const handleChangeData=(e)=>{
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    }

    const handleSubmitListener=async(e)=>{
        e.preventDefault();

        const new_data_form = new FormData()
        
        if(formData.type != "ws"){
            toast.error("Only ws is available");
            return
        }
        if(formData.bind.length < 7){
            toast.error("Invalid bind address");
            return
        }
        if(formData.url.length < 4){
            toast.error("Invalid url");
            return
        }

        new_data_form.append("type", formData.type);
        new_data_form.append("bind", formData.bind);
        new_data_form.append("url", formData.url);
        new_data_form.append("port", formData.port);

        if(ssl_tls){
            new_data_form.append("ssl_tls", "1");
            new_data_form.append("cert", formData.cert);
            new_data_form.append("key", formData.key);
            if(formData.ca) new_data_form.append("key", formData.ca);
        }else{
            new_data_form.append("ssl_tls", "");
        }

        try {
            const req = await fetch(`${import.meta.env.VITE_API_URL}/api/listener/create`,{
                method:'POST',
                headers:{
                  "x-token": Cookies.get('x-token')
                },
                body: new_data_form
            })

            const data = await req.json();

            if(data.ok){
                toast.success("listener created")
                getListeners();
                setFormData({       
                    type:"ws",
                    url:"",
                    bind:"0.0.0.0",
                    port:0,
                    cert:"",
                    key:""
                })
            }else{
                toast.error(data.msg)
            }
            
        } catch (error) {
            console.log(error);
            
            toast.error("Listener couldn't be created (Server error)")
        }

        
    }


    const getListeners=async()=>{
        try {
            const req = await fetch(`${import.meta.env.VITE_API_URL}/api/listener`,{
                headers:{
                  "Content-Type":"application/json",
                  "x-token": Cookies.get('x-token')
                }
            })

            const data = await req.json();

            if(data.ok){
                setListeners(data.listeners)
            }else{
                toast.error(data.msg)
            }
            
        } catch (error) {
            toast.error("Listeners couldn't be fetched (Server error)")
        }
    }


    useEffect(()=>{
      getListeners()
    },[])
    useEffect(()=>{
      console.log(listeners);
      
    },[listeners])




    const change_listener_panel=(value)=>{
        if(value){
            setListenerPanel(value);
            setImplantPanel(!value)
        }else{
            setListenerPanel(value);
        }
    }

    const change_implant_panel=(value)=>{
        if(value){
            setImplantPanel(value)
            setListenerPanel(!value);
        }else{
            setImplantPanel(value)
        }
    }




    return(
        <>
            <div className='listener-cpanel'>
                <h1>listeners</h1>
                <button onClick={()=>change_listener_panel(!listenerPanel)}>Create listener</button>
                <button onClick={()=>change_implant_panel(!implantPanel)}>Create implant</button>

                <ul className='listener-ul'>
                    <li className='listener-li-bar'><p>Type</p> <p>Url</p> <p>Bind</p> <p>Port</p> <p></p></li>

                    { listeners && listeners.length > 0 &&
                        
                        listeners.map(l=><li className='listener-li'>
                            <p>{l.type}</p>
                            <p>{l.url}</p>
                            <p>{l.bind}</p>
                            <p>{l.port}</p>
                            <button>X</button>
                        </li>)
                        
                    }
                </ul>


                { listenerPanel &&
                    <div className='listener-panel'>
                        <h3>Create listener</h3>
                        <form onSubmit={handleSubmitListener}>
                            <label htmlFor="">URL</label>
                            <input type="text" name="url" id="" placeholder='example.net' onChange={handleChangeData}/>
                            <label htmlFor="">Bind</label>
                            <input type="text" name="bind" id="" placeholder='0.0.0.0' onChange={handleChangeData}/>
                            <label htmlFor="">Port</label>
                            <input type="text" name="port" id="" placeholder='4444' onChange={handleChangeData}/>
                            <label htmlFor="">Protocol</label>
                            <select name="type" id="" defaultValue="ws" onChange={handleChangeData}>
                                <option value="ws" >ws</option>
                            </select>
                            <label htmlFor="">SSL/TLS</label>
                            <select name="" id="" defaultValue={false} >
                                <option value={false} onClick={()=> setSsl_tls(false)}>No</option>
                                <option value={true} onClick={()=> setSsl_tls(true)}>Yes</option>
                            </select>

                            {ssl_tls &&
                                <>
                                    <label htmlFor="">SSL (Cert.pem)</label>
                                    <input type="file" name="cert" id="" onChange={handleChange}/>

                                    <label htmlFor="">Private key (Key.pem)</label>
                                    <input type="file" name="key" id=""  onChange={handleChange}/>

                                    <label htmlFor="">CA (Key.pem)</label>
                                    <input type="file" name="ca" id="" onChange={handleChange} />
                                </>
                            }
                            <button>Crear</button>
                        </form>
                    </div>
                }

                { implantPanel &&
                    <div className='implant-panel' >
                        <h1>implant-panel</h1>

                    </div>
                }

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

