const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Express-session is used to create cookie and store it in the session automatically
// Session is initially stored in the memory, which is BAD.
const session = require('express-session');
// MongoDBStore is used to let the session to be store in the database rather than the memory
const MongoDBStore = require('connect-mongodb-session')(session);

// csurf is used generated a token attached to the form you gonna post
// so every-post's view, you gotta add the csrfToken
const csrf = require('csurf');
// flash is used to send message from this section to that section
// e.g: in postLogin, the user entered a wrong password, flash will send a error message in a flash, then render the /login
// then in the GET /login, we get the message from the flash.
const flash = require('connect-flash');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const errorController = require('./controllers/error');

const User = require('./models/user');

const app = express();

const MONGODB_URI = 'mongodb+srv://test:test@cloud-ejl26.mongodb.net/shop';
const store = new MongoDBStore({
    uri: MONGODB_URI,               // which database the sessions will be stored
    collection: 'sessions'          // which collection the sessions will be stored
});

const csrfProtection = csrf();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'a very long string.',
    resave: false,
    saveUninitialized: false,
    store: store        // store this session to where?
}));

app.use(csrfProtection);
app.use(flash());

// This mean in every respond, these two variable will always attached to
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    if (req.session.user)
        User.findById(req.session.user._id)
        .then(user => {
            if (!user)
                return next();
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
    else
        return next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500', errorController.get500);

app.use(errorController.get404);

app.use((err, req, res, next) => {
    res.status(500).render('500', {
        pageTitle: '500 ERROR',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    });
});

mongoose.connect(MONGODB_URI)
    .then(result => {
        console.warn('CONNECTED.');
        app.listen(3000);
    })
    .catch(err => console.log(err));