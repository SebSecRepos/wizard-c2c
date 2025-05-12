
import { Router } from "express"; 
import { create_implant_controller } from "../controllers/implant_controllers";

const implant_router = () => {
    const router = Router();

    router.post('/new/', (req,res) => create_implant_controller(req,res));

    return router;
};

export default implant_router

