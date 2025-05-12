import express from 'express'
import { configDotenv } from 'dotenv';
import authRouter from './routes/auth_routes.mjs';
import helmet from 'helmet';
import { syntax_errors, type_errors } from './middlewares/json_errors.mjs';
import db_connection from './database/config.mjs';
import { WebSocketServer } from 'ws';
import http from 'http'
import cmd_router from './routes/cmd_routes.mjs';



const webSocketsServer = (httpServer)=>{

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
                //if (clients.get(clientId) === socket) {
                //    clients.delete(clientId);
                //}
            });
        });
    
        const interval = setInterval(() => {
            if (clients.size === 0) {
                //console.log("No hay clientes conectados");
                return;
            }
    
            for (const [id, ws] of clients.entries()) {
                if (!ws.isAlive) {
                    console.log(`Cliente ${id} inactivo`);
                    //ws.terminate();
                    //clients.delete(id);
                    continue;
                }
    
                ws.isAlive = false;
                ws.ping();
            }
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
    const clients = webSocketsServer(server)
    
    app.use('/api/auth', authRouter)
    app.use('/api/rcv', cmd_router(clients))
    
    //------Type errors-----
    app.use(type_errors);
    app.use(syntax_errors);
    
    server.listen(process.env.PORT, ()=> console.log(`Esuchando en el puerto ${process.env.PORT}`))

}

main()