var ozpIwc = ozpIwc || {};
ozpIwc.owf7 = ozpIwc.owf7 || {};
ozpIwc.owf7.bridgeModules = ozpIwc.owf7.bridgeModules || {};

/**
 * A Factory function for the owf7 'drag and drop' rpc handlers.
 * @namespace ozpIwc.owf7.bridgeModules
 * @method dd
 * @param {Object} listener The listener to generate the functions for.
 * @returns {Object}
 */
ozpIwc.owf7.bridgeModules.dd = function(listener){
    if(!listener) { throw "Needs to have an owf7 ParticipantListener";}
    return {
        'dd': {
            /**
             * _fake_mouse_move is needed for drag and drop.  The container code is at
             * @see reference\js\dd\WidgetDragAndDropContainer.js:52
             * @param {ozpIwc.owf7.Participant} participant
             * @param {Object} msg
             */
            '_fake_mouse_move': function (participant, msg) {
                ozpIwc.log.info(msg);
                participant.dd.onFakeMouseMoveFromClient(msg);
            },
            /**
             * @see reference\js\dd\WidgetDragAndDropContainer.js:52
             * @param {ozpIwc.owf7.Participant} participant
             * @param {Object} msg
             */
            '_fake_mouse_up': function (participant, msg) {
                participant.dd.onFakeMouseUpFromClient(msg);
            },
            '_fake_mouse_out': function (participant) {
                /*ignored*/
            }
        }
    };
};