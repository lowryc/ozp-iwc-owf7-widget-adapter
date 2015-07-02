ozpIwc = ozpIwc || {};
ozpIwc.owf7ParticipantModules = ozpIwc.owf7ParticipantModules || {};

/**
 * A drag and drop module for the owf7Participant.
 * @class Dd
 * @namespace ozpIwc.owf7ParticipantModules
 * @param {ozpIwc.Owf7Participant} participant
 * @constructor
 */
ozpIwc.owf7ParticipantModules.Dd = function(participant){
    if(!participant) { throw "Needs to have an Owf7Participant";}

    /**
     * @property participant
     * @type {ozpIwc.Owf7Participant}
     */
    this.participant = participant;

    /**
     * A boolean flag used to track if a mouse event is over this participant's iFrame.
     * @property mouseOver
     * @type {Boolean}
     */
    this.mouseOver = true;

    /**
     * The last mouse position received from an event listener.
     * @property lastPosition
     * @type {Object}
     */
    this.lastPosition = {};

    /**
     * A timestamp of the last "mousemove" event
     * @property lastMouseMove
     * @type {Number}
     */
    this.lastMouseMove=Date.now();

    /**
     * The number of milliseconds to wait before sending another "mousemove" event.
     * @property mouseMoveDelay
     * @type {Number}
     * @default 100
     */
    this.mouseMoveDelay=100;

    /**
     * A shorthand for data api access through the participant.
     * @property dataApi
     * @type {Object}
     */
    this.dataApi = this.participant.client.data();

    this.registerDragAndDrop();
};

/**
 * Returns the IWC data.api resource path for the given rpc Channel
 * @method rpcChannel
 * @param {String} channel
 * @returns {String}
 */
ozpIwc.owf7ParticipantModules.Dd.rpcChannel=function(channel) {
    return "/owf-legacy/gadgetsRpc/"+channel;
};

/**
 * Uses the data.api watch capabilities to receive drag and drop events from other legacy widgets.
 * @method registerDragAndDrop
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.registerDragAndDrop=function() {
    var self=this;
    this.dataApi.watch(ozpIwc.owf7ParticipantModules.Dd.rpcChannel("_fake_mouse_up"), function(packet) {
        self.onFakeMouseUpFromOthers(packet.entity.newValue);
    });
    this.dataApi.watch(ozpIwc.owf7ParticipantModules.Dd.rpcChannel("_fake_mouse_move"), function(packet) {
        self.onFakeMouseMoveFromOthers(packet.entity.newValue);
    });
};

/**
 * Receive a fake mouse event from another widget.  Do the conversions and
 * finagling that the container would have done in OWF 7.
 * @method onFakeMouseUpFromOthers
 * @param {MouseEvent} msg
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.onFakeMouseUpFromOthers=function(msg) {
    var localizedEvent=this.convertToLocalCoordinates(msg);
    if(this.inIframeBounds(localizedEvent)) {
        //console.log("Received Fake mouse up at page("+localizedEvent.pageX+","+localizedEvent.pageY+")");
	if (window.OWF) {
	    var localId= document.getElementById(this.participant.iframe.id);
	    var localClientRects = localId.getClientRects()[0];
	    localizedEvent.pageX= localizedEvent.pageX + 5 - localClientRects.left; // 5 for widget border chrome
	    localizedEvent.pageY= localizedEvent.pageY + 30 - localClientRects.top; // 30 for widget title bar chrome
	}
        gadgets.rpc.call(this.participant.rpcId, '_fire_mouse_up', null,localizedEvent);
    } else {
        //console.log("out of page: Received Fake mouse up at page("
        //            +localizedEvent.pageX+","+localizedEvent.pageY+")", "InDrag?" , this.participant.listener.inDrag);

        //gadgets.rpc.call(this.participant.rpcId, '_dragStopInContainer', null,localizedEvent);
        // this.eventingContainer.publish(this.dragStopInContainerName, null);
        // TODO: not sure if the cancel goes here
        //this.participant.client.send({
        //    "dst": "data.api",
        //    "resource": ozpIwc.owf7ParticipantModules.Eventing.pubsubChannel("_dragStopInContainer"),
        //    "action": "set",
        //    "entity": msg  // ignored, but changes the value to trigger watches
        //});
    }
};

/**
 * Receive a fake mouse event from another widget.  Do the conversions and
 * finagling that the container would have done in OWF 7.
 * @method onFakeMouseMoveFromOthers
 * @param {MouseEvent} msg
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.onFakeMouseMoveFromOthers=function(msg) {
    if(!("screenX" in msg && "screenY" in msg)) {
        return;
    }

    this.lastPosition=msg;
    if(msg.sender===this.participant.rpcId) {
        return;
    }
    var localizedEvent=this.convertToLocalCoordinates(msg);
    //console.log("Received Fake mouse move at page("+localizedEvent.pageX+","+localizedEvent.pageY+")");
    if(this.inIframeBounds(localizedEvent)) {
        this.mouseOver=true;
        gadgets.rpc.call(this.participant.rpcId, '_fire_mouse_move', null,localizedEvent);
    } else {
        if(this.mouseOver) {
            //console.log("Faking an mouse dragOut at page(" + localizedEvent.pageX+","+localizedEvent.pageY + ")");
            // this.eventingContainer.publish(this.dragOutName, null, lastEl.id);
            // fake the pubsub event directly to the recipient
            gadgets.rpc.call(this.participant.rpcId, 'pubsub', null, "_dragOutName", "..", null);
        }
        this.mouseOver=false;
    }
};

/**
 * Receive a fake mouse event from the client.  Do the conversions and notify others on the bus of the movement.
 * @method onFakeMouseMoveFromClient
 * @param {MouseEvent} msg
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.onFakeMouseMoveFromClient=function(msg) {
    // originally translated the pageX/pageY to container coordinates.  With
    // the adapter, we're translating from screen coordinates so don't need to
    // do any modification
    //console.log("Fake mouse move:",msg);

    this.lastPosition = msg;
    var now=Date.now();
    var deltaT=now-this.lastMouseMove;
    if(deltaT < this.mouseMoveDelay) {
        return;
    }
    var localizedEvent=this.convertToLocalCoordinates(msg);
    this.mouseOver = this.inIframeBounds(localizedEvent);

    //console.log("Sending mouse move", this.mouseOver, msg);
    this.lastMouseMove=now;
    this.dataApi.set(ozpIwc.owf7ParticipantModules.Dd.rpcChannel("_fake_mouse_move"),{
        entity: msg
    });
};

/**
 * Only sent if the client is a flash widget (dunno why?).  Otherwise, it sends a _dragStopInWidgetName
 * @method onFakeMouseUpFromClient
 * @param {MouseEvent} msg
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.onFakeMouseUpFromClient=function(msg) {
    // originally translated the pageX/pageY to container coordinates.  With
    // the adapter, we're translating from screen coordinates so don't need to
    // do any modification
    //console.log("sending rpc msg to client: _fake_mouse_up");
    this.dataApi.set(ozpIwc.owf7ParticipantModules.Dd.rpcChannel("_fake_mouse_up"),{
        entity: msg
    });
};

/**
 * Returns true if the location is within the widget's iframe bounds.
 * @method inIframeBounds
 * @param {MouseEvent} location
 * @returns {Boolean}
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.inIframeBounds=function(location) {
    // since we normalized the coordinates, we can just check to see if they are
    // within the dimensions of the iframe.
    if (window.OWF) {
        // location parameter provides browser page coordinates, so convert to iframe coordinates here
	var localEl = document.getElementById(this.participant.iframe.id);
	var clientRect = localEl.getClientRects()[0];
	var localX = location.pageX + 5 - clientRect.left;  // 5 for border chrome
	var localY = location.pageY + 30 - clientRect.top;  // 30 for widget title bar chrome
	//console.log("inIframeBounds " + localX+","+localY+"  within "+localEl.clientWidth+", "+localEl.clientHeight);

	var immpb = 60;  // Iframe Mouse Move Pixel Buffer

	return localX >= - immpb &&
	    localX < localEl.clientWidth + 10 + immpb &&  // 20 for border chrome
	    localY >= - immpb &&
	    localY < localEl.clientHeight + 35 + immpb;  // 60 for border chrome
    }
    else {
        return location.pageX >= 0 && location.pageX < this.participant.iframe.clientWidth &&
            location.pageY >= 0 && location.pageY < this.participant.iframe.clientHeight;
    }
};

/**
 * Normalize the drag and drop message coordinates for the widget's content.
 * @method convertToLocalCoordinates
 * @param {Object} msg A drag and drop message.
 * @returns {Object}
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.convertToLocalCoordinates=function(msg) {
    var rv={};
    if (window.OWF) {
        // New process reads directly off screen coordinates and the browser window position.
	// This is much simpler than finding the page position by summing positions through
	// the element heirarchy.
	for(var k in msg) {
	    rv[k]=msg[k];
	}
	rv.pageX = msg.screenX - this.participant.listener.xOffset;
	rv.pageY = msg.screenY - this.participant.listener.yOffset;
	rv.screenX = msg.screenX;
	rv.screenY = msg.screenY;
    } else {
        // translate to container coordinates
        rv=this.participant.listener.convertToLocalCoordinates(msg);

        // this calculates the position of the iframe relative to the document,
        // accounting for scrolling, padding, etc.  If we started at zero, this
        // would be the iframe's coordinates inside the document.  Instead, we started
        // at the mouse location relative to the adapter, which gives the location
        // of the event inside the iframe content.
        // http://www.kirupa.com/html5/get_element_position_using_javascript.htm

        // should work in most browsers: http://www.quirksmode.org/dom/w3c_cssom.html#elementview
        // IE < 7: will miscalculate by skipping ancestors that are "position:relative"
        // IE, Opera: not work if there's a "position:fixed" in the ancestors
        var element=this.participant.iframe;
        while(element) {
            rv.pageX += (element.offsetLeft - element.scrollLeft + element.clientLeft);
            rv.pageY += (element.offsetTop - element.scrollTop + element.clientTop);
            element = element.offsetParent;
        }
    }
    return rv;
};

//==========================
// Hook the pubsub channels for drag and drop
//==========================

// No action needed, just let the move as normal for these:
// _dragStart: publish, receive
// _dragOverWidget:  publish, receive (not used by client)


/**
 * Cancels the publish, since these should originate from the container, not widgets
 * @method hookPublish_dragOutName
 * @returns {Boolean}
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.hookPublish_dragOutName=function() {return false;};

/**
 * Cancels the publish, since these should originate from the container, not widgets
 * @method hookPublish_dropReceiveData
 * @returns {Boolean}
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.hookPublish_dropReceiveData=function() { return false; };

/**
 * Cancels the receive, since these should not originate from outside the adapter
 * @method hookReceive_dragSendData
 * @returns {Boolean}
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.hookReceive_dragSendData=function() { return false;};

/**
 * Cancels the receive, since these should not originate from outside the adapter
 * @method hookReceive_dragOutName
 * @returns {Boolean}
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.hookReceive_dragOutName=function() { return false;};

/**
 * Cancels the receive, since these should not originate from outside the adapter
 * @method hookReceive_dropReceiveData
 * @returns {Boolean}
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.hookReceive_dropReceiveData=function() { return false; };


/**
 * Starts the drag state.
 * @method hookReceive_dragStart
 * @param {Object} message
 * @returns {Boolean}
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.hookReceive_dragStart=function(message) {
    //console.log("Starting external drag on ",message);
    this.participant.listener.inDrag=true;
    return true;
};

/**
 * Starts the drag state.
 * @method hookPublish_dragStart
 * @param {Object} message
 * @returns {Boolean}
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.hookPublish_dragStart=function(message) {
    //console.log("Starting internal drag on ",message);
    this.participant.listener.inDrag=true;
    return true;
};

/**
 * Stops the drag state.
 * @method hookReceive_dragStopInContainer
 * @returns {Boolean}
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.hookReceive_dragStopInContainer=function(msg) {
    //console.log("Stopping drag in container",msg);
    this.participant.listener.inDrag=false;
    return true;
};

/**
 * Stops the drag state.
 * @method hookReceive_dragStopInWidget
 * @returns {Boolean}
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.hookReceive_dragStopInWidget=function() {
    //console.log("Stopping drag in widget");
    this.participant.listener.inDrag=false;
    return true;
};

/**
 * Stores the drag data in the data.api.
 * @method hookPublish_dragSendData
 * @param {Object} message
 * @returns {Boolean}
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.hookPublish_dragSendData=function(message) {
    //console.log("Setting drag data to ",message);
    this.dataApi.set(ozpIwc.owf7ParticipantModules.Dd.rpcChannel("_dragSendData_value"),{
            "entity":message
        });
    return false;
};

/**
 * Handles drag data if the drag stopped over top of this participant.
 * @method hookPublish_dragStopInWidget
 * @param {Object} message
 * @returns {Boolean} true if stopped in this widget, false if not.
 */
ozpIwc.owf7ParticipantModules.Dd.prototype.hookPublish_dragStopInWidget=function(message) {
    // this always published from the widget that initiated the drag
    // so we need to figure out who to send it to

    // make sure the mouse is actually over the widget so that it can't steal
    // the drag from someone else
    //console.log("hookPublish_dragStopInWidget",message);
    var self = this;
    if(!this.mouseOver) {
        //console.log("dragStopInWidget, but not over myself.  Faking mouse event",this.lastPosition);
        this.onFakeMouseUpFromClient(this.lastPosition);

        //wait 1/4 second, see if someone canceled/handled the drag if not cancel it
        window.setTimeout(function(){
            if(self.participant.listener.inDrag){
                self.dataApi.set(ozpIwc.owf7ParticipantModules.Eventing.pubsubChannel("_dragStopInContainer"),{
                    "entity": Date.now()  // ignored, but changes the value to trigger watches
                });
            }
        },250);

        return false;
    }
    // this widget claims the drag, give it the drag data
    this.dataApi.get(ozpIwc.owf7ParticipantModules.Dd.rpcChannel("_dragSendData_value")).then(function(packet) {
        gadgets.rpc.call(self.participant.rpcId, 'pubsub', null, "_dropReceiveData", "..", packet.entity);
        // tell everyone else that the container took over the drag
        // also handles the case where the we couldn't get the dragData for some reason by
        // canceling the whole drag operation
        // is this duplicative of the same event in _fake_mouse_up?

        self.dataApi.set(ozpIwc.owf7ParticipantModules.Eventing.pubsubChannel("_dragStopInContainer"),{
            "entity": Date.now()  // ignored, but changes the value to trigger watches
        });
    });

    return true;
};
