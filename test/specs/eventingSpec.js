describe("Eventing", function() {
    var client;
    beforeEach(function(done) {
        client=new ozpIwc.Client({peerUrl:"http://localhost:16000"});
        client.connect().then(done);
    });
    
    it("OWF.Eventing.publish()",function(done) {
        client.api("data.api").watch("/owf-legacy/eventing/test.channel",function(e,unregister) {
                expect(e.entity.newValue).toEqual({'foo':1});
                unregister();
                done();
        }).then(function() {
            OWF.Eventing.publish("test.channel",{
                'foo': 1
            });
        });
    });
    
    it("OWF.Eventing.subscribe()",function(done) {
        OWF.Eventing.subscribe("test.channel", function(sender,msg,channel) {
            OWF.Eventing.unsubscribe("test.channel");
            expect(JSON.parse(msg)).toEqual({'foo':1});
            done();
        });
        setTimeout(function() {
            client.api("data.api").set("/owf-legacy/eventing/test.channel",{
                entity: {
                    foo: 1
                }
            });
        },10);
    });
    it("OWF.Eventing.unsubscribe()",function(done) {
        OWF.Eventing.subscribe("test.channel", function(sender,msg,channel) {
            console.log("subscribe callback",arguments);
            OWF.Eventing.unsubscribe("test.channel");
            expect(JSON.parse(msg)).toEqual({'foo':1});
            // Jasmine allows you to call done() multiple times.
            // normally this is a problem, but it works well for this test since
            // it makes a second call even uglier
            done();
        });
        setTimeout(function() {
            client.api("data.api").set("/owf-legacy/eventing/test.channel",{
                entity: {
                    foo: 1
                }
            });
            // first message will unsubscribe.  Second message should be ignored.
            client.api("data.api").set("/owf-legacy/eventing/test.channel",{
                entity: {
                    foo: 2
                }
            });
        },10);
    });

});