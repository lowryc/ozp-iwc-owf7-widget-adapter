ozpIwc = ozpIwc || {};
ozpIwc.owf7ParticipantModules = ozpIwc.owf7ParticipantModules || {};

/**
 * An Intents module for the owf7Participant.
 * @namespace ozpIwc.owf7ParticipantModules
 * @class Intents
 * @param {ozpIwc.Owf7Participant} participant
 * @constructor
 */
ozpIwc.owf7ParticipantModules.Intents = function(participant){
    if(!participant) { throw "Needs to have an Owf7Participant";}

    /**
     * @property participant
     * @type {ozpIwc.Owf7Participant}
     */
    this.participant = participant;

    /**
     * A shorthand for intents api access through the participant.
     * @property dataApi
     * @type {Object}
     */
    this.intentsApi = this.participant.client.intents();
};


/**
 * Called when the owf7 widget invokes an intent.
 * @method onIntents
 * @param {String} senderId
 * @param {Object} intent
 * @param {Object} data
 * @param {String[]} destIds
 * @param {Object} rpc
 */
ozpIwc.owf7ParticipantModules.Intents.prototype.onIntents=function(senderId,intent,data,destIds,rpc){
    intent = intent || {};
    if(!intent.dataType) { throw "A legacy intent registration requires a dataType.";}
    if(!intent.action) { throw "A legacy intent registration requires an action.";}

    this.intentsApi.invoke('/' + intent.dataType + '/' + intent.action, {
        'entity': {
            entity: data,
            destIds: destIds,
            senderId: senderId
        }
    },function(resp){
        //@TODO
    });
};

/**
 * Called when the owf7 widget registers a handler for an intent.
 * @method onIntentsReceive
 * @param {Object} intent
 * @param {String} destWidgetId
 */
ozpIwc.owf7ParticipantModules.Intents.prototype.onIntentsReceive=function(intent,destWidgetId) {
    intent = intent || {};
    if(!intent.dataType) { throw "A legacy intent registration requires a dataType.";}
    if(!intent.action) { throw "A legacy intent registration requires an action.";}

    this.intentsApi.register('/' + intent.dataType + '/' + intent.action, {
        'entity': {
            'type': intent.dataType,
            'action': intent.action,
            'icon': this.participant.appData.icons.small || "about:blank",
            'label': this.participant.widgetParams.name || document.title
        }
    }, function (response) {
            var ifie = response.entity || {};
            var intent = response.intent || {};
            var entity = ifie.entity;
            var intentObj = {
                'action': intent.action,
                'dataType': intent.type
            };

            gadgets.rpc.call(destWidgetId, "_intents", null, entity.senderId, intentObj, entity.entity);
    });
};