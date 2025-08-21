
import { response, Router } from "express"; 
import { validate_jwt } from "../middlewares/validate_jwt.mjs";
import { checkAdmin } from "../middlewares/checkAdmin.mjs";
import { create_listener, delete_listener, get_listener } from "../controllers/listener_controller.mjs";
import { syntax_errors } from "../middlewares/json_errors.mjs";
import multer from 'multer';




const storage = multer.memoryStorage();

const upload = multer({
    storage:storage
});


const listener_router = (attacks_running, agents, status_connections, listeners) => {
    const router = Router();

    router.use(validate_jwt);

    const middle=(req,res)=>{
        console.log(req.body);
        
    }
    
    router.get('/', (req, res) => get_listener(req,res));
    router.post(
        '/create/', 
        checkAdmin, 
        upload.fields([
            {name: 'cert', maxCount:1},
            {name: 'key', maxCount:1},
            {name: 'ca', maxCount:1}

        ]),
        (req,res=response)=>create_listener(req,res,attacks_running, agents, status_connections, listeners),
    );
    router.delete('/delete/', checkAdmin, (req,res=response) => delete_listener(req,res, listeners));
    
    return router;
};

export default listener_router

