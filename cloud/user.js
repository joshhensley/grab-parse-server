//var Image = require("parse-image");

Parse.Cloud.beforeSave("_User", function(request, response) {
	var user = request.object;

	if (!user.dirty("photoOriginal")) {
    	// The profile photo isn't being modified.
    	response.success();
        console.log('The profile photo is not being modified.');
    	return;
	}

	// Create array of thumbnail sizes needed.
	var photoSizes = [60,120,180,150,300,450];
    var photoPromises = [];

    for (var i = 0; i < photoSizes.length; i++) {
        photoPromises.push(createPhotoResizePromise(user, photoSizes[i]));
    }

    // Now we have all the promises, wait for them all to finish before we're done.
    Parse.Promise.when(photoPromises).then(function () {
        response.success();
    }, function (error) {
        response.error(error);
    });
});

function createPhotoResizePromise(user, size) {
    var Image = require("parse-image");
    // We want to return the promise.
    return Parse.Cloud.httpRequest({
        url: user.get("photoOriginal").url()
    }).then(function(response) {
        var image = new Image();
        return image.setData(response.buffer);
    }).then(function(image) {
        // Crop the image to the smaller of width or height (make it a square).
        console.log('Crop the image to the smaller of width or height (make it a square).');
        var minSize = Math.min(image.width(), image.height());
        return image.crop({
            left: (image.width() - minSize) / 2,
            top: (image.height() - minSize) / 2,
            width: minSize,
            height: minSize
        });
    }).then(function(image) {
        // Resize the image to 64x64.
        return image.scale({
            width: size,
            height: size
        });
    }).then(function(image) {
        // Make sure it's a JPEG to save disk space and bandwidth.
        return image.setFormat("JPEG");
    }).then(function(image) {
        // Get the image data in a Buffer.
        return image.data();
    }).then(function(buffer) {
        // Save the image into a new file.
        var base64 = buffer.toString("base64");
        var cropped = new Parse.File("photo"+size+".jpg", { base64: base64 });
        return cropped.save();
    }).then(function (cropped) {
        // Attach the image file to the user object.
        user.set("photo"+size, cropped);
        console.log("photo"+size);
    });
}