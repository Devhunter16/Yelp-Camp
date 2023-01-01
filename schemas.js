// Requiring "joi". This npm package will give us some tools
// for "easy" (lol) data validation in the forms in our "new.ejs" 
// and "edit.ejs" pages. Joi is not Express-specific, it is just a 
// Javascript validator tool.
const BaseJoi = require("joi");

// Requiring sanitize html to create our joi extenstion below.
const sanitizeHtml = require('sanitize-html');

// Had to write our own extension for our joi schemas here so that
// we can prvent cross-site scripting attacks in our edit and new
// forms. Had to look at the docs for this.
const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        // Our extension to joi.string(), called escapeHTML.
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    // No tags allowed, no attributes allowed.
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

// Adding the extension we created to joi.string().
const Joi = BaseJoi.extend(extension);

// You will only see the confusing chunk of code below in action
// if you somehow make it past the client-side validation we 
// created using bootstrap (check out the explanation on the 
// "new.ejs" page if you have questions), so this server-side 
// validation we created below is basically a backup plan for that. 

// The code below uses joi, which we imported above. We're using
// joi because it's much easier to validate forms with joi rather
// than writing a bunch of "if the user didn't put in a price, 
// then..." and "if the user didn't put in a description, 
// then...")-type logic for every field in our form. Joi also
// makes it easier to scale our model in case we want to add
// extra fields in the future. Visit the joi docs for more.

// Here we are defining a basic schema with joi for the req.body,
// which is essentially an object that includes all of the fields in 
// our form. Note that this is NOT a Mongoose schema. This is 
// going to validate our data before it even makes it to 
// Mongoose because we do not want Mongoose to be saving entries
// with missing fields to our MongoDB database.
module.exports.campgroundSchema = Joi.object({
    // If we look at our code in the "new.ejs" or "edit.ejs"
    // files, we'll see that the name of every input field is 
    // "campground[something]". This means that every input is 
    // being sent under "campground". Here we are making sure 
    // the campground object we're sending all of our form information
    // under is present by requiring it, and we're also making 
    // sure that every field within that object has been filled
    // out and is the correct type. We also set a price minimum
    // of 0.
    campground: Joi.object({
        title: Joi.string().required().escapeHTML(),
        price: Joi.number().required().min(0),
        location: Joi.string().required().escapeHTML(),
        description: Joi.string().required().escapeHTML()
    }).required(),
    deleteImages: Joi.array()
});

// Our server-side validation so that no-one can leave an empty review
// using postman etc if they get past our client-side bootstrap validation.
module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required().escapeHTML()
    }).required()
});