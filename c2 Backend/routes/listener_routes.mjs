
import { Router } from "express"; 
import { validate_jwt } from "../middlewares/validate_jwt.mjs";
import { checkAdmin } from "../middlewares/checkAdmin.mjs";
import { create_listener, delete_listener, get_listener } from "../controllers/listener_controller.mjs";
import { syntax_errors } from "../middlewares/json_errors.mjs";


const listener_router = (listeners) => {
    const router = Router();

    router.use(validate_jwt);
    
    router.get('/', (req, res) => get_listener(req,res));
    router.post('/create/', (req,res, next) =>checkAdmin(req,res, next), (req,res) => create_listener(req,res));
    router.delete('/delete/', (req,res, next) =>checkAdmin(req,res, next), (req,res) => delete_listener(req,res));
    
    return router;
};

export default listener_router

