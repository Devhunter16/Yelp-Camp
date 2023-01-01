const mongoose = require('mongoose');

// Assigning "mongoose.Schema" to variable "Schema" so
// that later instead of having to reference 
// mongoose.Schema.whatever when working with
// relationships we can shorten it a little to Schema.whatever.
const Schema = mongoose.Schema;

// Requiring Review so we can use it in our deletion middleware
// below.
const Review = require('./review');

// Created a schema just for a campground's images just so we
// could create the virtual below.
const ImageSchema = new Schema({
    url: String,
    filename: String
});

// Using virtual because we do not need to store this in our database.
// Virtual properties are not stored in MongoDB, virtuals are typically
// used for computed properties on documents, and we just need to
// manipulate our images to be width of 200. Now I have a property
// called .thumbnail on my images that I can call to make my images
// 200 width.
ImageSchema.virtual('thumbnail').get(function () {
    // this refers to the image
    return this.url.replace('/upload', '/upload/w_200');
});

// Need to define this so we can add our virtual (further down) to
// our campground Schema and convert it to JSON so that we can 
// access campground names on our cluster map (ugh).
const opts = { toJSON: { virtuals: true } };

// Creating our campground Schema and assigning it to
// variable "CampgroundSchema".
const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    // Adding geometry so that we can use Mapbox' coordinates
    // in our Schema. Mongoose docs tell us how to format this.
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    author: {
        // The type here is not a String, Number, or Boolean. It is
        // a user's object Id that is created upon creation of a new
        // user.
        type: Schema.Types.ObjectId,
        // Reference is the User model.
        ref: 'User'
    },
    // Our Campground Schema has an array which can store reviews
    // for that campground. When we store a review in the array,
    // it will initially be stored as an object Id, but we can 
    // use Mongoose's .populate() function later to populate each 
    // array entry with all of the review's key-value pairs like the 
    // review's rating and body text.
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
}, opts);

// "this" in this context refers to the particular campground instance.
CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>`;
});

// This is post middleware we are using to delete all reviews for a
// campground when a user hits the "delete campground" button on the
// "show.ejs" page. This middleware finds the campground document and
//  deletes, then an async function runs that takes the deleted doc
// (if there was one) and then takes each review document, check it's
// id, and if that id is found in the reviews array, it will delete
// that review from the reviews collection in MongoDB.
CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        console.log(doc);
        await Review.deleteMany({ _id: { $in: doc.reviews } });
    }
})

// Compiling our model from our Schema and naming the 
// model "Campground" and then exporting it to be used
// elsewhere.
module.exports = mongoose.model('Campground', CampgroundSchema);

// Something to remember when using mongoose - When you
// call mongoose.model on a Schema like we just did,
// Mongoose will automatically create a lowercase, plural
// version of your model name ("Campground" in this case)
// and create a collection in the database you're using.
// So mongoose created collection "campgrounds" for us
// in the MongoDB db "yelp-camp".