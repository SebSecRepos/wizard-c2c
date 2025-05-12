import { create_implant } from "../Utils/create_implant.mjs";


const create_implant_controller = async(req,res) =>{

    try {
        
        let { errors, jwt } = await create_implant(req);                               
        
        if( !jwt ) return res.status(400).json({ ok: false })           //Once the jwt is sended to the implant, starts ws connection 
     
        return res.status(200).json({ ok: true, msg: "Success", jwt})
        
    } catch (error) {                                                                   // <---- Server side error
        console.log(error);
        return res.status(502).json({ ok: false, msg: "Service error D:" })
    }

}

export {  create_implant_controller }