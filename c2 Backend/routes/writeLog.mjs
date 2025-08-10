// log.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '../Logs');

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

const logFile = path.join(logsDir, `${new Date().toISOString().slice(0, 10)}.log`);

function writeLog(message) {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const timestamp = `${day}/${month}/${year}:${hour}:${minute}`;

    const logLine = `[${timestamp}] ${message}\n`;

    console.log(logLine);
    

      fs.appendFile(logFile, logLine, (err) => {
        if (err) {
            console.error('Error escribiendo log:', err);
        }
    }); 
}


function readLastLines(n = 30) {
    if (!fs.existsSync(logFile)) {
        return [];
    }

    // Leer todo el archivo
    const data = fs.readFileSync(logFile, 'utf8');

    // Dividir en líneas y tomar las últimas n
    const lines = data.trim().split('\n');
    return lines.slice(-n);
}


export { writeLog, readLastLines };