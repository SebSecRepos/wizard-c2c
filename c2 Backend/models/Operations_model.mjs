import { Schema, model } from "mongoose";

const OperationSchema = Schema({
    category:{
        type: String,
        required: true,
    },
    name:{
        type: String,
        required: true
    },
    command:{
        type: String,
        required: true
    },
    sys:{
        type: String,
        required: true
    }

})

export default model('Operation', OperationSchema)