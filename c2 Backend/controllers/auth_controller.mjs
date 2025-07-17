/*
    authentication controllers

*/

import {response} from "express";
import { register_user } from "../Utils/register_user.mjs";
import { login_user } from "../Utils/login_users.mjs";
import {new_jwt} from '../Utils/jwt.mjs';
import User from "../models/User_model.mjs";
import { update_user } from "../Utils/update_user.mjs";

const register = async(req, res = response) => {
    
    try {

        const adminUser = await User.findById(req.uid);
        
        if(adminUser.role != "admin") return res.status(400).json({
            msg: "Permisos insuficientes",
            ok:false
        })
        
        let { errors, jwt } = await register_user(req);                                   //register_user component to register user
        
        if( !jwt ) return res.status(400).json({ ok: false, errors })                    //If one of the three fields exists, return an errors array 
     
        return res.status(200).json({ ok: true, msg: "Success", jwt})
        
    } catch (error) {                                                                   // <---- Server side error
        console.log(error);
        return res.status(502).json({ ok: false, msg: "Service error D:" })
    }

}
const update = async(req, res = response) => {
    
    try {

        let { errors=[] } = await update_user(req);                                   //register_user component to register user
        
        if( errors.length > 0 ) return res.status(400).json({ ok: false, errors })                    //If one of the three fields exists, return an errors array 
     
        return res.status(200).json({ ok: true, msg: "Success"})

        
    } catch (error) {                                                                   // <---- Server side error
        console.log(error);
        return res.status(502).json({ ok: false, errors: ["Service error D:"] })
    }

}
const delete_user = async(req, res = response) => {

    
    try {
        const { uid, name } = req;
        const { id="" } = req.params;

        const admin_user = await User.findById(uid);
        
        if(admin_user.role != 'admin') return res.status(200).json({
            ok:false,
            msg:'User not allowed'
        })

        const users = await User.findByIdAndDelete(id);
        
        return res.status(200).json({ ok:true, msg: "User deleted" })
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({  ok: false, msg: "Error deleting user"  });
    }
    
}


const login = async(req, res = response) => {
   
    try {

        const {errors, jwt, user} = await login_user(req.body);                //login_user component to login user
        if( !jwt ) return res.status(400).json({ ok:false, errors });

        return res.status(200).json({ ok:true, msg: "Success", jwt, data:user })
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({  ok: false, msg: "Service error D:"  });
    }
    
}


const get_users = async(req, res = response) => {

    
    try {
        const { uid, name } = req;

        const admin_user = await User.findById(uid);
        
        if(admin_user.role != 'admin') return res.status(200).json({
            ok:false,
            msg:'User not allowed'
        })

        const users = await User.find().select('user_name role');
        
        return res.status(200).json({ ok:true, msg: "Success", users })
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({  ok: false, msg: "Service error D:"  });
    }
    
}

const renew = async(req, res = express.response) => {
    
    try {
        
        const { uid, name } = req;
    
    
        const jwt = await new_jwt( uid, name );
    
        const user = await User.findById(uid);
    
        return res.status(200).json({ ok:true, message: 'Logged', jwt, data:{
            user_name: user.user_name,
            role: user.role
        }});
    } catch (error) {
        console.log(error);
        return res.status(200).json({ ok:false, message: 'Error fatal' });
    }

}



export {register, login, renew, get_users, update, delete_user} 