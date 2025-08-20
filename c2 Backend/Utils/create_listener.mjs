import Listener from "../models/Listener_model.mjs";
import express, { response } from 'express'
import { configDotenv } from 'dotenv';
import { syntax_errors, type_errors } from '../middlewares/json_errors.mjs';
import db_connection from '../database/config.mjs';
import cors from 'cors';
import sanitize from '../middlewares/sanitize.mjs';
import helmet from 'helmet';
import implant_router from '../routes/implant_routes.mjs';
import { webSocketsServer } from '../Servers/Websockets_launches.mjs';
import http from 'http'



const set_server = async(url, port, attacks_running, agents, status_connections)=>{

    configDotenv();
    const app = express();
    
    app.use(cors());
    app.use(helmet());
    app.use(express.json())
    app.use(express.urlencoded({ extended: true })); // Para formularios HTML
    
    app.use('/api/impl', sanitize, implant_router())
    //------Type errors-----
    app.use(type_errors);
    app.use(syntax_errors);

    
    const http_server = http.createServer(app);

    await webSocketsServer(http_server, attacks_running, agents, status_connections);
    http_server.listen(port, url, ()=> console.log(`New listener running in port:  ${port}`))

    return {
        app,
        http_server,
    }

}

const create_listener_endpoint=async(listeners,attacks_running, agents, status_connections)=>{
    
    const found_listeners = await Listener.find();

    
    const raise_servers = found_listeners.map(async(l)=>{
        return await set_server(l.url, l.port, attacks_running, agents, status_connections)
    })

    const servers = await Promise.all(raise_servers);

    listeners.listeners = servers;

}


export {create_listener_endpoint};