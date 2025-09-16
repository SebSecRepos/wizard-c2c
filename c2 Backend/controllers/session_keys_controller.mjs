import { response } from "express";
import { fileURLToPath } from 'url';
import  path from 'path';
import  {resolve} from 'path';
import { writeLog } from "../Utils/writeLog.mjs";
import SessKey from "../models/SessionKey_model.mjs";



const get_session_keys=async(req,res=response)=>{

    try {
        
        const session_keys = await SessKey.find().select('sess_key');
        let session_keys_arr = [];

        for (const key in session_keys) {
            session_keys_arr.push(session_keys[key].sess_key);
        }


        return res.status(200).json({
            ok: true,
            session_keys:session_keys_arr
        })
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg:"Error fetching session keys"
        })
    }
    
};

const delete_session_key=async(req,res=response)=>{
  
    try {
        const { sessKey="" } = req.body; 

        
        const found_sess_key = await SessKey.findOne({ sess_key: sessKey })

        if (!found_sess_key){
            console.log("Session key doesn't exists");
            return res.status(400).json({
                ok:false,
                msg:"Session key doesn't exists"
            })
        }

        
        await SessKey.findByIdAndDelete(found_sess_key._id);
        

        return res.status(200).json({
            ok:true,
            msg:"Session key deleted"
        })
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok:false,
            msg:"Error deleting session key"
        })
    }
    
};


const create_session_key = async(req,res=response)=>{

    try {
        const { sess_key="" } = req.body;

        if(sess_key.length < 10) return res.status(400).json({
            ok:false,
            msg: "Session key must have 10 or more characters"
        })

        const found_sess_key = await SessKey.findOne({sess_key});

        if(found_sess_key) return res.status(400).json({
            ok:false,
            msg:"Session key already exists"
        })

        const new_sess_key = new SessKey({sess_key})

        await new_sess_key.save();

        return res.status(200).json({
            ok: true,
            msg:"Session key created"
        })


    } catch (error) {
        
    }
}

export { get_session_keys, delete_session_key, create_session_key };

