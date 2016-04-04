define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/on',
    'dojo/query',
    'dojo/dom-attr',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/_TemplatedMixin',
    'jimu/BaseWidget',
    'dojo/dom-construct',
    'jimu/PanelManager',
    'jimu/dijit/LoadingShelter',
    './AddFromFile',
    './AddFromPortal',
    './AddFromWeb'
],
function (declare, lang, array, on,domQuery, domAttr,_WidgetsInTemplateMixin, _TemplatedMixin, BaseWidget, domConstruct, PanelManager, LoadingShelter,
    AddFromFile,AddFromPortal, AddFromWeb
    ) {
    return declare([BaseWidget, _WidgetsInTemplateMixin, _TemplatedMixin], {
    baseClass: 'jimu-widget-add-data',
    postCreate: function() {
        this.inherited(arguments);
        this._formatConfigForPortalAndServerSearch();
        this._renderAddDataSections();
        this._renderAddTypeSelector();
    },
    startup: function() {
        this.inherited(arguments);
        this._createLoadingShelter();
        this._setVersionTitle();
    },
    _createLoadingShelter:function(){
        this.shelter = new LoadingShelter({
            hidden: true
        });
        this.shelter.placeAt(this.domNode);
        this.shelter.startup();
    },
    _formatConfigForPortalAndServerSearch:function(){
        //1.merge addDataType for addFromPortal && addFromServer here and remove addFromServer entry from "this.config.addDataTypes"
        //along with searchMode from config.searchMode in the config determines how the addFromPortal workflow 
        var addFromPortalIndex;
        var addFromServerIndex;
        if (this.config.searchMode.serverAndPortalSearch) {
            array.forEach(this.config.addDataTypes, function (item, i) {
                if (item.name === "addFromServer") {
                    addFromServerIndex = i;
                } else if (item.name === "addFromPortal") {
                    addFromPortalIndex = i;
                }
            });
            this.config.addDataTypes.splice(addFromServerIndex, 1);
            this.config.addDataTypes[addFromPortalIndex].name = "addFromPortalAndServer";

            //corresponding configs
            this.config.addFromPortalAndServer = lang.mixin(this.config.addFromPortal, this.config.addFromServer);
            
            delete this.config.addFromServer;
            delete this.config.addFromPortal;
        }
    },
    _renderAddDataSections: function () {
        var addDataTypes = this.config.addDataTypes;
        array.forEach(addDataTypes, lang.hitch(this, function (_x) {
            if (_x.enabled == true) {
                var _widget = eval(_x.module);
                var config = lang.mixin({}, this.config.hasOwnProperty(_x.name) ? this.config[_x.name] :{});;
                lang.mixin(config, this.config.emailSettings);
                lang.mixin(config, this.config.searchMode);
                lang.mixin(config, { geometryServiceUrl: this.config.geometryServiceUrl });
                this[_x.name] = new _widget({ nls: this.nls, config: config,map:this.map});
                this[_x.name].setParentId(this.id);
                this.fetchData(this[_x.name].id);
                domConstruct.place(this[_x.name].domNode, this.sectionContainer);
            } 
        }));
    },
    _renderAddTypeSelector: function () {
        var addDataTypes = this.config.addDataTypes;
        this.typeList = array.map(array.filter(addDataTypes, function (type) { return type.enabled === true; }), lang.hitch(this, function (_x, index) {
            return { label: this.nls[_x.name], value: _x.name};
        }));
        this.addDataTypes.addOption(this.typeList)
        this.own(on(this.addDataTypes, 'change', lang.hitch(this,  this._displayContentSection)));
        this.addDataTypes.set('value', this.typeList[0].value);
    },
    _initializeContentSection: function () {
        var value = this.addDataTypes.get("value");
        this._displayContentSection(value)
    },
    _displayContentSection: function (value) {
        array.forEach(this.typeList,lang.hitch(this,function (list) {
                this[list.value].hide();
        }));
        this[value].show();
    },
    _onCloseClick:function(){
        PanelManager.getInstance().closePanel(this.id + '_panel');
    },
    onReceiveData: function (name, widgetId, data, historyData) {
        if (data.message) {
            var event = data.message.event;
            var state = data.message.state;
            if (event && event === "LOADING_MASK") {
                state ? this.shelter.show() : this.shelter.hide();
            }
        }
    },
    _setVersionTitle: function () {
        var labelNode = this._getLabelNode(this);

        var manifestInfo = this.manifest;
        var devVersion = manifestInfo.devVersion;
        var devWabVersion = manifestInfo.developedAgainst || manifestInfo.wabVersion;
        var codeSourcedFrom = manifestInfo.codeSourcedFrom;
        var client = manifestInfo.client;

        var title = "Dev version: " + devVersion + "\n";
        title += "Developed/Modified against: WAB" + devWabVersion + "\n";
        title += "Client: " + client + "\n";
        if (codeSourcedFrom) {
            title += "Code sourced from: " + codeSourcedFrom + "\n";
        }
        if (labelNode) {
            domAttr.set(labelNode, 'title', title);
        }
    },
    _getLabelNode: function (widget) {
        var labelNode;
        if (!(widget.labelNode) && !(widget.titleLabelNode)) {
            if (widget.getParent()) {
                labelNode = this._getLabelNode(widget.getParent());
            }
        } else {
            labelNode = widget.labelNode || widget.titleLabelNode;
        }
        return labelNode;

    }
   
  });
});