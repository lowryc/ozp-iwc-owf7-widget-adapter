var ozpIwc = ozpIwc || {};
ozpIwc.owf7 = ozpIwc.owf7 || {};
ozpIwc.owf7.participantModules = ozpIwc.owf7.participantModules || {};

ozpIwc.owf7.participantModules.Util = (function(Eventing){
    /**
     * An Util module for the owf7 Participant.
     * @namespace ozpIwc.owf7.participantModules
     * @class Components
     * @param {ozpIwc.owf7.Participant} participant
     * @constructor
     */
    var Util = function(participant){
        if(!participant) { throw "Needs to have an Owf7 Participant";}

        /**
         * @property participant
         * @type {ozpIwc.owf7.Participant}
         */
        this.participant = participant;

        /**
         * A shorthand for data api access through the participant.
         * @property systemApi
         * @type {Object}
         */
        this.dataApi = this.participant.client.data();

        this.registerLogging();
    };


    /**
     * Watch registrations for Ozone.log data.
     * @method registerUtils
     */
    Util.prototype.registerLogging = function(){
        this.dataApi.watch(Eventing.pubsubChannel("Ozone.log"),function(response){
            var msg = response.entity.newValue.message;
            gadgets.rpc.call('..',"Ozone.log",null,msg);
            ozpIwc.log.debug("[Legacy]",msg);
        });
    };

    /**
     * Handler for the RPC channel "Ozone.log".
     * Passes the log message on to other legacy widgets
     * @method onOzoneLog
     * @param {*} msg
     */
    Util.prototype.onOzoneLog=function(msg) {
        this.dataApi.set(Eventing.pubsubChannel("Ozone.log"), {
            entity: {
                message: msg,
                ts: ozpIwc.util.now() // to make every packet trigger "changed"
            },
            lifespan: "ephemeral"
        });
    };

    return Util;
}(ozpIwc.owf7.participantModules.Eventing));
