const express = require('express');
const {
    check,  // check from anywhere
    body    // check only from the body of the request
} = require('express-validator/check');

const authController = require('../controllers/auth');

const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post(
    '/login',
    [
        body('email')
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),
        body('password', 'Password has to be valid.')
        .isLength({
            min: 5
        })
        .isAlphanumeric()
        .trim()
    ],
    authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);
router.post(
    '/signup',
    [
        check('email')
        .isEmail()
        .custom((value, {req}) => {
            return User.findOne({
                    email: value
                })
                .then(user => {
                    if (user) {
                        // Express-validator's .custom() function can receive a promise
                        // So in this case, express will wait until the promise to be fufilled
                        // If it see a rejected promise, express will see it as an error
                        return Promise.reject('E-mail existed.');  
                    }
                });
        })
        .withMessage('Please enter a valid email.')
        .normalizeEmail(),
        body(
            'password',
            'Please enter password with number/text at least 5 chars'
        )
        .isLength({
            min: 5
        })
        .isAlphanumeric()
        .trim(),
        body('confirmPassword')
        .trim()
        .custom((value, {
            req
        }) => {
            if (value === req.body.password)
                return true;
            throw new Error('Passwords need to match.');
        })
    ],
    authController.postSignup);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);

module.exports = router;