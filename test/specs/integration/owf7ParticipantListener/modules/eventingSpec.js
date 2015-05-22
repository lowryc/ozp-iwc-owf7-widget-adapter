describe("Eventing", function() {
    var owf7ParticipantListener,testConfig,functions;

    beforeEach(function(){
        var config = initTestListener();
        owf7ParticipantListener = config.listener;
        functions = config.functions.eventing;

        testConfig = {
            'listener': owf7ParticipantListener,
            'rpcMsg': config.rpcMsg,
            'module': 'eventing',
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

    describe("container_init",function(){
        beforeEach(function(){
            testConfig.fn = functions.container_init;
            testConfig.handler = 'onContainerInit';
        });

        pit("calls the corresponding participant's onContainerInit.",function(){
            return participantCallTest(testConfig);
        });
    });

    describe("after_container_init",function(){

    });

    describe("pubsub",function(){
        beforeEach(function(){
            testConfig.fn = functions.pubsub;
        });

        pit("calls the corresponding participant's onPublish.",function(){
            testConfig.handler = 'onPublish';
            testConfig.args[0] ='publish';
            return participantCallTest(testConfig);
        });

        pit("calls the corresponding participant's onSubscribe.",function(){
            testConfig.handler = 'onSubscribe';
            testConfig.args[0] ='subscribe';
            return  participantCallTest(testConfig);
        });

        pit("calls the corresponding participant's onUnsubscribe.",function(){
            testConfig.handler = 'onUnsubscribe';
            testConfig.args[0] ='unsubscribe';
            return participantCallTest(testConfig);
        });
    });
});