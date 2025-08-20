import { Schema, model } from "mongoose";

const ListenerSchema = Schema({
    type:{
        type: String,
        require: true
    },
    url:{
        type: String,
        require: true
    },
    port:{
        type: Number,
        require: true,
    },

})

export default model('Listener', ListenerSchema)

