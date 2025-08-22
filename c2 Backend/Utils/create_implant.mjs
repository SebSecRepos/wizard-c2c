import Implant from '../models/Implant_model.mjs';


const create_implant = async( body ) => {
    let errors=[];

    console.log("Registrando implante");
    
    console.log(body);
    
    try {
        
        const { 
            impl_mac,
            impl_number,
            group,
            public_ip,
            local_ip,
            operating_system,
            token,
            impl_id
        } = body;


        const implan_by_model = await Implant.findOneAndUpdate(
            { impl_id },         
            { $set: {
                impl_mac,
                impl_number,
                group,
                local_ip,
                operating_system,
                token,
            } }, 
            {
                new: true,    
                upsert: true, 
            }
        );


        if(errors.length > 0) return { errors };
        //const jwt = await new_jwt_implant();

        return {errors};
    } catch (error) {
        
        if (error.code === 11000) {
            // Error de clave duplicada
            errors.push("Machine already infected");
            console.log("Machine already infected");
            return {errors, jwt:""};
            
        } else {
            console.log(error);
            errors.push("server error");
            return {errors};
        }

    }
        
}


export { create_implant }