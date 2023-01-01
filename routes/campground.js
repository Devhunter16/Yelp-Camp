const express = require('express');
const router = express.Router();

// Importing our campgrounds controller.
const campgrounds = require('../controllers/campgrounds');

const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');

// Requiring npm package Multer so that we can add file upload to
// our forms.
const multer = require('multer');

// Getting storage from cloudinary index.js file (node automatically
// searches for an index.js file, which is why the path ends at
// the cloudinary folder).
const { storage } = require('../cloudinary');

// Initializing Multer and giving it a place to store the uploaded
// files.
const upload = multer({ storage });

// Importing the catchAsync function we created in the utilities
// folder so that we can use it in the code on this page.
const catchAsync = require('../utilities/catchAsync');

// router.route is fancy express functionality where you can 
// more easily organize routes if they share the same path.
router.route('/')
    // Express route for our campgrounds index. campgrounds.index is our
    // controller for this route with all of the logic we need.
    .get(catchAsync(campgrounds.index))
    // POST request to "/campgrounds". We added the validateCampground
    // middleware function we created as an argument in our route handler
    // here so that we can use it in this route handler in order
    // to work as server-side validation in case a user somehow gets
    // past our client side bootsrap validation. We don't need to call
    // it within the route handler, we can just add is as an argument
    // and it'll work

    // Also, we're using Multer middleware here and singling out the form with 
    // name="image" in order to allow us to upload files to that form.
    // upload.array allows a user to send multiple files at once.
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground));

// Express route to get the "Create New Campground" page.
// Make sure this route is before "/campgrounds/:id" 
// otherwise Express will get confused and think "/new"
// is an "/:id" and try to find id: new. 
router.get('/new', isLoggedIn, campgrounds.renderNewForm);

router.route('/:id')
    // Express route showing an individual campground based
    // on which campground name you click on in the "All Campgrounds"
    // web page. Each campground entry has a unique ID assigned
    // to it by Mongoose when it is created using our Schema.
    // We're using that unique ID to find the matching campground
    // in our database and displaying it's info on our "show.ejs" page.
    .get(catchAsync(campgrounds.showCampground))
    // Put request we are making using method-override.
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    // Delete request we are making using method-override.
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));

module.exports = router;