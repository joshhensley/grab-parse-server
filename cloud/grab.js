var Grab = Parse.Object.extend("Grab");
var GrabType = {
    Audio : 1,
    File : 2,
    Photo : 3,
    Text : 4,
    Video : 5
};

Parse.Cloud.afterSave("Grab", function(request) {
	// Increment user's grab count.
    if(!request.object.isNew()) {
        var currentUser = request.user;
        currentUser.increment("grabCount", 1);
        currentUser.save();
    }
});

Parse.Cloud.afterDelete("Grab", function(request) {
	// Get reference to grab object that was deleted.
	var grab = request.object;

	// Decrement user's grab count.
    var currentUser = request.user;
    currentUser.increment("grabCount", -1);
    currentUser.save();

    // Get reference to grab object's related grab type object.
    var relatedGrabPointer;
    if (grab.get("type") == GrabType.Audio) {
    	relatedGrabPointer = grab.get("audio");
    } else if (grab.get("type") == GrabType.File) {
    	relatedGrabPointer = grab.get("file");
    } else if (grab.get("type") == GrabType.Photo) {
    	relatedGrabPointer = grab.get("photo");
    } else if (grab.get("type") == GrabType.Text) {
    	relatedGrabPointer = grab.get("text");
    } else if (grab.get("type") == GrabType.Video) {
    	relatedGrabPointer = grab.get("video");
    }

    // Deleted the related grab type object.
    if (relatedGrabPointer) {
    	return relatedGrabPointer.fetch().then(function(relatedGrab) {
    		return relatedGrab.destroy();
    	});
    }
});