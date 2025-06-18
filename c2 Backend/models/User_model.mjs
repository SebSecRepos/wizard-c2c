import { Schema, model } from "mongoose";

const UserSchema = Schema({
    user_name:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    role:{
        type: String,
        required: true
    },

})

export default model('User', UserSchema)