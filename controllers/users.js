const User = require('../models/user');

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
};

module.exports.register = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        // Here we create a new user with the email and username from
        // the form, but use .register() from passport to pass in the
        // user, then the password from the form so that passport can
        // hash the password for us.
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        // Using passport's res.login() here to log a user in after
        // they register. This requires a callback which you can see
        // below.
        req.login(registeredUser, err => {
            if (err) {
                return next(err);
            }
            else {
                req.flash('success', 'Welcome to Yelp Camp!');
                res.redirect('/campgrounds');
            }
        });
    } catch (error) {
        // If there is an error at any point in this process (like if there
        // is already a user registered with that username) we flash
        // the error at you and then redirect you to the registration page.
        req.flash('error', error.message);
        res.redirect('register');
    };
};

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
};

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back!');
    // If a user logs in after visiting a user-restricted page, 
    // they are redirected back to that page after login or if they
    // didn't visit a user-restricted page they are just redirected 
    // to campgrounds.
    const redirectURL = req.session.returnTo || '/campgrounds';
    // deleting the URL we were storing so it doesn't just sit in
    // the session forever.
    delete req.session.returnTo;
    res.redirect(redirectURL);
};

module.exports.logout = (req, res, next) => {
    req.logout(function (error) {
        if (error) {
            return next(error);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    });
};