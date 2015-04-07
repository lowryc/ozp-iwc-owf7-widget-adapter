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
	this.prefsUrl=absolutePath(config.prefsUrl || ozpIwc.owf7PrefsUrl || "/owf/prefs");
    this.participants={};
    this.offsetX=config.offsetX;
    this.offsetY=config.offsetY;
    
    this.client=new ozpIwc.InternalParticipant();
    ozpIwc.defaultRouter.registerParticipant(this.client);    
    
    if ((window.name === "undefined") || (window.name === "")) {
        window.name = "ContainerWindowName" + Math.random();
    }
    this.installDragAndDrop();
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
    
    // try to find our position on screen to help with cross-window drag and drop
    this.xOffset=window.screenX+window.outerWidth -document.body.clientWidth - 10;
    this.yOffset=window.screenY+window.outerHeight - document.body.clientHeight - 30;


    
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
ozpIwc.Owf7ParticipantListener.prototype.makeGuid=function() {
    // not a real guid, but it's the way OWF 7 does it
    var S4=function(){
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

ozpIwc.Owf7ParticipantListener.prototype.updateMouseCoordinates=function(e) {
//      console.log("Updating coords from("+this.xOffset+","+this.yOffset+")");
    this.xOffset=e.screenX-e.clientX;
    this.yOffset=e.screenY-e.clientY;
//      console.log("     to ("+this.xOffset+","+this.yOffset+")");
};

ozpIwc.Owf7ParticipantListener.prototype.convertToLocalCoordinates=function(msg,element) {
    // copy the message
    var rv={};
    for(var k in msg) {
        rv[k]=msg[k];
    }

    // start with the location relative to the adapter's top-left
    rv.pageX=msg.screenX-this.xOffset;
    rv.pageY=msg.screenY-this.yOffset;

    // this calculates the position of the iframe relative to the document,
    // accounting for scrolling, padding, etc.  If we started at zero, this
    // would be the iframe's coordinates inside the document.  Instead, we started
    // at the mouse location relative to the adapter, which gives the location
    // of the event inside the iframe content.
    // http://www.kirupa.com/html5/get_element_position_using_javascript.htm

    // should work in most browsers: http://www.quirksmode.org/dom/w3c_cssom.html#elementview
    // IE < 7: will miscalculate by skipping ancestors that are "position:relative"
    // IE, Opera: not work if there's a "position:fixed" in the ancestors
    while(element) {
        rv.pageX += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        rv.pageY += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
    }

    return rv;
};

ozpIwc.Owf7ParticipantListener.prototype.addWidget=function(config) {
    // From the caller: config.url, config.launchDataResource, (opt) config.instanceId
    config.instanceId = config.instanceId || this.makeGuid();
    config.listener = this;
    config.client = new ozpIwc.InternalParticipant();
    config.rpcId = gadgets.json.stringify({id: config.instanceId});
    ozpIwc.defaultRouter.registerParticipant(config.client);


    // Update the hash in case the user refreshes. Then create the participant/register RPC
    function init() {
        var hashObj = {};
        if(config.guid) hashObj.guid = config.guid;
        if(config.instanceId) hashObj.instanceId= config.instanceId;

        var newHash = "#";
        for (var i in hashObj) {
            newHash += i + "=" + hashObj[i] + "&";
        }
        newHash = newHash.substring(0, newHash.length - 1);
        window.location.hash = newHash;

        // After storing the hash, if the guid does not exist just set it as instanceId for OWF7 to not complain.
        config.guid = config.guid || config.instanceId;
        config.listener.participants[config.rpcId] = new ozpIwc.Owf7Participant(config);

        // @see js\state\WidgetStateContainer.js:35
        gadgets.rpc.register('_WIDGET_STATE_CHANNEL_' + config.instanceId, function(){});
    }

    // If there was a IWC launch resource, go gather it
    if (config.launchDataResource) {
        config.client.send({
            dst: "intents.api",
            action: "get",
            resource: config.launchDataResource
        }, function (resp) {
            // If the widget is refreshed, the launch resource data has been deleted.
            if (resp && resp.entity && resp.entity.entity && typeof resp.entity.entity.id === "string") {
                config.guid = resp.entity.entity.id;
            }
            init();
        });
    } else {
        init();
    }
};

ozpIwc.Owf7ParticipantListener.prototype.cancelDrag=function() {
    this.inDrag=false;
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.pubsubChannel("_dragStopInContainer"),
        "action": "set",
        "entity": Date.now()  // ignored, but changes the value to trigger watches
    });
};

ozpIwc.Owf7ParticipantListener.prototype.installDragAndDrop=function() {
    var self=this;
    var updateMouse=function(evt) {self.updateMouseCoordinates(evt);};
    
    document.addEventListener("mouseenter",updateMouse);
    document.addEventListener("mouseout",updateMouse);
    
    this.client.send({
       "dst":"data.api",
       "resource": ozpIwc.Owf7Participant.pubsubChannel("_dragStart"),
       "action": "watch"       
    },function(reply) {
        if(reply.response === "changed") {
            self.inDrag=true;        
        }
    });
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.pubsubChannel("_dragStopInContainer"),
        "action": "watch"
    },function(reply) {
        if(reply.response === "changed") {
            self.inDrag=false;        
        }
    });    
    
    document.addEventListener("mousemove",function(e) {
        self.updateMouseCoordinates(e);
//        console.log("Adapter mousemove at ",e);
        if(self.inDrag && (e.buttons&1) !== 1) {
            console.log("Canceling drag");
            self.cancelDrag();
        }
    },false);
//    document.addEventListener("mouseup",function(e) {
////        if(self.inDrag) {
////            return;
////        }
//        self.onFakeMouseUpFromClient({
//            sender: self.rpcId,
//            pageX: e.pageX,
//            pageY: e.pageY,
//            screenX: e.screenX,
//            screenY: e.screenY
//        });
//    },false);
};
})();