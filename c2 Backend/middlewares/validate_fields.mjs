import { response } from 'express'
import { validationResult } from "express-validator";


const validate_fields = (req, res=response, next) => {
    
    const errs = validationResult(req);

    if( !errs.isEmpty() ) return res.status(400).json({ 
        ok: false,
        errors: errs.mapped()
    });
    
    next();

}

export default validate_fields