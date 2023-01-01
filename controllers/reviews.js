const Campground = require('../models/campground');

const Review = require('../models/review');

module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    // req.body.review is everything a user has entered in the 
    // "Leave a Review" portion of the show campground web page.
    // We pass that information to Review to create a new review
    // entry in our db. You'll see review[something] for the name
    // of the inputs in the form. This is where the review part
    // of req.body.review comes from. It is the key for the key 
    // - value pair review: something.
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', 'Created new review!');
    res.redirect(`/campgrounds/${campground._id}`)
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    // $pull is a MongoDB operator that removes from an existing array all 
    // instances of a value or values that match a specified condition.
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review!');
    res.redirect(`/campgrounds/${id}`);
};