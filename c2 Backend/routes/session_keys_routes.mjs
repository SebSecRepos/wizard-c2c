
import { response, Router } from "express"; 
import { validate_jwt } from "../middlewares/validate_jwt.mjs";
import { checkAdmin } from "../middlewares/checkAdmin.mjs";
import { get_session_keys, delete_session_key, create_session_key } from "../controllers/session_keys_controller.mjs";
import sanitize from "../middlewares/sanitize.mjs";




const session_keys_router = (attacks_running, agents, status_connections, listeners) => {
    const router = Router();

    router.use(validate_jwt);
    
    router.get('/', (req, res) => get_session_keys(req,res));
    router.post('/create/', checkAdmin, sanitize, (req,res=response) => create_session_key(req,res, listeners));
    router.delete('/delete/', checkAdmin, sanitize, (req,res=response) => delete_session_key(req,res, listeners));
    
    return router;
};

export default session_keys_router

