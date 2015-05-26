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
                 * @param {ozpIwc.Owf7Participant} participant
                 */
                '_widget_iframe_ready': function (participant) {

                }
            },
            'widget': {
                /**
                 *  Launcher API
                 *  The handling of the rpc event is in WidgetLauncherContainer
                 *  @see js/launcher/WidgetLauncherContainer.js:22, 36
                 *  msg: {
                 *    universalName: 'universal name of widget to launch',  //universalName or guid maybe identify the widget to be launched
                 *    guid: 'guid of widget to launch',
                 *    title: 'title to replace the widgets title' the title will only be changed if the widget is opened.
                 *    titleRegex: optional regex used to replace the previous title with the new value of title
                 *    launchOnlyIfClosed: true, //if true will only launch the widget if it is not already opened.
                 *                              //if it is opened then the widget will be restored
                 *    data: dataString  //initial launch config data to be passed to a widget only if the widget is opened.  this must be a string
                 *  });
                 *  The steps to launch a widget are defined in dashboard.launchWidgetInstance
                 *  @see js/components/dashboard/Dashboard.js:427
                 *  The "iframe properties" come from Dashboard.onBeforeWidgetLaunch
                 *  @see js/components/dashboard/Dashboard.js:318
                 *  @see js\eventing\Container.js:237 for getIframeProperties()
                 * @see js\components\widget\WidgetIframeComponent.js:15
                 * @param {ozpIwc.Owf7Participant} participant
                 * @param {String} sender
                 * @param {String} msg
                 */
                '_WIDGET_LAUNCHER_CHANNEL': function (participant, sender, msg) {
                    participant.components.onLaunchWidget(sender, msg, this);
                }
            }

        }
    };
};