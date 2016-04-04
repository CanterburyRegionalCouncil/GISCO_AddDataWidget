define([
    "dojo/_base/declare",
    "dojo/_base/array"
], function (
    declare,array
) {
    var ResultsParser = declare("ResultsParser", [], {
        parse: function (results) {
            if (results.length == 2) {
                results = this._unionSearchResults(results);
            }
            var flattenedResults = [];
            array.forEach(results, function (result) {
                array.forEach(result, function (item) {
                    flattenedResults.push(item);
                })
            });
            return flattenedResults;
        },
        _unionSearchResults: function (results) {

            var portalItemsArray = results[0];
            var serverItemsArray = results[1];

            var serverSearchResultsCount = serverItemsArray.length;
            while (serverSearchResultsCount > 0) {
                var portalItems = array.filter(portalItemsArray, function (portalItem) {

                    var MapServerUrl_server = serverItemsArray[serverSearchResultsCount - 1].url.replace("FeatureServer", "MapServer");
                    var MapServerUrl_portal = portalItem.url.replace("FeatureServer", "MapServer");

                    return MapServerUrl_server === MapServerUrl_portal;
                })
                if (portalItems.length > 0) {
                    serverItemsArray.splice(serverSearchResultsCount-1, 1);
                }
                --serverSearchResultsCount;
            }
            return [portalItemsArray, serverItemsArray];
        }
    });
    if (!_instance) {
        var _instance = new ResultsParser();
    }
    return _instance;
});