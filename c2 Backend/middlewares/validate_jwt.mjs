import { response } from "express"  
import jwt from 'jsonwebtoken'


const validate_jwt = ( req, res=response, next ) =>{

    
    const token = req.header('x-token') || req.query.token;

    if(!token) return res.status(400).json({ ok:false, msg:"Invalid auth" });

    try {

        const { uid, name } = jwt.verify( token, process.env.SEED );
        req.uid = uid;
        req.name = name;

        next();
        
    } catch (error) {
        console.log(error);
        return res.status(401).json({ ok:false, msg:"Invalid auth" });
    }

    
}



export { validate_jwt }