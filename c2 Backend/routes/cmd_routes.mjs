
import { Router } from "express"; 
import  { send_cmd }  from "../controllers/c2c_controller.mjs";

const cmd_router = (clients) => {
    const router = Router();

    router.post('/:id', (req,res) => send_cmd(clients,req,res));

    return router;
};

export default cmd_router

