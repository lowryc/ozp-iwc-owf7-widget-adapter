ozpIwc = ozpIwc || {};
ozpIwc.owf7BridgeModules = ozpIwc.owf7BridgeModules  || {};

/**
 * A Factory function for the owf7 'drag and drop' rpc handlers.
 * @namespace ozpIwc.owf7BridgeModules
 * @method dd
 * @param {Object} listener The listener to generate the functions for.
 * @returns {Object}
 */
ozpIwc.owf7BridgeModules.dd = function(listener){
    if(!listener) { throw "Needs to have an Owf7ParticipantListener";}
    return {
        'dd': {
            /**
             * _fake_mouse_move is needed for drag and drop.  The container code is at
             * @see reference\js\dd\WidgetDragAndDropContainer.js:52
             * @param msg
             */
            '_fake_mouse_move': function (msg) {
                listener.getParticipant(this.f).dd.onFakeMouseMoveFromClient(msg);
            },
            /**
             * @see reference\js\dd\WidgetDragAndDropContainer.js:52
             * @param msg
             */
            '_fake_mouse_up': function (msg) {
                listener.getParticipant(this.f).dd.onFakeMouseUpFromClient(msg);
            },
            '_fake_mouse_out': function () {
                /*ignored*/
            }
        }
    };
};