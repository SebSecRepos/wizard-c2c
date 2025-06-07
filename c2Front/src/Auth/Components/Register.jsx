import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import './auth.css'
import { useAuthStore } from '../../hooks';

// Esquema de validación con Yup
const schema = yup.object().shape({
  user_name: yup
    .string()
    .required('El usuario es obligatorio')
    .min(2, 'El usuario debe tener entre 2 y 20 caracteres')
    .max(20, 'El usuario debe tener entre 2 y 20 caracteres'),


  password: yup
    .string()
    .required('La contraseña es obligatoria')
    .min(6, 'La contraseña debe tener entre 6 y 20 caracteres')
    .max(20, 'La contraseña debe tener entre 6 y 20 caracteres')
    .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .matches(/[a-z]/, 'Debe contener al menos una minúscula')
    .matches(/[0-9]/, 'Debe contener al menos un número')
    .matches(/[\W_]/, 'Debe contener al menos un carácter especial'),

  password_repeat: yup
  .string()
  .required('La contraseña es obligatoria')
  .oneOf([yup.ref('password'), null], 'Las contraseñas deben coincidir'),
 
});



export const Register = () => {

  const { startRegister } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  
  const submit=(data)=>{
    startRegister(data);
  }
  
  return (
    <div className="login-container">
      <div className="login-form-1">
        <h3>Registro</h3>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <div className="form-group">
            <input placeholder="Usuario" {...register('user_name')} className="form-control" />
            <p className="text-danger">{errors.user_name?.message}</p>
          </div>


          <div className="form-group">
            <input type="password" placeholder="Contraseña" {...register('password')} className="form-control" />
            <p className="text-danger">{errors.password?.message}</p>
          </div>

          <div className="form-group">
            <input type="password" placeholder="Repita su contraseña" {...register('password_repeat')} className="form-control" />
            <p className="text-danger">{errors.password_repeat?.message}</p>
          </div>

          <div className="form-group d-flex justify-content-center">
            <input type="submit" className="btnSubmit" value="Enviar" />
          </div>
        </form>
      </div>
    </div>
  );
};
