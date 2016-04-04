define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/on',
    'dojo/aspect',
    'dojo/topic',
    'dojo/Deferred',
    'dojo/dom-style',
    'dojo/dom-construct',
    "dojo/mouse",
    "dojo/dom-class", 
    'dojo/promise/all',
    'jimu/BaseWidget',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/layout/ContentPane',
    'dijit/form/ToggleButton',
    'dijit/form/Button',
    'dojo/text!./templates/AddFromPortal.html',
    'jimu/dijit/CheckBox',
    './ServerSearchUtil',
    './PortalSearchUtil',
    './LayerUtil',
    './SecurityManager',
    './ResultsParser'
],
function (declare, lang, array, on,aspect,topic, Deferred, domStyle, domConstruct,mouse,domClass, all, BaseWidget, _TemplatedMixin, _WidgetsInTemplateMixin, ContentPane,ToggleButton,
        Button, template, CheckBox, ServerSearchUtil, PortalSearchUtil, LayerUtil, SecurityManager,
        ResultsParser
    ) {
    return declare([BaseWidget, _WidgetsInTemplateMixin, _TemplatedMixin], {
        templateString: template,
        baseClass: 'jimu-widget-add-data',
        widgetsInTemplate: true,
        postCreate: function () {
            this.inherited(arguments);
            this._registerEnterKeyPress();
            if (this.config.portalOnlySearch || this.config.serverAndPortalSearch) {
                this.portalSearchUtil = new PortalSearchUtil({
                    url: this.config.portalSearchUrl,
                    map: this.map,
                    searchTypes: this.config.portalSearchItemTypes,
                    geometryServiceUrl: this.config.geometryServiceUrl
                });
            }
            if (this.config.serverOnlySearch || this.config.serverAndPortalSearch) {
                this.serverSearchUtil = new ServerSearchUtil({
                    url: this.config.serverSearchUrl,
                    map: this.map,
                    geometryServiceUrl: this.config.geometryServiceUrl
                });
            }
            this.layerUtil = new LayerUtil(this.map);
            aspect.after(this.withinMapArea, "onChange", lang.hitch(this, this._onClickLimitMapArea));
        },
        _registerEnterKeyPress:function(){
            // enter key is pressed ,do the search
            this.portalSearchField.on("input",lang.hitch(this, function (event) {
                if (event.keyCode == 13) {
                    this._onPortalSearchTrigger();
                }
            }));
        },
        _onPortalSearchTrigger: function () {
            var searchString = lang.trim(this.portalSearchField.get("value"));
            this._publishLoadingMessage(true);
            var searchDeferreds = [];
            if (searchString.length > 0) {
                if (this.config.portalOnlySearch) {
                    searchDeferreds.push(this.portalSearchUtil.doSearch(searchString))
                }else if (this.config.serverOnlySearch) {
                    searchDeferreds.push(this.serverSearchUtil.doSearch(searchString));
                }else if(this.config.serverAndPortalSearch){
                    searchDeferreds = [this.portalSearchUtil.doSearch(searchString), this.serverSearchUtil.doSearch(searchString)];
                }
            }
            all(searchDeferreds).then(lang.hitch(this, function (results) {
                var formattedResponses = ResultsParser.parse(results);
                this._renderResults(formattedResponses).then(lang.hitch(this, function () {
                    this._publishLoadingMessage(false);
                }));
            }), lang.hitch(this,function () {
                this._publishLoadingMessage(false);
            }));
        },
        _onClickLimitMapArea: function () {
            if (this.portalSearchUtil) {
                this.portalSearchUtil.setLimitExtent(this.withinMapArea.checked)
            }
            if (this.serverSearchUtil) {
                this.serverSearchUtil.setLimitExtent(this.withinMapArea.checked)
            }
            
        },
        _publishLoadingMessage:function(state){
            this.publishData({
                message:{
                    event: 'LOADING_MASK',
                    state:state
                } 
            }, false);
        },
        _renderResults: function (results) {
            var deferred = new Deferred();
            SecurityManager.seekLayerPermissions(results).then(lang.hitch(this, function () {
                this._updateResultCount(results.length);
                this._updateResultsUI(results);
                deferred.resolve();
            }));
            return deferred.promise;
        },
        _updateResultCount:function(count){
            this.resultCount.innerHTML = count + " " + this.nls.resultsFound;
        },
        _updateResultsUI:function(results){
            this.results.destroyDescendants();
            array.forEach(results, lang.hitch(this, function (result, i) {
                var title = result.title ? result.title : result.name;
                var owner = result.owner ? result.owner : "N/A";
                var type = result.type;
                var source = result.source;
                var cssClass = "jimu-add-data-item jimu-row" + " " + (i % 2 == 1 ? 'oddIndex' : 'evenIndex');
                var container = new ContentPane({
                    'class': cssClass
                });

                var detailsCntr = new ContentPane({
                    'class': 'jimu-add-data-item-detailsCntr'
                });
                var nameCntr = domConstruct.create("div", {
                    innerHTML: "Name : " + title,
                    'class': "jimu-add-data-item-details",
                    style:"cursor:pointer;",
                    onclick:function(){
                        window.open(result.url, '_blank');
                    }
                });
                var sourceCntr = domConstruct.create("div", {
                    innerHTML: "Source : " + source,
                    'class': "jimu-add-data-item-details"
                });
                var typeCntr = domConstruct.create("div", {
                    innerHTML: "Type : " + type,
                    'class': "jimu-add-data-item-details"
                });
                var ownerCntr = domConstruct.create("div", {
                    innerHTML: "Owner : " + owner,
                    'class': "jimu-add-data-item-details"
                });
                domConstruct.place(nameCntr, detailsCntr.domNode);
                domConstruct.place(sourceCntr, detailsCntr.domNode);
                domConstruct.place(typeCntr, detailsCntr.domNode);
                domConstruct.place(ownerCntr, detailsCntr.domNode);

                var btnCntr = new ContentPane({
                    'class': 'jimu-add-data-item-btnCntr'
                });
                container.addChild(btnCntr);
                container.addChild(detailsCntr);
            
                if (result.allowAccess) {
                    var btnText = this.nls.layerAdd;
                    var checked = false;
                    var isLayerInMap = this.layerUtil.isLayerInMap(result.id);
                    if (isLayerInMap) {
                        btnText = this.nls.layerRemove;
                        checked = true;
                    }
                    var btn = new ToggleButton({
                        label: btnText,
                        checked: checked,
                        'class': "jimu-btn jimu-add-data-item-btn"
                    });
                    aspect.after(btn, "onChange",lang.hitch(this, function () {
                        if (btn.get("checked")) {
                            this._publishLoadingMessage(true);
                            this._addLayerInMap(result).then(lang.hitch(this,function () {
                                this._publishLoadingMessage(false);
                                btn.set("label", this.nls.layerRemove);
                            }), lang.hitch(this, function (error) {
                                console.log("Failed to add the layer");
                                btn.set("checked", false);
                                this._publishLoadingMessage(false);
                            }));
                        } else {
                            this.layerUtil.removeLayerFromMap(result.id);
                            btn.set("label", this.nls.layerAdd);
                        }
                    
                    }));
                    btnCntr.addChild(btn);
                } else {
                    var btn = domConstruct.create("div", {
                        'class': 'jimu-add-data-item-btn  jimu-btn',
                        innerHTML: this.nls.layerRequest,
                        onclick: lang.hitch(this, function (event) {
                            this._requestLayerAccess(result);
                        })
                    }, btnCntr.domNode);
                   
                }
                this.results.addChild(container);
            }));
        },
        _addLayerInMap:function(result){
            var deferred = new Deferred();
            if (result.source === 'Portal') {
                this.layerUtil.addLayerFromPortal(result).then(function () {
                    deferred.resolve();
                });
            } else if (result.source === 'Server') {
                this.layerUtil.addLayerFromServer(result).then(function () {
                    deferred.resolve();
                });
            }
            return deferred.promise;
        },
        _requestLayerAccess: function (item) {
            var recepient = this.config.emailRecepient;
            var subject = this.config.emailSubject;
            var body = this.config.emailBody;
            body = body.replace(/\{([a-zA-Z]+)\}/g, function (match) {
                var token = match.replace(/\{|\}/g, "");
                return item[token];
            });
            var emailString = "mailto:" + recepient + "?subject=" + subject + "&body=" + body;
            this.emailLink.setAttribute("href", emailString);
            this.emailLink.click();
        },
        setParentId:function(id){
            this.parentId = id;
        },
        setConfig:function(config){
            this.config = config;
        },
        hide: function () {
            domStyle.set(this.domNode, "display", "none");
        },
        show: function () {
            domStyle.set(this.domNode, "display", "");
        }
    });
});