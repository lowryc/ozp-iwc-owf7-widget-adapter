describe("Listener Components Intents", function() {
    var listener,listenerHandlers,
        fakeParticipant,fakeParticipantHandlers;

    /**
     * put this function call on the end of the event loop.
     * @param fn
     */
    function delayForRPC(fn){
        window.setTimeout(fn,0);
    }

    beforeEach(function(){
        listener = new ozpIwc.Owf7ParticipantListener();
        listenerHandlers = listener.bridge.funcs.intents;

        //Stub a fake participant to spy on bridged handlers
        fakeParticipant = listener.participants[window.name] = {
            intents: {
                onIntents: function () {},
                onIntentsReceive: function () {}
            }
        };
        fakeParticipantHandlers = fakeParticipant.intents;
    });

    it("Requires an Owf7ParticipantListener",function(){
        try{
            ozpIwc.owf7BridgeModules.intents();
        } catch (e){
            expect(e).toEqual("Needs to have an Owf7ParticipantListener");
        }

        try {
            ozpIwc.owf7BridgeModules.intents(listener);
        } catch(e){
            expect("not to happen").toEqual("true");
        }
    });

    it("Is registered to the Listener via its bridge", function(){
        expect(listenerHandlers._intents).toBeDefined();
        expect(listenerHandlers._intents_receive).toBeDefined();
    });

    describe("RPC Registration calls the appropriate participant handler", function(){
        it("_intents",function(done){
            spyOn(fakeParticipantHandlers,"onIntents");
            gadgets.rpc.call("..","_intents",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onIntents).toHaveBeenCalled();
                done();
            });
        });

        it("_intents_receive",function(done){
            spyOn(fakeParticipantHandlers,"onIntentsReceive");
            gadgets.rpc.call("..","_intents_receive",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onIntentsReceive).toHaveBeenCalled();
                done();
            });
        });
    });
});