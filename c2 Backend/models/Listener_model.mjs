import { Schema, model } from "mongoose";

const ListenerSchema = Schema({
    type:{
        type: String,
        require: true
    },
    bind:{
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
    ssl_tls:{
        type: Boolean,
        require: true,
    },
    path_cert:{
        type: String,
        require: false,
    },

})

export default model('Listener', ListenerSchema)

