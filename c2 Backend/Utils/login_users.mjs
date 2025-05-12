import User from '../models/User_model.mjs';
import bcrypt from 'bcryptjs';
import new_jwt from './jwt.mjs';

const login_user = async( body ) => {
    
    const { user_name, password } = body;
    let errors=[];
    let user = await User.findOne({ user_name });

    
    
    if( !user ){
        errors.push("Usuario o contraseña incorrectos");
        return { errors, jwt: false};
    }
    
    const valid_password = bcrypt.compareSync( password, user.password );
    
    if( valid_password === false ){
        errors.push("Usuario o contraseña incorrectos");
        return { errors, jwt: false };
    }

    const token = await new_jwt( user.id, user.user_name );

    return { errors, jwt: token}
        
}


export { login_user }