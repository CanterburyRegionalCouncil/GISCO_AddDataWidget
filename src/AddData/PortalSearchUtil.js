/*
Helper class for portal search





*/
define(
[
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    'dojo/Deferred',
    'dojo/promise/all',
    'esri/arcgis/Portal',
    'esri/SpatialReference',
    'esri/tasks/GeometryService',
    'esri/tasks/ProjectParameters'
], function (
    declare,
    array,
    lang,
    Deferred,
    all,
    arcgisPortal,
    SpatialReference,
    GeometryService,
    ProjectParameters
) {

    var PortalSearchUtil = declare("PortalSearchUtil", null, {
        _limitExtent:false,
        constructor: function (obj) {
            this._setPortal(obj.url);
            this._setSearchTypes(obj.searchTypes);
            this._setMap(obj.map);
            this.geomService = new GeometryService(obj.geometryServiceUrl);
        },
        _setSearchTypes:function(types){
            this.searchTypes = types;
        },
        _setPortal: function (url) {
            this.portal = new arcgisPortal.Portal(url);
        },
        _setMap:function(map){
            this.map = map;
        },
        setLimitExtent: function (checked) {
            this._limitExtent = checked;
        },
        doSearch: function (searchString) {
            //Do the Search
            var deferred = new Deferred();
            var searchTypes = this.searchTypes;
            var queryString = "";
            dojo.forEach(searchTypes, function (item, i) {
                var OR = i == (searchTypes.length - 1) ? "" : " OR ";
                queryString += 'type:"' + item + '"' + OR;
            });
            queryString = searchString + ' ' + '(' + queryString + ')';
            if (this._limitExtent) {
                var params = new ProjectParameters();
                params.outSR = new SpatialReference({ wkid: 4326 });
                params.geometries = [this.map.extent];
                this.geomService.project(params, lang.hitch(this, function (k) {
                    if (this.portal) {
                        //var newQueryString = queryString += " AND extent:[" + k[0].xmin + ", " + k[0].ymin + "] - [" + k[0].xmax + ", " + k[0].ymax + "]";
                        this.queryPortal(queryString, k[0]).then(function (results) {
                            deferred.resolve(results);
                        }, function () {
                            deferred.reject(e);
                        });
                    } else {
                        deferred.resolve([]);
                    }

                }), lang.hitch(this, function () {
                    if (this.portal) {
                        this.queryPortal(queryString).then(function (results) {
                            deferred.resolve(results);
                        }, function (e) {
                            deferred.reject(e);
                        });
                    } else {
                        deferred.resolve([]);
                    }
                }));
            } else {
                this.queryPortal(queryString).then(function (results) {
                    deferred.resolve(results);
                }, function (e) {
                    deferred.reject(e);
                });
            }
            return deferred.promise;
        },
        queryPortal: function (queryString,extent) {
            var deferred = new Deferred();
            var queryObj = {
                num: 100,
                q: queryString
            };
            if (extent) {
                queryObj.bbox = extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax;
            }
            this.portal.queryItems(queryObj).then(lang.hitch(this, function (response) {
                if (response.results.length > 0) {
                    this._setSource(response.results)
                    deferred.resolve(response.results);
                } else {
                    deferred.resolve([]);
                }
            }), function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        },
        _setSource:function(results){
            array.forEach(results, function (result) {
                result.source = "Portal";
            });
        },
        _getMapExtent: function () {
            return this.map.extent;
        }
    });

    return PortalSearchUtil;
});




