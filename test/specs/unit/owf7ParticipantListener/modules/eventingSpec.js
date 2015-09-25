describe("Listener Eventing Bridging", function() {
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
        listener = new ozpIwc.owf7.ParticipantListener();
        listenerHandlers = listener.bridge.funcs.eventing;

        //Stub a fake participant to spy on bridged handlers
        fakeParticipant = listener.participants[window.name] = {
            eventing: {
                onContainerInit: function () {},
                onPubsub: function () {}
            }
        };
        fakeParticipantHandlers = fakeParticipant.eventing;
    });

    it("Requires an owf7 ParticipantListener",function(){
        try{
            ozpIwc.owf7.bridgeModules.eventing();
        } catch (e){
            expect(e).toEqual("Needs to have an owf7 ParticipantListener");
        }

        try {
            ozpIwc.owf7.bridgeModules.eventing(listener);
        } catch(e){
            expect("not to happen").toEqual("true");
        }
    });

    it("Is registered to the Listener via its bridge", function(){
        expect(listenerHandlers.container_init).toBeDefined();
        expect(listenerHandlers.pubsub).toBeDefined();
    });

    describe("RPC Registration calls the appropriate participant handler", function(){
        it("container_init",function(done){
            spyOn(fakeParticipantHandlers,"onContainerInit");
            gadgets.rpc.call("..","container_init",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onContainerInit).toHaveBeenCalled();
                done();
            });

        });

        it("pubsub",function(done){
            spyOn(fakeParticipantHandlers,"onPubsub");
            gadgets.rpc.call("..","pubsub",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onPubsub).toHaveBeenCalled();
                done();
            });
        });
    });
});