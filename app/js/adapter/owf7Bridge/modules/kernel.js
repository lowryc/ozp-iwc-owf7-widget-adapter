ozpIwc = ozpIwc || {};
ozpIwc.owf7BridgeModules = ozpIwc.owf7BridgeModules  || {};

/**
 * A Factory function for the owf7 'kernel' rpc handlers.
 * @namespace ozpIwc.owf7BridgeModules
 * @method kernel
 * @param {Object} listener The listener to generate the functions for.
 * @returns {Object}
 */
ozpIwc.owf7BridgeModules.kernel = function(listener){
    if(!listener) { throw "Needs to have an Owf7ParticipantListener";}
    return {
        'kernel': {
            /**
             * @see js/kernel/kernel-rpc-base.js:147
             * @param widgetId
             * @param srcWidgetId
             * @returns {boolean}
             */
            '_getWidgetReady': function (widgetId, srcWidgetId) {
                listener.getParticipant(this.f).kernel.onGetWidgetReady(widgetId,this);
            },
            /**
             * @see reference/js/kernel/kernel-rpc-base.js:130
             * @param widgetId
             */
            '_widgetReady': function(widgetId){
                listener.getParticipant(this.f).kernel.onWidgetReady(widgetId);
            },
            /**
             * @see js/kernel/kernel-rpc-base.js:124
             * @param iframeId
             * @param functions
             */
            'register_functions': function (iframeId, functions) {
                listener.getParticipant(this.f).kernel.onRegisterFunctions(iframeId,functions);

            },
            /**
             * @see js/kernel/kernel-rpc-base.js:88
             * @param widgetID
             * @param sourceWidgetId
             * @returns {*}
             */
            'GET_FUNCTIONS': function (widgetID, sourceWidgetId) {
                listener.getParticipant(this.f).kernel.onGetFunctions(widgetID, sourceWidgetId,this);
            },

            'FUNCTION_CALL': function(widgetId, widgetIdCaller, functionName, var_args){
                listener.getParticipant(this.f).kernel.onFunctionCall(widgetId, widgetIdCaller, functionName, var_args);
            },

            'FUNCTION_CALL_RESULT': function(widgetId, widgetIdCaller, functionName, result){
                listener.getParticipant(this.f).kernel.onFunctionCallResult(widgetId, widgetIdCaller, functionName, result);
            },
            /**
             * @see js/kernel/kernel-container.js:204
             * @returns {Array}
             */
            'LIST_WIDGETS': function () {
                listener.getParticipant(this.f).kernel.onListWidgets(this);
            }
        }
    };
};