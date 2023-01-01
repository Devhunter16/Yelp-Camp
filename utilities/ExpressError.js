// Here we're defining an error handling class so we can use it and
// re-use it in our code. It extends the built-in default Error class
// in Express.

class ExpressError extends Error {
    constructor(message, statusCode) {
        // Calling super() here which calls the constuctor function
        // within the Error class we're extending from. This allows
        // us to access properties from Error.
        super();
        this.message = message;
        this.statusCode = statusCode;
    }
};

// Exporting our class to be used elswhere.
module.exports = ExpressError;