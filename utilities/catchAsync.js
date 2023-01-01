// Here we're defining a function that we can wrap our async
// functions in. It looks very confusing because it is. Basically
// this function returns a function which accepts a function as a
// parameter. It executes the function it's been passed, catches 
// any errors within that function and passes it to next() if
// there is an error so that our error handling middleware at the 
// bottom of our "app.js" file can handle the error.

module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
};