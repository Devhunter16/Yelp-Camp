// We'll run this file on it's own seperately from "app.js"
// any time we want to seed our database with some entries

const mongoose = require('mongoose');

// Importing the arrays of places and descriptors from
// our "seedHelpers" file.
const { places, descriptors } = require('./seedHelpers');

// Importing the giant array of 1000 cities from our
// "cities" file.
const cities = require('./cities');

// Importing our "Campground" model from campground.js
// and assigning it to variable "Campground" so we can
// use it in this file. We need the ".." part because
// we need to back out of our "seeds" directory and 
// then go into models and then find "campground.js".
const Campground = require('../models/campground');

// Connecting mongoose to our mongodb database: "yelp-camp".
mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    // Using these parameters fixes all deprecation 
    // warnings from the MongoDB Node.js driver.
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Assigning mongoose.connection to variable "db" so we
// can type "db.on" or "db.once" instead of having to type 
// "mongoose.connection.on", etc. Just shortening things.
const db = mongoose.connection;

// If the connection throws an error, let us know in
// the console.
db.on('error', (err) => {
    console.log('Error in MongoDB connection: ' + err);
});
// "Once" signifies that this event will only be called 
// once. In this case we try to open the connection to
// MongoDB once, and if successful we print to the console.
db.once('open', () => {
    console.log('Database connected');
});

// Defining a function "sample()" that takes an array
// (such as our arrays of places and descriptors) and
// returns a random element from that array. We'll
// use this to create names for campgrounds below.
const sample = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

// Async function called "seedDB" which first erases
// everything in our collection so we can start fresh,
// and then seeds a bunch of entries.
const seedDB = async () => {
    // First we need to await because we need to clean
    // out any entries in our collection before seeding.
    // Here Campground is equivalent to our collection
    // in MongDB named "campgrounds" which holds all of
    // our db entries.
    await Campground.deleteMany({});
    // for loop that creates 300 collection entries of
    // random cities from our "cities.js" file and saves
    // those entries to "campgrounds" in MongoDB.
    for (let i = 0; i < 300; i++) {
        // "random1000" is a random number from 1 to 1000.
        const random1000 = Math.floor(Math.random() * 1000);
        // This gives us a random price so that each 
        // campground is priced differently between 10 and 30.
        const price = Math.floor(Math.random() * 20) + 10;
        // Creating a new campground entry.
        const camp = new Campground({
            // Your user ID.
            author: '633cae5bfc4721cd1a5fd2bd',
            // Using our cities array from "cities.js" to create
            // a location.
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            // Using our sample() function and our arrays of
            // descriptors and places from "seedHelper.js" to
            // create a campground title.
            title: `${sample(descriptors)} ${sample(places)}`,
            // Accessing the Unsplash image API for a collection
            // of woodsy pictures to go with out campgrounds. This
            // will be a different campground every time.
            description: '',
            price: price,
            geometry: {
                type: 'Point',
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/dp2jeiurf/image/upload/v1668972173/YelpCamp/u8wvearoh7d99maln4xl.jpg',
                    filename: 'YelpCamp/u8wvearoh7d99maln4xl',
                },
                {
                    url: 'https://res.cloudinary.com/dp2jeiurf/image/upload/v1668972176/YelpCamp/laura-pluth-RMicIhNOOIg-unsplash_ig1d5t.jpg',
                    filename: 'YelpCamp/laura-pluth-RMicIhNOOIg-unsplash_ig1d5t',
                },
                {
                    url: 'https://res.cloudinary.com/dp2jeiurf/image/upload/v1668972176/YelpCamp/todd-trapani-5LHzBpiTuzQ-unsplash_c75lgl.jpg',
                    filename: 'YelpCamp/todd-trapani-5LHzBpiTuzQ-unsplash_c75lgl',
                }
            ]
        });
        // Saves new campground entry before looping again.
        await camp.save();
    }
};

// Here we are executing the function we've defined above.
seedDB()
    // We can use a ".then()" function on seedDB() because it
    // returns a promise. Here we are closing the connection to our 
    // database after we're done running what we need to in this file.
    .then(() => {
        mongoose.connection.close();
    });
