import bcrypt from 'bcryptjs'

const encrypt_passwd=(password)=>{

    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync(password, salt);

    return hash;
}

export default encrypt_passwd