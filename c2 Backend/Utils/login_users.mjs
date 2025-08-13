import User from '../models/User_model.mjs';
import bcrypt from 'bcryptjs';
import {new_jwt} from './jwt.mjs';
import { writeLog } from "../Utils/writeLog.mjs";

const login_user = async( body ) => {
    
    const { user_name, password } = body;
    let errors=[];
    let user = await User.findOne({ user_name });

    
    if( !user ){
        errors.push("Wrong user or password");
        return { errors, jwt: false};
    }

    if( user.isPasswordChanged ){
        const updates = { isPasswordChanged:false };
        const updatedUser = await User.findByIdAndUpdate(
        user.id,
        { $set: updates },
        { new: true } 
        );
    
        await updatedUser.save();     
    }
    
    const valid_password = bcrypt.compareSync( password, user.password );
    
    if( valid_password === false ){
        errors.push("Wrong user or password");
        return { errors, jwt: false };
    }
    writeLog(` | User ${user_name} has been logged`)
    const token = await new_jwt( user.id, user.user_name );

    return { errors, jwt: token, user:{
        user_name: user.user_name,
        role: user.role
    }}
        
}


export { login_user }