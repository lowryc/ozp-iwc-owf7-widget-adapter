ozpIwc = ozpIwc || {};
ozpIwc.owf7ParticipantModules = ozpIwc.owf7ParticipantModules || {};

/**
 * An Eventing module for the owf7Participant. Retains knowledge of pubsub subscriptions.
 * @namespace ozpIwc.owf7ParticipantModules
 * @class Eventing
 * @param {ozpIwc.Owf7Participant} participant
 * @param {ozpIwc.owf7ParticipantModules.Dd} participant.dd
 * @constructor
 */
ozpIwc.owf7ParticipantModules.Eventing = function(participant){
    if(!participant) { throw "Needs to have an OWF7Participant";}
    if(!participant.dd) { throw "Needs OWF7Participant module Dd.";}
    this.participant = participant;
    this.subscriptions = {};
};

/**
 * Returns the IWC data.api resource path for the given pubsub channel.
 * @method pubsubChannel
 * @param {String} channel
 * @returns {String}
 */
ozpIwc.owf7ParticipantModules.Eventing.pubsubChannel=function(channel) {
    return "/owf-legacy/eventing/"+channel;
};

/**
 * Handles owf7 RPC messages on channel "container_init".
 * @method onContainerInit
 * @param sender
 * @param message
 */
ozpIwc.owf7ParticipantModules.Eventing.prototype.onContainerInit=function(sender,message) {
    // The container sends params, but the widget JS ignores them
    if ((window.name === "undefined") || (window.name === "")) {
        window.name = "ContainerWindowName" + Math.random();
    }
    var initMessage = gadgets.json.parse(message);
    var useMultiPartMessagesForIFPC = initMessage.useMultiPartMessagesForIFPC;
    var idString = this.participant.rpcId;

    gadgets.rpc.setRelayUrl(idString, initMessage.relayUrl, false, useMultiPartMessagesForIFPC);
    gadgets.rpc.setAuthToken(idString, 0);
    var jsonString = '{\"id\":\"' + window.name + '\"}';
    gadgets.rpc.call(idString, 'after_container_init', null, window.name, jsonString);
};

/**
 * Handles owf7 RPC messages on channel "pubsub".
 * @method onPubsub
 * @param {String} command
 * @param {String} channel
 * @param {String} message
 * @param {String} dest
 */
ozpIwc.owf7ParticipantModules.Eventing.prototype.onPubsub = function(command,channel,message,dest){
    switch (command) {
        case 'publish':
            this.onPublish(command, channel, message, dest);
            break;
        case 'subscribe':
            this.onSubscribe(command, channel, message, dest);
            break;
        case 'unsubscribe':
            this.onUnsubscribe(command, channel, message, dest);
            break;
    }
};

/**
 * Handles owf7 pubsub publish commands.
 * @method onPublish
 * @param {String} command
 * @param {String} channel
 * @param {String} message
 * @param {String} dest
 */
ozpIwc.owf7ParticipantModules.Eventing.prototype.onPublish=function(command, channel, message, dest) {
    if(this.participant.dd["hookPublish"+channel] && !this.participant.dd["hookPublish"+channel].call(this.participant.dd,message)) {
        return;
    }
    this.participant.client.send({
        "dst": "data.api",
        "resource": ozpIwc.owf7ParticipantModules.Eventing.pubsubChannel(channel),
        "action": "set",
        "entity": message
    });
};

/**
 * Handles owf7 pubsub subscribe commands.
 * @method onSubscribe
 * @param {String} command
 * @param {String} channel
 * @param {String} message
 * @param {String} dest
 */
ozpIwc.owf7ParticipantModules.Eventing.prototype.onSubscribe=function(command, channel, message, dest) {
    this.subscriptions[channel]=true;

    var self = this;
    this.participant.client.send({
        "dst": "data.api",
        "resource": ozpIwc.owf7ParticipantModules.Eventing.pubsubChannel(channel),
        "action": "watch"
    },function(packet,done) {
        if(packet.response !== "changed") {
            return;
        }

        if(self.participant.dd["hookReceive"+channel] && !self.participant.dd["hookReceive"+channel].call(self.participant.dd,packet.entity.newValue)) {
            return;
        }
        if(self.subscriptions[channel]) {
            // from shindig/pubsub_router.js:77
            //gadgets.rpc.call(subscriber, 'pubsub', null, channel, sender, message);
            gadgets.rpc.call(self.participant.rpcId, 'pubsub', null, channel, null, packet.entity.newValue);
        }else {
            done();
        }
    });
};

/**
 * Handles owf7 pubsub unsubscribe commands.
 * @method onUnsubscribe
 * @param {String} command
 * @param {String} channel
 * @param {String} message
 * @param {String} dest
 */
ozpIwc.owf7ParticipantModules.Eventing.prototype.onUnsubscribe=function(command, channel, message, dest) {
    this.subscriptions[channel]=false;
};