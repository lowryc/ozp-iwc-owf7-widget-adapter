/**
 * A bridging module for an IWC Participant Listener. Default use is for bridging an RPC handler interface to IWC
 * Participant handlers.
 *
 * @class Owf7Bridge
 * @namespace ozpIwc
 * @param {Object} config
 * @param {Object} config.listener The listener this is bridging for.
 * @param {Object} [funcs] Handlers to register upon instantiation of the bridge.
 * @param {Function} [config.defaultHandler=ozpIwc.Owf7Bridge._defaultHandler] The default handler for the bridge.
 * @param {Function} [config.registerDefaultFn=ozpIwc.Owf7Bridge._registerDefaultFn] The bridged default handler registration function.
 * @param {Function} [config.registerFn=ozpIwc.Owf7Bridge._registerFn] The bridged handler registration function.
 * @param {Function} [config.unregisterFn=ozpIwc.Owf7Bridge._unregisterFn] The bridged unhandler registration function.
 * @constructor
 */
ozpIwc.Owf7Bridge=function(config) {
    config = config || {};
    if(!config.listener) {throw this._noListener_err;}

    this.listener = config.listener;
    this.widgetReadyMap = {};
    this.magicFunctionMap = {};
    this.proxyMap = {};
    this.funcs = {};

    // Defaults to gadget.rpc calls, but can override if so desired.
    this._defaultHandler = config.defaultHandler || this._defaultHandler;
    this._registerFn = config.registerFn || this._registerFn;
    this._registerDefaultFn = config.registerDefaultFn || this._registerDefaultFn;
    this._unregisterFn = config.unregisterFn || this._unregisterFn;

    // Initialize then add any additional registrations passed in the constructor.
    this._initHandlers();
    this.addHandlers(config.funcs);
};

//
// Public Properties
//

/**
 * Adds handlers using their object property name as the channel. References stored in rpcFuncs.
 * Uncategorized functions will be placed in rpcFuncs under "uncategorized".
 * Adding a handler with a non-unique name will override the previous existence.
 *
 * @method addHandlers
 * @param {Object} object
 */
ozpIwc.Owf7Bridge.prototype.addHandlers = function(object){
    var formattedObj =  ozpIwc.Owf7Bridge.objectCategoryFormat(object);
    this._registerFunctions(formattedObj);
};

/**
 * Removes handlers using their object property name as the channel.
 * Uncategorized functions to remove will be searched for in rpcFuncs under "uncategorized".
 *
 * @method removeHandlers
 * @param {Object} object
 */
ozpIwc.Owf7Bridge.prototype.removeHandlers = function(object){
    var formattedObj =  ozpIwc.Owf7Bridge.objectCategoryFormat(object);
    this._unregisterFunctions(formattedObj);
};

/**
 * Replaces handlers registered using their object property name as the channel.
 * Uncategorized functions to update will be searched for in rpcFuncs under "uncategorized".
 *
 * @method updateHandlers
 * @param {Object} oldObject
 * @param {Object} newObject
 */
ozpIwc.Owf7Bridge.prototype.updateHandlers = function(oldObject,newObject){
    this.removeHandlers(oldObject);
    this.addHandlers(newObject);
};

/**
 * Registers the default handler function for calls without a registered handler.
 *
 * @method registerDefaultHandler
 * @param {Function} fn
 */
ozpIwc.Owf7Bridge.prototype.registerDefaultHandler = function(fn){
    if(typeof fn !== "function"){
        throw "Owf7Bridge default handler must be a function.";
    }
    this._registerDefaultFn(fn);

};

//
// Private Properties
//

/**
 * Error message used when no listener is passed in during instantiation.
 *
 * @property _noListener_err
 * @type {string}
 * @default "An Owf7ParticipantListener is required to bridge RPC to IWC"
 * @private
 */
ozpIwc.Owf7Bridge.prototype._noListener_err = "An Owf7ParticipantListener is required to bridge RPC to IWC";

/**
 * Registers the object-indexed functions.
 *
 * @method _registerFunctions
 * @param {Object} object
 * @private
 */
ozpIwc.Owf7Bridge.prototype._registerFunctions = function(object){
    var self = this;

    var onFunction = function(outObj,fn, name){
        self._registerFn(name,fn);
        outObj[name] = fn;
    };

    ozpIwc.Owf7Bridge.functionsInObjects({
        'inObj': object,
        'outObj': this.funcs,
        'onFn':onFunction
    });
};

/**
 * Default handler function to call if no registered function found.
 *
 * @method _defaultHandler
 * @private
 */
ozpIwc.Owf7Bridge.prototype._defaultHandler = function() {
    var rpcString=function(rpc) {
        return "[service:" + rpc.s + ",from:" + rpc.f + "]:" + JSON.stringify(rpc.a);
    };

    console.log("Unknown rpc " + rpcString(this));
};

/**
 * Unregisters the object-indexed functions.
 *
 * @method _unregisterFunctions
 * @param {Object} object
 * @private
 */
ozpIwc.Owf7Bridge.prototype._unregisterFunctions = function(object){
    var self = this;

    var onFunction = function(outObj,fn, name){
        self._unregisterFn(name,fn);
        delete outObj[name];
    };

    ozpIwc.Owf7Bridge.functionsInObjects({
        'inObj': object,
        'outObj': this.funcs,
        'onFn':onFunction
    });
};

/**
 * The register function called when registering a bridged handler.
 *
 * @method _registerFn
 * @type {gadgets.rpc.register}
 * @private
 */
ozpIwc.Owf7Bridge.prototype._registerFn = gadgets.rpc.register;

/**
 * The register function called when registering a default bridged handler.
 *
 * @method _registerDefaultFn
 * @type {gadgets.rpc.register}
 * @private
 */
ozpIwc.Owf7Bridge.prototype._registerDefaultFn = gadgets.rpc.registerDefault;

/**
 * The unregister function called when unregistering a bridged handler.
 *
 * @method _unregisterFn
 * @type {gadgets.rpc.register}
 * @private
 */
ozpIwc.Owf7Bridge.prototype._unregisterFn = gadgets.rpc.unregister;


/**
 * Initializes the static handler registrations. Runtime determined handlers should be added with addHandlers.
 *
 * @method _initHandlers
 * @returns {Object}
 * @private
 */
ozpIwc.Owf7Bridge.prototype._initHandlers = function(){
    // Use closure for any members as we are generating handlers.
    var widgetReadyMap = this.widgetReadyMap,
        magicFunctionMap = this.magicFunctionMap,
        proxyMap = this.proxyMap,
        listener = this.listener;

    var handlerFunctions = {
        /**
         * Components
         */
        'components': {
            'keys': {
                /**
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
                    var p = listener.getParticipant(this.f);
                    p.onLaunchWidget(sender, msg, this);
                }
            }

        },

        /**
         * Drag and Drop
         */
        'dd': {
            /**
             * _fake_mouse_move is needed for drag and drop.  The container code is at
             * @see reference\js\dd\WidgetDragAndDropContainer.js:52
             * @param msg
             */
            '_fake_mouse_move': function (msg) {
                listener.getParticipant(this.f).onFakeMouseMoveFromClient(msg);
            },
            /**
             * @see reference\js\dd\WidgetDragAndDropContainer.js:52
             * @param msg
             */
            '_fake_mouse_up': function (msg) {
                listener.getParticipant(this.f).onFakeMouseUpFromClient(msg);
            },
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
                listener.getParticipant(this.f).onContainerInit(sender, message);
            },
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
                var p = listener.getParticipant(this.f);
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
                widgetReadyMap[widgetId] = true;
                return widgetReadyMap;

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
                var functions = magicFunctionMap[widgetID] || [];

                //save the fact that the sourceWidgetId has a proxy of the widgetId
                if (!proxyMap.hasOwnProperty(widgetID)) {
                    proxyMap[widgetID] = [];
                }
                if (sourceWidgetId) {
                    proxyMap[widgetID].push(sourceWidgetId);
                }

                return functions;
            },
            /**
             * @see js/kernel/kernel-container.js:204
             * @returns {Array}
             */
            'LIST_WIDGETS': function () {
                listener.getParticipant(this.f).onListWidgets(this);
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
        },
        'uncategorized':{}
    };
    this.registerDefaultHandler(this._defaultHandler);
    this.addHandlers(handlerFunctions);
    return handlerFunctions;
};

//
// Static utility methods
//

/**
 * Formats the given object for the Owf7Bridge function storage format.
 *
 * @method objectCategoryFormat
 * @param {Object} object
 * @static
 * @returns {Object}
 */
ozpIwc.Owf7Bridge.objectCategoryFormat = function(object){
    var obj = { 'uncategorized' : {} };

    for (var i in object){
        if(object.hasOwnProperty(i)){
            if(typeof object[i] === 'function'){
                obj.uncategorized[i] = object[i];
            } else {
                obj[i] = object[i];
            }
        }
    }
    return obj;
};

/**
 * A utility method to recursively walk through an object-indexed collection of functions.
 *
 * @method functionsInObjects
 * @params {Object} config
 * @params {Object|Array} config.inObj A object of functions to walk
 * @params {Object} config.outObj A object of functions to walk
 * @params {Function} config.onFn  A registration function to pass (name,fn) to.
 * @static
 */
ozpIwc.Owf7Bridge.functionsInObjects = function(config){
    config.inObj = config.inObj || {};
    config.outObj = config.outObj || {};
    config.onFn = config.onFn || function(){};

    // Recursively cycle through the object/array.
    // If property is a function pass it to fn.
    // fnStorage creates a object-categorized reference to all functions added.
    function recurseIfObject(inObj,outObj,onFn,onObj){
        for(var i in inObj){
            if(inObj.hasOwnProperty(i)){
                if(typeof inObj[i] === 'function'){
                    onFn(outObj,inObj[i],i);
                } else if(typeof inObj[i] === 'object') {
                    outObj[i] = outObj[i]|| {};
                    recurseIfObject(inObj[i],outObj[i],onFn);
                } else {
                    console.error('typeof('+i+')=', typeof(inObj[i]), '. Only functions allowed.');
                }
            }
        }
    }
    recurseIfObject(config.inObj,config.outObj,config.onFn);
    return  config.outObj;
};
