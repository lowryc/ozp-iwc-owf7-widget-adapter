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
             * @param {ozpIwc.Owf7Participant} participant
             * @param {String} senderId
             * @param {Object} intent
             * @param {OBject} data
             * @param {String[]} destIds
             */
            '_intents': function(participant, senderId, intent, data, destIds){
                participant.intents.onIntents(senderId,intent,data,destIds,this);
            },
            /**
             * used by widgets to register an intent
             * @see js/intents/WidgetIntentsContainer.js:85 for reference
             * @param {ozpIwc.Owf7Participant} participant
             * @param {Object} intent
             * @param {String} destWidgetId
             */
            '_intents_receive': function(participant, intent, destWidgetId){
                participant.intents.onIntentsReceive(intent,destWidgetId);
            }
        }
    };
};