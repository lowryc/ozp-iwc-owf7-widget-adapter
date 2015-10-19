describe("Listener Kernel Bridging", function() {
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
        listener = new ozpIwc.owf7.ParticipantListener({
            peerUrl: window.location.origin
        });
        listenerHandlers = listener.bridge.funcs.kernel;

        //Stub a fake participant to spy on bridged handlers
        fakeParticipant = listener.participants[window.name] = {
            kernel: {
                onGetWidgetReady: function () {},
                onWidgetReady: function () {},
                onRegisterFunctions: function () {},
                onGetFunctions: function () {},
                onFunctionCall: function () {},
                onFunctionCallResult: function () {},
                onListWidgets: function () {},
                onDirectMessage: function () {},
                onAddEvent: function () {},
                onCallEvent: function () {}
            }
        };
        fakeParticipantHandlers = fakeParticipant.kernel;
    });

    it("Requires an owf7 ParticipantListener",function(){
        try{
            ozpIwc.owf7.bridgeModules.kernel();
        } catch (e){
            expect(e).toEqual("Needs to have an owf7 ParticipantListener");
        }

        try {
            ozpIwc.owf7.bridgeModules.kernel(listener);
        } catch(e){
            expect("not to happen").toEqual("true");
        }
    });

    it("Is registered to the Listener via its bridge", function(){
        expect(listenerHandlers._getWidgetReady).toBeDefined();
        expect(listenerHandlers._widgetReady).toBeDefined();
        expect(listenerHandlers.register_functions).toBeDefined();
        expect(listenerHandlers.GET_FUNCTIONS).toBeDefined();
        expect(listenerHandlers.FUNCTION_CALL).toBeDefined();
        expect(listenerHandlers.FUNCTION_CALL_RESULT).toBeDefined();
        expect(listenerHandlers.LIST_WIDGETS).toBeDefined();
        expect(listenerHandlers.DIRECT_MESSAGE).toBeDefined();
        expect(listenerHandlers.ADD_EVENT).toBeDefined();
        expect(listenerHandlers.CALL_EVENT).toBeDefined();
    });

    describe("RPC Registration calls the appropriate participant handler", function(){
        it("_getWidgetReady",function(done){
            spyOn(fakeParticipantHandlers,"onGetWidgetReady");
            gadgets.rpc.call("..","_getWidgetReady",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onGetWidgetReady).toHaveBeenCalled();
                done();
            });
        });

        it("_widgetReady",function(done){
            spyOn(fakeParticipantHandlers,"onWidgetReady");
            gadgets.rpc.call("..","_widgetReady",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onWidgetReady).toHaveBeenCalled();
                done();
            });
        });

        it("register_functions",function(done){
            spyOn(fakeParticipantHandlers,"onRegisterFunctions");
            gadgets.rpc.call("..","register_functions",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onRegisterFunctions).toHaveBeenCalled();
                done();
            });
        });

        it("GET_FUNCTIONS",function(done){
            spyOn(fakeParticipantHandlers,"onGetFunctions");
            gadgets.rpc.call("..","GET_FUNCTIONS",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onGetFunctions).toHaveBeenCalled();
                done();
            });
        });

        it("FUNCTION_CALL",function(done){
            spyOn(fakeParticipantHandlers,"onFunctionCall");
            gadgets.rpc.call("..","FUNCTION_CALL",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onFunctionCall).toHaveBeenCalled();
                done();
            });
        });
        it("FUNCTION_CALL",function(done){
            spyOn(fakeParticipantHandlers,"onFunctionCallResult");
            gadgets.rpc.call("..","FUNCTION_CALL_RESULT",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onFunctionCallResult).toHaveBeenCalled();
                done();
            });
        });

        it("GET_FUNCTIONS",function(done){
            spyOn(fakeParticipantHandlers,"onGetFunctions");
            gadgets.rpc.call("..","GET_FUNCTIONS",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onGetFunctions).toHaveBeenCalled();
                done();
            });
        });

        it("LIST_WIDGETS",function(done){
            spyOn(fakeParticipantHandlers,"onListWidgets");
            gadgets.rpc.call("..","LIST_WIDGETS",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onListWidgets).toHaveBeenCalled();
                done();
            });
        });

        it("DIRECT_MESSAGE",function(done){
            spyOn(fakeParticipantHandlers,"onDirectMessage");
            gadgets.rpc.call("..","DIRECT_MESSAGE",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onDirectMessage).toHaveBeenCalled();
                done();
            });
        });

        it("ADD_EVENT",function(done){
            spyOn(fakeParticipantHandlers,"onAddEvent");
            gadgets.rpc.call("..","ADD_EVENT",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onAddEvent).toHaveBeenCalled();
                done();
            });
        });

        it("CALL_EVENT",function(done){
            spyOn(fakeParticipantHandlers,"onCallEvent");
            gadgets.rpc.call("..","CALL_EVENT",null);
            delayForRPC(function(){
                expect(fakeParticipantHandlers.onCallEvent).toHaveBeenCalled();
                done();
            });
        });
    });
});