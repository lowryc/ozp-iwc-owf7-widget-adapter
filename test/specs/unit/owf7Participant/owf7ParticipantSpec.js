describe("Owf7Participant", function() {
    var participant;

    beforeEach(function(done){

        participant = new ozpIwc.owf7.Participant({
            url: "http://www.testhost.com/test/path/name.html",
            rpcId: "fake",
            instanceId: "fake",
            guid: "fake",
            client: {
                data: function(){
                    return {
                        'watch': function(){return Promise.resolve();},
                        'addChild': function(){
                            return Promise.resolve({
                                entity: {
                                    resource: "fake"
                                }
                            });
                        },
                        'removeChild': function(){ return Promise.resolve({ action: "ok" }); },
                        'set': function(){ return Promise.resolve({ action: "ok" }); } 
                    };
                },
                system: function(){
                    return {
                        'get': function(){return Promise.resolve({});},
                    };
                },
                intents: function(){
                    return {};
                }
            },
            listener: {},
            onReady: function(){
                done();
            }
        });
    });
    afterEach(function(){
        document.title = "Unit Tests";
    });
    it("Sets the title to the given name",function(){
        participant.setWidgetTitle("TestTest123");
        expect(document.title).toEqual("TestTest123");
    });
    it("Sets the title to [host + pathname] +  '-- OWF Widget' if no title given",function(){
        participant.setWidgetTitle();
        expect(document.title).toEqual("www.testhost.com/test/path/name.html -- OWF Widget");
    });
});
