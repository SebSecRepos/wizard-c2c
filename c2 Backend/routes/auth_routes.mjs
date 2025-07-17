
/*
    Rutas de usuarios / auth
    host + /api/auth
*/

import { response, Router } from "express"; 
import { get_users, login, register, renew, update, delete_user } from "../controllers/auth_controller.mjs";
import { check, body } from "express-validator";
import validate_fields from "../middlewares/validate_fields.mjs";
import { validate_jwt } from "../middlewares/validate_jwt.mjs";

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
    validate_jwt, register
);
router.post(
  '/update/:id',
  [
    check('user_name')
      .optional()
      .notEmpty().withMessage('El usuario no puede estar vacío'),

    check('password')
      .optional({checkFalsy:true})
      .isLength({ min: 6, max: 20 }).withMessage('La contraseña debe tener entre 6 y 20 caracteres')
      .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
      .matches(/[a-z]/).withMessage('Debe contener al menos una minúscula')
      .matches(/[0-9]/).withMessage('Debe contener al menos un número')
      .matches(/[\W_]/).withMessage('Debe contener al menos un carácter especial'),

    check('role')
      .optional()
      .notEmpty().withMessage('El rol no puede estar vacío'),

    body('password_repeat')
      .if(body('password').exists().notEmpty())
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Las contraseñas no coinciden');
        }
        return true;
      }),

    validate_fields
  ],
  validate_jwt,
  update
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

router.get('/get_users',validate_jwt, get_users);
router.delete('/delete/:id',validate_jwt, delete_user);
router.put('/renew', validate_jwt, renew);



export default router;