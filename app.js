const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

const errorController = require('./controllers/error');

const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findById('5cb59bb6ebd37537f4628859')
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose.connect('mongodb+srv://test:test@cloud-ejl26.mongodb.net/shop?retryWrites=true')
.then(() => {
    console.log('Connected.');
    return User.find();
})
.then(users => {
    if(users.length == 0)
    {
        const user = new User({
            name: 'admin',
            email: 'admin@admin.com',
            cart:{
                items: []
            }
        });
        user.save();
    }
    app.listen(3000);
})
.catch(err => console.log(err));