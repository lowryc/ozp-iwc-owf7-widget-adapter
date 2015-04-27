ozpIwc = ozpIwc || {};
ozpIwc.owf7BridgeModules = ozpIwc.owf7BridgeModules  || {};

/**
 * A Factory function for the owf7 'components' rpc handlers.
 * @namespace ozpIwc.owf7BridgeModules
 * @method components
 * @param {Object} listener The listener to generate the functions for.
 * @returns {Object}
 */
ozpIwc.owf7BridgeModules.components = function(listener){
    if(!listener) { throw "Needs to have an Owf7ParticipantListener";}
    return {
        'components': {
            'keys': {
                /**
                 * @see reference/js/components/keys/KeyEventing.js
                 */
                '_widget_iframe_ready': function () {
                }
            },
            'widget': {
                /**
                 * @see js\components\widget\WidgetIframeComponent.js:15
                 * @param sender
                 * @param msg
                 */
                '_WIDGET_LAUNCHER_CHANNEL': function (sender, msg) {
                    listener.getParticipant(this.f).components.onLaunchWidget(sender, msg, this);
                }
            }

        }
    };
};