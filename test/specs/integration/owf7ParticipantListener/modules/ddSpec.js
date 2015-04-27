describe("Drag and Drop", function() {
    var owf7ParticipantListener,testConfig,functions;

    beforeEach(function(){
        var config = initTestListener();
        owf7ParticipantListener = config.listener;
        functions = config.functions.dd;

        testConfig = {
            'listener': owf7ParticipantListener,
            'err': config.err,
            'rpcMsg': config.rpcMsg,
            'module': 'dd',
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

    describe("_fake_mouse_move",function(){
        beforeEach(function(){
            testConfig.fn = functions._fake_mouse_move;
            testConfig.handler = 'onFakeMouseMoveFromClient';
        });

        it("can't initialize if the participant does not exist.",function() {
            expectErr(testConfig);
        });

        it("calls the corresponding participant's onContainerInit.",function(){
            participantCallTest(testConfig);
        });
    });


    describe("_fake_mouse_up",function(){
        beforeEach(function(){
            testConfig.fn = functions._fake_mouse_up;
            testConfig.handler = 'onFakeMouseUpFromClient';
        });

        it("can't initialize if the participant does not exist.",function() {
            expectErr(testConfig);
        });

        it("calls the corresponding participant's onContainerInit.",function(){
            participantCallTest(testConfig);
        });
    });


});