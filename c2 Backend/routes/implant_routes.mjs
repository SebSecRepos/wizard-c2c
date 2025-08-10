
import { response, Router } from "express"; 
import { create_implant_controller } from "../controllers/implant_controllers.mjs";

const implant_router = () => {
    const router = Router();

    router.post('/new/:id', (req,res) => create_implant_controller(req,res));

    return router;
};

export default implant_router

