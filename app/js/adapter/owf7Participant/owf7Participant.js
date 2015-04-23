/**
 * @class Owf7Participant
 * @constructor
 * @namespace ozpIwc
 * @param {Object} config
 * @param {Object} config.iframe The iframe that contains the widget for this participant
 * @param {Object} config.listener The parent OWF7ParticipantListener
 * @param {Object} config.client The InternalParticipant for this widget.
 * @param {String} config.guid The GUID for the widget that this is an instance of.
 * @param {String} config.instanceId The GUID for the widget instance.
 * @param {String} config.url The launch URL for this widget.
 * @param {String} config.rpcId The iframe.id that is used as the ID for RPC.
 * @param {String} [config.launchDataResource=undefined] The intents.api resource that contains the launch data for the widget, or null for no launch data.
 * @param {Boolean} [config.externalInit=false] Set to true if the iframe has been initialized elsewhere, such as when embedded in OWF 7.
 */
ozpIwc.Owf7Participant=function(config) {
    config = config || {};
    if(!config.listener) { throw "Needs to have an OWF7ParticipantListener";}
    if(!config.client) {throw "Needs an IWC Client";}
    if(!config.guid) { throw "Must be assigned a guid for this widget";}
    if(!config.instanceId) { throw "Needs an widget instance id";}
    if(!config.url) { throw "Needs a url for the widget"; }
    if(!config.rpcId) { throw "Needs a rpcId for the widget"; }

    this.iframe=config.iframe;
    this.listener=config.listener;
    this.client=config.client;
    this.url=config.url;
    this.instanceId=config.instanceId;
    this.widgetGuid=config.guid;
    this.rpcId=config.rpcId;

    // Create an iframe for the widget
    this.iframe = document.createElement('iframe');
    this.iframe.id = config.instanceId;

    // Do a lookup on these two at some point
    this.widgetQuery="?lang=en_US&owf=true&themeName=a_default&themeContrast=standard&themeFontSize=12";
    
    this.launchData=null;
    this._initModules();

    if(config.launchDataResource) {
        var self=this;
        this.client.send({
            dst: "intents.api",
            resource: config.launchDataResource,
            action: "get"
        }, function (response, done) {
            if (response.response === 'ok' &&
                response.entity && response.entity.entity && response.entity.entity.launchData) {
                self.launchData = response.entity.entity.launchData;
            } else {
                self.launchData = undefined;
            }
            if(!config.externalInit) {
                self._initIframe();
            }
            done();
        });
    } else {
        if(!config.externalInit) {
            this._initIframe();
        }
    }
};

/**
 * Initializes the modules used by this participant
 * @method initModules
 * @private
 */
ozpIwc.Owf7Participant.prototype._initModules = function(){
    this.dd = new ozpIwc.owf7ParticipantModules.Dd(this);
    this.eventing = new ozpIwc.owf7ParticipantModules.Eventing(this);
    this.kernel = new ozpIwc.owf7ParticipantModules.Kernel(this);
    this.components = new ozpIwc.owf7ParticipantModules.Components(this);
};

/**
 * Creates the iframe for the legacy widget content. Registers drag and drop for the widget.
 * @method initIframe
 * @private
 */
ozpIwc.Owf7Participant.prototype._initIframe=function() {
      
	// these get turned into the iframes name attribute
	// Refer to js/eventing/container.js:272
	this.widgetParams={
		"id": this.instanceId,
		"webContextPath":"/owf",
		"preferenceLocation": this.listener.prefsUrl,
		"relayUrl":  this.listener.rpcRelay, 
		"url": this.url,
		"guid": this.widgetGuid,
		// fixed values
		"layout":"desktop",
		"containerVersion":"7.0.1-GA",
		"owf":true,
		"lang":"en_US",
		"currentTheme":{
			"themeName":"a_default",
			"themeContrast":"standard",
			"themeFontSize":12
		},		
		"version":1,
		"locked":false,
        "data": this.launchData
	};
	this.iframe.setAttribute("name",JSON.stringify(this.widgetParams));
    this.iframe.setAttribute("src",this.widgetParams.url+this.widgetQuery);
    this.iframe.setAttribute("id",this.rpcId);
    document.body.appendChild(this.iframe);
};