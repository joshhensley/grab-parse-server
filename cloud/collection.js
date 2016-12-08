// Alert
var Alert = Parse.Object.extend("Alert");
var AlertType = {
    // Friends
    FriendRequested : 1,
    FriendAddedByRequest : 2,
    FriendAddedByCodeScan : 3,
    FriendRemoved : 4,
    
    // Collections
    CollectionCreated : 5,
    CollectionArchived : 6,
    CollectionDeleted : 7,
    
    // Groups
    GroupCreated : 8,
    GroupArchived : 9,
    GroupDeleted : 10
};

//
//

Parse.Cloud.afterSave("Collection", function(request) {
    var collection = request.object;

    if(collection.isNew()) {
        var currentUser = request.user;
        currentUser.increment("collectionCount", 1);
        currentUser.save();

        var alert = new Alert();
        alert.set("collection", collection);
    	alert.set("type", AlertType.CollectionCreated);
    	alert.set("owner", currentUser);
    	alert.set("ownerRead", true);
    	alert.set("ownerArchived", false);
    	alert.save();
    }
});

Parse.Cloud.beforeDelete("Collection", function(request, response) {
    var collection = request.object;
    var alertsQuery = new Parse.Query(Alert);
    alertsQuery.equalTo("collection", collection);
    alertsQuery.find({
        success: function(results) {
            for (i=0; i<results.length; i++) {
                var collectionAlert = results[i];
                collectionAlert.set("collection", null);
                collectionAlert.set("collectionName", collection.get("name"));
                collectionAlert.save();
            }
            response.success();
        },
        error: function(error) {
            response.error("Error updating related alerts before collection delete " + error.code + ": " + error.message);
        }
    });
});

Parse.Cloud.afterDelete("Collection", function(request) {
    var collection = request.object;

    var currentUser = request.user;
    currentUser.increment("collectionCount", -1);
    currentUser.save();

    var alert = new Alert();
    alert.set("collectionName", collection.get("name"));
    alert.set("type", AlertType.CollectionDeleted);
    alert.set("owner", currentUser);
    alert.set("ownerRead", true);
    alert.set("ownerArchived", false);
    alert.save();
});