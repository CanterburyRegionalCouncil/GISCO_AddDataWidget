define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/Deferred',
    'dojo/promise/all',
    'esri/request',
    'esri/arcgis/utils',
    'esri/layers/WMSLayerInfo',
    'esri/layers/WMTSLayerInfo',
    'esri/layers/WMSLayer',
    'esri/layers/WMTSLayer',
    'esri/layers/FeatureLayer',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/layers/ArcGISTiledMapServiceLayer',
    'esri/layers/ArcGISImageServiceLayer'
], function (
    declare, lang, array,Deferred,all,esriRequest, arcgisUtils, WMSLayerInfo,WMTSLayerInfo, WMSLayer, WMTSLayer,FeatureLayer,
    ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer, ArcGISImageServiceLayer
) {
    var LayerUtil = declare("LayerUtil", [], {
        constructor:function(map){
            this.map = map;
        },
        addLayerFromPortal: function (item) {
            var deferred = new Deferred();
            if (item.type === 'Feature Service') {
                this._addFeatureLayer(item).then(function () {
                    deferred.resolve();
                });
            }else if (item.type === 'Map Service' || item.type === 'Image Service') {
                this._addMapServiceLayer(item).then(function () {
                    deferred.resolve();
                });
            }else if(item.type === 'WMS'){
                this._addWMSLayer(item).then(function () {
                    deferred.resolve(item);
                });
            }else if (item.type === 'WMTS') {
                //not implemented
            }
            return deferred.promise;
        },
        addLayerFromServer: function (item) {
            var deferred = new Deferred();
            var deferred = new Deferred();
            if (item.type === 'Feature Service') {
                this._addFeatureLayer(item).then(function () {
                    deferred.resolve();
                });
            } else if (item.type === 'Map Service' || item.type === 'Image Service') {
                this._addMapServiceLayer(item).then(function () {
                    deferred.resolve();
                });
            }
            return deferred.promise;
        },
        _addFeatureLayer: function (item) {
            var layerUrl = item.url;
            var layerId = layerUrl.substr(layerUrl.lastIndexOf('/') + 1);
            var deferred = new Deferred();
            var regExp = /\d+/g;
            if (regExp.test(layerId)) {
                var layer = new FeatureLayer(layerUrl);
                layer.id = item.id;
                layer.title = item.title;
                this._addToMap(layer).then(function () {
                    deferred.resolve();
                });
            } else {
                this._requestServerResourceInfo(item).then(lang.hitch(this, function (info) {
                    if (info.layers && info.layers.length > 0) {
                        var featureLayersAddDeferred = [];
                        array.forEach(info.layers, lang.hitch(this, function (layerObj) {
                            var layer = new FeatureLayer(layerUrl + "/" + layerObj.id);
                            layer.layerGroupId = item.id;
                            layer.title = layerObj.name;
                            featureLayersAddDeferred.push(this._addToMap(layer));
                        }));
                        all(featureLayersAddDeferred).then(function () {
                            deferred.resolve();
                        });
                    }
                    deferred.resolve();
                }));
            }
            return deferred.promise;
        },
        _addMapServiceLayer: function (item) {
            var layerUrl = item.url;
            var deferred = new Deferred();
            this._requestServerResourceInfo(item).then(lang.hitch(this, function (info) {
                var layer;
                if (info.singleFusedMapCache) {
                    layer = new ArcGISTiledMapServiceLayer(layerUrl);
                } else {
                    layer = new ArcGISDynamicMapServiceLayer(layerUrl);
                }
                layer.id = item.id;
                layer.title = item.title;
                this._addToMap(layer).then(function () {
                    deferred.resolve();
                });
            }));
            return deferred.promise;
        
        },
        _addWMSLayer:function(item){
            var deferred = new Deferred();
            this._requestPortalResourceInfo(item).then(lang.hitch(this, function (info) {
                var layerInfos = [],visibleLayers = []
                array.forEach(info.layers, function (obj) {
                    layerInfos.push(new WMSLayerInfo(obj));
                    visibleLayers.push(obj.name);
                })
                var resourceInfo = {
                    extent: this.map.extent,
                    layerInfos: layerInfos
                };
                var layer = new WMSLayer(info.url, {
                    resourceInfo: resourceInfo,
                    visibleLayers: visibleLayers
                });
                layer.id = item.id;
                layer.title = item.title
                this._addToMap(layer).then(function () {
                    deferred.resolve();
                });
            }));
            return deferred.promise;
        },
        _addWMTSLayer: function () {
            //not implemented
        },
        _requestServerResourceInfo: function (item) {
            var url = item.url;
            var deferred = new Deferred();
            var infoRequest = esriRequest({
                url: url,
                content: {
                    f: 'json'
                },
                handleAs: 'json',
                callbackParamName: "callback"
            });
            infoRequest.then(function (info) {
                deferred.resolve(info)
            }, function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        },
        _requestPortalResourceInfo: function (item) {
            var deferred = new Deferred();
            var itemId = item.id;
            arcgisUtils.getItem(itemId).then(lang.hitch(this, function (response) {
                deferred.resolve(response.itemData);
            }));
            return deferred.promise;
        },
        isLayerInMap: function (id) {
            var layer =  this.map.getLayer(id);
            var layerInMap = false;
            if(layer){
                layerInMap = true;
            }else{
                var layerIds = [].concat(this.map.layerIds,this.map.graphicsLayerIds);
                array.forEach(layerIds,lang.hitch(this,function(layerId){
                    var eachLayer = this.map.getLayer(layerId)
                    if(eachLayer && eachLayer.layerGroupId && eachLayer.layerGroupId === id){
                        layerInMap = true;
                    }
                }));
            }
            return layerInMap;
        },
        removeLayerFromMap: function (id) {
            var layer = this.map.getLayer(id);
            if (layer) {
                this.map.removeLayer(layer);
            } 
            var layerIds = [].concat(this.map.layerIds, this.map.graphicsLayerIds);
            array.forEach(layerIds, lang.hitch(this, function (layerId) {
                var eachLayer = this.map.getLayer(layerId)
                if (eachLayer && eachLayer.layerGroupId && eachLayer.layerGroupId === id) {
                    this.map.removeLayer(eachLayer);
                }
            }));
        },
        _addToMap: function (layer) {
            var deferred = new Deferred();
            layer.visible = true;
            layer.showAttribution = true;
            this.map.addLayers([layer]);
            layer.source = "data-discovery";
            if (layer.loaded) {
                deferred.resolve();
            } else {
                layer.on('load', function () {
                    // may require to publish any global event/message to update any layer dependant widgets(eg:layerlist,attribute table) 
                    deferred.resolve();
                });
                layer.on('error', function (err) {
                    // may require to publish any global event/message to update any layer dependant widgets(eg:layerlist,attribute table) 
                    deferred.reject(err);
                });
            }
            return deferred.promise;
        }
        
    });
    return LayerUtil;
});
