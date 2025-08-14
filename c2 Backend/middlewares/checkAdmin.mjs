import { response } from "express";
import User from '../models/User_model.mjs';

const checkAdmin =async(req, res=response, next)=>{

    try {
        const { uid  } = req;
        const adminUser = await User.findById(uid).select('role');

        if (!adminUser || adminUser.role != 'admin') return res.status(400).json({ok:false, msg:'User is not allowed to perform this task'});
        
        next();
        
    } catch (error) {
        console.log(error);
        
        return res.status(400).json({ok:false, msg:'Server error'});
    }
}


export { checkAdmin };