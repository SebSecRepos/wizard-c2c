import { Schema, model } from "mongoose";

const ImplantSchema = Schema({
    impl_mac:{
        type: String,
        require: true,
        unique: true
    },
    impl_number:{
        type: Number,
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
        type: String,
        require: true
    },
    operating_system:{
        type: String,
        require: true
    },
    token:{
        type: String,
        require: true
    },

})

export default model('Implant', ImplantSchema)

