import { response } from 'express'
import User from '../models/User_model.mjs';
import encrypt_passwd from './encrypt_passwd.mjs';

const update_user = async( req ) => {
    
    const { user_name, password, role  } = req.body;
    const { id="" } = req.params;

    const adminUser = await User.findById(req.uid);

    let errors=[];

            
    if(adminUser.role != "admin") errors.push("Permisos insuficientes")
    
    const user_by_user_name = await User.findOne({ user_name });

    if( user_by_user_name && (user_by_user_name._id.toString() != id)  ) errors.push("El nombre de usuario ya está en uso");

    if(errors.length > 0) return { errors };

    let new_password = encrypt_passwd(password);    
    
    let updates = { user_name, password: new_password, role};

    const updatedUser = await User.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true } 
    );

    await updatedUser.save();                                                               // <--- Save user in database
    return {errors};
        
}


export { update_user }