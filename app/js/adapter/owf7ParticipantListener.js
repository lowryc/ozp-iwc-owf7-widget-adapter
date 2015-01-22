ozpIwc.Owf7ParticipantListener=function(config) {
	config = config || {};
    if(!config.url) { throw "Needs a url for the widget"; }
    if(!config.iframe) { throw "Needs an iframe";}
    if(!config.client) {throw "Needs an IWC Client";}

    var absolutePath = function(href) {
        var link = document.createElement("a");
        link.href = href;
        return (link.protocol+"//"+link.host+link.pathname+link.search+link.hash);
    };
    
    this.client=config.client;

    var instanceId="666f46bf-d8da-27c4-b907-f4a3a9e58c75";
	var widgetGuid="eb5435cf-4021-4f2a-ba69-dde451d12551";
	
	this.widgetQuery="?lang=en_US&owf=true&themeName=a_default&themeContrast=standard&themeFontSize=12";
	
	this.rpcRelay=config.rpcRelay || absolutePath("rpc_relay.uncompressed.html");
	this.prefsUrl=config.prefsUrl || absolutePath('owf7prefs.html');
    this.iframe=config.iframe;
	// these get turned into the iframes name attribute
	// Refer to js/eventing/container.js:272
	this.widgetParams={
		"id": instanceId,
		"webContextPath":"/owf",
		"preferenceLocation": this.prefsUrl,
		"relayUrl":  this.rpcRelay, 
		"url": config.url,
		"guid": widgetGuid,
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
		"locked":false
	};
    this.rpcId=gadgets.json.stringify({id:instanceId});

    this.initializeIframe();
    this.hook();
};

ozpIwc.Owf7ParticipantListener.prototype.initializeIframe=function() {
//	var widgetParams=JSON.stringify(this.widgetParams);
	
	this.iframe.setAttribute("name",JSON.stringify(this.widgetParams));
    this.iframe.setAttribute("src",this.widgetParams.url+this.widgetQuery);
    this.iframe.setAttribute("id",gadgets.json.stringify({id:this.widgetParams.id}));
};

ozpIwc.Owf7ParticipantListener.prototype.hook=function() {
	var rpcString=function(rpc) {
		return "[service:" + rpc.s + ",from:" + rpc.f + "]:" + JSON.stringify(rpc.a);
	};
	console.log("Registering RPC hooks");
	gadgets.rpc.registerDefault(function() {
		console.log("Unknown rpc " + rpcString(this));
	});
	var self=this;
	/**
	 * Called by the widget to connect to the container
	 * @see js/eventing/Container.js:26 for the containerInit function that much of this is copied from
	 * @see js/eventing/Container.js:104 for the actual rpc.register
	 */
	gadgets.rpc.register('container_init',function(sender,message) {
        console.log("Connecting from a new recipient: "+ sender + " with message: ",message);
		// The container sends params, but the widget JS ignores them
        if ((window.name === "undefined") || (window.name === "")) {
            window.name = "ContainerWindowName" + Math.random();
        }
        var initMessage = gadgets.json.parse(message);
		var useMultiPartMessagesForIFPC = initMessage.useMultiPartMessagesForIFPC;
		var idString = self.rpcId;//null;
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
        console.log("Registered ",idString," with relayUrl ",initMessage.relayUrl);
	});
	
	gadgets.rpc.register('_widget_iframe_ready',function() {
		// @see js/components/keys/KeyEventing.js
	});
	
	/**
	 * @see js\state\WidgetStateContainer.js:35
	 */
	gadgets.rpc.register('_WIDGET_STATE_CHANNEL_'+this.widgetParams.id,function() {
		
	});

	var specialPubsubChannelDefault={
			publish: function(message, dest, rpc) { 
				console.log("Unimplemented specialchannel publish " + rpcString(rpc));
			},
			subscribe: function(message, dest,rpc) { 
				console.log("Unimplemented specialchannel subscribe " +  rpcString(rpc));
			},
			unsubscribe: function(message, dest,rpc) { 
				console.log("Unimplemented specialchannel unsubscribe " + rpcString(rpc));
			}
		};
	var specialPubsubChannels={
		'_dragStart': specialPubsubChannelDefault,
	  '_dragOutName': specialPubsubChannelDefault,
    '_dragStopInContainer':specialPubsubChannelDefault,
		'_dropReceiveData':specialPubsubChannelDefault
	};

	/**
	 * @param {string} command - publish | subscribe | unsubscribe
	 * @param {string} channel - the OWF7 channel
	 * @param {string} message - the message being published
	 * @param {string} dest - the ID of the recipient if this is point-to-point
	 * @see js/eventing/Container.js:376
	 * @see js-lib/shindig/pubsub.js
	 * @see js-lib/shindig/pubsub_router.js
	 */
    var subscriptions={};
	gadgets.rpc.register('pubsub',function(command, channel, message, dest) {
        console.log("eventing: [command: " + command + ", channel:" + channel + "]: ",message);
        switch (command) {
            case 'publish':
                self.client.send({
                    "dst": "data.api",
                    "resource": "/owf-legacy/eventing/" + channel,
                    "action": "set",
                    "entity": message
                });
                break;
            case 'subscribe':
                subscriptions[channel]=true;
                self.client.send({
                    "dst": "data.api",
                    "resource": "/owf-legacy/eventing/" + channel,
                    "action": "watch"
                },function(packet,unregister) {
                    if(subscriptions[channel]) { 
                        console.log("Got subscription for " +self.rpcId + " on "+ channel, packet.entity.newValue);
                        // from shindig/pubsub_router.js:77    
                        //gadgets.rpc.call(subscriber, 'pubsub', null, channel, sender, message);
                        gadgets.rpc.call(self.rpcId, 'pubsub', null, channel, null, JSON.stringify(packet.entity.newValue));
                    }else {
                        unregister();
                    };
                });
                break;
            case 'unsubscribe': break;
                subscriptions[channel]=false;
                break;
        }   
	});
//
//	// Intents API
//	
//	// used for both handling and invoking intents
//	// @see js/intents/WidgetIntentsContainer.js:32 for reference
//	gadgets.rpc.register('_intents',function(senderId, intent, data, destIds) {
//	});
//	
//	// used by widgets to register an intent
//	// @see js/intents/WidgetIntentsContainer.js:85 for reference
//	gadgets.rpc.register('_intents_receive',function(intent, destWidgetId) {
//	});
//
//	// Launcher API
//	// @see js/launcher/WidgetLauncherContainer.js:22, 36
//	gadgets.rpc.register('_WIDGET_LAUNCHER_CHANNEL',function(sender, msg) {
//	});
//
//	// WidgetProxy readiness
//	// @see js/kernel/kernel-rpc-base.js:130
//	gadgets.rpc.register('_widgetReady',function(widgetId) {
//	});
//	// @see js/kernel/kernel-rpc-base.js:147
//	gadgets.rpc.register('_getWidgetReady',function(widgetId, srcWidgetId) {
//	});
//
//	// OWF.log
//	gadgets.rpc.register('Ozone.log',function() {
//	});
//
//	// Widget State functions

//	gadgets.rpc.register('after_container_init',function() {
//	});
//
//	gadgets.rpc.register('_WIDGET_STATE_CHANNEL_' + instanceId,function() {
//	});

	
	
};