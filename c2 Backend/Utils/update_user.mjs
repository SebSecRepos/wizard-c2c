import { response } from 'express'
import User from '../models/User_model.mjs';
import encrypt_passwd from './encrypt_passwd.mjs';
import { writeLog } from "../Utils/writeLog.mjs";

const update_user = async( req ) => {
    
    const { user_name, password, role  } = req.body;
    const { id="" } = req.params;


    const adminUser = await User.findById(req.uid);

    let errors=[];


    if( id === req.uid )errors.push("Cannot modify your current user")
            
    if(adminUser.role != "admin") errors.push("User not allowed to perform this action")
    
    const user_by_user_name = await User.findOne({ user_name });


    if( user_by_user_name && (user_by_user_name._id.toString() != id)  ) errors.push("Username already register");

    if(errors.length > 0) return { errors };


    let updates={};
    if(password && password.length >=4 && password.length <=20 ){
        let new_password = encrypt_passwd(password);    
        updates = { user_name, password: new_password, role, isPasswordChanged:true };
    }else{
        updates = { user_name, password: user_by_user_name.password, role };
    }

    const updatedUser = await User.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true } 
    );

    await updatedUser.save();                                                               // <--- Save user in database
    writeLog(` | User ${user_name} has been updated`);
    return {errors};
}


export { update_user }