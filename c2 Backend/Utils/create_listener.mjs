import Listener from "../models/Listener_model.mjs";
import { set_server, set_ssl_server } from "../Servers/http_servers.mjs";


const create_listener_endpoint=async(listeners,attacks_running, agents, status_connections)=>{
    
    const found_listeners = await Listener.find();
    
    const raise_servers = found_listeners.map(async(l)=>{
        if(l.ssl_tls){
            return await set_ssl_server(l.bind, l.port, l.path_cert, attacks_running, agents, status_connections)

        }else{
            
            return await set_server(l.bind, l.port, attacks_running, agents, status_connections)
        }
    })

    const servers = await Promise.all(raise_servers);

    listeners.listeners = servers;

    console.log(listeners);
    

}


export { create_listener_endpoint };