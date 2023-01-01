const express = require('express');
const router = express.Router();
const catchAsync = require('../utilities/catchAsync');
const passport = require('passport');

// Importing our users controller.
const users = require('../controllers/users');

// router.route is fancy express functionality where you can 
// more easily organize routes if they share the same path.
router.route('/register')
    .get(users.renderRegister)
    .post(catchAsync(users.register));

router.route('/login')
    .get(users.renderLogin)
    // passport.authenticate is middleware from passport to authenticate
    // our local strategy (your can use 'google' or twitter' if you want
    // to give users the option to login with google or twitter, etc.).
    // failureFlash flashes a failure message if things go wrong, 
    // failure redirect redirects to "/login" upon failure, and keepSessionInfo
    // keeps the session info in the browser so that if a user tries to
    // visit a login-restricted page, then logs in, after login they are redirected
    // to that login-restricted page.
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login', keepSessionInfo: true }), users.login);

router.get('/logout', users.logout);

module.exports = router;