import express, { response } from 'express'
import { configDotenv } from 'dotenv';
import authRouter from '../routes/auth_routes.mjs';
import { syntax_errors, type_errors } from '../middlewares/json_errors.mjs';
import db_connection from '../database/config.mjs';
import artifacts_router from '../routes/artifacts_routes.mjs';
import cors from 'cors';
import sanitize from '../middlewares/sanitize.mjs';
import helmet from 'helmet';
import cmd_router from '../routes/cmd_routes.mjs';
import { main_ws_server } from './Websockets_launches.mjs';
import http from 'http'
import listener_router from '../routes/listener_routes.mjs';
import { create_listener_endpoint } from '../Utils/create_listener.mjs';
import { validate_jwt } from '../middlewares/validate_jwt.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import session_keys_router from '../routes/session_keys_routes.mjs';

const team_app_launcher=async(attacks_running, agents, status_connections={status_connections:[]}, listeners={listeners:[]})=>{
    const middle=(req,res=response, next)=>{
        console.log("dfdsfs");
        next()
    }


    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    

    configDotenv();
    const app = express();
    
    
    await db_connection();
    app.use(cors());
    app.use(helmet());
    app.use(express.json())
    app.use(express.urlencoded({ extended: true })); // Para formularios HTML

    const staticPath = path.join(__dirname, '..', 'client', 'dist')
    
    app.use(express.static(staticPath));
    app.use(type_errors);
    app.use(syntax_errors);
    app.use('/api/auth', sanitize, authRouter)
    app.use('/api/rcv', cmd_router(agents, attacks_running, status_connections))
    app.use('/api/artifacts', sanitize, artifacts_router())
    app.use('/api/listener', sanitize, listener_router(attacks_running, agents, status_connections, listeners))
    app.use('/api/sources/', validate_jwt, express.static(path.join(__dirname, '../public/Sources/') ));
    app.use('/api/sessKeys/', sanitize, session_keys_router(attacks_running, agents, status_connections, listeners));
    
    app.get(/(.*)/, (req,res=response)=>{
        res.sendFile(path.join(staticPath, 'index.html'))
    })
    //------Type errors-----

    const team_server = http.createServer(app);

    await main_ws_server(team_server, attacks_running, agents, status_connections);
    team_server.listen(process.env.PORT, '127.0.0.1', ()=> console.log(`Team server running in port:  ${process.env.PORT}`))

    await create_listener_endpoint(listeners, attacks_running, agents, status_connections);
    
    
    return app;

}

export { team_app_launcher };

    