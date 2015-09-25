var ozpIwc = ozpIwc || {};
ozpIwc.owf7 = ozpIwc.owf7 || {};
ozpIwc.owf7.bridgeModules = ozpIwc.owf7.bridgeModules || {};

ozpIwc.owf7.bridgeModules.util = function(listener){
    if(!listener) { throw "Needs to have an owf7 ParticipantListener";}
    return {
        'util': {
            /**
             * @param {ozpIwc.owf7.Participant} participant
             * @param {*} msg
             */
            'Ozone.log': function(participant,msg) {
                participant.util.onOzoneLog(msg);
            }
        }
    };
};