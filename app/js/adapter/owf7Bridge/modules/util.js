ozpIwc = ozpIwc || {};
ozpIwc.owf7BridgeModules = ozpIwc.owf7BridgeModules  || {};

ozpIwc.owf7BridgeModules.util = function(listener){
    if(!listener) { throw "Needs to have an Owf7ParticipantListener";}
    return {
        'util': {
            'Ozone.log': function() {
                //@TODO
            }
        }
    };
};