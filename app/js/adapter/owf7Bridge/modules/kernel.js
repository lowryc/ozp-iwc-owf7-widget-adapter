var ozpIwc = ozpIwc || {};
ozpIwc.owf7 = ozpIwc.owf7 || {};
ozpIwc.owf7.bridgeModules = ozpIwc.owf7.bridgeModules || {};

/**
 * A Factory function for the owf7 'kernel' rpc handlers.
 * @namespace ozpIwc.owf7.bridgeModules
 * @method kernel
 * @param {Object} listener The listener to generate the functions for.
 * @returns {Object}
 */
ozpIwc.owf7.bridgeModules.kernel = function(listener){
    if(!listener) { throw "Needs to have an owf7 ParticipantListener";}
    return {
        'kernel': {
            /**
             * @see js/kernel/kernel-rpc-base.js:147
             * @param {ozpIwc.owf7.Participant} participant
             * @param widgetId
             * @param srcWidgetId
             * @returns {boolean}
             */
            '_getWidgetReady': function (participant, widgetId, srcWidgetId) {
                participant.kernel.onGetWidgetReady(widgetId,this);
            },
            /**
             * @see reference/js/kernel/kernel-rpc-base.js:130
             * @param {ozpIwc.owf7.Participant} participant
             * @param widgetId
             */
            '_widgetReady': function(participant, widgetId){
                participant.kernel.onWidgetReady(widgetId);
            },
            /**
             * @see js/kernel/kernel-rpc-base.js:124
             owf7.Participant             * @param {String} iframeId
             * @param {String[]} functions
             */
            'register_functions': function (participant, iframeId, functions) {
                participant.kernel.onRegisterFunctions(iframeId,functions);

            },
            /**
             * @see js/kernel/kernel-rpc-base.js:88
             * @param {ozpIwc.owf7.Participant} participant
             * @param {String} widgetID
             * @param {String} sourceWidgetId
             * @returns {*}
             */
            'GET_FUNCTIONS': function (participant, widgetID, sourceWidgetId) {
                participant.kernel.onGetFunctions(widgetID, sourceWidgetId,this);
            },

            /**
             * @param {ozpIwc.owf7.Participant} participant
             * @param {String} widgetId
             * @param {String} widgetIdCaller
             * @param {String} functionName
             * @param {Array} var_args
             */
            'FUNCTION_CALL': function(participant, widgetId, widgetIdCaller, functionName, var_args){
                participant.kernel.onFunctionCall(widgetId, widgetIdCaller, functionName, var_args);
            },

            /**
             * @param {ozpIwc.owf7.Participant} participant
             * @param {String} widgetId
             * @param {String} widgetIdCaller
             * @param {String} functionName
             * @param {String} result
             */
            'FUNCTION_CALL_RESULT': function(participant, widgetId, widgetIdCaller, functionName, result){
                participant.kernel.onFunctionCallResult(widgetId, widgetIdCaller, functionName, result);
            },

            /**
             * @see js/kernel/kernel-container.js:204
             * @param {ozpIwc.owf7.Participant} participant
             * @returns {String[]}
             */
            'LIST_WIDGETS': function (participant) {
                participant.kernel.onListWidgets(this);
            },

            /**
             * @see js/
             * @param {ozpIwc.owf7.Participant}participant
             * @param {String} widgetId
             * @param {*} dataToSend
             */
            'DIRECT_MESSAGE': function (participant, widgetId, dataToSend) {
                participant.kernel.onDirectMessage(widgetId, dataToSend);
            },

            /**
             * @param {ozpIwc.owf7.Participant} participant
             * @param {String} widgetId
             * @param {String} eventName
             */
            'ADD_EVENT': function (participant, widgetId, eventName) {
                participant.kernel.onAddEvent(widgetId, eventName);
            },

            /**
             * @param {ozpIwc.owf7.Participant} participant
             * @param {String} eventName
             * @param {*} payload
             */
            'CALL_EVENT': function (participant, eventName, payload) {
                participant.kernel.onCallEvent(eventName, payload);
            }
        }
    };
};