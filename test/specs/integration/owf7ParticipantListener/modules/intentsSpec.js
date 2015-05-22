describe("Eventing", function() {
    var owf7ParticipantListener,testConfig,functions;

    beforeEach(function(){
        var config = initTestListener();
        owf7ParticipantListener = config.listener;
        functions = config.functions.intents;

        testConfig = {
            'listener': owf7ParticipantListener,
            'err': config.err,
            'rpcMsg': config.rpcMsg,
            'module': 'intents',
            'scope': config.rpcMsg,
            'from': config.rpcMsg.f,
            'widgetConfig': config.widgetConfig,
            'fn': undefined, //specify in test
            'args': [] //specify in test if needed
        };
    });

    afterEach(function(){
        destructTestListener(owf7ParticipantListener);
    });

    describe("_intents",function(){
        beforeEach(function(){
            testConfig.fn = functions._intents;
            testConfig.handler = 'onIntents';
        });

        pit("calls the corresponding participant's onIntents.",function(){
            return participantCallTest(testConfig);
        });
    });

    describe("_intents_receive",function(){
        beforeEach(function(){
            testConfig.fn = functions._intents_receive;
            testConfig.handler = 'onIntentsReceive';
        });

        pit("calls the corresponding participant's onIntentsReceive.",function(){
            return participantCallTest(testConfig);
        });
    });
});