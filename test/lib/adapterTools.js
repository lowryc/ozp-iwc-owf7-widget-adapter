

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


    var participant1 = config.listener.addWidget(config.widgetConfig);
    var participant2 = config.listener.addWidget({
        instanceId: "0000-0000-0000-0000",
        url: "someotherfake.url"
    });
    spyOn(participant1[config.module],config.handler);
    spyOn(participant2[config.module], config.handler);

    config.fn.apply(config.scope,config.args);

    expect(participant1[config.module][config.handler]).toHaveBeenCalled();
    expect(participant2[config.module][config.handler]).not.toHaveBeenCalled();
};
var initTestListener = function (){
    var listener = new ozpIwc.Owf7ParticipantListener({
        xOffset: 1,
        yOffset: 1
    });
    return {
        'listener':listener,
        'err': listener.getParticipant_err,
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