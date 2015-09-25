var ozpIwc = ozpIwc || {};
ozpIwc.owf7 = ozpIwc.owf7 || {};
ozpIwc.owf7.participantModules = ozpIwc.owf7.participantModules || {};

/**
 * A Kernel module for the owf7Participant.
 * @class Kernel
 * @namespace ozpIwc.owf7.participantModules
 * @param {ozpIwc.owf7.Participant} participant
 * @constructor
 */
ozpIwc.owf7.participantModules.Kernel = function(participant){
    if(!participant) { throw "Needs to have an Owf7Participant";}

    /**
     * @property participant
     * @type {ozpIwc.owf7.Participant}
     */
    this.participant = participant;

    /**
     * @property widgetReadyMap
     * @type {Object}
     */
    this.widgetReadyMap = {};

    /**
     * @property proxyMap
     * @type {Object}
     */
    this.proxyMap = {};

    /**
     * A shorthand for data api access through the participant.
     * @property dataApi
     * @type {Object}
     */
    this.dataApi = this.participant.client.data();

    this.registerWidgetListing();
    this.registerFunctionCallListener();
    this.registerFunctionCallResultListener();
    this.registerWidgetReadyListener();
    this.registerDirectMessageListener();
};

/**
 * IWC data.api resource path where all active legacy widget GUIDs are reported.
 * @property listWidgetChannel
 * @type {String}
 */
ozpIwc.owf7.participantModules.Kernel.prototype.listWidgetChannel = "/owf-legacy/kernel/_list_widgets";

/**
 * IWC data.api resource path prefix for any proxy related messaging
 * @property listWidgetChannel
 * @type {String}
 */
ozpIwc.owf7.participantModules.Kernel.prototype.widgetProxyChannelPrefix = "/owf-legacy/kernel/proxy/";

/**
 * Returns the IWC Data.api resource path for the given widget's _widgetReady event.
 * @method widgetReadyResource
 * @param {String} widgetId
 * @returns {String}
 */
ozpIwc.owf7.participantModules.Kernel.prototype.widgetReadyResource = function(widgetId){
    return this.widgetProxyChannelPrefix + widgetId + "/_widgetReady";
};

/**
 * Returns the IWC Data.api resource path for the given widget's FUNCTION_CALL_CLIENT event.
 * @method functionCallResource
 * @param {String} widgetId
 * @returns {String}
 */
ozpIwc.owf7.participantModules.Kernel.prototype.functionCallResource = function(widgetId){
    return this.widgetProxyChannelPrefix + widgetId + "/FUNCTION_CALL_CLIENT";
};

/**
 * Returns the IWC Data.api resource path for the given widget's FUNCTION_CALL_RESULT_CLIENT event.
 * @method functionCallResultResource
 * @param {String} widgetId
 * @returns {String}
 */
ozpIwc.owf7.participantModules.Kernel.prototype.functionCallResultResource = function(widgetId){
    return this.widgetProxyChannelPrefix + widgetId + "/FUNCTION_CALL_RESULT_CLIENT";
};

/**
 * Returns the IWC Data.api resource path for the given widget's DIRECT_MESSAGE event.
 * @method directMessageResource
 * @param {String} widgetId
 * @returns {String}
 */
ozpIwc.owf7.participantModules.Kernel.prototype.directMessageResource = function(widgetId){
    return this.widgetProxyChannelPrefix + widgetId + "/DIRECT_MESSAGE";
};
/**
 * Returns the IWC Data.api resource path for the given widget's CALL_EVENT event.
 * @method directMessageResource
 * @param {String} eventName
 * @returns {String}
 */
ozpIwc.owf7.participantModules.Kernel.prototype.callEventResource = function(eventName) {
    return this.widgetProxyChannelPrefix + "/CALL_EVENT/" + eventName;
};

/**
 * Register's a listener for the given widget's _widgetReady event.
 * @method functionCallResultResource
 * @param {String} widgetId
 * @returns {String}
 */
ozpIwc.owf7.participantModules.Kernel.prototype.registerWidgetReadyListener = function(){
    var self = this;
    this.dataApi.set(this.widgetReadyResource(this.participant.instanceId),{'lifespan': "ephemeral"});

    this.dataApi.watch(this.widgetReadyResource(this.participant.instanceId),function(packet,done) {
        done();
        self.onWidgetReady(self.participant.instanceId);
    });
};

/**
 * Updates the IWC's data.api resource specified by listWidgetChannel with this widget's GUID.
 * Registers a beforeunload event to remove the GUID on closing.
 *
 * @method registerWidgetListing
 */
ozpIwc.owf7.participantModules.Kernel.prototype.registerWidgetListing = function() {
    var self = this;

    window.addEventListener("beforeunload",function(){
        self.unregisterWidgetListing();
    });

    this.dataApi.addChild(this.listWidgetChannel,{
        entity: gadgets.json.parse(this.participant.rpcId),
        lifespan: "ephemeral"
    }).then(function(reply){
        self.widgetListing = reply.entity.resource;
    });
};

/**
 * Updates the IWC's data.api resource specified by listWidgetChannel by removing this widget's GUID.
 * @method unregisterWidgetListing
 */
ozpIwc.owf7.participantModules.Kernel.prototype.unregisterWidgetListing = function() {
    this.dataApi.removeChild(this.listWidgetChannel,{
        entity: {resource: this.widgetListing}
    });
    return true;
};

/**
 * A handler for the _getWidgetReady event.
 * @method onGetWidgetReady
 * @param {String} widgetId
 * @param {Object} rpc
 */
ozpIwc.owf7.participantModules.Kernel.prototype.onGetWidgetReady = function(widgetId,rpc){
    if(this.widgetReadyMap.hasOwnProperty(widgetId)) {
        rpc.callback(this.widgetReadyMap[widgetId] === true);
    } else {
        var self = this;
        this.dataApi.get(this.widgetReadyResource(widgetId)).then(function(packet){
            var ready = !!packet.entity;
            if(ready) {
                self.onWidgetReady(widgetId);
            }
            rpc.callback(ready);
        },function(error){
            if(error.response === "noResource"){
                rpc.callback(false);
            }
        });
    }
};

/**
 * A handler for the _widgetReady event.
 * @method onWidgetReady
 * @param {String} widgetId
 */
ozpIwc.owf7.participantModules.Kernel.prototype.onWidgetReady = function(widgetId){
    this.widgetReadyMap[widgetId] = true;
    this.dataApi.set(this.widgetReadyResource(widgetId),{
        entity: this.widgetReadyMap[widgetId],
        lifespan: "ephemeral"
    });

    //loop through any widgets that have reference to widgetId and send messages that widgetId widget is ready
    var proxyHolders = this.proxyMap[widgetId];
    if (proxyHolders) {
        for (var i = 0, len = proxyHolders.length; i < len; i++) {
            var proxyHolder = proxyHolders[i];
            if (proxyHolder) {
                this.dataApi.set(this.widgetReadyResource(proxyHolder),{
                    entity: true,
                    lifespan: "ephemeral"
                });
            }
        }
    }
};

/**
 * A handler for the register_functions event.
 * @method onRegisterFunctions
 * @param {String} iframeId
 * @param {String[]} functions
 */
ozpIwc.owf7.participantModules.Kernel.prototype.onRegisterFunctions = function(iframeId, functions){
    var widgetID = JSON.parse(iframeId).id;
    var self = this;


    this.dataApi.get(this.widgetProxyChannelPrefix + widgetID).then(function(reply){
        return Array.isArray(reply.entity) ? reply.entity : [];
    },function(error){
        if(error.response === "noResource"){
            return [];
        }
    }).then(function(functionArray){
        for(var j in functions){
            if(functionArray.indexOf(functions[j]) < 0){
                functionArray.push(functions[j]);
            }
        }
        self.dataApi.set(self.widgetProxyChannelPrefix + widgetID,{
            entity: functionArray,
            lifespan: "ephemeral"
        });
    });
};

/**
 * A handler for the GET_FUNCTIONS event.
 * @method onGetFunctions
 * @param {String} widgetId
 * @param {String} sourceWidgetId
 * @param {Object} rpc
 */
ozpIwc.owf7.participantModules.Kernel.prototype.onGetFunctions = function(widgetId, sourceWidgetId, rpc){
    var self = this;
    this.dataApi.get(this.widgetProxyChannelPrefix + widgetId).then(function(reply){

        //save the fact that the sourceWidgetId has a proxy of the widgetId
        if (!self.proxyMap[widgetId]) {
            self.proxyMap[widgetId] = [];
        }
        if (sourceWidgetId) {
            var id = JSON.parse(sourceWidgetId).id;
            self.proxyMap[widgetId].push(id);
        }

        rpc.callback(reply.entity);
    },function(error){
        if(error.response === "noResource"){
            rpc.callback([]);
        }
    });
};

/**
 * A handler for the FUNCTION_CALL event. Fires when the widget wants to make a function call.
 * @method onGetFunctions
 * @param {String} widgetId
 * @param {String} widgetIdCaller
 * @param {String} functionName
 * @param {Array} var_args
 */
ozpIwc.owf7.participantModules.Kernel.prototype.onFunctionCall = function(widgetId, widgetIdCaller, functionName, var_args){
    this.dataApi.set(this.functionCallResource(widgetId),{
        entity: {
            'widgetId': widgetId,
            'widgetIdCaller': widgetIdCaller,
            'functionName': functionName,
            'var_arg': var_args,
            'time': Date.now()  // slap a timestamp on to trigger change always
        },
        lifespan: "ephemeral"
    });
};

/**
 * When receiving a function call from another widget, this calls rpc FUNCTION_CALL_CLIENT to route it to this legacy widget.
 * @method functionCallClient
 * @param {String} widgetId
 * @param {String} widgetIdCaller
 * @param {String} functionName
 * @param {Array} var_args
 */
ozpIwc.owf7.participantModules.Kernel.prototype.functionCallClient = function(widgetId, widgetIdCaller, functionName, var_args){
    gadgets.rpc.call(this.participant.rpcId, 'FUNCTION_CALL_CLIENT', null, widgetId, widgetIdCaller, functionName, var_args);
};

/**
*  When receiving a function call result from another widget, this calls rpc  FUNCTION_CALL_CLIENT to route it to this legacy widget.
* @method functionCallResultClient
* @param {String} widgetId
* @param {String} widgetIdCaller
* @param {String} functionName
* @param {String} result
*/
ozpIwc.owf7.participantModules.Kernel.prototype.functionCallResultClient = function(widgetId, widgetIdCaller, functionName, result){
    gadgets.rpc.call(this.participant.rpcId, 'FUNCTION_CALL_RESULT_CLIENT', null, widgetId, functionName, result);
};

/**
 * A handler for the FUNCTION_CALL_RESULT event. Fires when the widget is sending a result to a different client.
 * @method onGetFunctions
 * @param {String} widgetId
 * @param {String} widgetIdCaller
 * @param {String} functionName
 * @param {Object} result
 */
ozpIwc.owf7.participantModules.Kernel.prototype.onFunctionCallResult = function(widgetId, widgetIdCaller, functionName, result){
    this.dataApi.set(this.functionCallResultResource(widgetIdCaller),{
        entity: {
            'widgetId': widgetId, //NOTE swapping
            'widgetIdCaller': widgetIdCaller,
            'functionName': functionName,
            'result': result,
            'time': Date.now()// slap a timestamp on to trigger change always
        },
        lifespan: "ephemeral"
    });
};

/**
* Watches for other legacy widgets to try and make a function call.
* @method registerFunctionCallHandler
*/
ozpIwc.owf7.participantModules.Kernel.prototype.registerFunctionCallListener = function(){
    var self = this;
    this.dataApi.watch(this.functionCallResource(this.participant.instanceId),function(packet) {
        var widgetId = packet.entity.newValue.widgetId || "";
        var widgetIdCaller = packet.entity.newValue.widgetIdCaller || "";
        var functionName = packet.entity.newValue.functionName || "";
        var var_arg = packet.entity.newValue.var_arg || [];

        self.functionCallClient(widgetId,widgetIdCaller,functionName,var_arg);
    });
};

/**
* Watches for other legacy widgets to return a function call result.
* @method registerFunctionCallHandler
*/
ozpIwc.owf7.participantModules.Kernel.prototype.registerFunctionCallResultListener = function(){
    var self = this;
    this.dataApi.watch(this.functionCallResultResource(this.participant.instanceId), function(packet) {
        var widgetId = packet.entity.newValue.widgetId || "";
        var widgetIdCaller = packet.entity.newValue.widgetIdCaller || "";
        var functionName = packet.entity.newValue.functionName || "";
        var result = packet.entity.newValue.result || {};

        self.functionCallResultClient(widgetId,widgetIdCaller,functionName,result);
    });
};

/**
 * Gathers a list of current active legacy widget GUIDs from the IWC data.api.
 * @method onListWidgets
 * @param {Object} rpc
 */
ozpIwc.owf7.participantModules.Kernel.prototype.onListWidgets = function(rpc){
    var self = this;
    this.dataApi.list(this.listWidgetChannel).then(function(reply){
        var widgets = [];
        var widgetCount = reply.entity.length || 0;
        var handleWidgetData = function(resp){
            if(resp.entity && resp.entity.id) {
                widgets.push(resp.entity);
            }
            if (--widgetCount <= 0) {
                rpc.callback(widgets);
            }
        };

        for(var i in reply.entity){
            self.dataApi.get(reply.entity[i]).then(handleWidgetData);
        }
    });
};

/**
 * Forwards RPC call DIRECT_MESSAGE on IWC Bus.
 * @method onDirectMessage
 * @param {String} widgetId
 * @param {Object} dataToSend
 */
ozpIwc.owf7.participantModules.Kernel.prototype.onDirectMessage = function(widgetId, dataToSend){
    this.dataApi.set(this.directMessageResource(widgetId),{
        entity:{
            message: dataToSend,
            ts: ozpIwc.util.now()
        },
        lifespan: "ephemeral"
    });
};

/**
 * Watches for other legacy widgets to send a DIRECT_MESSAGE through the iwc.
 * @method registerDirectMessageListener
 */
ozpIwc.owf7.participantModules.Kernel.prototype.registerDirectMessageListener = function(){
    var self = this;
    this.dataApi.watch(this.directMessageResource(this.participant.instanceId), function(packet) {
        if(packet.entity && packet.entity.newValue && packet.entity.newValue.message) {
            var payload = packet.entity.newValue.message;
            self.directMessageClient(payload);
        }
    });
};

/**
 *  When receiving a direct message from another widget, this calls DIRECT_MESSAGE to route it to this legacy widget.
 * @method directMessageClient
 * @param {*} payload
 */
ozpIwc.owf7.participantModules.Kernel.prototype.directMessageClient = function(payload){
    gadgets.rpc.call(this.participant.rpcId, 'DIRECT_MESSAGEL_CLIENT', null, payload);
};

/**
 *  When receiving a add event call from the widget, this registers to pass any events onto the widget for the eventName.
 * @method onAddEvent
 * @param {String} widgetId
 * @param {String} eventName
 */
ozpIwc.owf7.participantModules.Kernel.prototype.onAddEvent = function(widgetId, eventName){
    var self = this;
    this.dataApi.watch(this.callEventResource(eventName), function(packet) {
        if(packet.entity && packet.entity.newValue && packet.entity.newValue.message) {
            self.eventClient(eventName,packet.entity.newValue.message);
        }
    });
};

/**
 * When receiving a event call  from another widget, this calls rpc EVENT_CLIENT to route it to this legacy widget.
 * @method eventCall
 * @param {String} eventName
 * @param {*} payload
 */
ozpIwc.owf7.participantModules.Kernel.prototype.eventClient = function(eventName,payload){
    gadgets.rpc.call(this.participant.rpcId, "EVENT_CLIENT", null, eventName, payload);
};

/**
 * Forwards RPC call CLIENT_EVENT on IWC Bus.
 * @method onCallEvent
 * @param {String} eventName
 * @param {*} payload
 */
ozpIwc.owf7.participantModules.Kernel.prototype.onCallEvent = function(eventName, payload){
    this.dataApi.set(this.callEventResource(eventName), {
        entity:{
            'message': payload,
            'ts': ozpIwc.util.now()
        },
        lifespan: "ephemeral"
    });
};
