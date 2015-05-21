ozpIwc = ozpIwc || {};
ozpIwc.owf7ParticipantModules = ozpIwc.owf7ParticipantModules || {};

/**
 * An Intents module for the owf7Participant.
 * @namespace ozpIwc.owf7ParticipantModules
 * @class Intents
 * @param participant
 * @constructor
 */
ozpIwc.owf7ParticipantModules.Intents = function(participant){
    if(!participant) { throw "Needs to have an OWF7ParticipantListener";}
    this.participant = participant;
};


/**
 * @method onIntents
 * @param senderId
 * @param intent
 * @param data
 * @param destIds
 */
ozpIwc.owf7ParticipantModules.Intents.prototype.onIntents=function(senderId,intent,data,destIds){
    intent = intent || {};
    if(!intent.dataType) { throw "A legacy intent registration requires a dataType.";}
    if(!intent.action) { throw "A legacy intent registration requires an action.";}

    this.participant.client.send({
        'dst': "intents.api",
        'action': "invoke",
        'resource': '/' + intent.dataType + '/' + intent.action,
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
 * @method onIntentsReceive
 * @param {Object} intent
 * @param {String} destWidgetId
 */
ozpIwc.owf7ParticipantModules.Intents.prototype.onIntentsReceive=function(intent,destWidgetId) {
    intent = intent || {};
    if(!intent.dataType) { throw "A legacy intent registration requires a dataType.";}
    if(!intent.action) { throw "A legacy intent registration requires an action.";}

    this.participant.client.send({
        'dst': "intents.api",
        'action': "register",
        'resource': '/' + intent.dataType + '/' + intent.action,
        'entity': {
            'type': intent.dataType,
            'action': intent.action,
            'icon': this.participant.appData.icons.small || "about:blank",
            'label': this.participant.widgetParams.name
        }
    }, function (response) {
        if (response.entity && response.entity.inFlightIntentEntity && response.entity.inFlightIntentEntity.entity) {
            var ifie = response.entity.inFlightIntentEntity;
            var entity = ifie.entity;
            var intentObj = {
                'action': ifie.intent.action,
                'dataType': ifie.intent.type
            };

            gadgets.rpc.call(destWidgetId, "_intents", null, entity.senderId, intentObj, entity.entity);
        }
    });
};