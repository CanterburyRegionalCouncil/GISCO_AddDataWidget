///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/_base/declare',
   'dojo/_base/array',
   'dojo/_base/lang',
  'jimu/BaseWidgetSetting',
   'dijit/_WidgetsInTemplateMixin',
   'dijit/form/SimpleTextarea'
],
function (declare, array, lang,BaseWidgetSetting, _WidgetsInTemplateMixin) {

    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-add-data-setting',

    postCreate: function(){
        //the config object is passed in
      this.setConfig(this.config);
    },
    startup: function () {
        this.inherited(arguments);
    },
    setConfig: function (config) {
        this.config = config;
        this._setAddDataTypes();
        this._setGeomServiceUrl();
        this._setAddFromPortalConfig();
        this._setAddFromServerConfig();
        this._setEmailConfig();
    },
    _setAddDataTypes:function(){
        array.forEach(this.config.addDataTypes, lang.hitch(this, function (type) {
            type.enabled ? this[type.name].check() : this[type.name].uncheck();
        }));
    },
    _setGeomServiceUrl:function(){
        var geomServiceUrl = this.config.geometryServiceUrl;
        this.geometryServiceUrl.set("value", geomServiceUrl);
    },
    _getPortalAndServerSearchMode:function(){
        if (this.addFromPortal.checked && this.addFromServer.checked) {
            this.config.portalOnlySearch = false;
            this.config.serverOnlySearch = false;
            this.config.serverAndPortalSearch = true;
        } else if (!this.addFromPortal.checked && this.addFromServer.checked) {
            this.config.portalOnlySearch = false;
            this.config.serverOnlySearch = true;
            this.config.serverAndPortalSearch = false;
        } else if (this.addFromPortal.checked && !this.addFromServer.checked) {
            this.config.portalOnlySearch = true;
            this.config.serverOnlySearch = false;
            this.config.serverAndPortalSearch = false;
        } else {
            this.config.portalOnlySearch = false;
            this.config.serverOnlySearch = false;
            this.config.serverAndPortalSearch = false;
        }

        return{
            portalOnlySearch: this.config.portalOnlySearch, 
            serverOnlySearch:this.config.serverOnlySearch,
            serverAndPortalSearch:this.config.serverAndPortalSearch
        }

    },
    _setAddFromPortalConfig: function () {
        var config = this.config.addFromPortal;
        var searchUrl = config.portalSearchUrl ? config.portalSearchUrl : this.appConfig.portalUrl; //+ 'sharing/rest/search';
        this.portalSearchUrl.set("value", searchUrl);
       
    },
    _setAddFromServerConfig:function(){
        var config = this.config.addFromServer;
        var searchUrl = config.serverSearchUrl ? config.serverSearchUrl : this.appConfig.portalUrl + 'sharing/rest/search';
        this.serverSearchUrl.set("value", searchUrl);
    },
    _setEmailConfig:function(){
        var emailConfig = this.config.emailSettings;
        this.emailRecepient.set("value", emailConfig.emailRecepient);
        this.emailSubject.set("value", emailConfig.emailSubject);
        var formattedEmailBody = emailConfig.emailBody.replace(/%0D%0A\s+/g, "\n");
        this.emailBody.value = formattedEmailBody;
    },
    getConfig: function(){
        //WAB will get config object through this method

        //1 . get add data functional module types
        var addDataTypes = [];
        array.forEach(this.config.addDataTypes, lang.hitch(this, function (type) {
            addDataTypes.push({ name: type.name, enabled: this[type.name].checked, module: type.module });
        }));

        //2 . add from portal config
        var config = this.config.addFromPortal;
        return {
            addDataTypes: addDataTypes,
            geometryServiceUrl: this.geometryServiceUrl.value,
            addFromPortal: {
                portalSearchUrl: this.portalSearchUrl.value,
                portalSearchItemTypes: config.portalSearchItemTypes
            },
            addFromServer:{
                serverSearchUrl: this.serverSearchUrl.value
            },  
            emailSettings: {
                emailRecepient: this.emailRecepient.get("value"),
                emailSubject:this.emailSubject.get("value"),
                emailBody: this.emailBody.value.replace(/\n/g, "\%0D\%0A ")
            },
            searchMode:this._getPortalAndServerSearchMode()
          
        };
    }
  });
});