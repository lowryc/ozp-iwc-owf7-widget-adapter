/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


ozpIwc.Owf7Participant=function(config) {
    config = config || {};
    if(!config.listener) { throw "Needs to have an OWF7ParticipantListener";}
    if(!config.client) {throw "Needs an IWC Client";}
    if(!config.guid) { throw "Must be assigned a guid for this widget";}
    if(!config.url) { throw "Needs a url for the widget"; }
    if(!config.iframe) { throw "Needs an iframe";}
    if(!config.rpcId) { throw "Needs an rpcID";}
    if(!config.instanceId) { throw "Needs an widget instance id";}
    
    this.client=config.client;
    this.listener=config.listener;
    this.rpcId=config.rpcId;
    this.instanceId=config.instanceId;
    this.url=config.url;
    this.widgetGuid=config.guid;
    // Do a lookup on these two at some point
    this.widgetQuery="?lang=en_US&owf=true&themeName=a_default&themeContrast=standard&themeFontSize=12";
    
    this.iframe=config.iframe;
    this.launchData={};
    var self=this;

    if(config.launchDataResource) {
        this.client.send({
            dst: "intents.api",
            resource: config.launchDataResource,
            action: "get"
        }, function (response, done) {
            if (response.response === 'ok') {
                self.launchData = response.entity.entity;
            }
            self.initIframe();
            done();
        });
    } else {
        this.initIframe();
    }

  
};
ozpIwc.Owf7Participant.prototype.initIframe=function() {
      
	// these get turned into the iframes name attribute
	// Refer to js/eventing/container.js:272
	this.widgetParams={
		"id": this.instanceId,
		"webContextPath":"/owf",
		"preferenceLocation": this.listener.prefsUrl,
		"relayUrl":  this.listener.rpcRelay, 
		"url": this.url,
		"guid": this.widgetGuid,
		// fixed values
		"layout":"desktop",
		"containerVersion":"7.0.1-GA",
		"owf":true,
		"lang":"en_US",
		"currentTheme":{
			"themeName":"a_default",
			"themeContrast":"standard",
			"themeFontSize":12
		},		
		"version":1,
		"locked":false,
        "data": this.launchData
	};
	this.subscriptions={};
	this.iframe.setAttribute("name",JSON.stringify(this.widgetParams));
    this.iframe.setAttribute("src",this.widgetParams.url+this.widgetQuery);
    this.iframe.setAttribute("id",this.rpcId);
};
ozpIwc.Owf7Participant.prototype.onContainerInit=function(sender,message) {
    // The container sends params, but the widget JS ignores them
    if ((window.name === "undefined") || (window.name === "")) {
        window.name = "ContainerWindowName" + Math.random();
    }
    var initMessage = gadgets.json.parse(message);
    var useMultiPartMessagesForIFPC = initMessage.useMultiPartMessagesForIFPC;
    var idString = this.rpcId;//null;
//		if (initMessage.id.charAt(0) !== '{') {
//				idString = initMessage.id;
//		}
//		else {
//				var obj = gadgets.json.parse(initMessage.id);
//				var id = obj.id;
//				idString = gadgets.json.stringify({id:obj.id});
//		}

    gadgets.rpc.setRelayUrl(idString, initMessage.relayUrl, false, useMultiPartMessagesForIFPC);
    gadgets.rpc.setAuthToken(idString, 0);
    var jsonString = '{\"id\":\"' + window.name + '\"}';
    gadgets.rpc.call(idString, 'after_container_init', null, window.name, jsonString);
};
    
ozpIwc.Owf7Participant.prototype.onPublish=function(command, channel, message, dest) {
    this.client.send({
        "dst": "data.api",
        "resource": "/owf-legacy/eventing/" + channel,
        "action": "set",
        "entity": message
    });
};
ozpIwc.Owf7Participant.prototype.onSubscribe=function(command, channel, message, dest) {
    var self=this;
    this.subscriptions[channel]=true;
    this.client.send({
        "dst": "data.api",
        "resource": "/owf-legacy/eventing/" + channel,
        "action": "watch"
    },function(packet,unregister) {
        if(packet.response !== "changed") return;
        if(self.subscriptions[channel]) { 
            // from shindig/pubsub_router.js:77    
            //gadgets.rpc.call(subscriber, 'pubsub', null, channel, sender, message);
            gadgets.rpc.call(self.rpcId, 'pubsub', null, channel, null, JSON.stringify(packet.entity.newValue));
        }else {
            unregister();
        };
    });
};
ozpIwc.Owf7Participant.prototype.onUnsubscribe=function(command, channel, message, dest) {
    this.subscriptions[channel]=false;
};


ozpIwc.Owf7Participant.prototype.onLaunchWidget=function(sender,msg,rpc) {
    msg=JSON.parse(msg);    
    // ignore title, titleRegex, and launchOnlyIfClosed
    this.client.send({
        dst: "system.api",
        resource: "/application/" + msg.guid,
        action: "launch",
        contentType: "text/plain",
        entity: msg.data
    },function(reply,unregister) {
      //gadgets.rpc.call(rpc.f, '__cb', null, rpc.c, {
      rpc.callback({
        error: false,
        newWidgetLaunched: true,
        uniqueId: "unknown,not supported yet"
      });
      unregister();
    });
};