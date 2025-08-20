import { response } from "express";
import Listener from '../models/Listener_model.mjs';

const create_listener = async (req, res = response) => {


    try {
        const { type = "ws", url = "localhost", port = 0} = req.body;

        if (type.length <= 0 || url.length <= 0 || port === 0) {
            console.log("Fields shouldn't be empty");
            return res.status(400).json({
                ok: false,
                msg: "Fields shouldn't be empty"
            });
        }

        if (type != "ws" ) {
            console.log("Invalid type");
            return res.status(400).json({
                ok: false,
                msg: "Invalid type"
            });
        }


        const found_listener = await Listener.findOne({ type, url, port })

        if (found_listener) {
            console.log("Listener already exists");
            return res.status(400).json({
                ok: false,
                msg: "Listener already exists"
            })
        }

        const new_listener = new Listener({  type, url, port });

        await new_listener.save();

        return res.status(200).json({
            ok: true,
            msg: "New listener added"
        })

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: "Error creating listener"
        })
    }

}



const get_listener=async( req, res = response) => {

    
    try {
        
        const listeners = await Listener.find().select('url type port');

        return res.status(200).json({
            ok: true,
            listeners
        })
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg:"Error fetching listeners"
        })
    }

    
};



const delete_listener= async( req, res = response) => {

    try {
        const { type = "", url = "", port = 0} = req.body; 
        
        if( type.length <=0 || url.length <=0 || port===0 ){
            return res.status(400).json({
                ok:false,
                msg:"Error fields"
            });
        }

        if( type != "ws"  ){
            console.log("Invalid type");
            return res.status(400).json({
                ok:false,
                msg:"Invalid type"
            });
        }

        
        const found_listener = await Listener.findOne({type, port, url})

        if (!found_listener){
            console.log("Listener doesn't exists");
            return res.status(400).json({
                ok:false,
                msg:"Listener doesn't exists"
            })
        }

        await Listener.findByIdAndDelete(found_listener._id);

        return res.status(200).json({
            ok:true,
            msg:"Listener deleted"
        })
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok:false,
            msg:"Error deleting listener"
        })
    }

    
};


export { create_listener, delete_listener, get_listener };