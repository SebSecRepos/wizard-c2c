
const send_cmd = async(clients,req,res) => {
    const clientId = req.params.id;
    //const {cmd} = req.body;

    try {
        
        const client = clients.get(clientId);
        if (!client || client.readyState !== 1) {
            return res.status(404).json({ error: 'Cliente no conectado' });
        }
    
        client.send( JSON.stringify(req.body) );

        
        client.on('message', (msg) => {
            return res.status(200).json({ result: `Result${clientId}: ${msg}` })
        });

        
    } catch (error) {
        console.log(error);
        return res.json({ status: 'error fatal' });
        
    }
};

export{ send_cmd }