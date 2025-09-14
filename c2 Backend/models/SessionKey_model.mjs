import { Schema, model } from "mongoose";

const SessionKeySchema = Schema({
    sess_key:{
        type: String,
        required: true,
    },

})

export default model('SessionKey', SessionKeySchema)