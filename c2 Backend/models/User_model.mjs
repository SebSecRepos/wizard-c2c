import { Schema, model } from "mongoose";

const UserSchema = Schema({
    user_name:{
        type: String,
        require: true,
        unique: true
    },
    password:{
        type: String,
        require: true
    },

})

export default model('User', UserSchema)