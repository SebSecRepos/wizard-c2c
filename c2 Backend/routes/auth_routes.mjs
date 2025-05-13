
/*
    Rutas de usuarios / auth
    host + /api/auth
*/

import { Router } from "express"; 
import { login, register, renew } from "../controllers/auth_controller.mjs";
import { check } from "express-validator";
import validate_fields from "../middlewares/validate_fields.mjs";

const router = Router();


///api/auth/new
router.post(
    '/new', 
    [
        check('user_name', 'El es usuario obligatorio').not().isEmpty(),
        check('password', 'La contraseña es obligatoria').not().isEmpty(),
        check('password', 'La contraseña debe tener entre 6 y 20 caracteres').isLength({min: 6, max:20}).matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
        .matches(/[a-z]/).withMessage('Debe contener al menos una minúscula')
        .matches(/[0-9]/).withMessage('Debe contener al menos un número')
        .matches(/[\W_]/).withMessage('Debe contener al menos un carácter especial'),
        validate_fields
    ], 
    register
);
router.post(
    '/', 
    [
        check('user_name', 'El usuario es obligatorio').not().isEmpty(),
        check('password', 'Ingrese una contraseña').not().isEmpty(),
        check('password', 'La contraseña debe tener 6 o mas caracteres').isLength({min: 6}),
        validate_fields
    ], 
    login);


router.put('/renew', renew);



export default router;