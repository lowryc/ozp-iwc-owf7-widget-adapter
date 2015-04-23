describe("Kernel", function() {
    var owf7ParticipantListener,testConfig,functions;

    beforeEach(function(){
        var config = initTestListener();
        owf7ParticipantListener = config.listener;
        functions = config.functions.kernel;

        testConfig = {
            'listener': owf7ParticipantListener,
            'err': config.err,
            'rpcMsg': config.rpcMsg,
            'module': 'kernel',
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

    describe("_getWidgetReady",function(){
        beforeEach(function(){
            testConfig.fn = functions._getWidgetReady;
            testConfig.handler = 'onGetWidgetReady';
        });

        it("can't initialize if the participant does not exist.",function() {
            expectErr(testConfig);
        });

        it("calls the corresponding participant's onContainerInit.",function(){
            participantCallTest(testConfig);
        });
    });

    describe("_widgetReady",function(){
        beforeEach(function(){
            testConfig.fn = functions._widgetReady;
            testConfig.handler = 'onWidgetReady';
        });

        it("can't initialize if the participant does not exist.",function() {
            expectErr(testConfig);
        });

        it("calls the corresponding participant's onContainerInit.",function(){
            participantCallTest(testConfig);
        });
    });
    describe("register_functions",function(){
        beforeEach(function(){
            testConfig.fn = functions.register_functions;
            testConfig.handler = 'onRegisterFunctions';
        });

        it("can't initialize if the participant does not exist.",function() {
            expectErr(testConfig);
        });

        it("calls the corresponding participant's onContainerInit.",function(){
            participantCallTest(testConfig);
        });
    });
    describe("GET_FUNCTIONS",function(){
        beforeEach(function(){
            testConfig.fn = functions.GET_FUNCTIONS;
            testConfig.handler = 'onGetFunctions';
        });

        it("can't initialize if the participant does not exist.",function() {
            expectErr(testConfig);
        });

        it("calls the corresponding participant's onContainerInit.",function(){
            participantCallTest(testConfig);
        });
    });
    describe("FUNCTION_CALL",function(){
        beforeEach(function(){
            testConfig.fn = functions.FUNCTION_CALL;
            testConfig.handler = 'onFunctionCall';
        });

        it("can't initialize if the participant does not exist.",function() {
            expectErr(testConfig);
        });

        it("calls the corresponding participant's onContainerInit.",function(){
            participantCallTest(testConfig);
        });
    });
    describe("FUNCTION_CALL_RESULT",function(){
        beforeEach(function(){
            testConfig.fn = functions.FUNCTION_CALL_RESULT;
            testConfig.handler = 'onFunctionCallResult';
        });

        it("can't initialize if the participant does not exist.",function() {
            expectErr(testConfig);
        });

        it("calls the corresponding participant's onContainerInit.",function(){
            participantCallTest(testConfig);
        });
    });
    describe("LIST_WIDGETS",function(){
        beforeEach(function(){
            testConfig.fn = functions.LIST_WIDGETS;
            testConfig.handler = 'onListWidgets';
        });

        it("can't initialize if the participant does not exist.",function() {
            expectErr(testConfig);
        });

        it("calls the corresponding participant's onContainerInit.",function(){
            participantCallTest(testConfig);
        });
    });
});