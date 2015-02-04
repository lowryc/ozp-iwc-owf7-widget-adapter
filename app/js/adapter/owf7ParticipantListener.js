(function() {
    var absolutePath = function(href) {
        var link = document.createElement("a");
        link.href = href;
        return (link.protocol+"//"+link.host+link.pathname+link.search+link.hash);
    };
    

ozpIwc.Owf7ParticipantListener=function(config) {
	config = config || {};
//    if(!config.url) { throw "Needs a url for the widget"; }
//    if(!config.iframe) { throw "Needs an iframe";}
//    if(!config.client) {throw "Needs an IWC Client";}

    this.rpcRelay=absolutePath(config.rpcRelay || "rpc_relay.uncompressed.html");
	this.prefsUrl=absolutePath(config.prefsUrl || "/owf/prefs");
    this.participants={};
    
    if ((window.name === "undefined") || (window.name === "")) {
        window.name = "ContainerWindowName" + Math.random();
    }
	
    var rpcString=function(rpc) {
		return "[service:" + rpc.s + ",from:" + rpc.f + "]:" + JSON.stringify(rpc.a);
	};
//	console.log("Registering RPC hooks");
	gadgets.rpc.registerDefault(function() {
		console.log("Unknown rpc " + rpcString(this));
	});
    
	var self=this;
    var getParticipant=function(id) {
        var p=self.participants[id];
        if(!p) {
            throw "Unknown participant";
        }
        return p;
    };
	/**
	 * Called by the widget to connect to the container
	 * @see js/eventing/Container.js:26 for the containerInit function that much of this is copied from
	 * @see js/eventing/Container.js:104 for the actual rpc.register
	 */
	gadgets.rpc.register('container_init',function(sender,message) {
        getParticipant(this.f).onContainerInit(sender,message);
	});
	


	/**
	 * @param {string} command - publish | subscribe | unsubscribe
	 * @param {string} channel - the OWF7 channel
	 * @param {string} message - the message being published
	 * @param {string} dest - the ID of the recipient if this is point-to-point
	 * @see js/eventing/Container.js:376
	 * @see js-lib/shindig/pubsub.js
	 * @see js-lib/shindig/pubsub_router.js
	 */
//    var subscriptions={};
	gadgets.rpc.register('pubsub',function(command, channel, message, dest) {
        var p=getParticipant(this.f);
        switch (command) {
            case 'publish': 
                p.onPublish(command, channel, message, dest);
                break;
            case 'subscribe':
                p.onSubscribe(command, channel, message, dest);
                break;
            case 'unsubscribe': break;
                p.onUnsubscribe(command, channel, message, dest);
                break;
        }
	});
    
    // Launcher API
// The handling of the rpc event is in WidgetLauncherContainer
// @see js/launcher/WidgetLauncherContainer.js:22, 36
// msg: {
//    universalName: 'universal name of widget to launch',  //universalName or guid maybe identify the widget to be launched
//    guid: 'guid of widget to launch',
//    title: 'title to replace the widgets title' the title will only be changed if the widget is opened.
//    titleRegex: optional regex used to replace the previous title with the new value of title
//    launchOnlyIfClosed: true, //if true will only launch the widget if it is not already opened.
//                                   //if it is opened then the widget will be restored
//    data: dataString  //initial launch config data to be passed to a widget only if the widget is opened.  this must be a string
// });
//  The steps to launch a widget are defined in dashboard.launchWidgetInstance
//  @see js/components/dashboard/Dashboard.js:427
//  The "iframe properties" come from Dashboard.onBeforeWidgetLaunch
//  @see js/components/dashboard/Dashboard.js:318
//  @see js\eventing\Container.js:237 for getIframeProperties()
// WidgetIframeComponent actually creates the iframe tag.
// @see js\components\widget\WidgetIframeComponent.js:15
	gadgets.rpc.register('_WIDGET_LAUNCHER_CHANNEL',function(sender, msg) {
        var p=getParticipant(this.f);
        p.onLaunchWidget(sender,msg,this);
	});
    

	
    /**
     * _fake_mouse_move is needed for drag and drop.  The container code is at
     * @see reference\js\dd\WidgetDragAndDropContainer.js:52
     */
    gadgets.rpc.register('_fake_mouse_move',function(msg) {
		// @see @see reference\js\dd\WidgetDragAndDropContainer.js:52
        getParticipant(this.f).onFakeMouseMoveFromClient(msg);
	});
    
    gadgets.rpc.register('_fake_mouse_up',function(msg) {
		// @see @see reference\js\dd\WidgetDragAndDropContainer.js:52
         getParticipant(this.f).onFakeMouseUpFromClient(msg);
	});
    gadgets.rpc.register('_fake_mouse_out',function(){ /*ignored*/});
    
    var IGNORE=function(){};
    // @see js/components/keys/KeyEventing.js
    gadgets.rpc.register('_widget_iframe_ready',IGNORE);
    
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

ozpIwc.Owf7ParticipantListener.prototype.addWidget=function(config) {
  // From the caller: config.url and config.iframe
  config.listener=this;
  config.client=new ozpIwc.InternalParticipant();
  ozpIwc.defaultRouter.registerParticipant(config.client);
  config.guid="eb5435cf-4021-4f2a-ba69-dde451d12551"; // FIXME: generate
  config.instanceId=config.client.address; // FIXME: generate
  config.rpcId=gadgets.json.stringify({id:config.instanceId});
  this.participants[config.rpcId]=new ozpIwc.Owf7Participant(config);
  
  // @see js\state\WidgetStateContainer.js:35
  gadgets.rpc.register('_WIDGET_STATE_CHANNEL_'+config.instanceId,function(){});
};



})();