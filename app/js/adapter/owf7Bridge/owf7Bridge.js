var ozpIwc = ozpIwc || {};
ozpIwc.owf7 = ozpIwc.owf7 || {};
ozpIwc.owf7.bridgeModules = ozpIwc.owf7.bridgeModules || {};

ozpIwc.owf7.Bridge = (function (bridgeModules, log) {
    /**
     * A bridging module for an IWC Participant Listener. Default use is for bridging an RPC handler interface to IWC
     * Participant handlers.
     *
     * @class Bridge
     * @namespace ozpIwc.owf7
     * @param {Object} config
     * @param {Object} config.listener The listener this is bridging for.
     * @param {Object} [funcs] Handlers to register upon instantiation of the bridge.
     * @param {Function} [config.defaultHandler=ozpIwc.owf7.Bridge._defaultHandler] The default handler for the bridge.
     * @constructor
     */
    var Bridge = function (config) {
        config = config || {};
        if (!config.listener) {
            throw this._noListener_err;
        }

        this.listener = config.listener;
        this.funcs = {};

        // Defaults to gadget.rpc calls, but can override if so desired.
        this._defaultHandler = config.defaultHandler || this._defaultHandler;

        // Initialize then add any additional registrations passed in the constructor.
        initHandlers(this);
        this.addHandlers(config.funcs);
    };


    //---------------------------------------------------------------
    // Private Properties
    //---------------------------------------------------------------

    /**
     * Initializes the static handler registrations. Handler registrations gathered from ozpIwc.owf7.bridgeModules.
     * Runtime determined handlers should be added with addHandlers.
     * @method _initHandlers
     * @returns {Object}
     * @private
     */
    var initHandlers = function (participant) {
        /**
         * Default handler function to call if no registered function found.
         * @method _defaultHandler
         * @private
         */
        participant._defaultHandler = function () {
            //If this is from someone else using rpc we don't care.
            if (participant.listener.getParticipant(this.f)) {
                var rpcString = function (rpc) {
                    return "[service:" + rpc.s + ",from:" + rpc.f + "]:" + JSON.stringify(rpc.a);
                };

                log.error("Unknown rpc " + rpcString(participant));
            }
        };

        participant.registerDefaultHandler(participant._defaultHandler);

        for (var i in bridgeModules) {
            var module = bridgeModules[i];
            if (bridgeModules.hasOwnProperty(i) && typeof module === "function") {
                participant.addHandlers(module(participant.listener));
            }
        }
        return participant.funcs;
    };
    //---------------------------------------------------------------
    // Public Properties
    //---------------------------------------------------------------
    /**
     * The error message passed when a desired participant does not exist in the listener.
     * @property getParticipant_err
     * @type {string}
     */
    Bridge.prototype._noListener_err = "An owf7 ParticipantListener is required to bridge RPC to IWC";

    /**
     * Adds handlers using their object property name as the channel. References stored in rpcFuncs.
     * Uncategorized functions will be placed in rpcFuncs under "uncategorized".
     * Adding a handler with a non-unique name will override the previous existence.
     * @method addHandlers
     * @param {Object} object
     */
    Bridge.prototype.addHandlers = function (object) {
        var formattedObj = Bridge.objectCategoryFormat(object);
        this._registerFunctions(formattedObj);
    };
    /**
     *
     * Removes handlers using their object property name as the channel.
     * Uncategorized functions to remove will be searched for in rpcFuncs under "uncategorized".
     * @method removeHandlers
     * @param {Object} object
     */
    Bridge.prototype.removeHandlers = function (object) {
        var formattedObj = Bridge.objectCategoryFormat(object);
        this._unregisterFunctions(formattedObj);
    };

    /**
     * Replaces handlers registered using their object property name as the channel.
     * Uncategorized functions to update will be searched for in rpcFuncs under "uncategorized".
     * @method updateHandlers
     * @param {Object} oldObject
     * @param {Object} newObject
     */
    Bridge.prototype.updateHandlers = function (oldObject, newObject) {
        this.removeHandlers(oldObject);
        this.addHandlers(newObject);
    };

    /**
     * Registers the default handler function for calls without a registered handler.
     * @method registerDefaultHandler
     * @param {Function} fn
     */
    Bridge.prototype.registerDefaultHandler = function (fn) {
        if (typeof fn !== "function") {
            throw "Bridge default handler must be a function.";
        }
        gadgets.rpc.registerDefault(fn);
    };

    /**
     * Registers the object-indexed functions.
     * @method _registerFunctions
     * @param {Object} object
     * @private
     */
    Bridge.prototype._registerFunctions = function (object) {
        var self = this;
        var onFunction = function (outObj, fn, name) {

            function func() {
                //Ignore messages not meant for this participant.
                var participant = self.listener.getParticipant(this.f);
                if (participant) {
                    // unshift to front of arguments
                    Array.prototype.unshift.call(arguments, participant);
                    fn.apply(this, arguments);
                }
            }

            gadgets.rpc.register(name, func);
            outObj[name] = func;
        };

        Bridge.functionsInObjects({
            'inObj': object,
            'outObj': this.funcs,
            'onFn': onFunction
        });
    };

    /**
     * Unregisters the object-indexed functions.
     * @method _unregisterFunctions
     * @param {Object} object
     * @private
     */
    Bridge.prototype._unregisterFunctions = function (object) {
        var onFunction = function (outObj, fn, name) {
            gadgets.rpc.unregister(name, fn);
            delete outObj[name];
        };

        Bridge.functionsInObjects({
            'inObj': object,
            'outObj': this.funcs,
            'onFn': onFunction
        });
    };


    /**
     * Formats the given object for the Bridge function storage format.
     * @method objectCategoryFormat
     * @param {Object} object
     * @static
     * @returns {Object}
     */
    Bridge.objectCategoryFormat = function (object) {
        var obj = {'uncategorized': {}};

        for (var i in object) {
            if (object.hasOwnProperty(i)) {
                if (typeof object[i] === 'function') {
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
     * @method functionsInObjects
     * @params {Object} config
     * @params {Object|Array} config.inObj A object of functions to walk
     * @params {Object} config.outObj A object of functions to walk
     * @params {Function} config.onFn  A registration function to pass (name,fn) to.
     * @static
     */
    Bridge.functionsInObjects = function (config) {
        config.inObj = config.inObj || {};
        config.outObj = config.outObj || {};
        config.onFn = config.onFn || function () {};

        // Recursively cycle through the object/array.
        // If property is a function pass it to fn.
        // fnStorage creates a object-categorized reference to all functions added.
        function recurseIfObject(inObj, outObj, onFn, onObj) {
            for (var i in inObj) {
                if (inObj.hasOwnProperty(i)) {
                    if (typeof inObj[i] === 'function') {
                        onFn(outObj, inObj[i], i);
                    } else if (typeof inObj[i] === 'object') {
                        outObj[i] = outObj[i] || {};
                        recurseIfObject(inObj[i], outObj[i], onFn);
                    } else {
                        console.error('typeof(' + i + ')=', typeof(inObj[i]), '. Only functions allowed.');
                    }
                }
            }
        }

        recurseIfObject(config.inObj, config.outObj, config.onFn);
        return config.outObj;
    };

    return Bridge;
}(ozpIwc.owf7.bridgeModules, ozpIwc.log));