define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/on',
    "dojo/dom-style",
    "jimu/BaseWidget",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    'dojo/text!./templates/AddFromWeb.html',
    "jimu/dijit/CheckBox"
],
function (declare, lang, array, on, domStyle, BaseWidget, _TemplatedMixin, _WidgetsInTemplateMixin, template, CheckBox) {
    return declare([BaseWidget, _WidgetsInTemplateMixin, _TemplatedMixin], {
        templateString: template,
        baseClass: 'jimu-widget-add-data',
        widgetsInTemplate: true,
        postCreate: function () {
            this.inherited(arguments);
        },
        startup: function () {
            this.inherited(arguments);
        },
        setMap: function (map) {
            this.map = map;
        },
        _onPortalSearchTrigger: function () {
            alert("trigger search");
        },
        setParentId: function (id) {
            this.parentId = id;
        },
        hide: function () {
            domStyle.set(this.domNode, "display", "none");
        },
        show: function () {
            domStyle.set(this.domNode, "display", "");
        }
    });
});