ozpIwc = ozpIwc || {};
ozpIwc.owf7ParticipantModules = ozpIwc.owf7ParticipantModules || {};

/**
 * A Components module for the owf7Participant.
 * @namespace ozpIwc.owf7ParticipantModules
 * @class Components
 * @param participant
 * @constructor
 */
ozpIwc.owf7ParticipantModules.Components = function(participant){
    if(!participant) { throw "Needs to have an OWF7ParticipantListener";}
    this.participant = participant;
    this.subscriptions = {};
};

/**
 * Handler for the RPC channel "_WIDGET_LAUNCHER_CHANNEL".
 * Launches legacy widgets using the IWC's system.api launch capabilities.
 * @method onLaunchWidget
 * @param {String} sender
 * @param {String} msg
 * @param {Object} rpc
 */
ozpIwc.owf7ParticipantModules.Components.prototype.onLaunchWidget=function(sender,msg,rpc) {
    msg=JSON.parse(msg);
    // ignore title, titleRegex, and launchOnlyIfClosed
    this.participant.client.send({
        dst: "system.api",
        resource: "/application/" + msg.guid,
        action: "launch",
        contentType: "text/plain",
        entity: msg.data
    },function(reply,done) {
        //gadgets.rpc.call(rpc.f, '__cb', null, rpc.c, {
        rpc.callback({
            error: false,
            newWidgetLaunched: true,
            uniqueId: "unknown,not supported yet"
        });
        done();
    });
};