describe("Listener Components Bridging", function() {
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
        listenerHandlers = listener.bridge.funcs.components;

        //Stub a fake participant to spy on bridged handlers
        fakeParticipant = listener.participants[window.name] = {
            components: {
                onLaunchWidget: function () {}
            }
        };
        fakeParticipantHandlers = fakeParticipant.components;
    });

    it("Requires an Owf7ParticipantListener",function(){
        try{
            ozpIwc.owf7BridgeModules.components();
        } catch (e){
            expect(e).toEqual("Needs to have an Owf7ParticipantListener");
        }

        try {
            ozpIwc.owf7BridgeModules.components(listener);
        } catch(e){
            expect("not to happen").toEqual("true");
        }
    });

    it("Is registered to the Listener via its bridge", function(){
        expect(listenerHandlers.keys._widget_iframe_ready).toBeDefined();
        expect(listenerHandlers.widget._WIDGET_LAUNCHER_CHANNEL).toBeDefined();
    });

    describe("RPC Registration calls the appropriate participant handler", function(){
        it("_WIDGET_LAUNCHER_CHANNEL",function(done){
            spyOn(fakeParticipantHandlers,"onLaunchWidget");
            gadgets.rpc.call("..","_WIDGET_LAUNCHER_CHANNEL",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onLaunchWidget).toHaveBeenCalled();
                done();
            });
        });
    });
});