/*
    authentication controllers

*/

import {response} from "express";
import { register_user } from "../Utils/register_user.mjs";
import { login_user } from "../Utils/login_users.mjs";


const register = async(req, res = response) => {
    
    try {
        
        let { errors, jwt } = await register_user(req);                                   //register_user component to register user
        
        if( !jwt ) return res.status(400).json({ ok: false, errors })                    //If one of the three fields exists, return an errors array 
     
        return res.status(200).json({ ok: true, msg: "Success", jwt})
        
    } catch (error) {                                                                   // <---- Server side error
        console.log(error);
        return res.status(502).json({ ok: false, msg: "Service error D:" })
    }

}

const login = async(req, res = response) => {
   
    try {

        const {errors, jwt} = await login_user(req.body);                //login_user component to login user
        if( !jwt ) return res.status(400).json({ ok:false, errors });

        res.status(200).json({ ok:true, msg: "Success", jwt })
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({  ok: false, msg: "Service error D:"  });
    }

}

const renew = (req, res = express.response) => {
    return res.json({ message: 'renew' });
}



export {register, login, renew} 