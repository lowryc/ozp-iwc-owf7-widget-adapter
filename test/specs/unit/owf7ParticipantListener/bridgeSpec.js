describe("Bridge", function() {
    var listener,bridge,functions;

    var fakedRegistration =function(object){
        var onFunction = function(outObj,fn, name){
            gadgets.rpc.register(name,fn);
            outObj[name] = fn;
        };

        ozpIwc.owf7.Bridge.functionsInObjects({
            'inObj': object,
            'outObj': this.funcs,
            'onFn':onFunction
        });
    };
    var init = function (){
        listener = new ozpIwc.owf7.ParticipantListener({
            xOffset: 1,
            yOffset: 1,
            bridge: {}    // don't instantiate the bridge for test purposes.
        });

        bridge = new ozpIwc.owf7.Bridge({listener: listener});

        // assign the bridge to the listener
        listener.bridge = bridge;

        functions = listener.bridge.funcs;
        spyOn(ozpIwc.owf7.Bridge.prototype,"_registerFunctions").and.callFake(fakedRegistration);
    };

    var destruct = function(){
        for(var i in listener.participants){
            document.body.removeChild(listener.participants[i].iframe);
        }
    };

    beforeEach(function(){
        init();
    });

    afterEach(function(){
        destruct();
    });

    describe("utility methods",function(){
        describe("functionsInObjects",function(){
            var obj = {
               'a': {
                   'b': {
                       'c' :{
                           'func1':function(){}
                       }
                   },
                   'd': {
                       'func2': function(){}
                   }
               },
               'e': {
                   'func3': function(){}
               }
            };

            it("calls onFn for every function within the parameter object",function(){
               var fnArray = [];
               var onFn = function(outObj,fn,name){
                  fnArray.push(name);
               };
               ozpIwc.owf7.Bridge.functionsInObjects({
                   'inObj':obj,
                   'onFn': onFn
               });

               expect(fnArray).toEqual(['func1','func2','func3']);

            });

            it("can store functions in the outObj using onFn",function(){
               var foo = {};
               var onFn = function(outObj,fn,name){
                   outObj[name] = fn;
               };

               ozpIwc.owf7.Bridge.functionsInObjects({
                   'inObj':obj,
                   'outObj': foo,
                   'onFn': onFn
               });
               expect(foo).toEqual(obj);
            });

            it("can remove functions from the outObj using onFn",function(){
               var foo = {
                   'a': {
                       'b': {
                           'c' :{
                               'func1':function(){}
                           }
                       },
                       'd': {
                           'func2': function(){}
                       }
                   },
                   'e': {
                       'func3': function(){}
                   },
                   'f': {
                       'func4': function(){}
                   }
               };

               var onFn = function(outObj,fn,name){
                   delete outObj[name];
               };

               ozpIwc.owf7.Bridge.functionsInObjects({
                   'inObj':obj,
                   'outObj': foo,
                   'onFn': onFn
               });
               expect(foo).not.toEqual(obj);
               expect(foo.a.b.c).toEqual({});
               expect(foo.a.d).toEqual({});
               expect(foo.e).toEqual({});
               expect(foo.f.func4).toBeDefined();

            });

            it("returns outObj",function(){
               var foo = {};
               var onFn = function(outObj,fn,name){
                   outObj[name] = fn;
               };

               var buzz = ozpIwc.owf7.Bridge.functionsInObjects({
                   'inObj':obj,
                   'outObj': foo,
                   'onFn': onFn
               });
               expect(buzz).toEqual(foo);
            });
        });

        describe("objectCategoryFormat",function(){
            var obj = {
                'func1': function(){},
                'a': {
                    'func2': function(){}
                }
            };
            it("places any root-level functions in uncategorized",function(){
                var out = ozpIwc.owf7.Bridge.objectCategoryFormat(obj);
                expect(out.func1).not.toBeDefined();
                expect(out.uncategorized.func1).toBeDefined();
                expect(out.a.func2).toBeDefined();

            });

            it("does not manipulate the original object",function(){
                ozpIwc.owf7.Bridge.objectCategoryFormat(obj);
                expect(obj.func1).toBeDefined();
            });

        });


    });
    describe("instantiation",function(){
        it("requires a listener when instantiating",function(){
            try{
                new ozpIwc.owf7.Bridge();
            } catch (e) {
                expect(e).toEqual(ozpIwc.owf7.Bridge.prototype._noListener_err);
            }
        });

        it("registers default  handlers",function(){
            expect(bridge.funcs.components).toBeDefined();
            expect(bridge.funcs.components.keys).toBeDefined();
            expect(bridge.funcs.components.widget).toBeDefined();
            expect(bridge.funcs.dd).toBeDefined();
            expect(bridge.funcs.eventing).toBeDefined();
            expect(bridge.funcs.intents).toBeDefined();
            expect(bridge.funcs.kernel).toBeDefined();
        });
        it("registers additional handlers received in the config",function(){
            var funcs = {
                'newCat': {
                    'newFunc': function(){}
                },
                'eventing': {
                    'container_init': function(){}

                }
            };

            bridge = new ozpIwc.owf7.Bridge({
                listener: listener,
                funcs: funcs
            });
            expect(bridge.funcs.eventing.container_init).toEqual(funcs.eventing.container_init);
            expect(bridge.funcs.newCat.newFunc).toEqual(funcs.newCat.newFunc);
        });
    });

    describe("registration",function(){
        it("adds uncategorized registrations to the 'uncategorized' category",function(){
            var testFunc = function(){};
            bridge.addHandlers({
                'func1': testFunc
            });
            expect(bridge.funcs.func1).toBeUndefined();
            expect(bridge.funcs.uncategorized.func1).toEqual(testFunc);
        });

        it("adds registrations to the their specified category",function(){
            var testFunc = function(){};
            bridge.addHandlers({
                'categoryA': {
                    'func1': testFunc
                }
            });
            expect(bridge.funcs.func1).toBeUndefined();
            expect(bridge.funcs.categoryA.func1).toEqual(testFunc);
        });

        it("allows infinite subcategories",function(){
            var testFunc = function(){};
            bridge.addHandlers({
                'categoryA': {
                    'subCategoryA': {
                        'func1': testFunc
                    }
                }
            });
            expect(bridge.funcs.func1).toBeUndefined();
            expect(bridge.funcs.categoryA.subCategoryA.func1).toEqual(testFunc);
        });
    });

    describe("unregistration",function(){
        var testFunc = function(){};

        beforeEach(function(){
            bridge.addHandlers({
                'categoryA': {
                    'func1': testFunc
                }
            });
        });

        it("removes uncategorized registrations from the 'uncategorized' category",function(){
            expect(bridge.funcs.categoryA.func1).toEqual(testFunc);
            bridge.removeHandlers({
                'func1': testFunc
            });
            expect(bridge.funcs.uncategorized.func1).toBeUndefined();
        });

        it("removes registrations from the their specified category",function(){
            expect(bridge.funcs.categoryA.func1).toEqual(testFunc);
            bridge.removeHandlers({
                'categoryA': {
                    'func1': testFunc
                }
            });
            expect(bridge.funcs.categoryA.func1).toBeUndefined();
        });
    });

    describe("updates",function(){
        var testFunc = function(){};

        beforeEach(function(){
            bridge.addHandlers({
                'func1': testFunc
            });
        });

        it("removes old registrations and adds new registrations",function(){
            var oldFn = {
                'func1': testFunc
            };
            var newFunc = function(a) { return a; };
            var newFunc2 = function(b) {return !b; };

            var newFn = {
                'func1': newFunc,
                'a': {
                    'func2': newFunc2
                }
            };

            bridge.updateHandlers(oldFn,newFn);
            expect(bridge.funcs.uncategorized.func1).toEqual(newFunc);
            expect(bridge.funcs.a.func2).toEqual(newFunc2);
        });
    });

    describe("handlers",function(){
        it("call the registered functions to handle RPC calls",function(done){
            var rpcData = "Handle_Me";
            var handleFunc = function(data){
                expect(data).toEqual(rpcData);
                done();
            };

            bridge.addHandlers({
                'func1': handleFunc
            });

            gadgets.rpc.call('..','func1',null,rpcData);
        });

        it("calls the default RPC handler when a function is not registered",function(done){
            var rpcData = "Handle_Me";
            bridge.registerDefaultHandler(function(data){
                expect(data).toEqual(rpcData);
                done();
            });
            gadgets.rpc.call('..','notAFunc',null,rpcData);
        });

        it("calls the default RPC handler when a function is unregistered",function(done){

            var rpcData = "Handle_Me";
            var handleFunc = function(data){
                expect(data).toEqual("should not have happened");

            };
            bridge.registerDefaultHandler(function(data){
                expect(data).toEqual(rpcData);
                done();
            });

            bridge.addHandlers({
                'func1': handleFunc
            });
            bridge.removeHandlers({
                'func1': handleFunc
            });

            gadgets.rpc.call('..','func1',null,rpcData);
        });

    });

});