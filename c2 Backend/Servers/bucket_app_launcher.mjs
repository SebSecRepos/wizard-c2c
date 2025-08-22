import express from "express";
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http'


const bucket_app_launcher =async()=>{

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    

    const buckets = express();
    buckets.use(cors());
    buckets.use(helmet());
    buckets.use(express.json())
    buckets.use(express.urlencoded({ extended: true })); // Para formularios HTML

    buckets.use('/api/arts/',express.static(path.join(__dirname, '../public/arts/') ));
   

    const buckets_server = http.createServer(buckets);
    buckets_server.listen(process.env.BUCKETS_PORT, '0.0.0.0', ()=> console.log(`Bucket server running in port:  ${process.env.BUCKETS_PORT}`))

}

export { bucket_app_launcher };