
const send_cmd = async(clients,req,res) => {
    const clientId = req.params.id;
    const client = clients.get(clientId);
    //const {cmd} = req.body;

    
    if (!client || client.readyState !== 1) {
        return res.status(404).json({ error: 'Cliente no conectado' });
    }

    
    const msgHandler = (msg) => {
        res.status(200).json({ result: `Result ${clientId}: ${msg}` });
        client.off('message', msgHandler); // Elimina el listener después de usarlo
    };

    client.on('message', msgHandler);
    
    // Envía el comando
    client.send(JSON.stringify(req.body));

    // Opcional: añade timeout por si el cliente no responde
    setTimeout(() => {
        client.off('message', msgHandler);
        if (!res.headersSent) {
            res.status(504).json({ error: 'Timeout esperando respuesta del cliente' });
        }
    }, 5000); // 5 segundos de espera

};

export{ send_cmd }