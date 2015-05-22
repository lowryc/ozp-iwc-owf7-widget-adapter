ozpIwc = ozpIwc || {};
ozpIwc.owf7ParticipantModules = ozpIwc.owf7ParticipantModules || {};

/**
 * A Kernel module for the owf7Participant.
 * @class Kernel
 * @namespace ozpIwc.owf7ParticipantModules
 * @param {ozpIwc.Owf7Participant} participant
 * @constructor
 */
ozpIwc.owf7ParticipantModules.Kernel = function(participant){
    if(!participant) { throw "Needs to have an Owf7Participant";}

    /**
     * @property participant
     * @type {ozpIwc.Owf7Participant}
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
};

/**
 * IWC data.api resource path where all active legacy widget GUIDs are reported.
 * @property listWidgetChannel
 * @type {String}
 */
ozpIwc.owf7ParticipantModules.Kernel.prototype.listWidgetChannel = "/owf-legacy/kernel/_list_widgets";

/**
 * IWC data.api resource path prefix for any proxy related messaging
 * @property listWidgetChannel
 * @type {String}
 */
ozpIwc.owf7ParticipantModules.Kernel.prototype.widgetProxyChannelPrefix = "/owf-legacy/kernel/proxy/";

/**
 * Returns the IWC Data.api resource path for the given widget's _widgetReady event.
 * @method widgetReadyResource
 * @param {String} widgetId
 * @returns {String}
 */
ozpIwc.owf7ParticipantModules.Kernel.prototype.widgetReadyResource = function(widgetId){
    return this.widgetProxyChannelPrefix + widgetId + "/_widgetReady";
};

/**
 * Returns the IWC Data.api resource path for the given widget's FUNCTION_CALL_CLIENT event.
 * @method functionCallResource
 * @param {String} widgetId
 * @returns {String}
 */
ozpIwc.owf7ParticipantModules.Kernel.prototype.functionCallResource = function(widgetId){
    return this.widgetProxyChannelPrefix + widgetId + "/FUNCTION_CALL_CLIENT";
};

/**
 * Returns the IWC Data.api resource path for the given widget's FUNCTION_CALL_RESULT_CLIENT event.
 * @method functionCallResultResource
 * @param {String} widgetId
 * @returns {String}
 */
ozpIwc.owf7ParticipantModules.Kernel.prototype.functionCallResultResource = function(widgetId){
    return this.widgetProxyChannelPrefix + widgetId + "/FUNCTION_CALL_RESULT_CLIENT";
};


/**
 * Register's a listener for the given widget's _widgetReady event.
 * @method functionCallResultResource
 * @param {String} widgetId
 * @returns {String}
 */
ozpIwc.owf7ParticipantModules.Kernel.prototype.registerWidgetReadyListener = function(){
    var self = this;
    var unregisterFn;
    this.dataApi.watch(this.widgetReadyResource(this.participant.instanceId),function(packet,done) {
        unregisterFn = done;
        self.onWidgetReady(self.participant.instanceId);
    });
    return unregisterFn;
};

/**
 * Updates the IWC's data.api resource specified by listWidgetChannel with this widget's GUID.
 * Registers a beforeunload event to remove the GUID on closing.
 *
 * @method registerWidgetListing
 */
ozpIwc.owf7ParticipantModules.Kernel.prototype.registerWidgetListing = function() {
    var self = this;

    window.addEventListener("beforeunload",function(){
        self.unregisterWidgetListing();
    });

    this.dataApi.addChild(this.listWidgetChannel,{
        entity: gadgets.json.parse(this.participant.rpcId)
    }).then(function(reply){
        self.widgetListing = reply.entity.resource;
    });
};

/**
 * Updates the IWC's data.api resource specified by listWidgetChannel by removing this widget's GUID.
 * @method unregisterWidgetListing
 */
ozpIwc.owf7ParticipantModules.Kernel.prototype.unregisterWidgetListing = function() {
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
ozpIwc.owf7ParticipantModules.Kernel.prototype.onGetWidgetReady = function(widgetId,rpc){
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
        });
    }
};

/**
 * A handler for the _widgetReady event.
 * @method onWidgetReady
 * @param {String} widgetId
 */
ozpIwc.owf7ParticipantModules.Kernel.prototype.onWidgetReady = function(widgetId){
    this.widgetReadyMap[widgetId] = true;
    this.dataApi.set(this.widgetReadyResource(widgetId),{
        entity: this.widgetReadyMap[widgetId]
    });

    //loop through any widgets that have reference to widgetId and send messages that widgetId widget is ready
    var proxyHolders = this.proxyMap[widgetId];
    if (proxyHolders) {
        for (var i = 0, len = proxyHolders.length; i < len; i++) {
            var proxyHolder = proxyHolders[i];
            if (proxyHolder) {
                this.dataApi.set(this.widgetReadyResource(proxyHolder),{
                    entity: true
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
ozpIwc.owf7ParticipantModules.Kernel.prototype.onRegisterFunctions = function(iframeId, functions){
    var widgetID = JSON.parse(iframeId).id;
    var self = this;

    this.dataApi.get(this.widgetProxyChannelPrefix + widgetID).then(function(reply){
        var functionArray = Array.isArray(reply.entity) ? reply.entity : [];
        for(var j in functions){
            if(functionArray.indexOf(functions[j]) < 0){
                functionArray.push(functions[j]);
            }
        }

        self.dataApi.set(self.widgetProxyChannelPrefix + widgetID,{
            entity: functionArray
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
ozpIwc.owf7ParticipantModules.Kernel.prototype.onGetFunctions = function(widgetId, sourceWidgetId, rpc){
    var self = this;
    this.dataApi.get(this.widgetProxyChannelPrefix + widgetId).then(function(reply){

        //save the fact that the sourceWidgetId has a proxy of the widgetId
        if (!self.proxyMap[widgetId]) {
            self.proxyMap[widgetId] = [];
        }
        if (sourceWidgetId) {
            self.proxyMap[widgetId].push(sourceWidgetId);
        }

        rpc.callback(reply.entity);
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
ozpIwc.owf7ParticipantModules.Kernel.prototype.onFunctionCall = function(widgetId, widgetIdCaller, functionName, var_args){
    this.dataApi.set(this.functionCallResource(widgetId),{
        entity: {
            'widgetId': widgetId,
            'widgetIdCaller': widgetIdCaller,
            'functionName': functionName,
            'var_arg': var_args,
            'time': Date.now()  // slap a timestamp on to trigger change always
        }
    });
};

/**
 * When receiving a function call from another widget call FUNCTION_CALL_CLIENT to route it to this legacy widget.
 * @method onFunctionCallClient
 * @param {String} widgetId
 * @param {String} widgetIdCaller
 * @param {String} functionName
 * @param {Array} var_args
 */
ozpIwc.owf7ParticipantModules.Kernel.prototype.onFunctionCallClient = function(widgetId, widgetIdCaller, functionName, var_args){
    gadgets.rpc.call(this.participant.rpcId, 'FUNCTION_CALL_CLIENT', null, widgetId, widgetIdCaller, functionName, var_args);
};

/**
*  When receiving a function call from another widget call FUNCTION_CALL_CLIENT to route it to this legacy widget.
* @method onFunctionCallResultClient
* @param {String} widgetId
* @param {String} widgetIdCaller
* @param {String} functionName
* @param {String} result
*/
ozpIwc.owf7ParticipantModules.Kernel.prototype.onFunctionCallResultClient = function(widgetId, widgetIdCaller, functionName, result){
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
ozpIwc.owf7ParticipantModules.Kernel.prototype.onFunctionCallResult = function(widgetId, widgetIdCaller, functionName, result){
    this.dataApi.set(this.functionCallResultResource(widgetIdCaller),{
        entity: {
            'widgetId': widgetId, //NOTE swapping
            'widgetIdCaller': widgetIdCaller,
            'functionName': functionName,
            'result': result,
            'time': Date.now()// slap a timestamp on to trigger change always
        }
    });
};

/**
* Watches for other legacy widgets to try and make a function call.
* @method registerFunctionCallHandler
*/
ozpIwc.owf7ParticipantModules.Kernel.prototype.registerFunctionCallListener = function(){
    var self = this;
    var unregisterFn;
    this.dataApi.watch(this.functionCallResource(this.participant.instanceId),function(packet,done) {
        unregisterFn = done;
        var widgetId = packet.entity.newValue.widgetId || "";
        var widgetIdCaller = packet.entity.newValue.widgetIdCaller || "";
        var functionName = packet.entity.newValue.functionName || "";
        var var_arg = packet.entity.newValue.var_arg || [];

        self.onFunctionCallClient(widgetId,widgetIdCaller,functionName,var_arg);
    });
    return unregisterFn;
};

/**
* Watches for other legacy widgets to return a function call result.
* @method registerFunctionCallHandler
*/
ozpIwc.owf7ParticipantModules.Kernel.prototype.registerFunctionCallResultListener = function(){
    var self = this;
    var unregisterFn;
    this.dataApi.watch(this.functionCallResultResource(this.participant.instanceId), function(packet,done) {
        unregisterFn = done;
        var widgetId = packet.entity.newValue.widgetId || "";
        var widgetIdCaller = packet.entity.newValue.widgetIdCaller || "";
        var functionName = packet.entity.newValue.functionName || "";
        var result = packet.entity.newValue.result || {};

        self.onFunctionCallResultClient(widgetId,widgetIdCaller,functionName,result);
    });
    return unregisterFn;
};

/**
 * Gathers a list of current active legacy widget GUIDs from the IWC data.api.
 * @method onListWidgets
 * @param {Object} rpc
 */
ozpIwc.owf7ParticipantModules.Kernel.prototype.onListWidgets = function(rpc){
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