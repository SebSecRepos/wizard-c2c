import express, { response } from 'express'
import { configDotenv } from 'dotenv';
import { syntax_errors, type_errors } from '../middlewares/json_errors.mjs';
import db_connection from '../database/config.mjs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sanitize from '../middlewares/sanitize.mjs';
import helmet from 'helmet';
import implant_router from '../routes/implant_routes.mjs';
import { webSocketsServer } from './Websockets_launches.mjs';
import http from 'http'
import { create_listener_endpoint } from '../Utils/create_listener.mjs';



const listeners_app_launcher=async(attacks_running, agents, listeners, status_connections={status_connections:[]} )=>{


    configDotenv();
    const app = express();
    
    
    await db_connection();
    app.use(cors());
    app.use(helmet());
    app.use(express.json())
    app.use(express.urlencoded({ extended: true })); // Para formularios HTML
    
    app.use('/api/impl', sanitize, implant_router())
    //------Type errors-----
    app.use(type_errors);
    app.use(syntax_errors);

    
    const listener_server = http.createServer(app);

    const default_listener = await webSocketsServer(listener_server, attacks_running, agents, status_connections);


    listener_server.listen(process.env.DEFAULT_LISTENER_PORT, '127.0.0.1', ()=> console.log(`Default ws listener running in port:  ${process.env.DEFAULT_LISTENER_PORT}`))
    
    return app;

}

export { listeners_app_launcher };

    