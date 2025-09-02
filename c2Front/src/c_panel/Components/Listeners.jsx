import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import './BottomBar.css'
import { useAuthStore } from '../../hooks';
import { toast, ToastContainer } from 'react-toastify';
import AlertModal from '../../util-components/AlertModal';
import './Listeners.css';




export const Listeners = () => {


    const [listeners, setListeners] = useState([]);
    const [listenerPanel, setListenerPanel] = useState(false);
    const [implantPanel, setImplantPanel] = useState(false);
    const [ssl_tls, setSsl_tls] = useState(false);
    const [implant, setImplant] = useState({
        listener: 4444,
        system: "windows",
        arch: "x64",
        type: "exe",
        group: "default"
    });
    const [formData, setFormData] = useState({
        type: "ws",
        url: "",
        bind: "0.0.0.0",
        port: 0,
        cert: "",
        key: ""
    });


    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.files[0]
        }));
    }
    const handleChangeData = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    }

    const handleChangeImplant = (e) => {

        setImplant(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    }


    const handleSubmitListener = async (e) => {
        e.preventDefault();

        const new_data_form = new FormData()

        if (formData.type != "ws") {
            toast.error("Only ws is available");
            return
        }
        if (formData.bind.length < 7) {
            toast.error("Invalid bind address");
            return
        }
        if (formData.url.length < 4) {
            toast.error("Invalid url");
            return
        }

        new_data_form.append("type", formData.type);
        new_data_form.append("bind", formData.bind);
        new_data_form.append("url", formData.url);
        new_data_form.append("port", formData.port);

        if (ssl_tls) {
            new_data_form.append("ssl_tls", "1");
            new_data_form.append("cert", formData.cert);
            new_data_form.append("key", formData.key);
            if (formData.ca) new_data_form.append("key", formData.ca);
        } else {
            new_data_form.append("ssl_tls", "");
        }

        try {
            const req = await fetch(`${import.meta.env.VITE_API_URL}/api/listener/create`, {
                method: 'POST',
                headers: {
                    "x-token": Cookies.get('x-token')
                },
                body: new_data_form
            })

            const data = await req.json();

            if (data.ok) {
                toast.success("listener created")
                getListeners();
                setFormData({
                    type: "ws",
                    url: "",
                    bind: "0.0.0.0",
                    port: 0,
                    cert: "",
                    key: ""
                })
            } else {
                toast.error(data.msg)
            }

        } catch (error) {
            console.log(error);

            toast.error("Listener couldn't be created (Server error)")
        }

        setListenerPanel(false);

    }

    const handleSubmitImplant = async (e) => {
        e.preventDefault();

        if ( !listeners.some(l => Number(l.port) === Number(implant.listener))) {
            toast.error("Invalid listener");
            return
        }
        if (implant.system != "linux" && implant.system != "windows") {
            toast.error("Invalid operating system");
            return
        }
        if (implant.arch != "" && implant.arch != "x86" && implant.arch != "x64") {
            toast.error("Invalid arch");
            return
        }
        if (implant.type != "py" && implant.type != "exe") {
            toast.error("Invalid type");
            return
        }
        if (implant.group.length < 2 || implant.group.length > 20) {
            toast.error("Group must have min 2 characters max 20 characters");
            return
        }


        try {
            const req = await fetch(`${import.meta.env.VITE_API_URL}/api/listener/create_implant`, {
                method: 'POST',
                headers: {
                    "x-token": Cookies.get('x-token'),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(implant)
            })


            if (!req.ok) {
                toast.error(req.error);
                return;
            }

            const blob = await req.blob();

            const downloadUrl = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `TrustMeImNotAvirus.${implant.system === 'linux' ? 'elf' : 'exe' }`; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

   

        } catch (error) {
            console.log(error);
        }

        setImplantPanel(false);

    }


    const getListeners = async () => {
        try {
            const req = await fetch(`${import.meta.env.VITE_API_URL}/api/listener`, {
                headers: {
                    "Content-Type": "application/json",
                    "x-token": Cookies.get('x-token')
                }
            })

            const data = await req.json();

            if (data.ok) {
                setListeners(data.listeners)
            } else {
                toast.error(data.msg)
            }

        } catch (error) {
            toast.error("Listeners couldn't be fetched (Server error)")
        }
    }


    useEffect(() => {
        getListeners()
    }, [])
/*     useEffect(() => {
        console.log(listeners);

    }, [listeners])
 */



    const change_listener_panel = (value) => {
        if (value) {
            setListenerPanel(value);
            setImplantPanel(!value)
        } else {
            setListenerPanel(value);
        }
    }

    const change_implant_panel = (value) => {
        if (value) {
            setImplantPanel(value)
            setListenerPanel(!value);
        } else {
            setImplantPanel(value)
        }
    }

    const delete_listener = async (l) => {

        try {
            const req = await fetch(`${import.meta.env.VITE_API_URL}/api/listener/delete/`, {
                method: 'DELETE',
                headers: {
                    "x-token": Cookies.get('x-token'),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: l.type,
                    bind: l.bind,
                    port_to_delete: l.port
                })
            })

            const data = await req.json();

            if (data.ok) {
                toast.success("listener deleted")
                getListeners()
            } else {
                toast.error(data.msg)
            }

        } catch (error) {
            console.log(error);

            toast.error("Listener couldn't be deleted (Server error)")
        }

    }



    return (
        <>
            <div className='listener-cpanel'>
                <h1>listeners</h1>
                <button onClick={() => change_listener_panel(!listenerPanel)}>Create listener</button>
                <button onClick={() => change_implant_panel(!implantPanel)}>Create implant</button>

                <ul className='listener-ul'>
                    <li className='listener-li-bar'><p>Type</p> <p>Url</p> <p>Bind</p> <p>Port</p> <p></p></li>

                    {listeners && listeners.length > 0 &&

                        listeners.map(l => <li className='listener-li'>
                            <p>{l.type}</p>
                            <p>{l.url}</p>
                            <p>{l.bind}</p>
                            <p>{l.port}</p>
                            <button onClick={() => delete_listener(l)}>X</button>
                        </li>)

                    }
                </ul>


                {listenerPanel &&
                    <div className='listener-panel'>

                        <div className='listener-title'>
                            <h3>Create listener</h3>
                            <button onClick={() => setListenerPanel(false)}>x</button>
                        </div>
                        <form onSubmit={handleSubmitListener}>
                            <label htmlFor="">URL</label>
                            <input type="text" name="url" id="" placeholder='example.net' onChange={handleChangeData} />
                            <label htmlFor="">Bind</label>
                            <input type="text" name="bind" id="" placeholder='0.0.0.0' onChange={handleChangeData} />
                            <label htmlFor="">Port</label>
                            <input type="text" name="port" id="" placeholder='4444' onChange={handleChangeData} />
                            <label htmlFor="">Protocol</label>
                            <select name="type" id="" defaultValue="ws" onChange={handleChangeData}>
                                <option value="ws" >ws</option>
                            </select>

                            <label htmlFor="">SSL/TLS</label>
                            <select name="" id="" defaultValue={ssl_tls} >
                                <option value={false} onClick={() => setSsl_tls(false)}>No</option>
                                <option value={true} onClick={() => setSsl_tls(true)}>Yes</option>
                            </select>

                            {ssl_tls &&
                                <>
                                    <label htmlFor="">SSL (Cert.pem)</label>
                                    <input type="file" name="cert" id="" onChange={handleChange} />

                                    <label htmlFor="">Private key (Key.pem)</label>
                                    <input type="file" name="key" id="" onChange={handleChange} />

                                    <label htmlFor="">CA (Key.pem)</label>
                                    <input type="file" name="ca" id="" onChange={handleChange} />
                                </>
                            }
                            <button>Create</button>
                        </form>
                    </div>
                }

                {implantPanel &&
                    <div className='implant-panel' >

                        <div className='listener-title'>
                            <h3>Create implant</h3>
                            <button onClick={() => setImplantPanel(false)}>x</button>
                        </div>
                        <form onSubmit={handleSubmitImplant}>
                            <label htmlFor="">Select listener</label>

                            {listeners && listeners.length > 0 ?

                                <>
                                    <select name="listener" id="" className='listener-li-opt' onChange={handleChangeImplant} defaultValue={listeners[0].port} >
                                        {
                                            listeners.map(l => <option value={l.port}>
                                                {l.ssl_tls ? 'wss' : 'ws'}://
                                                {l.url}:
                                                {l.port}
                                            </option>)
                                        }
                                    </select>

                                    <label htmlFor="">System</label>
                                    <select name="system" id="" defaultValue="windows" onChange={handleChangeImplant} >
                                        <option value="windows">Windows</option>
                                        <option value="linux">Linux</option>
                                    </select>
                                    <label htmlFor="">Type</label>
                                    <select name="type" id="" defaultValue="exe" onChange={handleChangeImplant} >
                                        <option value="exe">Executable</option>
                                        <option value="py">Python script (Required libraries in target)</option>
                                    </select>
                                    { 
                                        implant.type === 'exe' &&<>
                                            <label htmlFor="">Architecture</label>
                                            <select name="arch" id="" defaultValue="x64" onChange={handleChangeImplant} >
                                                <option value="x64">x64</option>
                                                <option value="x86">x86</option>
                                            </select>
                                        </>
                                    }
                                    <label htmlFor="">Group</label>
                                    <input type="text" name="group" id="" placeholder='default' onChange={handleChangeImplant} />

                                    <label >Loader payload</label>
                                    <a href="http://" target="_blank" rel="noopener noreferrer"> Guide for raw binary implants </a>

                                </>

                                :
                                <h3>No listeners available, create one first</h3>

                            }



                            <button>Create</button>
                        </form>

                    </div>
                }

            </div>


        </>
    );
}

