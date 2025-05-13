import { response } from 'express'
import User from '../models/User_model.mjs';
import encrypt_passwd from './encrypt_passwd.mjs';
import {new_jwt} from './jwt.mjs';

const register_user = async( req ) => {
    
    const { user_name } = req.body;

    let user_by_user_name = await User.findOne({ user_name });

    let errors=[];

    if( user_by_user_name ) errors.push("El nombre de usuario ya está en uso");

    if(errors.length > 0) return { errors, jwt:false };

    const user = new User({ ...req.body });              //Create model
    user.password = encrypt_passwd(user.password);                                   //Encrypt password and update property value with the hash in the user model
    await user.save();                                                               // <--- Save user in database
    const jwt = await new_jwt( user.id, user.user_name );

    return {errors, jwt};
        
}


export { register_user }