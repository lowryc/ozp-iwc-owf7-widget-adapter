ozpIwc.Owf7ParticipantListener=function(config) {
	config = config || {};
	
//	var widgetUrl="https://localhost:15005/";
	this.widgetQuery="?lang=en_US&owf=true&themeName=a_default&themeContrast=standard&themeFontSize=12";
	
//	var instanceId="666f46bf-d8da-27c4-b907-f4a3a9e58c75";
//	var widgetGuid="eb5435cf-4021-4f2a-ba69-dde451d12551";
	
	this.rpcRelay=config.rpcRelay || $('<a href="rpc_relay.uncompressed.html"></a>')[0].href;
	this.prefsUrl=config.prefsUrl || $('<a href="owf7prefs.html"></a>')[0].href + "#";

	// these get turned into the iframes name attribute
	// Refer to js/eventing/container.js:272
	this.baseWidgetParams={
		"id": instanceId,
		"webContextPath":"/owf",
		"preferenceLocation": this.prefsUrl,
		"relayUrl":  this.rpcRelay, 
		"url": widgetUrl,
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
};

ozpIwc.Owf7ParticipantListener.prototype.widgetParams=function(config) {
	var params={};
	for(var k in this.baseWidgetParams) {
		params[k]=baseWidgetParams[k];
	}
	for(var k in config) {
		params[k]=config[k];
	}
	return params;
};

ozpIwc.Owf7ParticipantListener.prototype.initializeIframe=function(config) {
	var instanceIdString=config.id || ozpIwc.util.generateId();
	var widgetParams=JSON.stringify(this.widgetParams({
		id: instanceIdString,
		guid: config.widgetGuid,
		url: config.widgetUrl
	}));
	
	config.widgetIframe.attr("name",JSON.stringify(widgetParams))
					.attr("src",config.widgetUrl+this.widgetQuery)
					.attr("id",instanceIdString);
};

ozpIwc.Owf7ParticipantListener.prototype.hook=function() {
	var rpcString=function(rpc) {
		return "[service:" + rpc.s + ",from:" + rpc.f + "]:" + JSON.stringify(rpc.a);
	};
	
	gadgets.rpc.registerDefault(function() {
		console.log("Unknown rpc " + rpcString(this));
	});
	
	/**
	 * Called by the widget to connect to the container
	 * @see js/eventing/Container.js:26 for the containerInit function that much of this is copied from
	 * @see js/eventing/Container.js:104 for the actual rpc.register
	 */
	gadgets.rpc.register('container_init',function(sender,message) {
		// The container sends params, but the widget JS ignors them
		var initMessage = gadgets.json.parse(message);
		var useMultiPartMessagesForIFPC = initMessage.useMultiPartMessagesForIFPC;
		var idString = null;
		if (initMessage.id.charAt(0) !== '{') {
				idString = initMessage.id;
		}
		else {
				var obj = gadgets.json.parse(initMessage.id);
				var id = obj.id;
				idString = gadgets.json.stringify({id:obj.id});
		}

		gadgets.rpc.setRelayUrl(idString, initMessage.relayUrl, false, useMultiPartMessagesForIFPC);
		gadgets.rpc.setAuthToken(idString, 0);
		gadgets.rpc.call(idString, 'after_container_init', null);
	});
	
	gadgets.rpc.register('_widget_iframe_ready',function() {
		// @see js/components/keys/KeyEventing.js
	});
	
	/**
	 * @see js\state\WidgetStateContainer.js:35
	 */
	gadgets.rpc.register('_WIDGET_STATE_CHANNEL_'+instanceId,function() {
		
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
	gadgets.rpc.register('pubsub',function(command, channel, message, dest) {
		if(specialPubsubChannels[channel]) {
			specialPubsubChannels[channel][command].call(specialPubsubChannels[channel], message, dest,this);
		} else {
			switch (command) {
				case 'publish': 
					console.log("eventing.publish not implemented [channel:" + channel + ", message:" + message);
					break;
				case 'subscribe': break;
					console.log("eventing.subscribe not implemented [channel:" + channel + ", message:" + message);
					break;
				case 'unsubscribe': break;
					console.log("eventing.unsubscribe not implemented [channel:" + channel + ", message:" + message);
					break;
			}
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