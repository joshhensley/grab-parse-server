var fs = require('fs');
var layer = require('./layer-parse-module/layer-module.js');

var layerProviderID = 'layer:///providers/23a81966-2b61-11e5-9145-42902a00338c';
var layerKeyID = 'layer:///keys/df28d270-2b61-11e5-8f12-42902a004538';
var privateKey = fs.readFileSync('./cloud/layer-parse-module/keys/layer-key.js');
layer.initialize(layerProviderID, layerKeyID, privateKey);

Parse.Cloud.define("generateLayerToken", function(request, response) {
    var userID = request.params.userID;
    var nonce = request.params.nonce;
    if (!userID) throw new Error('Missing userID parameter');
    if (!nonce) throw new Error('Missing nonce parameter');
    response.success(layer.layerIdentityToken(userID, nonce));
});