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

// Friendship
var Friendship = Parse.Object.extend("Friendship");
var FriendStatus = {
    RequestSent : 1,
    RequestRejected : 2,
    RequestAccepted : 3,
    QRAccepted : 4
};

Parse.Cloud.afterSave("Friendship", function(request) {
  // Only send push notifications and create alerts for new Friendships.
  if (request.object.existed()) {
    return;
  }

  var currentUser = request.user;
	var friendship = request.object;
  var fromUser = friendship.get("fromUser");
  var toUser = friendship.get("toUser");
  var pushString;
  var alert;

  // Update both user's friend count column.
  if (friendship.get("status") == FriendStatus.QRAccepted || friendship.get("status") == FriendStatus.RequestAccepted) {
    fromUser.increment("friendCount", 1);
    fromUser.save();

    toUser.increment("friendCount", 1);
    toUser.save();
  }

  if (friendship.get("status") == FriendStatus.QRAccepted) {
    alert = new Alert();
    alert.set("type", AlertType.FriendAddedByCodeScan);
    alert.set("owner", currentUser);
    alert.set("user", fromUser);
    alert.set("ownerRead", true);
    alert.set("ownerArchived", false);
    alert.set("userRead", false);
    alert.set("userArchived", false);

    pushString = currentUser.get("firstName") + " " + currentUser.get("lastName") + " scanned your code to become friends on Grab.";

    var query = new Parse.Query(Parse.Installation);
    query.equalTo("user", fromUser);
  
    Parse.Push.send({
      where: query, // Set Installation query.
      data: {
        alert: pushString,
        sound: "default",
        badge: "Increment"
      }
      },{
        success: function() {
          // Push was successful
          console.log("Push for QR Code Scan was successful!");
        },
        error: function (error) {
          console.error("Push for QR Code Scan was NOT successful...error: " + error);
        }
    });
  }
  else {
    if (friendship.get("status") == FriendStatus.Requested) {
      pushString = fromUser.get("firstName") + " " + fromUser.get("lastName") + " would like to add you as a friend on Grab."
      alert = new Alert();
      alert.set("type", AlertType.FriendRequested);
      alert.set("owner", fromUser);
      alert.set("user", toUser);
      alert.set("ownerRead", true);
      alert.set("ownerArchived", false);
      alert.set("userRead", false);
      alert.set("userArchived", false);
    }
    else if (friendship.get("status") == FriendStatus.RequestAccepted) {
      pushString = fromUser.get("firstName") + " " + fromUser.get("lastName") + " accepted your request to become friends on Grab."
      alert = new Alert();
      alert.set("type", AlertType.FriendAddedByRequest);
      alert.set("owner", fromUser);
      alert.set("user", toUser);
      alert.set("ownerRead", true);
      alert.set("ownerArchived", false);
      alert.set("userRead", false);
      alert.set("userArchived", false);
    }
    else if (friendship.get("status") == FriendStatus.RequestRejected) {
      // Don't send push notification, but maybe create Alert for rejecting user.
    }

    if (pushString != null) {
      var query = new Parse.Query(Parse.Installation);
      query.equalTo("user", toUser);
  
      Parse.Push.send({
        where: query, // Set Installation query.
        data: {
          alert: pushString,
          sound: "default",
          badge: "Increment"
        }
        },{
        success: function() {
          // Push was successful
          console.log("Push for QR Code Scan was successful!");
        },
        error: function (error) {
          console.error("Push for QR Code Scan was NOT successful...error: " + error);
        }
      });
    }
  }

  if (alert != null) {
    alert.save();
  }
});