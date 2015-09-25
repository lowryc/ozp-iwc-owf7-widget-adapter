var ozpIwc = ozpIwc || {};
ozpIwc.owf7 = ozpIwc.owf7 || {};
ozpIwc.owf7.participantModules = ozpIwc.owf7.participantModules || {};

/**
 * An Eventing module for the owf7Participant. Retains knowledge of pubsub subscriptions.
 * @namespace ozpIwc.owf7.participantModules
 * @class Eventing
 * @param {ozpIwc.owf7.Participant} participant
 * @param {ozpIwc.owf7.participantModules.Dd} participant.dd
 * @constructor
 */
ozpIwc.owf7.participantModules.Eventing = function(participant){
    if(!participant) { throw "Needs to have an OWF7Participant";}
    /**
     * @property participant
     * @type {ozpIwc.owf7.Participant}
     */
    this.participant = participant;
    this.participant.dd = this.participant.dd || {};

    /**
     * A shorthand for data api access through the participant.
     * @property dataApi
     * @type {Object}
     */
    this.dataApi = this.participant.client.data();

    /**
     * A store of done functions for api callbacks grouped by channel.
     * @property subscriptions
     * @type {Object}
     */
    this.subscriptions = {};
};

/**
 * Returns the IWC data.api resource path for the given pubsub channel.
 * @method pubsubChannel
 * @param {String} channel
 * @returns {String}
 */
ozpIwc.owf7.participantModules.Eventing.pubsubChannel=function(channel) {
    return "/owf-legacy/eventing/"+channel;
};

/**
 * Handles owf7 RPC messages on channel "container_init".
 * @method onContainerInit
 * @param {String} sender
 * @param {String} message
 */
ozpIwc.owf7.participantModules.Eventing.prototype.onContainerInit=function(sender,message) {
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
ozpIwc.owf7.participantModules.Eventing.prototype.onPubsub = function(command,channel,message,dest,sender){
    switch (command) {
        case 'publish':
            this.onPublish(command, channel, message, dest, sender);
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
ozpIwc.owf7.participantModules.Eventing.prototype.onPublish=function(command, channel, message, dest, sender) {
    if(this.participant.dd["hookPublish"+channel] && !this.participant.dd["hookPublish"+channel].call(this.participant.dd,message)) {
        return;
    }
    this.dataApi.set(ozpIwc.owf7.participantModules.Eventing.pubsubChannel(channel),{
        "entity": {
            "message": message,
            "sender": sender
        },
        "lifespan": "ephemeral"
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
ozpIwc.owf7.participantModules.Eventing.prototype.onSubscribe=function(command, channel, message, dest) {
    this.subscriptions[channel]=this.subscriptions[channel] || {};

    var self = this;

    this.dataApi.watch(ozpIwc.owf7.participantModules.Eventing.pubsubChannel(channel),{"lifespan": "ephemeral"},
        function(packet,done) {
            //Add the msgId to a list of handlers to unregister should unsubscribe be fired.
            self.subscriptions[channel] = self.subscriptions[channel] || {};
            self.subscriptions[channel][packet.replyTo] = done;
            if(self.participant.dd["hookReceive"+channel] &&
                !self.participant.dd["hookReceive"+channel].call(self.participant.dd,packet.entity.newValue)) {
                return;
            }

            // from shindig/pubsub_router.js:77
            //gadgets.rpc.call(subscriber, 'pubsub', null, channel, sender, message);
            gadgets.rpc.call(self.participant.rpcId, 'pubsub', null, channel, packet.entity.newValue.sender,
                packet.entity.newValue.message);
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
ozpIwc.owf7.participantModules.Eventing.prototype.onUnsubscribe=function(command, channel, message, dest) {
    this.subscriptions[channel] = this.subscriptions[channel] || [];
    //itterate over all the done flags and cancel the callbacks.
    for(var i in this.subscriptions[channel]) {
        this.subscriptions[channel][i]();
    }
};
