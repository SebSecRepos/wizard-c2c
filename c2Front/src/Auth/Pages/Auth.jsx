import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuthStore } from '../../hooks/';

export const schema = yup.object().shape({

  user_name: yup
    .string()
    .required('El usuario es obligatorio'),
  password: yup
    .string()
    .required('La contraseña es obligatoria')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});


export const Auth =()=>{


  const { startLogin } = useAuthStore();

  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });
  

  const submit =(data)=>{
    startLogin(data);            //useAuthStore
  }


    return (
 <>
      <div className="row login-container">
        <div className="col-md-6 login-form-1">
          <h3>Ingreso</h3>
          <form onSubmit={handleSubmit(submit)}>
            <div className="form-group mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="User_name"
                {...register('user_name')}
              />
              <p className="text-danger">{errors.user_name?.message}</p>
            </div>
            <div className="form-group mb-2">
              <input
                type="password"
                className="form-control"
                placeholder="Contraseña"
                {...register('password')}
              />
              <p className="text-danger">{errors.password?.message}</p>
            </div>
            <div className="form-group mb-2">
              <input
                type="submit"
                className="btnSubmit"
                value="Login"
              />
            </div>
          </form>
        </div>
      </div>
    </>
    )
}