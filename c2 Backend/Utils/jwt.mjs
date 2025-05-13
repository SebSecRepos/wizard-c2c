import jwt from 'jsonwebtoken'


const new_jwt = ( uid, name )=>{

    return new Promise( (resolve, reject)=>{
        const payload = { uid, name };
        jwt.sign( payload, process.env.SEED,{
            expiresIn: '336h'
        }, (err, token)=>{
            if(err){
                console.log(err);
                reject( "No se pudo generar el token" );
            }
            resolve(token);
        });
    })
}

const new_jwt_implant = ()=>{

    return new Promise( (resolve, reject)=>{
        const payload = { name:"pwn3d!" };
        jwt.sign( payload, process.env.IMPLANT_SEED,{
            expiresIn: '336h'
        }, (err, token)=>{
            if(err){
                console.log(err);
                reject( "No se pudo generar el token" );
            }
            resolve(token);
        });
    })
}

export {new_jwt, new_jwt_implant};