
/**
 * 
 * @param {object} config
 * @param {object} config.iframe - The iframe that contains the widget for this participant
 * @param {object} config.listener - The parent OWF7ParticipantListener
 * @param {object} config.client - The InternalParticipant for this widget.
 * @param {string} config.guid - The GUID for the widget that this is an instance of.
 * @param {string} config.instanceId - The GUID for the widget instance.
 * @param {string} config.url - The launch URL for this widget.
 * @param {string} config.rpcId - The iframe.id that is used as the ID for RPC.
 * @param {string} [config.launchDataResource=undefined] - The intents.api resource that contains the launch data for the widget, or null for no launch data.
 * @param {boolean} [config.externalInit=false] - Set to true if the iframe has been initialized elsewhere, such as when embedded in OWF 7.
 */

ozpIwc.Owf7Participant=function(config) {
    config = config || {};
    if(!config.listener) { throw "Needs to have an OWF7ParticipantListener";}
    if(!config.client) {throw "Needs an IWC Client";}
    if(!config.guid) { throw "Must be assigned a guid for this widget";}
    if(!config.instanceId) { throw "Needs an widget instance id";}
    if(!config.url) { throw "Needs a url for the widget"; }
    if(!config.rpcId) { throw "Needs a rpcId for the widget"; }

    this.iframe=config.iframe;
    this.listener=config.listener;
    this.client=config.client;
    this.url=config.url;
    this.instanceId=config.instanceId;
    this.widgetGuid=config.guid;
    this.rpcId=config.rpcId;

    // Create an iframe for the widget
    this.iframe = document.createElement('iframe');
    this.iframe.id = config.instanceId;

    this.inDrag=false;
    this.lastMouseMove=Date.now();
    
    // Do a lookup on these two at some point
    this.widgetQuery="?lang=en_US&owf=true&themeName=a_default&themeContrast=standard&themeFontSize=12";
    
    this.launchData=null;
    var self=this;
    // number of milliseconds to wait before sending another mousemove event
    this.mouseMoveDelay=250;

    if(config.launchDataResource) {
        this.client.send({
            dst: "intents.api",
            resource: config.launchDataResource,
            action: "get"
        }, function (response, done) {
            if (response.response === 'ok'
                && response.entity && response.entity.entity && response.entity.entity.launchData) {
                self.launchData = response.entity.entity.launchData;
            } else {
                self.launchData = undefined;
            }
            if(!config.externalInit) {
                self.initIframe();
            }
            done();
        });
    } else {
        if(!config.externalInit) {
            this.initIframe();
        }
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
    document.body.appendChild(this.iframe);
    this.registerDragAndDrop();
};
ozpIwc.Owf7Participant.pubsubChannel=function(channel) {
    return "/owf-legacy/eventing/"+channel;
};
ozpIwc.Owf7Participant.rpcChannel=function(channel) {
    return "/owf-legacy/gadgetsRpc/"+channel;
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
    if(this["hookPublish"+channel] && !this["hookPublish"+channel].call(this,message)) {
        return;
    }
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.pubsubChannel(channel),
        "action": "set",
        "entity": message
    });
};


ozpIwc.Owf7Participant.prototype.onSubscribe=function(command, channel, message, dest) {
    var self=this;
    this.subscriptions[channel]=true;
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.pubsubChannel(channel),
        "action": "watch"
    },function(packet,unregister) {
        if(packet.response !== "changed") return;

        if(self["hookReceive"+channel] && !self["hookReceive"+channel].call(self,packet.entity.newValue)) {
            return;
        }
        if(self.subscriptions[channel]) { 
            // from shindig/pubsub_router.js:77    
            //gadgets.rpc.call(subscriber, 'pubsub', null, channel, sender, message);
            gadgets.rpc.call(self.rpcId, 'pubsub', null, channel, null, packet.entity.newValue);
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

//=======================================================================
// Drag and Drop MADNESS
//=======================================================================

/* All Drag and Drop messages look like:
 * {
        sender: this.widgetEventingController.getWidgetId(),
        pageX: e.pageX,
        pageY: e.pageY,
        screenX: e.screenX,
        screenY: e.screenY
    }
 */

ozpIwc.Owf7Participant.prototype.convertToLocalCoordinates=function(msg) {
    // translate to container coordinates
    var rv=this.listener.convertToLocalCoordinates(msg);

    // this calculates the position of the iframe relative to the document,
    // accounting for scrolling, padding, etc.  If we started at zero, this
    // would be the iframe's coordinates inside the document.  Instead, we started
    // at the mouse location relative to the adapter, which gives the location
    // of the event inside the iframe content.
    // http://www.kirupa.com/html5/get_element_position_using_javascript.htm
    
    // should work in most browsers: http://www.quirksmode.org/dom/w3c_cssom.html#elementview
    // IE < 7: will miscalculate by skipping ancestors that are "position:relative"
    // IE, Opera: not work if there's a "position:fixed" in the ancestors
    var element=this.iframe;
    while(element) {        
        rv.pageX += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        rv.pageY += (element.offsetTop - element.scrollTop + element.clientTop);        
        element = element.offsetParent;    
    }

    return rv;
};

ozpIwc.Owf7Participant.prototype.inIframeBounds=function(location) {
    // since we normalized the coordinates, we can just check to see if they are 
    // within the dimensions of the iframe.
    return location.pageX >= 0 && location.pageX < this.iframe.clientWidth &&
           location.pageY >= 0 && location.pageY < this.iframe.clientHeight;
};

ozpIwc.Owf7Participant.prototype.onFakeMouseMoveFromClient=function(msg) {
    // originally translated the pageX/pageY to container coordinates.  With
    // the adapter, we're translating from screen coordinates so don't need to 
    // do any modification
//    console.log("Fake mouse move:",msg);
    var now=Date.now();
    var deltaT=now-this.lastMouseMove;
    if(deltaT < this.mouseMoveDelay) {
        return;
    }
//    console.log("Sending mouse move",msg);
    this.lastMouseMove=now;
    this.client.send({
       "dst": "data.api",
       "resource": ozpIwc.Owf7Participant.rpcChannel("_fake_mouse_move"),
       "action": "set",
       "entity": msg
    });
    
};

// Only sent if the client is a flash widget (dunno why?).  Otherwise, it sends a _dragStopInWidgetName
ozpIwc.Owf7Participant.prototype.onFakeMouseUpFromClient=function(msg) {
    // originally translated the pageX/pageY to container coordinates.  With
    // the adapter, we're translating from screen coordinates so don't need to 
    // do any modification
    this.client.send({
       "dst": "data.api",
       "resource": ozpIwc.Owf7Participant.rpcChannel("_fake_mouse_up"),
       "action": "set",
       "entity": msg
    });
};

/* Receive a fake mouse event from another widget.  Do the conversions and
 * finagling that the container would have done in OWF 7.
 */
ozpIwc.Owf7Participant.prototype.onFakeMouseMoveFromOthers=function(msg) {
    if(!("screenX" in msg && "screenY" in msg)) {
        return;
    }

    this.lastPosition=msg;
    if(msg.sender===this.rpcId) {
        return;
    }
    var localizedEvent=this.convertToLocalCoordinates(msg);
//    console.log("Received Fake mouse move at page("
//        +localizedEvent.pageX+","+localizedEvent.pageY+")");
    if(this.inIframeBounds(localizedEvent)) {
        this.mouseOver=true;
        gadgets.rpc.call(this.rpcId, '_fire_mouse_move', null,localizedEvent);
    } else {
        if(this.mouseOver) {
//            console.log("Faking an mouse dragOut at page("
//                +localizedEvent.pageX+","+localizedEvent.pageY+")");
            // this.eventingContainer.publish(this.dragOutName, null, lastEl.id);
            // fake the pubsub event directly to the recipient
            gadgets.rpc.call(this.rpcId, 'pubsub', null, "_dragOutName", "..", null);
        }
        this.mouseOver=false;
    }
};


/* Receive a fake mouse event from another widget.  Do the conversions and
 * finagling that the container would have done in OWF 7.
 */
ozpIwc.Owf7Participant.prototype.onFakeMouseUpFromOthers=function(msg) {
    var localizedEvent=this.convertToLocalCoordinates(msg);
    if(this.inIframeBounds(localizedEvent)) {
//        console.log("Received Fake mouse up at page("
//            +localizedEvent.pageX+","+localizedEvent.pageY+")");    
        gadgets.rpc.call(this.rpcId, '_fire_mouse_up', null,localizedEvent);
    } else {
        // send a mouse up over container message
        // @see dd/WidgetDragAndDropContainer.js:257
        
        // this.eventingContainer.publish(this.dragStopInContainerName, null);
        // TODO: not sure if the cancel goes here
//        this.client.send({
//            "dst": "data.api",
//            "resource": this.pubsubChannel("_dragStopInContainer"),
//            "action": "set",
//            "entity": msg  // ignored, but changes the value to trigger watches
//        });
    }
};

ozpIwc.Owf7Participant.prototype.registerDragAndDrop=function() {
    var self=this;
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.rpcChannel("_fake_mouse_up"),
        "action": "watch"
    },function(packet,unregister) {
        if(packet.response!=="changed") return;
        self.onFakeMouseUpFromOthers(packet.entity.newValue);
    });
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.rpcChannel("_fake_mouse_move"),
        "action": "watch"
    },function(packet,unregister) {
        if(packet.response!=="changed") return;
        self.onFakeMouseMoveFromOthers(packet.entity.newValue);
    });
 
};
//==========================
// Hook the pubsub channels for drag and drop
//==========================

// No action needed, just let the move as normal for these:
// _dragStart: publish, receive
// _dragOverWidget:  publish, receive (not used by client)

 
// cancel the publish, since these should originate from the container, not widgets
ozpIwc.Owf7Participant.prototype.hookPublish_dragOutName=function() {return false;};
ozpIwc.Owf7Participant.prototype.hookPublish_dropReceiveData=function() { return false; };
ozpIwc.Owf7Participant.prototype.hookPublish_dropReceiveData=function() { return false; };

// cancel the receive, since these should not originate from outside the adapter
ozpIwc.Owf7Participant.prototype.hookReceive_dragSendData=function() { return false;};
ozpIwc.Owf7Participant.prototype.hookReceive_dragOutName=function() { return false;};
ozpIwc.Owf7Participant.prototype.hookReceive_dropReceiveData=function() { return false; };


// these all start the drag state
ozpIwc.Owf7Participant.prototype.hookReceive_dragStart=function(message) {
//    console.log("Starting external drag on ",message);
    this.inDrag=true;
    return true; 
};
ozpIwc.Owf7Participant.prototype.hookPublish_dragStart=function(message) {
//    console.log("Starting internal drag on ",message);
    this.inDrag=true;
    return true; 
};

// these all stop the drag state
ozpIwc.Owf7Participant.prototype.hookReceive_dragStopInContainer=function() {
//    console.log("Stopping drag in container");
    this.inDrag=false;
    return true; 
};
ozpIwc.Owf7Participant.prototype.hookReceive_dragStopInWidget=function() {
//    console.log("Stopping drag in widget");
    this.inDrag=false;
    return true; 
};

// Merely store the dragData for later.
ozpIwc.Owf7Participant.prototype.hookPublish_dragSendData=function(message) {
//    console.log("Setting drag data to ",message);
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.rpcChannel("_dragSendData_value"),
        "action": "set",
        "entity": message
    });
    return false;
};

ozpIwc.Owf7Participant.prototype.hookPublish_dragStopInWidget=function(message) {
    // this always published from the widget that initiated the drag
    // so we need to figure out who to send it to
    
    // make sure the mouse is actually over the widget so that it can't steal
    // the drag from someone else
    if(!this.mouseOver) {
//        console.log("dragStopInWidget, but not over myself.  Faking mouse event",this.lastPosition);
        this.onFakeMouseUpFromClient(this.lastPosition);

        return false;
    }
    // this widget claims the drag, give it the drag data
    var self=this;
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.rpcChannel("_dragSendData_value"),
        "action": "get"
    },function(packet,unregister) {
        unregister();

        if(packet.response==="ok") {
//            console.log("Completing drag of data ",packet.entity);
            gadgets.rpc.call(self.rpcId, 'pubsub', null, "_dropReceiveData", "..", packet.entity);
        } else {
            console.log("Unable to fetch drag data",packet);
        }
        // tell everyone else that the container took over the drag
        // also handles the case where the we couldn't get the dragData for some reason by
        // canceling the whole drag operation
        // is this duplicative of the same event in _fake_mouse_up?
        
        self.client.send({
            "dst": "data.api",
            "resource": ozpIwc.Owf7Participant.pubsubChannel("_dragStopInContainer"),
            "action": "set",
            "entity": Date.now()  // ignored, but changes the value to trigger watches
        });
    });
    

    return true;
};
