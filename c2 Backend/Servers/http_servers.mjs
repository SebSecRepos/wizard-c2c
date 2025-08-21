import express, { response } from 'express'
import { configDotenv } from 'dotenv';
import { syntax_errors, type_errors } from '../middlewares/json_errors.mjs';
import cors from 'cors';
import sanitize from '../middlewares/sanitize.mjs';
import helmet from 'helmet';
import implant_router from '../routes/implant_routes.mjs';
import { webSocketsServer } from '../Servers/Websockets_launches.mjs';
import http from 'http'
import https from 'https'
import fs from 'fs'
import path from "path";



const set_server = async(bind, port, attacks_running, agents, status_connections)=>{

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
    http_server.listen(port, bind, ()=> console.log(`New listener running in port:  ${port}`))

    return {
        app,
        http_server,
        port
    }

}
const set_ssl_server = async(bind, port, path_cert, attacks_running, agents, status_connections)=>{

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

    console.log(path_cert);
    
    path_cert = path.normalize(path_cert);

    const options={
        cert: fs.readFileSync(path.join( path_cert, 'cert.pem')),
        key: fs.readFileSync(path.join( path_cert, 'key.pem')),
    }
    const https_server = https.createServer(options);
    
    await webSocketsServer(https_server, attacks_running, agents, status_connections);
    https_server.listen(port, bind, ()=> console.log(`New SSL listener running in port:  ${port}`))

    return {
        app,
        https_server,
        port
    }

}

export { set_server, set_ssl_server };