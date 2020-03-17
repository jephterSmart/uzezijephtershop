const express = require('express');
const { check, body } = require('express-validator/check');

const authController = require('../controllers/Shop/auth');
const UserModel = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',[body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
body('password',"Password must be at least 6 characters").isLength({min:6}).trim()], authController.postLogin);

router.post('/signup',[
    check('email').isEmail().withMessage('Invalid email address').custom((value,{req}) =>{
        if(value.trim() === "test@test.com"){
            throw new Error('forbidden email address')
        }
        
            return   UserModel.findOne({email:value})
            .then(user =>{
            if(user){
                 return Promise.reject('email already exist, please pick another one.');
        
        } 
        })
    })
     ,
    body('password','please enter a password with at least 6 characters')
    .isLength({min:6}).trim(),
    body('confirmPassword')
    .custom((value,{req}) =>{
        if(value.trim() !== req.body.password){
            throw new Error('password does not match');
        }
        return true;
    })
] , authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset',authController.getReset);

router.post('/reset',authController.postReset);

router.get('/reset/:token',authController.getNewPassword);

router.post('/new-password',
[check('password').isLength({min:6}).withMessage('password must be at least 6 characters').trim()],
authController.postNewPassword);

module.exports = router;