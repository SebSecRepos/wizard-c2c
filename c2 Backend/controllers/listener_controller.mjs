import { response } from "express";
import Listener from '../models/Listener_model.mjs';
import { fileURLToPath } from 'url';
import fs from 'fs'
import path from 'path'
import { set_server, set_ssl_server } from "../Servers/http_servers.mjs";


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

    
            return res.status(200).json({
                ok: true,
                msg: "New listener added"
            })

        }

        const new_listener = new Listener({  type, bind, port, ssl_tls });
        await new_listener.save();

        
        const listener = await set_server(bind, port, attacks_running, agents, status_connections);
        listeners.listeners.push(listener);


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
        
        const listeners = await Listener.find().select('bind type port url');

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



const delete_listener= async( req, res = response) => {

    try {
        const { type = "", bind = "", port = 0} = req.body; 
        
        if( type.length <=0 || bind.length <=0 || port===0 ){
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

        
        const found_listener = await Listener.findOne({type, port, bind})

        if (!found_listener){
            console.log("Listener doesn't exists");
            return res.status(400).json({
                ok:false,
                msg:"Listener doesn't exists"
            })
        }

        await Listener.findByIdAndDelete(found_listener._id);

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


export { create_listener, delete_listener, get_listener };