/*
Helper class for arcgis service parsing





*/
define(
[
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    'dojo/Deferred',
    'dojo/promise/all',
    'dojo/request/script',
    'esri/request',
    'esri/geometry/Extent',
    'esri/SpatialReference',
    'esri/tasks/GeometryService',
    'esri/tasks/ProjectParameters'
], function (
    declare,
    array,
    lang,
    Deferred,
    all,
    scriptRequest,
    esriRequest,
    Extent,
    SpatialReference, GeometryService, ProjectParameters
) {

    var ServerSearchUtil = declare("ServerSearchUtil", null, {
        _resultSet: [],
        _limitExtent: false,
        constructor:function(obj){
            this._setServicesUrl(obj.url);
            this._setMap(obj.map);
            this.geomService = new GeometryService(obj.geometryServiceUrl);
        },
        setLimitExtent: function (checked) {
            this._limitExtent = checked;
        },
        _setMap: function (map) {
            this.map = map;
        },
        _setServicesUrl: function (url) {
            this.servicesUrl = lang.trim(url).replace(/\/$/, "");// lang.trim(url);
        },
        doSearch:function(queryString){
            var deferred = new Deferred();
            this._resultSet = [];
            this._drillThroughFoldersAndServices().then(lang.hitch(this,function () {
                var results = this._filterResultsByQueryString(queryString);
                if (this._limitExtent) {
                    this._filterResultsWithinMapArea(results).then(function (filteredResults) {
                        deferred.resolve(filteredResults);
                    });
                } else {
                    deferred.resolve(results);
                }
            }), lang.hitch(this, function () {
                deferred.resolve([]);
            }));
            return deferred.promise;
        },
        _drillThroughFoldersAndServices: function () {
            var deferred = new Deferred();
            var servicesUrl = this.servicesUrl;
            scriptRequest.get(servicesUrl, {
                handleAs: 'json',
                jsonp: "callback",
                query: {
                    f: "json"
                }
            }).then(lang.hitch(this, function (response) {
                var allDeferreds = [];
                if (response.folders && response.folders.length > 0) {
                    allDeferreds.push(this._getDataFromFolders(servicesUrl, response.folders));
                }
                if (response.services && response.services.length > 0) {
                    var services = array.filter(response.services, function (serv) {
                        return serv.type === "MapServer";
                        //return serv.type === "MapServer" || serv.type === "FeatureServer"
                    });
                    if (services.length > 0) {
                        allDeferreds.push(this._getDataFromServices(services))
                    }
                }
                all(allDeferreds).then(lang.hitch(this, function () {
                    deferred.resolve(this._resultSet)
                }));
            }), function (error) {
                deferred.reject(error)
            });
            return deferred.promise;

        },
        _getDataFromFolders: function (servicesUrl, folders) {
            var deferred = new Deferred();
            var allParseFolders = [];
            array.forEach(folders, lang.hitch(this, function (folder) {
                allParseFolders.push(this._getDataFromSingleFolder(servicesUrl, folder));
            }));
            all(allParseFolders).then(function () {
                deferred.resolve();
            });
            return deferred.promise;
        },
        _getDataFromSingleFolder: function (url, folder) {
            var servicesUrl = url + "/" + folder;
            var deferred = new Deferred();
            scriptRequest.get(servicesUrl,{
                handleAs: 'json',
                jsonp: "callback",
                timeout:3000,
                query: {
                    f: "json"
                }
            }).then(lang.hitch(this, function (response) {
                var deferredLists = [];
                if (response.folders && response.folders.length > 0) {
                    deferredLists.push(this._getDataFromFolders(servicesUrl, response.folders));
                }
                var services = array.filter(response.services, function (serv) {
                    return serv.type === "MapServer"
                    //return serv.type === "MapServer" || serv.type === "FeatureServer"
                });
                if (services.length > 0) {
                    deferredLists.push(this._getDataFromServices(services))
                }
                all(deferredLists).then(function () {
                    deferred.resolve();
                });

            }), function (error) {
                console.log("Error parsing " + servicesUrl);
                deferred.resolve()
            });
            return deferred.promise;
        },
        _getDataFromServices: function (services) {
            var deferred = new Deferred();
            var allServices = [];
            array.forEach(services, lang.hitch(this, function (service) {
                allServices.push(this._getDataFromSingleService(service));
            }));
            all(allServices).then(function (serviceDesc) {
                deferred.resolve();
            });
            return deferred.promise;
        },
        _getDataFromSingleService: function (service) {
            var deferred = new Deferred();
            var name = service.name;
            var type = service.type;
            var requestUrl = this.servicesUrl + "/" + name + "/" + type;
            esriRequest({
                url:requestUrl,
                handleAs: 'json',
                jsonp: "callback",
                content: {
                    f: "json"
                }
            }).then(lang.hitch(this, function (response) {
                if (service.type === "FeatureServer") {
                    service.type = "Feature Service";
                } else if (service.type === "MapServer") {
                    service.type = "Map Service";
                }
                service.url = requestUrl;
                service.extent = response.fullExtent;
                service.root = true;
                service.title = service.name.substr(service.name.lastIndexOf('/') + 1);
                service.id = service.name.replace("/", "-");
                service.source = "Server";
                this._resultSet.push(service);

                var layerInfoDeferredList = [];
                array.forEach(response.layers, lang.hitch(this, function (layer) {
                    var layerUrl = requestUrl + "/" + layer.id
                    layerInfoDeferredList.push(this._getSubLayerInfos(layerUrl));
                }));
                all(layerInfoDeferredList).then(lang.hitch(this, function (layerInfos) {
                    array.forEach(layerInfos, lang.hitch(this, function (info) {
                        if (Object.keys(info).length > 0) {
                            info.type = "Feature Service";
                            info.root = false;
                            info.title = info.name;
                            info.id = service.id + '-' + info.id;
                            info.source = "Server";
                            this._resultSet.push(info);
                        }
                    }));
                    deferred.resolve();
                }));
                
            }), lang.hitch(this,function (error) {
                this._resultSet.push({});
                deferred.resolve();
            }));
            return deferred.promise;
        },
        _getSubLayerInfos: function (layerUrl) {
            var deferred = new Deferred();
            esriRequest({
                url:layerUrl,
                handleAs: 'json',
                jsonp: "callback",
                content: {
                    f: "json"
                }
            }).then(lang.hitch(this, function (response) {
                response.url = layerUrl;
                deferred.resolve(response);
            }), function (error) {
                console.log(error);
                deferred.resolve({});
            });
            return deferred.promise;
        },
        _filterResultsByQueryString: function (q) {
            var filteredResults = [];
            if (this._resultSet.length > 0) {
                var filteredResults = array.filter(this._resultSet, function (item) {
                    q = q.replace(/(\\|\/)$|^(\\|\/)/, "");
                    var regExp = new RegExp(q, "ig");
                    return (regExp.test(item.title) && (item.root == true || item.subLayerIds == null))
                });
            }
            return filteredResults;
        },
        _filterResultsWithinMapArea: function (layers) {
            var deferred = new Deferred();
            var reprojectDeferredList = [];
            array.forEach(layers,lang.hitch(this,function (layer) {
                reprojectDeferredList.push(this._checkWithinMapArea(layer));
            }));
            all(reprojectDeferredList).then(function (layers) {
                var filteredLayers = array.filter(layers, function (layer) {
                    return layer.withinMapArea == true;
                })
                deferred.resolve(filteredLayers);
            }, function () {
                console.log("error occured in spatial filtering");
                deferred.resolve(layers)
            });
            return deferred.promise;
        },
        _checkWithinMapArea: function (layer) {
            var deferred = new Deferred();
            var params = new ProjectParameters();
            params.outSR = new SpatialReference({ wkid: this.map.spatialReference.wkid });
            var layerExtent = new Extent(layer.extent);
            params.geometries = [layerExtent];
            if (layer.extent.spatialReference.wkid != this.map.spatialReference.wkid) {
                this.geomService.project(params, lang.hitch(this, function (k) {
                    var geometry = k[0];
                    if (this.map.extent.contains(geometry) || this.map.extent.intersects(geometry)) {
                        layer.withinMapArea = true;
                    } else {
                        layer.withinMapArea = false;
                    }
                    deferred.resolve(layer);
                }));
            } else {
                if (this.map.extent.contains(layerExtent) || this.map.extent.intersects(layerExtent)) {
                    layer.withinMapArea = true;
                } else {
                    layer.withinMapArea = false;
                }
                deferred.resolve(layer);
            }
            
            return deferred.promise;
        }
    });

    return ServerSearchUtil;
});




