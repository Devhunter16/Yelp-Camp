// This is an Express app. Express is a routing and 
// middleware web framework that has minimal functionality
// of its own: An Express application is essentially a 
// series of middleware function calls.

// Middleware functions are functions that have access to
// the request object (req), the response object (res), 
// and the next middleware function in the application’s
// request-response cycle. The next middleware function 
// is commonly denoted by a variable named next.

// Middleware functions can perform the following tasks:

// -Execute any code.
// -Make changes to the request and the response objects.
// -End the request-response cycle.
// -Call the next middleware function in the stack.

// If the current middleware function does not end the 
// request-response cycle, it must call next() to pass 
// control to the next middleware function. Otherwise, 
// the request will be left hanging.

// If we're running in development mode (not production)
// require the dotenv package which takes the variables 
// found in the .env file and adds them to process.env
// so we can access them in our app files.
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
};

// Here we're importing Express, a Node.js module which acts as the
// de facto standard server framework for Node.js.
const express = require('express');

// Here we're importing Mongoose, a Node.js Object Data Modeling (ODM)
// library for MongoDB.
const mongoose = require('mongoose');

// Here we're importing helmet, which helps secure Express apps by 
// setting various HTTP headers. Read the helmet.js docs for more.
const helmet = require('helmet');

// Here we're importing method-override so that we can send "PUT" 
// and "DELETE" requests in places where the client doesn't support 
// them (like in our ejs pages).
const methodOverride = require('method-override');

// Here we're importing ejs-mate so that we can create a template
// for any part of our ejs files (like a header or footer) and then 
// re-use that template in as many ejs files  as we want to avoid 
// having to type the same thing over and over. ejs-mate is one of 
// many ejs engines that can be downloaded as an npm package.
const ejsMate = require('ejs-mate');

// Here we're importing express-session. A session will contain some
// unique data about that client to allow the server to keep track 
// of the user’s state.
const session = require('express-session');

// Here we're importing connect-flash so that we can flash 
// notifications to the user.
const flash = require('connect-flash');

// Here we're importing express-mongo-sanitize, this sanitizes inputs
// against query selector injection attacks (SQL injection).
const mongoSanitize = require('express-mongo-sanitize');

// Here we're importing passport which gives us multiple strategies 
// for authentication.
const passport = require('passport');

// Here we're impprting passport-local. This module lets you 
// authenticate using a username and password in Node.js 
// applications.
const LocalStrategy = require('passport-local');

// Here we're importing path, which provides utilities for working
// with file and directory paths.
const path = require('path');

// Here we're importing the ExpressError class we created in the 
// utilities folder so that we can use it in the code on this page.
const ExpressError = require('./utilities/ExpressError');

// Here we're importing all of our different routes.
const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campground');
const reviewRoutes = require('./routes/reviews');

// Here we're importing our User model so that we can authenticate
// users with passport.
const User = require('./models/user');

// Here we're importing connect-mongo. We use this to store our 
// session info in mongo.
const MongoDBStore = require('connect-mongo')(session);

// Setting this string to a variable so we can use it to connect
// mongoose to our db later and to use it with connect-mongo in order
// to store our session in mongodb
const dbUrl = 'mongodb://localhost:27017/yelp-camp';

// This is our our db URL in Mongo Atlas
// const dbUrl = process.env.DB_URL;

// Connecting mongoose to our MongoDB database: "yelp-camp"
mongoose.connect(dbUrl, {
    // Using these parameters fixes all deprecation 
    // warnings from the MongoDB Node.js driver.
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Assigning mongoose.connection to variable "db" so we
// can type "db.on" or "db.once" instead of having to type 
// "mongoose.connection.on", etc. Just shortening things.
const db = mongoose.connection;
// If the connection throws an error, print to the console.
db.on('error', (err) => {
    console.log("Error in MongoDB connection: " + err);
});
// db.once signifies that this event will only be called 
// once. In this case we try to open the connection to
// MongoDB once, and if successful we print to the console.
db.once('open', () => {
    console.log("Database connected");
});

// Calls the express function, "express()", and puts new
// Express application inside the "app" variable. It is
// kind of like we're creating an object of a class.
const app = express();

// Here we're telling express that we want to use
// ejs-mate as our engine rather than the default one
// it is relying on.
app.engine('ejs', ejsMate);

// ejs is one of many template engines that work with
// Express. These template engines allow for dynamic
// templating of html pages. Here we are declaring
// that our template engine, or view engine, is going to
// be ejs.
app.set('view engine', 'ejs');

// Here we are declaring that the "views" directory we've
// created is the place to find all of our ejs files.
// __dirname is a variable that tells express the absolute
// path of the directory containing the currently
// executing file.
app.set('views', path.join(__dirname, 'views'));

// Side note on app.use(): app.use() runs whatever code 
// is within the parentheses on every single request 
// unless we pass in a specific path as a string for the
// first parameter, then it will only run when we try to
// access that specific path. You'll also have access to 
// whatever variables, functions, etc. you define inside 
// of app.use() in every GET, POST, etc. route handler 
// after you've defined your middleware inside of app.use()
// unless you've passed in a specific path.

// This will allow us to parse the "req.body" object so
// instead of being undefined (req.body = undefined by
// default). It allows us to recieve data in a string or 
// JSON object through a POST or PUT request in the 
// Express server. This is built-in Express middleware.
app.use(express.urlencoded({ extended: true }));

// Using method-override and passing "_method" as the
// query string we want to use in our ejs pages that
// feature "PUT" or "DELETE" requests. Chek out the code in
// the "edit.ejs" page to see this in action.
app.use(methodOverride('_method'));

// Using mongoSanitize to prevent SQL injection attacks. 
app.use(mongoSanitize());

// Creating store with connect-mongo in order to store our session
// in mongo. We're required to pass in the URL, a secret, and a time
// period for the session to resave on the database automatically, 
// here we're specifying in seconds when to auto-resave.
const store = new MongoDBStore({
    url: dbUrl,
    secret: process.env.SECRET,
    touchAfter: 24 * 60 * 60
});

// Printing a message to the console should there be an error when
// storing the session.
store.on('error', function(error) {
    console.log("Session store error!", error)
});

// sessionConfig = an object. We need this so that we can work with
// cookies.
const sessionConfig = {
    store: store,
    name: 'session',
    // A random unique string used to authenticate a session.
    secret: process.env.SECRET,
    // We've set these key-value pairs below so we won't get warnings
    // in the console.
    resave: false,
    saveUninitialized: true,
    cookie: {
        // Extra security measure, the default when creating cookies,
        // check the docs to learn more.
        httpOnly: true,
        // Setting an expiration date for our cookie that expires
        // after a week from now, that's what all the wonky math is 
        // for.
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        // Max cookie age = 1 week.
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

// Telling our app that we're going to be using "express-session",
// we provide sessionConfig as an argument because session requires
// a secret option.
app.use(session(sessionConfig));

// Telling our app that we're going to use "connect-flash" so that
// we can flash things on screen in our ejs pages.
app.use(flash());

// Telling our app that we'll be using helmet upon every single
// request.
app.use(helmet());

// Enambles all 15 of the middleware that helmet comes with, see docs.
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net/",
    "https://res.cloudinary.com/dp2jeiurf/"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/",
    "https://res.cloudinary.com/dp2jeiurf/"
];
const connectSrcUrls = [
    "https://*.tiles.mapbox.com",
    "https://api.mapbox.com",
    "https://events.mapbox.com",
    "https://res.cloudinary.com/dp2jeiurf/"
];
const fontSrcUrls = [ "https://res.cloudinary.com/dp2jeiurf/" ];
 
app.use(
    helmet.contentSecurityPolicy({
        directives : {
            defaultSrc : [],
            connectSrc : [ "'self'", ...connectSrcUrls ],
            scriptSrc  : [ "'unsafe-inline'", "'self'", ...scriptSrcUrls ],
            styleSrc   : [ "'self'", "'unsafe-inline'", ...styleSrcUrls ],
            workerSrc  : [ "'self'", "blob:" ],
            objectSrc  : [],
            imgSrc     : [
                "'self'",
                "blob:",
                "data:",
                `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`,
                "https://images.unsplash.com/"
            ],
            fontSrc    : [ "'self'", ...fontSrcUrls ],
            mediaSrc   : [ `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/` ],
            childSrc   : [ "blob:" ]
        }
    })
);

// Telling our app we're going to be using passport.
app.use(passport.initialize());

// Using this middleware that comes with passport so that we can
// have persistent login sessions vs. haVIng to login upon every
// single request.
app.use(passport.session());

// Telling passport to use the LocalStrategy we downloaded via
// npm and required in this file, and for that LocalStrategy the 
// authentication method is going to be located on our User model
// (we did not define this on User, it comes from "passport-local-mongoose").
passport.use(new LocalStrategy(User.authenticate()));

// Telling passport how to store a user in the session. Look at the
// "passport-local-mongoose" docs for more on this.
passport.serializeUser(User.serializeUser());

// Telling passport how to get a user out of a session.
passport.deserializeUser(User.deserializeUser());

// Some flash middleware.
app.use((req, res, next) => {
    // Now we have access to res.locals. -->success<-- in all of our
    // ejs templates without having to pass it through in our routes.
    res.locals.success = req.flash('success');
    // Same thing but with error this time.
    res.locals.error = req.flash('error');
    // req.user is like req.body except with all of a user's info 
    // (like username, email), we're setting this to currentUser
    // so we can pass it to our ejs pages to only show certain things
    // if a user is signed in (like showing a logout button).
    res.locals.currentUser = req.user;
    // Calling next so that we don't break our app and don't get stuck
    // here with this middleware becoming the end-all, be-all.
    next();
});

// Telling our app that we'll be using our various routes.
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.use('/', userRoutes);

// Telling express to serve our "public" directory so that we can
// use static assets in our ejs pages.
app.use(express.static(path.join(__dirname, 'public')));

// The express route to our home page.
app.get('/', (req, res) => {
    res.render("home");
});

// app.all() is for every single request, the "*" parameter stand for 
// every path.
app.all('*', (req, res, next) => {
    // We're wrapping our error in next() so that it will hit our
    // generic error handler at the bottom of this file. This error
    // will then become the "err" parameter in that middleware
    // function.
    next(new ExpressError('Page not found', 404));
});

// Error handler we created. Whenever you see a ".use" function with 
// four parameters, that means its an error handling middleware.
app.use((err, req, res, next) => {
    // Destructuring the statusCode from whatever
    // ExpressError hits this error handler so we can display it
    // back to the user. We've given a default of "500" and
    // just in case.
    const { statusCode = 500 } = err;
    // Here we're saying if there is no error message attached to
    // our error already, this is going to be the default
    if (!err.message) err.message = 'Oh no, something went wrong!'
    // This renders our "error.ejs" page and passes our status code 
    // through;
    res.status(statusCode).render('error', { err });
});

// Assigning our port # 3000 to variable "port".
const port = 3000;

// "app.listen" takes two parameters: a port number to 
// listen on when we start the server, and a function 
// that gets executed once our app starts listening on 
// the specified port
app.listen(port, () => {
    console.log('Serving on port 3000!');
});