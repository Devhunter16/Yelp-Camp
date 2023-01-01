// Requiring our campgroundSchema and reviewSchema from our 
// "schemas.js" file. Destructured here because we want to 
// require multiple schemas from that file.
const { campgroundSchema, reviewSchema } = require('./schemas');

const Campground = require('./models/campground');

const Review = require('./models/review')

const ExpressError = require('./utilities/ExpressError');

// Exporting our middleware function.
module.exports.isLoggedIn = (req, res, next) => {
    // We can use req.user to see a user's information because of
    // passport.
    console.log('Req.user...', req.user);
    // .isAuthenticated() comes from passport, makes sure a user is
    // logged in before allowing them to access a page.
    if (!req.isAuthenticated()) {
        // Adding returnTo to the session which stores the url we
        // tried to go to (if we were trying to access a login-restricted
        // page while not logged in) in the session as returnTo so
        // we can return to that page automatically after logging in.
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in');
        return res.redirect('/login');
    }
    next();
};

// Creating a middleware function that contains server-side validation
// logic to make sure than no user can submit an empty form. 
module.exports.validateCampground = (req, res, next) => {
    // If the input in the form is valid, then the error will be 
    // undefined. If the input is invalid, error is assigned a 
    // ValidationError object providing more information.
    const { error } = campgroundSchema.validate(req.body);
    // If an error exists, we map over error.details which is an 
    // array of ValidationError objects, take every object and return
    // the error messages into a new array, then join those elements 
    // of the new array we created by comma into a new string. We 
    // save that string as the variable msg so we can display it to
    // the user by adding it as an argument to our ExpressError class.
    if (error) {
        const msg = error.details.map(element => element.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        // We have to call next here so if there is no error we can
        // move past this rather than getting stuck here.
        next();
    }
};

// Middleware we created in order to check whether the current user
// is also the author of whatever campground they're trying to edit or delete.
module.exports.isAuthor = async (req, res, next) => {
    // The req.params property is an object containing
    // properties mapped to the named route “parameters”.
    // For example, if you have the route /student/:id, 
    // then the “id” property is available as req.params.id.
    const { id } = req.params;
    const campground = await Campground.findById(id);
    // If the author id of this campground does not match the id of
    // the currently logged in user, then flash an error message and
    // redirect them to the show page.
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'Error, you do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
};

// Middleware we created in order to check whether the current user
// is also the author of whatever review they're trying to edit or delete.
module.exports.isReviewAuthor = async (req, res, next) => {
    // We have to get the campground id and review id from the params
    // because we need to use both in this middleware.
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    // If the author id of this review does not match the id of
    // the currently logged in user, then flash an error message and
    // redirect them to the show page.
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'Error, you do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
};

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(element => element.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        // We have to call next here so if there is no error we can
        // move past this rather than getting stuck here.
        next();
    }
};