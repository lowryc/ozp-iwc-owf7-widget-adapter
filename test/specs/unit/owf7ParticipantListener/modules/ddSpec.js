describe("Listener Drag and Drop Bridging", function() {
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
        listenerHandlers = listener.bridge.funcs.dd;

        //Stub a fake participant to spy on bridged handlers
        fakeParticipant = listener.participants[window.name] = {
            dd: {
                onFakeMouseMoveFromClient: function () {},
                onFakeMouseUpFromClient: function () {}
            }
        };
        fakeParticipantHandlers = fakeParticipant.dd;
    });

    it("Requires an Owf7ParticipantListener",function(){
        try{
            ozpIwc.owf7BridgeModules.dd();
        } catch (e){
            expect(e).toEqual("Needs to have an Owf7ParticipantListener");
        }

        try {
            ozpIwc.owf7BridgeModules.dd(listener);
        } catch(e){
            expect("not to happen").toEqual("true");
        }
    });

    it("Is registered to the Listener via its bridge", function(){
        expect(listenerHandlers._fake_mouse_move).toBeDefined();
        expect(listenerHandlers._fake_mouse_up).toBeDefined();
        expect(listenerHandlers._fake_mouse_out).toBeDefined();
    });

    describe("RPC Registration calls the appropriate participant handler", function(){
        it("_fake_mouse_move",function(done){
            spyOn(fakeParticipantHandlers,"onFakeMouseMoveFromClient");
            gadgets.rpc.call("..","_fake_mouse_move",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onFakeMouseMoveFromClient).toHaveBeenCalled();
                done();
            });
        });

        it("_fake_mouse_up",function(done){
            spyOn(fakeParticipantHandlers,"onFakeMouseUpFromClient");
            gadgets.rpc.call("..","_fake_mouse_up",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onFakeMouseUpFromClient).toHaveBeenCalled();
                done();
            });
        });
    });
});