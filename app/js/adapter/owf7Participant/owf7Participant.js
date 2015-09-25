var ozpIwc = ozpIwc || {};
ozpIwc.owf7 = ozpIwc.owf7 || {};

/**
 * @class Participant
 * @constructor
 * @namespace ozpIwc.owf7
 * @param {Object} config
 * @param {Object} config.iframe The iframe that contains the widget for this participant
 * @param {Object} config.listener The parent owf7 ParticipantListener
 * @param {Object} config.client The InternalParticipant for this widget.
 * @param {String} config.guid The GUID for the widget that this is an instance of.
 * @param {String} config.instanceId The GUID for the widget instance.
 * @param {String} config.url The launch URL for this widget.
 * @param {String} config.rpcId The iframe.id that is used as the ID for RPC.
 * @param {String} [config.launchDataResource=undefined] The intents.api resource that contains the launch data for the widget, or null for no launch data.
 * @param {Boolean} [config.externalInit=false] Set to true if the iframe has been initialized elsewhere, such as when embedded in OWF 7.
 */
ozpIwc.owf7.Participant=function(config) {
    config = config || {};
    if(!config.listener) { throw "Needs to have an owf7 ParticipantListener";}
    if(!config.client) {throw "Needs an IWC Client";}
    if(!config.guid) { throw "Must be assigned a guid for this widget";}
    if(!config.instanceId) { throw "Needs an widget instance id";}
    if(!config.url) { throw "Needs a url for the widget"; }
    if(!config.rpcId) { throw "Needs a rpcId for the widget"; }

    /**
     * The iframe element of this participant.
     * @property iframe
     * @type {Object}
     */
    this.iframe=config.iframe;

    /**
     * The listener this participant is connected to.
     * @property listener
     * @type {ozpIwc.owf7.ParticipantListener}
     */
    this.listener=config.listener;

    /**
     * The client participant this uses to communicate on the bus.
     * @property client
     * @type {ozpIwc.transport.participant.Client}
     */
    this.client=config.client;

    /**
     * A shorthand for system api access.
     * @property systemApi
     * @type {Function}
     */
    this.systemApi = this.client.system();

    /**
     * A shorthand for intents api access
     * @property intentsApi
     * @type {Function}
     */
    this.intentsApi = this.client.intents();

    /**
     * The url of the owf7 widget
     * @property url
     * @type {String}
     */
    this.url=config.url;

    /**
     * @property instanceId
     * @type {String}
     */
    this.instanceId=config.instanceId;

    /**
     * @property widgetGuid
     * @type {String}
     */
    this.widgetGuid=config.guid;

    /**
     * @property rpcId
     * @type {String}
     */
    this.rpcId=config.rpcId;

    /**
     * A callback for when this participant is initialized.
     * @property onReady
     * @type {Fimctopm}
     */
    this.onReady = config.onReady;

    /**
     * @todo  Do a lookup on this at some point
     * @property widgetQuery
     * @type {string}
     */
    this.widgetQuery="?lang=en_US&owf=true&themeName=a_default&themeContrast=standard&themeFontSize=12";

    /**
     * @property launchData
     * @type {Object}
     */
    this.launchData= config.launchData;
    /**
     * @property appData
     * @type {Object}
     */
    this.appData={};

    // Create an iframe for the widget
    this.iframe = document.createElement('iframe');
    this.iframe.id = config.instanceId;

    this._initModules();

    if(!config.externalInit) {
        this.connect(config.launchData);
    }
};

/**
 * Initializes the modules used by this participant
 * @method initModules
 * @private
 */
ozpIwc.owf7.Participant.prototype._initModules = function(){
    /**
     * Drag and Drop module of the participant.
     * @property dd
     * @type {ozpIwc.owf7.participantModules.Dd}
     */
    this.dd = new ozpIwc.owf7.participantModules.Dd(this);

    /**
     * Eventing module of the participant.
     * @property eventing
     * @type {ozpIwc.owf7.participantModules.Eventing}
     */
    this.eventing = new ozpIwc.owf7.participantModules.Eventing(this);

    /**
     * Kernel module of the participant.
     * @property kernel
     * @type {ozpIwc.owf7.participantModules.Kernel}
     */
    this.kernel = new ozpIwc.owf7.participantModules.Kernel(this);

    /**
     * Components module of the participant.
     * @property components
     * @type {ozpIwc.owf7.participantModules.Components}
     */
    this.components = new ozpIwc.owf7.participantModules.Components(this);

    /**
     * Intents module of the participant.
     * @property intents
     * @type {ozpIwc.owf7.participantModules.Intents}
     */
    this.intents = new ozpIwc.owf7.participantModules.Intents(this);

    /**
     * Util module of the participant.
     * @property util
     * @type {ozpIwc.owf7.participantModules.Intents}
     */
    this.util = new ozpIwc.owf7.participantModules.Util(this);
};

/**
 * Creates the iframe for the legacy widget content. Registers drag and drop for the widget.
 * @method initIframe
 * @private
 */
ozpIwc.owf7.Participant.prototype.connect=function() {
    if(!this.connectPromise) {
        var self = this;
        var openWidget = function(appData){
            self.appData = appData || {};
            self.setWidgetTitle(self.appData.name);
            self.iframe.setAttribute("name", JSON.stringify(self.widgetParams));
            self.iframe.setAttribute("src", self.widgetParams.url + self.widgetQuery);
            self.iframe.setAttribute("id", self.rpcId);
            var iframe = document.body.appendChild(self.iframe);

            var ddCalibrate = function(){
                // cancel out the pointerEvents= none after first calculation.
                iframe.style.pointerEvents = "auto";
                iframe.removeEventListener("mousemove",ddCalibrate);
            };

            document.addEventListener("mousemove",ddCalibrate);
            if (typeof self.onReady === "function") {
                self.onReady();
            }
        };
        /**
         * @property connectPromise
         * @Type Promise
         */
        this.connectPromise = new Promise(function(resolve,reject) {
            // these get turned into the iframes name attribute
            // Refer to js/eventing/container.js:272
            self.widgetParams = {
                "id": self.instanceId,
                "webContextPath": "/owf",
                "preferenceLocation": self.listener.prefsUrl,
                "relayUrl": self.listener.rpcRelay,
                "url": self.url,
                "guid": self.widgetGuid,
                // fixed values
                "layout": "desktop",
                "containerVersion": "7.0.1-GA",
                "owf": true,
                "lang": "en_US",
                "runningInOZP": true,
                "currentTheme": {
                    "themeName": "a_default",
                    "themeContrast": "standard",
                    "themeFontSize": 12
                },
                "version": 1,
                "locked": false,
                "data": self.launchData
            };
            resolve(self._getApplicationData());
        }).then(function (appData) {
            openWidget(appData);
        });
    }

    return this.connectPromise;
};

/**
 * Gathers information from the system.api for the participants widgetGuid. If no information exists on the system.api,
 * an empty object is passed to the callback function
 * @method _getApplicationData
 * @returns {Promise}
 * @private
 */
ozpIwc.owf7.Participant.prototype._getApplicationData = function(){
    var fallbackData = {
        icons: {
            small: "about:blank",
            large: "about:blank",
            banner: "about:blank",
            featuredBanner: "about:blank"
        },
        intents: [],
        name: null
    };
    return this.systemApi.get("/application/" + this.widgetGuid).then(function(reply){
        if(reply.entity && reply.entity.icons){
            return reply.entity;
        } else {
            return fallbackData;
        }
    }).catch(function(eror){
        return fallbackData;
    });
};

/**
 * Sets the document title to the given name. If no name given, the title is
 * set with the following pattern "<href.host><href.pathname> -- OWF Widget".
 * @method setWidgetTitle
 * @param {String} name.
 */
ozpIwc.owf7.Participant.prototype.setWidgetTitle = function(name){
    if(!name){
        var a=document.createElement("a");
        a.href = this.widgetParams.url;
        name = a.host + a.pathname + " -- OWF Widget";
    }
    document.title = name;
    return document.title;
};