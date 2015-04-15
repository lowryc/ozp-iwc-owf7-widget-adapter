(function() {

    var absolutePath = function(href) {
        var link = document.createElement("a");
        link.href = href;
        return (link.protocol+"//"+link.host+link.pathname+link.search+link.hash);
    };

    /**
     *
     * @class Owf7ParticipantListener
     * @namespace ozpIwc
     * @param {Object} config
     * @param {String} config.rpcRelay
     * @param {String} config.prefsUrl
     * @param {Number} config.xOffset
     * @param {Number} config.yOffset
     * @constructor
     */
    ozpIwc.Owf7ParticipantListener=function(config) {
        config = config || {};

        this.rpcRelay=absolutePath(config.rpcRelay || "rpc_relay.uncompressed.html");
        this.prefsUrl=absolutePath(config.prefsUrl || ozpIwc.owf7PrefsUrl || "/owf/prefs");
        this.participants={};
        this.widgetReadyMap = {};
        this.magicFunctionMap = {};
        this.proxyMap = {};

        this.client=new ozpIwc.InternalParticipant();
        ozpIwc.defaultRouter.registerParticipant(this.client);

        if ((window.name === "undefined") || (window.name === "")) {
            window.name = "ContainerWindowName" + Math.random();
        }
        this.installDragAndDrop();
        this.registerDefaults();

        // try to find our position on screen to help with cross-window drag and drop
        this.xOffset= (typeof config.xOffset !== undefined) ?
            config.xOffset : window.screenX+window.outerWidth - document.body.clientWidth - 10;
        this.yOffset= (typeof config.yOffset !== undefined) ?
            config.yOffset : window.screenY+window.outerHeight - document.body.clientHeight - 30;
    };

    /**
     * Generates a guid the way OWF7 does it.
     * @method makeGuid
     * @returns {string}
     */
    ozpIwc.Owf7ParticipantListener.prototype.makeGuid=function() {
        // not a real guid, but it's the way OWF 7 does it
        var S4=function(){
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        };
        return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    };

    /**
     * Updates the xOffset & yOffset from the given MouseEvent object.
     * @method updateMouseCoordinates
     * @param {MouseEvent} e
     */
    ozpIwc.Owf7ParticipantListener.prototype.updateMouseCoordinates=function(e) {
        //console.log("Updating coords from("+this.xOffset+","+this.yOffset+")");
        this.xOffset=e.screenX-e.clientX;
        this.yOffset=e.screenY-e.clientY;
        //console.log("     to ("+this.xOffset+","+this.yOffset+")");
    };

    /**
     * Normalize the drag and drop message coordinates for the listener's content.
     * @method convertToLocalCoordinates
     * @param {Object} msg
     * @param {Object} element
     * @returns {Object}
     */
    ozpIwc.Owf7ParticipantListener.prototype.convertToLocalCoordinates=function(msg,element) {
        // copy the message
        var rv={};
        for(var k in msg) {
            rv[k]=msg[k];
        }

        // start with the location relative to the adapter's top-left
        rv.pageX=msg.screenX-this.xOffset;
        rv.pageY=msg.screenY-this.yOffset;

        // this calculates the position of the iframe relative to the document,
        // accounting for scrolling, padding, etc.  If we started at zero, this
        // would be the iframe's coordinates inside the document.  Instead, we started
        // at the mouse location relative to the adapter, which gives the location
        // of the event inside the iframe content.
        // http://www.kirupa.com/html5/get_element_position_using_javascript.htm

        // should work in most browsers: http://www.quirksmode.org/dom/w3c_cssom.html#elementview
        // IE < 7: will miscalculate by skipping ancestors that are "position:relative"
        // IE, Opera: not work if there's a "position:fixed" in the ancestors
        while(element) {
            rv.pageX += (element.offsetLeft - element.scrollLeft + element.clientLeft);
            rv.pageY += (element.offsetTop - element.scrollTop + element.clientTop);
            element = element.offsetParent;
        }

        return rv;
    };

    /**
     * Creates a Owf7Participant for the given widget and registers its widget state channel.
     * @method addWidget
     * @param {Object} config
     * @param {String} [config.instanceId] a guid is assigned if not given.
     * @param {String} config.url the url of the widget
     * @param {String} [config.launchDataResource] a resource path of data to be used for the launch of the widget.
     * @returns {*}
     */
    ozpIwc.Owf7ParticipantListener.prototype.addWidget=function(config) {
        var self = this;
        var participantConfig = {};

        for(var i in config){
            participantConfig[i] = config[i];
        }

        participantConfig.instanceId = config.instanceId || this.makeGuid();
        participantConfig.listener = self;
        participantConfig.client = new ozpIwc.InternalParticipant();
        participantConfig.rpcId = gadgets.json.stringify({id:participantConfig.instanceId});


        // Update the hash in case the user refreshes. Then create the participant/register RPC
        function init(cfg) {
            var hashObj = {},
                newHash = "#",
                widgetRegistrations = {};

            if(cfg.guid){
                hashObj.guid = cfg.guid;
            }
            if(cfg.instanceId){
                hashObj.instanceId= cfg.instanceId;
            }

            // Serialize the hash and add it to the location.
            for (var i in hashObj) {
                newHash += i + "=" + hashObj[i] + "&";
            }
            newHash = newHash.substring(0, newHash.length - 1);
            window.location.hash = newHash;

            // After storing the hash, if the guid does not exist just set it as instanceId for OWF7 to not complain.
            cfg.guid = config.guid || cfg.instanceId;
            cfg.listener.participants[cfg.rpcId] = new ozpIwc.Owf7Participant(cfg);

            // Add the _WIDGET_STATE_CHANNEL_<instanceId> RPC registration for the widget.
            // @see js\state\WidgetStateContainer.js:35
            widgetRegistrations['_WIDGET_STATE_CHANNEL_' + cfg.instanceId] = function(){};
            self.registerFunctions(widgetRegistrations,gadgets.rpc.register);

            return cfg.listener.participants[cfg.rpcId];
        }

        ozpIwc.defaultRouter.registerParticipant(participantConfig.client);

        // If there was a IWC launch resource, go gather it
        if (config.launchDataResource) {
            participantConfig.client.send({
                dst: "intents.api",
                action: "get",
                resource: config.launchDataResource
            }, function (resp) {
                // If the widget is refreshed, the launch resource data has been deleted.
                if (resp && resp.entity && resp.entity.entity && typeof resp.entity.entity.id === "string") {
                    participantConfig.guid = resp.entity.entity.id;
                }
                return init(participantConfig);
            });
        } else {
            return init(participantConfig);
        }
    };

    /**
     * Notifies the IWC that a legacy widget has canceled dragging.
     * @method cancelDrag
     */
    ozpIwc.Owf7ParticipantListener.prototype.cancelDrag=function() {
        this.inDrag=false;
        this.client.send({
            "dst": "data.api",
            "resource": ozpIwc.Owf7Participant.pubsubChannel("_dragStopInContainer"),
            "action": "set",
            "entity": Date.now()  // ignored, but changes the value to trigger watches
        });
    };

    /**
     * Adds the capability of drag and drop to the container.
     * @method installDragAndDrop
     */
    ozpIwc.Owf7ParticipantListener.prototype.installDragAndDrop=function() {
        var self=this;
        var updateMouse=function(evt) {self.updateMouseCoordinates(evt);};

        document.addEventListener("mouseenter",updateMouse);
        document.addEventListener("mouseout",updateMouse);

        this.client.send({
           "dst":"data.api",
           "resource": ozpIwc.Owf7Participant.pubsubChannel("_dragStart"),
           "action": "watch"
        },function(reply) {
            if(reply.response === "changed") {
                self.inDrag=true;
            }
        });
        this.client.send({
            "dst": "data.api",
            "resource": ozpIwc.Owf7Participant.pubsubChannel("_dragStopInContainer"),
            "action": "watch"
        },function(reply) {
            if(reply.response === "changed") {
                self.inDrag=false;
            }
        });

        document.addEventListener("mousemove",function(e) {
            self.updateMouseCoordinates(e);
    //        console.log("Adapter mousemove at ",e);
            if(self.inDrag && (e.buttons&1) !== 1) {
                console.log("Canceling drag");
                self.cancelDrag();
            }
        },false);
    //    document.addEventListener("mouseup",function(e) {
    ////        if(self.inDrag) {
    ////            return;
    ////        }
    //        self.onFakeMouseUpFromClient({
    //            sender: self.rpcId,
    //            pageX: e.pageX,
    //            pageY: e.pageY,
    //            screenX: e.screenX,
    //            screenY: e.screenY
    //        });
    //    },false);
    };

    /**
     * Default rpc registration for the OWF7ParticipantListener. Registers the default rpc handler, and all rpc
     * functions gathered from OWF7ParticipantListener.prototype.getRPCFuncs(). If custom registrations are
     * desired, see registerFunctions.
     * @method registerDefaults
     */
    ozpIwc.Owf7ParticipantListener.prototype.registerDefaults = function(){

        var rpcString=function(rpc) {
            return "[service:" + rpc.s + ",from:" + rpc.f + "]:" + JSON.stringify(rpc.a);
        };

        gadgets.rpc.registerDefault(function() {
            console.log("Unknown rpc " + rpcString(this));
        });
        this.registerFunctions(this.getRPCFunctions(),gadgets.rpc.register);
    };

    /**
     * Returns the participant if it registered to the listener, throws an exception if it does not.
     * @method getParticipant
     * @param id
     * @returns {Object}
     */
    ozpIwc.Owf7ParticipantListener.prototype.getParticipant = function(id){
        var p=this.participants[id];
        if(!p) {
            throw this.getParticipant_err;
        }
        return p;
    };

    /**
     * The error message passed when a desired participant does not exist in the listener.
     * @property getParticipant_err
     * @type {string}
     */
    ozpIwc.Owf7ParticipantListener.prototype.getParticipant_err = "Uknown participant";

    /**
     * Registers any function nested in the regObj param using the regFn param.
     * @method registerFunctions
     * @params  {Object|Array} regObj A object of functions to register where the key is the name, Or nested objects/arrays
     *                               matching said structure.
     * @params  {Function} regFn A registration function to pass (name,fn) to.
     */
    ozpIwc.Owf7ParticipantListener.prototype.registerFunctions = function(regObj,regFn){

        // Recursively cycle through the object/array.
        // If property is a function pass it to fn.
        function recurseIfObject(obj,fn){
            for(var i in obj){
                if(obj.hasOwnProperty(i)){
                    if(typeof obj[i] === 'function'){
                        fn(i,obj[i]);
                    } else if(typeof obj[i] === 'object') {
                        recurseIfObject(obj[i],fn);
                    } else {
                        console.error('typeof('+i+')=', typeof(obj[i]), '. Only functions allowed.');
                    }
                }
            }
        }

        recurseIfObject(regObj,regFn);
    };

    /**
     * Using scope isolation, these RPC functions have access to limited properties of the OWF7ParticipantListener.
     * @method getRPCFunctions
     * @returns {Object}
     */
    ozpIwc.Owf7ParticipantListener.prototype.getRPCFunctions = function(){
        // Use closure for any members as we are generating handlers.
        var widgetReadyMap = this.widgetReadyMap,
            magicFunctionMap = this.magicFunctionMap,
            proxyMap = this.proxyMap,
            self = this;

        return {
            /**
             * Components
             */
            'components': {
                'keys': {
                    /**
                     *
                     * @see reference/js/components/keys/KeyEventing.js
                     */
                    '_widget_iframe_ready': function () {
                    }
                },
                'widget': {
                    /**
                     * @see js\components\widget\WidgetIframeComponent.js:15
                     * @param sender
                     * @param msg
                     */
                    '_WIDGET_LAUNCHER_CHANNEL': function (sender, msg) {
                        var p = self.getParticipant(this.f);
                        p.onLaunchWidget(sender, msg, this);
                    }
                }

            },

            /**
             * Drag and Drop
             */
            'dd': {
                /**
                 *
                 * _fake_mouse_move is needed for drag and drop.  The container code is at
                 * @see reference\js\dd\WidgetDragAndDropContainer.js:52
                 * @param msg
                 */
                '_fake_mouse_move': function (msg) {
                    self.getParticipant(this.f).onFakeMouseMoveFromClient(msg);
                },
                /**
                 * @see reference\js\dd\WidgetDragAndDropContainer.js:52
                 * @param msg
                 */
                '_fake_mouse_up': function (msg) {
                    self.getParticipant(this.f).onFakeMouseUpFromClient(msg);
                },
                /**
                 *
                 */
                '_fake_mouse_out': function () { /*ignored*/
                }
            },

            /**
             * Eventing
             */
            'eventing': {
                /**
                 * Called by the widget to connect to the container
                 * @see js/eventing/Container.js:26 for the containerInit function that much of this is copied from
                 * @see js/eventing/Container.js:104 for the actual rpc.register
                 * @property container_init
                 */
                'container_init': function (sender, message) {
                    self.getParticipant(this.f).onContainerInit(sender, message);
                },
                /**
                 *
                 */
                'after_container_init': function() {

                },
                /**
                 * @param {string} command - publish | subscribe | unsubscribe
                 * @param {string} channel - the OWF7 channel
                 * @param {string} message - the message being published
                 * @param {string} dest - the ID of the recipient if this is point-to-point
                 * @see js/eventing/Container.js:376
                 * @see js-lib/shindig/pubsub.js
                 * @see js-lib/shindig/pubsub_router.js
                 */
                'pubsub': function (command, channel, message, dest) {
                    var p = self.getParticipant(this.f);
                    switch (command) {
                        case 'publish':
                            p.onPublish(command, channel, message, dest);
                            break;
                        case 'subscribe':
                            p.onSubscribe(command, channel, message, dest);
                            break;
                        case 'unsubscribe':
                            p.onUnsubscribe(command, channel, message, dest);
                            break;
                    }
                }
            },

            /**
             * Intents
             */
            'intents': {
                /**
                 * used for both handling and invoking intents
                 * @see js/intents/WidgetIntentsContainer.js:32 for reference
                 * @param senderId
                 * @param intent
                 * @param data
                 * @param destIds
                 */
                '_intents': function(senderId, intent, data, destIds){

                },
                /**
                 * used by widgets to register an intent
                 * @see js/intents/WidgetIntentsContainer.js:85 for reference
                 * @param intent
                 * @param destWidgetId
                 */
                '_intents_receive': function(intent, destWidgetId){

                }
            },

            /**
             * Kernel
             */
            'kernel': {
                /**
                 * @see js/kernel/kernel-rpc-base.js:147
                 * @param widgetId
                 * @param srcWidgetId
                 * @returns {boolean}
                 */
                '_getWidgetReady': function (widgetId, srcWidgetId) {
                    return widgetReadyMap[widgetId] = true;

                },
                /**
                 * @see reference/js/kernel/kernel-rpc-base.js:130
                 * @param widgetId
                 */
                '_widgetReady': function(widgetId){

                },
                /**
                 * @see js/kernel/kernel-rpc-base.js:124
                 * @param iframeId
                 * @param functions
                 */
                'register_functions': function (iframeId, functions) {
                    var widgetID = JSON.parse(iframeId).id;

                    if (!magicFunctionMap[widgetID]) {
                        magicFunctionMap[widgetID] = functions;
                        return;
                    }

                    // don't add duplicates
                    var found;

                    for (var i = 0, len = functions.length; i < len; i++) {
                        found = false;
                        for (var j = 0, len2 = magicFunctionMap[widgetID].length; j < len2; j++) {
                            if (functions[i] === magicFunctionMap[widgetID][j]) {
                                found = true;
                                break;
                            }
                        }
                        if (found === false) {
                            magicFunctionMap[widgetID].push(functions[i]);
                        }
                    }
                },
                /**
                 * @see js/kernel/kernel-rpc-base.js:88
                 * @param widgetID
                 * @param sourceWidgetId
                 * @returns {*}
                 */
                'GET_FUNCTIONS': function (widgetID, sourceWidgetId) {
                    var functions = magicFunctionMap[widgetID];

                    //save the fact that the sourceWidgetId has a proxy of the widgetId
                    if (proxyMap[widgetID] == null) {
                        proxyMap[widgetID] = [];
                    }
                    if (sourceWidgetId != null) {
                        proxyMap[widgetID].push(sourceWidgetId);
                    }

                    return functions != null ? functions : [];
                },
                /**
                 * @see js/kernel/kernel-container.js:204
                 * @returns {Array}
                 */
                'LIST_WIDGETS': function () {
                    self.getParticipant(this.f).onListWidgets(this);
                }
            },

            /**
             *  Launcher API
             *  The handling of the rpc event is in WidgetLauncherContainer
             *  @see js/launcher/WidgetLauncherContainer.js:22, 36
             *  msg: {
             *    universalName: 'universal name of widget to launch',  //universalName or guid maybe identify the widget to be launched
             *    guid: 'guid of widget to launch',
             *    title: 'title to replace the widgets title' the title will only be changed if the widget is opened.
             *    titleRegex: optional regex used to replace the previous title with the new value of title
             *    launchOnlyIfClosed: true, //if true will only launch the widget if it is not already opened.
             *                              //if it is opened then the widget will be restored
             *    data: dataString  //initial launch config data to be passed to a widget only if the widget is opened.  this must be a string
             *  });
             *  The steps to launch a widget are defined in dashboard.launchWidgetInstance
             *  @see js/components/dashboard/Dashboard.js:427
             *  The "iframe properties" come from Dashboard.onBeforeWidgetLaunch
             *  @see js/components/dashboard/Dashboard.js:318
             *  @see js\eventing\Container.js:237 for getIframeProperties()
             *  WidgetIframeComponent actually creates the iframe tag.
             */
            'launcher': {},

            /**
             * Util
             */
            'util': {
                'Ozone.log': function() {

                }
            }
        };
    };
})();