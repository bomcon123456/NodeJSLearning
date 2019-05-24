const crypto = require('crypto');       // create unique secure random values

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const {
    validationResult
} = require('express-validator/check')

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message,
        oldInput: {
            email: "",
            password: ""
        },
        validationErrors: []
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const reqPassword = req.body.password;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: reqPassword
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({
            email: email
        })
        .then((user) => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email/password.',
                    oldInput: {
                        email: email,
                        password: reqPassword
                    },
                    validationErrors: []
                });
            }
            bcrypt
                .compare(reqPassword, user.password)
                .then(result => {
                    if (result) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            if (err)
                                console.log(err);
                            res.redirect('/');
                        });
                    }
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: 'Invalid email/password.',
                        oldInput: {
                            email: email,
                            password: reqPassword
                        },
                        validationErrors: []
                    });
                })
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        }
        res.redirect('/');
    });
}

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
            confirmPassword: ""
        },
        validationErrors: []
    });
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array);
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: errors.array()
        });
    }
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const newUser = new User({
                email: email,
                password: hashedPassword,
                cart: {
                    items: []
                }
            });
            return newUser.save();
        })
        .then(result => {
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'shop@termanteus.com',
                subject: 'Sign up completed',
                html: '<h1> You successfully signed up </h1>'
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });

}

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({
                email: req.body.email
            })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 360000;
                user.save();
            })
            .then(result => {
                res.redirect('/');
                transporter.sendMail({
                    to: req.body.email,
                    from: 'shop@termanteus.com',
                    subject: 'Password reset',
                    html: `
                        <p>You requested a password reset</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
                    `
                });
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatus = 500;
                return next(error);
            });
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
};

exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const newPassword = req.body.password;
    const passwordToken = req.body.passwordToken;

    let resetUser;

    User.findOne({
            resetToken: passwordToken,
            resetTokenExpiration: {
                $gt: Date.now()
            },
            _id: userId
        })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = null;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });

};