var ozpIwc = ozpIwc || {};
ozpIwc.owf7 = ozpIwc.owf7 || {};
ozpIwc.owf7.participantModules = ozpIwc.owf7.participantModules || {};

ozpIwc.owf7.participantModules.Components = (function(){
    /**
     * A Components module for the owf7Participant.
     * @namespace ozpIwc.owf7.participantModules
     * @class Components
     * @param {ozpIwc.owf7.Participant} participant
     * @constructor
     */
    var Components = function(participant){
        if(!participant) { throw "Needs to have an Owf7Participant";}

        /**
         * @property participant
         * @type {ozpIwc.owf7.Participant}
         */
        this.participant = participant;

        /**
         * A shorthand for system api access through the participant.
         * @property systemApi
         * @type {Object}
         */
        this.systemApi = this.participant.client.system();
    };

    /**
     * Handler for the RPC channel "_WIDGET_LAUNCHER_CHANNEL".
     * Launches legacy widgets using the IWC's system.api launch capabilities.
     * @method onLaunchWidget
     * @param {String} sender
     * @param {String} msg
     * @param {Object} rpc
     */
    Components.prototype.onLaunchWidget=function(sender,msg,rpc) {
        msg=JSON.parse(msg);
        // Allow launching by the widget's universal name or by the guid
        var launchKey = msg.universalName || ms.guid;
        // ignore title, titleRegex, and launchOnlyIfClosed
        this.systemApi.launch("/application/" + launchKey,{
            contentType: "text/plain",
            entity: msg.data
        }).then(function(reply) {
            //If the rpc call has a callback.
            if(rpc.callback) {
                rpc.callback({
                    error: false,
                    newWidgetLaunched: true,
                    uniqueId: "unknown,not supported yet"
                });
            }
        }).catch(function(err){
            //If the rpc call has a callback.
            if(rpc.callback) {
                rpc.callback({
                    error: true,
                    newWidgetLaunched: false,
                    uniqueId: "unknown,not supported yet"
                });
            }
        });
    };

    return Components;
}());
