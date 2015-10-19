

function promises(fn) {
    return function(done) {
        fn().then(
            done,
            function(error) {
                expect(error).toNotHappen();
                done();
            }
        );
    };
}

function pit(desc,fn) {
    return it(desc,promises(fn));
}

function pBeforeEach(desc,fn) {
    return beforeEach(desc,promises(fn));
}

function pAfterEach(desc,fn) {
    return afterEach(desc,promises(fn));
}

var expectErr = function(config) {
    if(!config.scope){throw "Needs scope";}
    if(!config.err){throw "Needs err";}
    if(!config.fn){throw "Needs fn";}
    if(!config.args){throw "Needs args";}
    try {
        config.fn.apply(config.scope,config.args);
        expect("no exception thrown.").toEqual(config.err);
    } catch (e) {
        expect(e).toEqual(config.err);
    }
};

var participantCallTest = function(config){
    if(!config.listener){throw "Needs listener";}
    if(!config.module){throw "Needs module";}
    if(!config.handler){throw "Needs handler";}
    if(!config.scope){throw "Needs scope";}
    if(!config.fn){throw "Needs fn";}
    if(!config.widgetConfig){throw "Needs widgetConfig";}
    if(!config.args){throw "Needs args";}


    var participant1,participant2;
    return config.listener.addWidget(config.widgetConfig).then(function(participant){
        participant1 = participant;
        return config.listener.addWidget({
            instanceId: "0000-0000-0000-0000",
            url: "someotherfake.url"
        });
    }).then(function(participant){
        participant2 = participant;
        spyOn(participant1[config.module],config.handler);
        spyOn(participant2[config.module], config.handler);

        config.fn.apply(config.scope,config.args);

        expect(participant1[config.module][config.handler]).toHaveBeenCalled();
        expect(participant2[config.module][config.handler]).not.toHaveBeenCalled();
    });
};
var initTestListener = function (){
    var listener = new ozpIwc.owf7.ParticipantListener({
        peerUrl: window.location.origin,
        xOffset: 1,
        yOffset: 1
    });
    return {
        'listener':listener,
        'functions': listener.bridge.funcs,
        'rpcMsg': {f: '{"id":"1234-5678-abcd-ef01"}'},
        'widgetConfig': {
            instanceId: "1234-5678-abcd-ef01",
            url: "somefake.url"
        }
    };
};

var destructTestListener = function(listener){
    for(var i in listener.participants){
        document.body.removeChild(listener.participants[i].iframe);
    }
};