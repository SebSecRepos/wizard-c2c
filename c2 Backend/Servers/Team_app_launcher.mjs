import express from 'express'
import { configDotenv } from 'dotenv';
import authRouter from '../routes/auth_routes.mjs';
import { syntax_errors, type_errors } from '../middlewares/json_errors.mjs';
import db_connection from '../database/config.mjs';
import artifacts_router from '../routes/artifacts_routes.mjs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import sanitize from '../middlewares/sanitize.mjs';
import helmet from 'helmet';
import cmd_router from '../routes/cmd_routes.mjs';
import { main_ws_server } from './Websockets_launches.mjs';
import http from 'http'


const team_app_launcher=async(attacks_running, agents, status_connections={status_connections:[]})=>{

    
    configDotenv();
    const app = express();
    
    
    await db_connection();
    app.use(cors());
    app.use(helmet());
    app.use(express.json())
    app.use(express.urlencoded({ extended: true })); // Para formularios HTML
    
    
    app.use('/api/auth', sanitize, authRouter)
    app.use('/api/rcv', cmd_router(agents, attacks_running))
    app.use('/api/artifacts', sanitize, artifacts_router())
    //------Type errors-----
    app.use(type_errors);
    app.use(syntax_errors);

    const team_server = http.createServer(app);

    await main_ws_server(team_server, attacks_running, agents, status_connections);

    team_server.listen(process.env.PORT, '127.0.0.1', ()=> console.log(`Team server running in port:  ${process.env.PORT}`))

    
    return app;

}

export { team_app_launcher };

    