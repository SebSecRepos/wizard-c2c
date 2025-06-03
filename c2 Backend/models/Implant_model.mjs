import { Schema, model } from "mongoose";

const ImplantSchema = Schema({
    impl_mac:{
        type: Array,
        require: true,
        unique: true
    },
    group:{
        type: String,
        require: true,
    },
    public_ip:{
        type: String,
        require: true
    },
    local_ip:{
        type: Array,
        require: true
    },
    operating_system:{
        type: String,
        require: true
    },
    impl_id:{
        type: String,
        require: true
    },

})

export default model('Implant', ImplantSchema)

