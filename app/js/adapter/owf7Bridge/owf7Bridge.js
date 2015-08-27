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
 * @constructor
 */
ozpIwc.Owf7Bridge=function(config) {
    config = config || {};
    if(!config.listener) {throw this._noListener_err;}

    this.listener = config.listener;
    this.funcs = {};

    // Defaults to gadget.rpc calls, but can override if so desired.
    this._defaultHandler = config.defaultHandler || this._defaultHandler;

    // Initialize then add any additional registrations passed in the constructor.
    this._initHandlers();
    this.addHandlers(config.funcs);
};

/**
 * The error message passed when a desired participant does not exist in the listener.
 * @property getParticipant_err
 * @type {string}
 */
ozpIwc.Owf7Bridge.prototype._noListener_err = "An Owf7ParticipantListener is required to bridge RPC to IWC";

//
// Public Properties
//

/**
 * Adds handlers using their object property name as the channel. References stored in rpcFuncs.
 * Uncategorized functions will be placed in rpcFuncs under "uncategorized".
 * Adding a handler with a non-unique name will override the previous existence.
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
 * @method registerDefaultHandler
 * @param {Function} fn
 */
ozpIwc.Owf7Bridge.prototype.registerDefaultHandler = function(fn){
    if(typeof fn !== "function"){
        throw "Owf7Bridge default handler must be a function.";
    }
    gadgets.rpc.registerDefault(fn);
};

//
// Private Properties
//

/**
 * Registers the object-indexed functions.
 * @method _registerFunctions
 * @param {Object} object
 * @private
 */
ozpIwc.Owf7Bridge.prototype._registerFunctions = function(object){
    var self = this;
    var onFunction = function(outObj,fn, name){

        function func(){
            //Ignore messages not meant for this participant.
            var participant = self.listener.getParticipant(this.f);
            if(participant){
                // unshift to front of arguments
                Array.prototype.unshift.call(arguments, participant);
                fn.apply(this,arguments);
            }
        }

        gadgets.rpc.register(name,func);
        outObj[name] = func;
    };

    ozpIwc.Owf7Bridge.functionsInObjects({
        'inObj': object,
        'outObj': this.funcs,
        'onFn':onFunction
    });
};


/**
 * Unregisters the object-indexed functions.
 * @method _unregisterFunctions
 * @param {Object} object
 * @private
 */
ozpIwc.Owf7Bridge.prototype._unregisterFunctions = function(object){
    var onFunction = function(outObj,fn, name){
        gadgets.rpc.unregister(name,fn);
        delete outObj[name];
    };

    ozpIwc.Owf7Bridge.functionsInObjects({
        'inObj': object,
        'outObj': this.funcs,
        'onFn':onFunction
    });
};

/**
 * Initializes the static handler registrations. Handler registrations gathered from ozpIwc.owf7BridgeModules.
 * Runtime determined handlers should be added with addHandlers.
 * @method _initHandlers
 * @returns {Object}
 * @private
 */
ozpIwc.Owf7Bridge.prototype._initHandlers = function(){
    var self = this;
    /**
     * Default handler function to call if no registered function found.
     * @method _defaultHandler
     * @private
     */
    this._defaultHandler = function() {
        //If this is from someone else using rpc we don't care.
        if(self.listener.getParticipant(this.f)) {
            var rpcString = function (rpc) {
                return "[service:" + rpc.s + ",from:" + rpc.f + "]:" + JSON.stringify(rpc.a);
            };

            ozpIwc.log.error("Unknown rpc " + rpcString(this));
        }
    };

    this.registerDefaultHandler(this._defaultHandler);

    for(var i in ozpIwc.owf7BridgeModules){
        var module = ozpIwc.owf7BridgeModules[i];
        if(ozpIwc.owf7BridgeModules.hasOwnProperty(i) && typeof module === "function") {
            this.addHandlers(module(this.listener));
        }
    }
    return this.funcs;
};

//
// Static utility methods
//

/**
 * Formats the given object for the Owf7Bridge function storage format.
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