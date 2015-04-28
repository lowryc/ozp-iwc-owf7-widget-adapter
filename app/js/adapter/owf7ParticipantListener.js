(function() {

    var absolutePath = function(href) {
        var link = document.createElement("a");
        link.href = href;
        return (link.protocol+"//"+link.host+link.pathname+link.search+link.hash);
    };

    /**
     *
     * @class Owf7ParticipantListener
     * @namespace ozpIwc
     * @param {Object} config
     * @param {String} config.rpcRelay
     * @param {String} config.prefsUrl
     * @param {Number} config.xOffset
     * @param {Number} config.yOffset
     * @constructor
     */
    ozpIwc.Owf7ParticipantListener=function(config) {
        config = config || {};

        this.rpcRelay=absolutePath(config.rpcRelay || "rpc_relay.uncompressed.html");
        this.prefsUrl=absolutePath(config.prefsUrl || ozpIwc.owf7PrefsUrl || "/owf/prefs");
        this.participants={};

        this.client=new ozpIwc.InternalParticipant();
        this.bridge = config.bridge || new ozpIwc.Owf7Bridge({listener: this});

        ozpIwc.defaultRouter.registerParticipant(this.client);

        if ((window.name === "undefined") || (window.name === "")) {
            window.name = "ContainerWindowName" + Math.random();
        }
        this.installDragAndDrop();

        // try to find our position on screen to help with cross-window drag and drop
        this.xOffset= (typeof config.xOffset !== undefined) ?
            config.xOffset : window.screenX+window.outerWidth - document.body.clientWidth - 10;
        this.yOffset= (typeof config.yOffset !== undefined) ?
            config.yOffset : window.screenY+window.outerHeight - document.body.clientHeight - 30;
    };

    /**
     * Generates a guid the way OWF7 does it.
     * @method makeGuid
     * @returns {string}
     */
    ozpIwc.Owf7ParticipantListener.prototype.makeGuid=function() {
        /*jshint bitwise: false*/
        // not a real guid, but it's the way OWF 7 does it
        var S4=function(){
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        };
        return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    };

    /**
     * Updates the xOffset & yOffset from the given MouseEvent object.
     * @method updateMouseCoordinates
     * @param {MouseEvent} e
     */
    ozpIwc.Owf7ParticipantListener.prototype.updateMouseCoordinates=function(e) {
        //console.log("Updating coords from("+this.xOffset+","+this.yOffset+")");
        this.xOffset=e.screenX-e.clientX;
        this.yOffset=e.screenY-e.clientY;
        //console.log("     to ("+this.xOffset+","+this.yOffset+")");
    };

    /**
     * Normalize the drag and drop message coordinates for the listener's content.
     * @method convertToLocalCoordinates
     * @param {Object} msg
     * @param {Object} element
     * @returns {Object}
     */
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

    /**
     * Creates a Owf7Participant for the given widget and registers its widget state channel.
     * @method addWidget
     * @param {Object} config
     * @param {String} [config.instanceId] a guid is assigned if not given.
     * @param {String} config.url the url of the widget
     * @param {String} [config.launchDataResource] a resource path of data to be used for the launch of the widget.
     * @returns {*}
     */
    ozpIwc.Owf7ParticipantListener.prototype.addWidget=function(config) {
        var self = this;
        var participantConfig = {};

        for(var i in config){
            participantConfig[i] = config[i];
        }

        participantConfig.instanceId = config.instanceId || this.makeGuid();
        participantConfig.listener = self;
        participantConfig.client = new ozpIwc.InternalParticipant();
        participantConfig.rpcId = gadgets.json.stringify({id:participantConfig.instanceId});


        // Update the hash in case the user refreshes. Then create the participant/register RPC
        function init(cfg) {
            var hashObj = {},
                newHash = "#";

            if(cfg.guid){
                hashObj.guid = cfg.guid;
            }
            if(cfg.instanceId){
                hashObj.instanceId= cfg.instanceId;
            }

            // Serialize the hash and add it to the location.
            for (var i in hashObj) {
                newHash += i + "=" + hashObj[i] + "&";
            }
            newHash = newHash.substring(0, newHash.length - 1);
            window.location.hash = newHash;

            // After storing the hash, if the guid does not exist just set it as instanceId for OWF7 to not complain.
            cfg.guid = cfg.guid || cfg.instanceId;
            cfg.listener.participants[cfg.rpcId] = new ozpIwc.Owf7Participant(cfg);

            // Add the _WIDGET_STATE_CHANNEL_<instanceId> RPC registration for the widget.
            // @see js\state\WidgetStateContainer.js:35
            var widgetRegistrations = {'state': {}};
            widgetRegistrations.state['_WIDGET_STATE_CHANNEL_' + cfg.instanceId] = function(){};
            self.bridge.addHandlers(widgetRegistrations);

            return cfg.listener.participants[cfg.rpcId];
        }

        ozpIwc.defaultRouter.registerParticipant(participantConfig.client);

        // If there was a IWC launch resource, go gather it
        if (config.launchDataResource) {
            participantConfig.client.send({
                dst: "intents.api",
                action: "get",
                resource: config.launchDataResource
            }, function (resp,done) {
                // If the widget is refreshed, the launch resource data has been deleted.
                if (resp && resp.entity && resp.entity.entity && typeof resp.entity.entity.id === "string") {
                    participantConfig.guid = resp.entity.entity.id;
                }
                done();
                return init(participantConfig);
            });
        } else {
            return init(participantConfig);
        }
    };

    /**
     * Notifies the IWC that a legacy widget has canceled dragging.
     * @method cancelDrag
     */
    ozpIwc.Owf7ParticipantListener.prototype.cancelDrag=function() {
        this.inDrag=false;
        this.client.send({
            "dst": "data.api",
            "resource": ozpIwc.owf7ParticipantModules.Eventing.pubsubChannel("_dragStopInContainer"),
            "action": "set",
            "entity": Date.now()  // ignored, but changes the value to trigger watches
        });
    };

    /**
     * Adds the capability of drag and drop to the container.
     * @method installDragAndDrop
     */
    ozpIwc.Owf7ParticipantListener.prototype.installDragAndDrop=function() {
        var self=this;
        var updateMouse=function(evt) {self.updateMouseCoordinates(evt);};

        document.addEventListener("mouseenter",updateMouse);
        document.addEventListener("mouseout",updateMouse);

        this.client.send({
           "dst":"data.api",
           "resource": ozpIwc.owf7ParticipantModules.Eventing.pubsubChannel("_dragStart"),
           "action": "watch"
        },function(reply) {
            if(reply.response === "changed") {
                self.inDrag=true;
            }
        });
        this.client.send({
            "dst": "data.api",
            "resource": ozpIwc.owf7ParticipantModules.Eventing.pubsubChannel("_dragStopInContainer"),
            "action": "watch"
        },function(reply) {
            if(reply.response === "changed") {
                self.inDrag=false;
            }
        });

        document.addEventListener("mousemove",function(e) {
            /*jshint bitwise: false*/
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


    /**
     * Returns the participant if it registered to the listener, throws an exception if it does not.
     * @method getParticipant
     * @param id
     * @returns {Object}
     */
    ozpIwc.Owf7ParticipantListener.prototype.getParticipant = function(id){
        var p=this.participants[id];
        if(!p) {
            throw this.getParticipant_err;
        }
        return p;
    };

    /**
     * The error message passed when a desired participant does not exist in the listener.
     * @property getParticipant_err
     * @type {string}
     */
    ozpIwc.Owf7ParticipantListener.prototype.getParticipant_err = "Uknown participant";
})();