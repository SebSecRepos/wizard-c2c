
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
        check('user_name', 'User in required').not().isEmpty(),
        check('password', 'Password is required').not().isEmpty(),
        check('password', 'Password must have at least 4 characters and max 20 characters').isLength({min: 4, max:20}).matches(/[A-Z]/).withMessage('Must have at least an uppercase character')
        .matches(/[a-z]/).withMessage('Must have at least an lowercase character')
        .matches(/[0-9]/).withMessage('Must have at least an number')
        .matches(/[\W_]/).withMessage('Must have at least an special character'),
        validate_fields
    ], 
    validate_jwt, register
);
router.post(
  '/update/:id',
  [
    check('user_name')
      .optional()
      .notEmpty().withMessage('User can\'t be empty string'),

    check('password')
      .optional({checkFalsy:true})
      .isLength({ min: 4, max: 20 }).withMessage('Password must have at least 4 characters and max 20 characters')
      .matches(/[a-z]/).withMessage('Must have at least an lowercase character')
      .matches(/[0-9]/).withMessage('Must have at least an number')
      .matches(/[\W_]/).withMessage('Must have at least an special character'),

    check('role')
      .optional()
      .notEmpty().withMessage('Role cant\'t be empty string'),

    body('password_repeat')
      .if(body('password').exists().notEmpty())
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords doesn\'t match');
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
        check('user_name', 'User is required').not().isEmpty(),
        check('password', 'Password is required').not().isEmpty(),
        check('password', 'Password must have at least 4 characters and max 20 characters').isLength({min: 4}),
        validate_fields
    ], 
    login);

router.get('/get_users',validate_jwt, get_users);
router.delete('/delete/:id',validate_jwt, delete_user);
router.put('/renew', validate_jwt, renew);



export default router;