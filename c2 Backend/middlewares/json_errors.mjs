import { response } from 'express'

const type_errors = (err, req, res=response, next) => {
    if (err instanceof TypeError ) return res.status(400).json({ 
        error: 'JSON Error',
        solution: 'bad format'
    });
    next();
}

const syntax_errors = (err, req, res, next) => {
    if (err instanceof SyntaxError ) return res.status(400).json({ 
        error: 'JSON Error',
        solution: 'bad format'
    });
    next();
}


export { type_errors, syntax_errors }