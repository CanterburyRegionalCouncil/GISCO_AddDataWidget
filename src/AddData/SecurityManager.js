/*
Helper class for security check for layers 

*/
define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    'dojo/Deferred',
    'dojo/promise/all',
    'esri/request',
    'dojo/request/script'
], function (
    declare,
    array,
    lang,
    Deferred,
    all,
    esriRequest,
    scriptRequest
) {
    var SecurityManager = declare("SecurityManager", [], {
        seekLayerPermissions: function (results) {
            //dummy function -placeholder//
            var deferred = new Deferred();
            var deferredArray = [];
            array.forEach(results, lang.hitch(this, function (result, i) {
                deferredArray.push(this._getSecuritySettingsOfLayer(result, i))
            }));
            all(deferredArray).then(function (results) {
                deferred.resolve(results);
            });
            return deferred.promise;

        },
        _getSecuritySettingsOfLayer: function (result,i) {
            //dummy function -placeholder//
            var deferred = new Deferred();
            var regExp = new RegExp(/\/wms$/i)
            if (!regExp.test(result.url)) {
                var layerUrl = result.url;
                esriRequest({
                    url: layerUrl,
                    content: { f: "json" },
                    handleAs: "json",
                    callbackParamName: "callback"
                }).then(lang.hitch(this, function (response) {
                    result.allowAccess = true;
                    deferred.resolve(result);
                }), function (error) {
                    result.allowAccess = false;
                    deferred.resolve(result);
                });
            } else {
                result.allowAccess = true;
                deferred.resolve(result);
            }
            return deferred.promise;
        }
    });
    if (!_instance) {
        var _instance = new SecurityManager();
    }
    return _instance;
});




