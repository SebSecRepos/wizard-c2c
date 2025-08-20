import { configDotenv } from 'dotenv';
import db_connection from './database/config.mjs';
import http from 'http'
import path from 'path';
import { fileURLToPath } from 'url';
import { team_app_launcher } from './Servers/Team_app_launcher.mjs';
import { bucket_app_launcher } from './Servers/bucket_app_launcher.mjs';
import { listeners_app_launcher } from './Servers/Listeners_app_launcher.mjs';



const main = async () =>{

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    configDotenv();
    let attacks_running={attacks:[]};
    let agents = {agents: new Map()};
    let listeners = {listeners: []};
    let status_connections = {status_connections: new Array};

    await team_app_launcher(attacks_running, agents, status_connections, listeners)
    await bucket_app_launcher()
    //await listeners_app_launcher(attacks_running, agents, listeners, status_connections)

    await db_connection();

    console.log(listeners);
    


}
main()
