
import { Router } from "express"; 
import  { send_cmd, upload_file }  from "../controllers/c2c_controller.mjs";
import multer from "multer";


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const cmd_router = (clients) => {
    const router = Router();

    router.post('/:id', (req,res) => send_cmd(clients,req,res));
    router.post('/upload/:id', upload.single("file"), (req,res) => upload_file(clients,req,res));

    return router;
};

export default cmd_router

