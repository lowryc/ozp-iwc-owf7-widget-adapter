ozpIwc = ozpIwc || {};
ozpIwc.owf7BridgeModules = ozpIwc.owf7BridgeModules  || {};

/**
 * A Factory function for the owf7 'eventing' rpc handlers.
 * @namespace ozpIwc.owf7BridgeModules
 * @method eventing
 * @param {Object} listener The listener to generate the functions for.
 * @returns {Object}
 */
ozpIwc.owf7BridgeModules.eventing = function(listener){
    if(!listener) { throw "Needs to have an Owf7ParticipantListener";}
    return {
        'eventing': {
            /**
             * Called by the widget to connect to the container
             * @see js/eventing/Container.js:26 for the containerInit function that much of this is copied from
             * @see js/eventing/Container.js:104 for the actual rpc.register
             * @property container_init
             */
            'container_init': function (sender, message) {
                listener.getParticipant(this.f).eventing.onContainerInit(sender, message);
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
                listener.getParticipant(this.f).eventing.onPubsub(command,channel,message,dest);
            }
        }
    };
};