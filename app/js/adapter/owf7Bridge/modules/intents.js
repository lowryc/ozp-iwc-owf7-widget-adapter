ozpIwc = ozpIwc || {};
ozpIwc.owf7BridgeModules = ozpIwc.owf7BridgeModules  || {};

/**
 * A Factory function for the owf7 'intents' rpc handlers.
 * @namespace ozpIwc.owf7BridgeModules
 * @method intents
 * @param {Object} listener The listener to generate the functions for.
 * @returns {Object}
 */
ozpIwc.owf7BridgeModules.intents = function(listener){
    if(!listener) { throw "Needs to have an Owf7ParticipantListener";}
    return {
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
                listener.getParticipant(this.f).intents.onIntents(senderId,intent,data,destIds);
            },
            /**
             * used by widgets to register an intent
             * @see js/intents/WidgetIntentsContainer.js:85 for reference
             * @param intent
             * @param destWidgetId
             */
            '_intents_receive': function(intent, destWidgetId){
                listener.getParticipant(this.f).intents.onIntentsReceive(intent,destWidgetId);
            }
        }
    };
};