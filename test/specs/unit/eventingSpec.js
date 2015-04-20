describe("Eventing", function() {
    var owf7ParticipantListener,
        err,
        rpcMsg,
        functions,
        fn,
        args,
        widgetConfig;

    var expectErr = function(scope,err,fn, args) {
        try {
            fn.apply(scope,args);
            expect("no exception thrown.").toEqual(err);
        } catch (e) {
            expect(e).toEqual(err);
        }
    };


    var participantCallTest = function(rpcCall,scope,fn,args){
        var participant1 = owf7ParticipantListener.addWidget(widgetConfig);
        var participant2 = owf7ParticipantListener.addWidget({
            instanceId: "0000-0000-0000-0000",
            url: "someotherfake.url"
        });
        spyOn(participant1,rpcCall);
        spyOn(participant2, rpcCall);

        fn.apply(rpcMsg,args);

        expect(participant1[rpcCall]).toHaveBeenCalled();
        expect(participant2[rpcCall]).not.toHaveBeenCalled();
    };

    var init = function (){
        owf7ParticipantListener=new ozpIwc.Owf7ParticipantListener({
            xOffset: 1,
            yOffset: 1
        });
        err = owf7ParticipantListener.getParticipant_err;

        functions = owf7ParticipantListener.bridge.funcs.eventing;
        rpcMsg = {
            f: '{"id":"1234-5678-abcd-ef01"}'
        };
        widgetConfig = {
            instanceId: "1234-5678-abcd-ef01",
            url: "somefake.url"
        };
    };

    var destruct = function(){
        for(var i in owf7ParticipantListener.participants){
            document.body.removeChild(owf7ParticipantListener.participants[i].iframe);
        }
    };

    beforeEach(function(){
       init();
    });

    afterEach(function(){
       destruct();
    });

    describe("container_init",function(){
        beforeEach(function(){
            fn = functions.container_init;
            args = [rpcMsg.f, undefined];
        });

        it("can't initialize if the participant does not exist.",function() {
            expectErr(rpcMsg, err, fn, args);
        });

        it("calls the corresponding participant's onContainerInit.",function(){
            participantCallTest('onContainerInit', rpcMsg, fn, args);
        });
    });

    describe("after_container_init",function(){

    });

    describe("pubsub",function(){
        beforeEach(function(){
            fn = functions.pubsub;
        });

        it("can't perform an action if the participant does not exist.",function() {
            expectErr(rpcMsg, err, fn, ['publish','fakeChannel','fakeMessage', rpcMsg.f]);
        });

        it("calls the corresponding participant's onPublish.",function(){
            participantCallTest('onPublish',rpcMsg,fn,['publish','fakeChannel','fakeMessage', rpcMsg.f]);
        });

        it("calls the corresponding participant's onSubscribe.",function(){
            participantCallTest('onSubscribe',rpcMsg,fn,['subscribe','fakeChannel','fakeMessage', rpcMsg.f]);
        });

        it("calls the corresponding participant's onUnsubscribe.",function(){
            participantCallTest('onUnsubscribe',rpcMsg,fn,['unsubscribe','fakeChannel','fakeMessage', rpcMsg.f]);
        });
    });

});