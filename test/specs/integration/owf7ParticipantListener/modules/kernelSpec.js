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

        pit("calls the corresponding participant's onGetWidgetReady.",function(){
            return participantCallTest(testConfig);
        });
    });

    describe("_widgetReady",function(){
        beforeEach(function(){
            testConfig.fn = functions._widgetReady;
            testConfig.handler = 'onWidgetReady';
        });

        pit("calls the corresponding participant's onWidgetReady.",function(){
            return participantCallTest(testConfig);
        });
    });
    describe("register_functions",function(){
        beforeEach(function(){
            testConfig.fn = functions.register_functions;
            testConfig.handler = 'onRegisterFunctions';
        });

        pit("calls the corresponding participant's onRegisterFunctions.",function(){
            return participantCallTest(testConfig);
        });
    });
    describe("GET_FUNCTIONS",function(){
        beforeEach(function(){
            testConfig.fn = functions.GET_FUNCTIONS;
            testConfig.handler = 'onGetFunctions';
        });

        pit("calls the corresponding participant's onGetFunctions.",function(){
            return participantCallTest(testConfig);
        });
    });
    describe("FUNCTION_CALL",function(){
        beforeEach(function(){
            testConfig.fn = functions.FUNCTION_CALL;
            testConfig.handler = 'onFunctionCall';
        });

        pit("calls the corresponding participant's onFunctionCall.",function(){
            return participantCallTest(testConfig);
        });
    });
    describe("FUNCTION_CALL_RESULT",function(){
        beforeEach(function(){
            testConfig.fn = functions.FUNCTION_CALL_RESULT;
            testConfig.handler = 'onFunctionCallResult';
        });

        pit("calls the corresponding participant's onFunctionCallResult.",function(){
            return participantCallTest(testConfig);
        });
    });
    describe("LIST_WIDGETS",function(){
        beforeEach(function(){
            testConfig.fn = functions.LIST_WIDGETS;
            testConfig.handler = 'onListWidgets';
        });

        pit("calls the corresponding participant's onListWidgets.",function(){
            return participantCallTest(testConfig);
        });
    });
    describe("DIRECT_MESSAGE",function(){
        beforeEach(function(){
            testConfig.fn = functions.DIRECT_MESSAGE;
            testConfig.handler = 'onDirectMessage';
        });

        pit("calls the corresponding participant's onDirectMessage.",function(){
            return participantCallTest(testConfig);
        });
    });

    describe("DIRECT_MESSAGE",function(){
        beforeEach(function(){
            testConfig.fn = functions.DIRECT_MESSAGE;
            testConfig.handler = 'onDirectMessage';
        });

        pit("calls the corresponding participant's onDirectMessage.",function(){
            return participantCallTest(testConfig);
        });
    });

    describe("ADD_EVENT",function(){
        beforeEach(function(){
            testConfig.fn = functions.ADD_EVENT;
            testConfig.handler = 'onAddEvent';
        });

        pit("calls the corresponding participant's onAddEvent.",function(){
            return participantCallTest(testConfig);
        });
    });

    describe("CALL_EVENT",function(){
        beforeEach(function(){
            testConfig.fn = functions.CALL_EVENT;
            testConfig.handler = 'onCallEvent';
        });

        pit("calls the corresponding participant's onCallEvent.",function(){
            return participantCallTest(testConfig);
        });
    });
});