const Campground = require('../models/campground');

// Importing cloudinary to store campground images.
const { cloudinary } = require('../cloudinary');

// Importing MapBox geocoding capabiliities.
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
// Getting our public Mapbox API token from our .env file.
const mapBoxToken = process.env.MAPBOX_TOKEN;
// Passing our token to mbxGeocoding so Mapbox will work for us.
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
    // Here we're having Mongoose find all of the entries
    // in our campgrounds collection in MongoDB and save 
    // them to the "campgrounds" variable as an array/
    const campgrounds = await Campground.find({});
    // Now we're telling express to render our "index.js"
    // page. The first parameter is the path to find it,
    // the second is us passing our "campgrounds" array
    // to our "index.ejs" file so we can use it there.
    res.render('campgrounds/index', { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
};

module.exports.createCampground = async (req, res, next) => {
    // Mapbox geocoder needs two things: a place(query) and 
    // a limit for results. We just want 1 result
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send();
    // req.body is empty (undefined) until it is parsed. Here we 
    // pass all of the values in the form in "new.ejs" to our 
    // Campground model to create a new campground with that info.
    const campground = new Campground(req.body.campground);
    // This is the latitude and longitude from Mapbox.
    campground.geometry = geoData.body.features[0].geometry;
    // mapping over the image files uploaded then adding them 
    // to the campground's images array.
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    // making this campground's author the user that created the
    // campground so we can display that on the "show" page.
    campground.author = req.user._id;
    // Waiting until the new campground is saved to our db
    // before redirecting the user.
    await campground.save();
    // Flashes when we make a new campground.
    req.flash('success', 'Successfully made a new campground!');
    // Redirecting the user to the new campground's "show.ejs"
    // page using a string template literal to get the id.
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res) => {
    // Finding a specific campground based upon it's id and saving
    // that info to variable "campground". We also want to populate
    // the reviews array, the author for each review, and the author
    // of the campground so that it will show the actual reviews rather 
    // than just a bunch of ids and it will show the campground author 
    // rather than just the User model's id
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    // If not campground (if campground has been deleted and someone
    // still tries to go to the url) then flash error and redirect.
    if (!campground) {
        req.flash('error', 'Cannot find that campground, sorry.');
        return res.redirect('/campgrounds');
    }
    // Rendering the "show.ejs" page and passing the info
    // for the campground we found to it.
    res.render('campgrounds/show', { campground });
};

module.exports.renderEditForm = async (req, res) => {
    // The req.params property is an object containing
    // properties mapped to the named route “parameters”.
    // For example, if you have the route /student/:id, 
    // then the “id” property is available as req.params.id.
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Error, cannot find that campground.');
        return res.redirect(`/campgrounds/${id}`);
    }
    // Rendering our "edit.ejs" page and passing through
    // the campground we found above so we can use that
    // information to populate the form on our ejs page.
    res.render('campgrounds/edit', { campground });
};

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params
    // Finding the campground by it's id. The second parameter
    // here selects what to update. We're using the spread
    // operator to say "we want to update everything".
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    // Mapping over the new image files uploaded then adding them 
    // to an array.
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    // Pushing all elements from the new array onto the existing array.
    campground.images.push(...imgs);
    await campground.save();
    // If there are any images to delete in the req.body.deleteImages
    // array...
    if (req.body.deleteImages) {
        // Deleting images from cloudinary storage.
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        };
        // The $pull operator is how we pull items out of an array, we are 
        // pulling from the images array all images where the filename of
        // that image is in the req.body.deleteImages array that is created
        // upon editing a campground after selecting images to delete.
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
    };
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    // If the author id of this campground does not match the id of
    // the currently logged in user, then flash an error message and
    // redirect them to the show page.
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'Error, you do not have permission to delete this campground.');
        return res.redirect(`/campgrounds/${id}`);
    }
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
};