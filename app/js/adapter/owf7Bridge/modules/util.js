ozpIwc = ozpIwc || {};
ozpIwc.owf7BridgeModules = ozpIwc.owf7BridgeModules  || {};

ozpIwc.owf7BridgeModules.util = function(listener){
    if(!listener) { throw "Needs to have an Owf7ParticipantListener";}
    return {
        'util': {
            /**
             * @param {ozpIwc.Owf7Participant} participant
             * @param {*} msg
             */
            'Ozone.log': function(participant,msg) {
                participant.util.onOzoneLog(msg);
            }
        }
    };
};