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

Parse.Cloud.beforeSave("Group", function(request, response) {
    var group = request.object;
    if(group.isNew()) {
        group.set("grabCount", 0);
        group.set("collectionCount", 0);
        group.set("memberCount", 1); // New grabs have one member, the owner creating it.
    }
    response.success();
});

Parse.Cloud.afterSave("Group", function(request) {
    var group = request.object;

    if (!group.existed()) {
        var currentUser = request.user;
        currentUser.increment("groupCount", 1);
        currentUser.save();

        var alert = new Alert();
        alert.set("group", group);
    	alert.set("type", AlertType.GroupCreated);
    	alert.set("owner", currentUser);
    	alert.set("ownerRead", true);
    	alert.set("ownerArchived", false);
    	alert.save();
    }
    else {
        // Count number of grabs related to this group.
        var grabsRelation = group.relation("grabs");
        var grabsRelationQuery = grabsRelation.query();
        grabsRelationQuery.count({
            success: function(count) {
                // The grabs count request succeeded. Update the group's grab count.
                group.set("grabCount", count);
            },
            error: function(error) {
                // The collections count request failed.
            }
        });

        // Count number of collections related to this group.
        var collectionsRelation = group.relation("collections");
        var collectionsRelationQuery = collectionsRelation.query();
        collectionsRelationQuery.count({
            success: function(count) {
                // The collections count request succeeded. Update the group's collection count.
                group.set("collectionCount", count);
            },
            error: function(error) {
                // The collections count request failed.
            }
        });

        // Count number of members related to this group.
        var membersRelation = group.relation("members");
        var membersRelationQuery = membersRelation.query();
        membersRelationQuery.count({
            success: function(count) {
                // The memebrs count request succeeded. Update the group's member count.
                group.set("memberCount", count + 1); // Add one to the count number to allow for the group owner's membership.
            },
            error: function(error) {
                // The members count request failed.
            }
        });

        // Save the group.
        group.save();
    }
});

Parse.Cloud.beforeDelete("Group", function(request, response) {
    var group = request.object;
    var alertsQuery = new Parse.Query(Alert);
    alertsQuery.equalTo("group", group);
    alertsQuery.find({
        success: function(results) {
            for (i=0; i<results.length; i++) {
                var groupAlert = results[i];
                groupAlert.set("group", null);
                groupAlert.set("groupName", group.get("name"));
                groupAlert.save();
            }
            response.success();
        },
        error: function(error) {
            response.error("Error updating related alerts before group delete " + error.code + ": " + error.message);
        }
    });
});

Parse.Cloud.afterDelete("Group", function(request) {
    var group = request.object;

    var currentUser = request.user;
    currentUser.increment("groupCount", -1);
    currentUser.save();

    var alert = new Alert();
    alert.set("groupName", group.get("name"));
    alert.set("type", AlertType.GroupDeleted);
    alert.set("owner", currentUser);
    alert.set("ownerRead", true);
    alert.set("ownerArchived", false);
    alert.save();
});