    export default function sendToPython(message, socket) {
        return new Promise((resolve, reject) => {

            socket.on("open", () => {
            socket.send(JSON.stringify(message));
            });

            socket.on("message", (data) => {
            resolve(JSON.parse(data));
            socket.close();
            });

            socket.on("error", reject);
        });
    }
