import { create_implant } from "../Utils/create_implant.mjs";


const create_implant_controller = async(req,res) =>{

    try {
        
        let { errors } = await create_implant(req.body);                               
        
        if( errors.length > 0 ) return res.status(400).json({ ok: false })           
        return res.status(200).json({ ok: true, msg: "Success"})
    } catch (error) {                                                                   
        console.log(error);
        return res.status(502).json({ ok: false, msg: "Server error" })
    }
}

export {  create_implant_controller }