
/* jshint unused:false */
var ozpIwc = ozpIwc || {};

// doneSemaphore & tick aren't used locally.

var customMatchers={
	toBeInstanceOf: function(util, customEqualityTesters) { return {
		compare: function(actual,expected) {
			var result={ pass: actual instanceof expected };
			if(result.pass) {
				result.message="Expected " + actual + " to NOT be an instance of " + expected;
			} else {
				result.message="Expected " + actual + " to be an instance of " + expected;
			}
			return result;
		}
	};},
	toBeApproximately: function(util, customEqualityTesters) { return {
		compare: function(actual,expected,epsilon) {
			if(typeof(epsilon) !== "number") {
				epsilon=1e-5;
			}
			return {pass: Math.abs(actual-expected) <= epsilon * Math.abs(expected)};
		}
	};},
    toBeWithinRange: function(util, customEqualityTesters) { return {
        //compares epsilon against the range-scaled absolute error
        compare: function(actual,expected,range,epsilon) {
            if(typeof(epsilon) !== "number") {
                epsilon=1e-5;
            }
            return {pass: Math.abs(actual-expected)/ Math.abs(range) <= epsilon};
        }
    };},
	toContainAll: function(util, customEqualityTesters) { return {
		compare: function(actual,expected) {
			var missing=[];
			
			for(var i=0; i < expected.length;++i) {
				if(!util.contains(actual,expected[i],customEqualityTesters)) {
					missing.push(expected[i]);
				}
			}
			
			if(missing.length === 0) {
				return {
					pass: true,
					message: "Expected " + actual + " to not contain [" + expected.join(",") + "]"
				};
			} else {
				return {
					pass: false,
					message: "Expected " + actual + " to contain [" + missing.join(",") + "]"
				};
			}
		}
	};}
};

beforeEach(function() {
    jasmine.addMatchers(customMatchers);
    jasmine.clock().install();
});


function doneSemaphore(count,done) {
    return function() { 
        if(--count <= 0) {
            done();
        }
    };
}

//================================================
// Time-advancement for IWC objects that use time
//================================================

var clockOffset=0;

var tick=function(t) { 
	clockOffset+=t;
	try {
		jasmine.clock().tick(t);
	} catch (e) {
		// do nothing
	}
};

// mock out the now function to let us fast forward time
ozpIwc.util.now=function() {
	return new Date().getTime() + clockOffset;
};

ozpIwc.testUtil = ozpIwc.testUtil || {};

ozpIwc.testUtil.dataGenerator = function (size) {
    var result = "";
    var chars = "abcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < size; i++) {
        result += chars.substr(Math.floor(Math.random() * 26), 1);
    }
    return result;
};

ozpIwc.testUtil.transportPacketGenerator = function (entity) {
    return {
        msgId: ozpIwc.util.generateId(),
        entity: entity
    };
};

ozpIwc.testUtil.networkPacketGenerator = function (link,transportPacket) {
    return {
        sequence: link.peer.sequenceCounter++,
        srcPeer: ozpIwc.util.generateId(),
        data: transportPacket,
        ver:0,
        src: "testSrc",
        dst: "testDst",
        msgId: "i:0"
    };
};
ozpIwc.testUtil.testPacket = function(link,size){
    return ozpIwc.testUtil.networkPacketGenerator(link,
        ozpIwc.testUtil.transportPacketGenerator(ozpIwc.testUtil.dataGenerator(size)));
};
ozpIwc.testUtil.BrowsingContext = function(onLoad,msgHandler,id){
    this.msgQueue = this.msgQueue || [];

    var msgEvent = function(e){
        if(e.data !== "") {
            var message;
            try {
                if (typeof(e.data) === 'string') {
                    if(e.data.indexOf("setImmediate$") == -1) {
                        message = JSON.parse(e.data);
                    }
                } else {
                    message = e.data;
                }
            } catch (e) {
                console.error(e);
            }
            if (message !== "") {
                msgHandler(message, self);
            }
        }
    };

    var scripts = [ 'var ozpIwc = ozpIwc || {}; ozpIwc.enableDefault=false; var msgHandler = ' + msgHandler.toString() + ';' +
        'window.addEventListener("message",'+msgEvent.toString()+',false);',
            '('+onLoad.toString()+')();'];

    this.iframe = document.createElement("iframe");
    this.iframe.id = id || "iframe";
    this.iframe.height = 10;
    this.iframe.width = 10;
    var html = '<body></body>';

    document.body.appendChild(this.iframe);
    this.iframe.contentWindow.document.write("<!DOCTYPE html><html><body></body></html>");
    this.addScript('text',scripts[0])
        .then(this.addScript('src','/js/ozpIwc-bus.js'))
        .then(this.addScript('text',scripts[1]))
        .then(this.ready);

    this.iframe.style = "display:none !important;";
};

ozpIwc.testUtil.BrowsingContext.prototype.wrapReady = function(val){
//    return 'document.addEventListener("DOMContentLoaded", function() {' + val + '});';
    return val;
};

ozpIwc.testUtil.BrowsingContext.prototype.addScript = function(type,val){
    var script = this.iframe.contentWindow.document.createElement('script');
    script.type = "text/javascript";

    switch(type){
        case 'text':
            script.text = this.wrapReady(val);
            this.iframe.contentWindow.document.body.appendChild(script);
            return new Promise(function(res,rej) {
                res();
            });
            break;

        case 'src':
        default:
            var xhrObj = new XMLHttpRequest();
            // open and send a synchronous request
            xhrObj.open('GET', val, false);
            xhrObj.send('');
            script.text = this.wrapReady(xhrObj.responseText);
            this.iframe.contentWindow.document.body.appendChild(script);

            return new Promise(function(res,rej) {
                if (script.readyState) {  //IE
                    script.onreadystatechange = function () {
                        if (script.readyState === "loaded" || script.readyState === "complete") {
                            script.onreadystatechange = null;
                            res();
                        }
                    };
                } else {//others
                    script.onload = function () {
                        res();
                    }
                }
            });
            break;
    }

};

ozpIwc.testUtil.BrowsingContext .prototype.ready = function() {
    return new Promise(function(res,rej){
        this.ready = true;
        for(var i in this.msgQueue){
            this.send(this.msgQueue[i]);
        }
        this.msgQueue = [];
        res();
    });
};

ozpIwc.testUtil.BrowsingContext .prototype.send = function(message){
    if(!this.ready){
        this.msgQueue.push(message);
    } else {
        ozpIwc.util.safePostMessage(this.iframe.contentWindow,message,'*');
    }
};