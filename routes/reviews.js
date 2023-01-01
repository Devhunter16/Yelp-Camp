const express = require('express');

// We use mergeParams here because when we try to get an id from
// our req.params in this file, it can't find that id because our
// route with that id in it is specified over in the app.js file.
// We use mergeParams so we can have access to the id from our 
// /campgrounds/:id/reviews routes
const router = express.Router({ mergeParams: true });

const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');

// Importing the catchAsync function we created in the utilities
// folder so that we can use it in the code on this page.
const catchAsync = require('../utilities/catchAsync');

// Importing our reviews controller.
const reviews = require('../controllers/reviews');

router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview));

router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview));

module.exports = router;