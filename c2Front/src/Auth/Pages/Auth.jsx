import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuthStore } from '../../hooks/';
import { ToastContainer, toast } from 'react-toastify';
import '../../Styles/global.css'

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
  

  const submit =(data)=>startLogin(data);            //useAuthStore


    return (
 <>
      <div className="login-container">
        <div className="login-form-1">
          <h3>Ingreso</h3>
          <form onSubmit={handleSubmit(submit)}>
            <div className="form-group">
              <input
                type="text"
                className="form-section-auth"
                placeholder="User"
                {...register('user_name')}
              />
              <p className="text-danger">{errors.user_name?.message}</p>
            </div>
            <div className="form-group">
              <input
                type="password"
                className="form-section-auth"
                placeholder="Password"
                {...register('password')}
              />
              <p className="text-danger">{errors.password?.message}</p>
            </div>
            <div className="form-group">
              <input
                type="submit"
                className="btnSubmit"
                value="Login"
              />
            </div>
          </form>
        </div>
      </div>
      <ToastContainer
      position="top-center"
      autoClose={4000}
      hideProgressBar={true}
      newestOnTop={false}
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      />
    </>
    )
}