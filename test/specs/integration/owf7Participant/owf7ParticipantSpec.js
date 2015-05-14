describe("Owf7Participant", function() {
    var listener,participant;

    beforeEach(function(done){
        listener = initTestListener().listener;
        participant = listener.addWidget({
            url: "http://www.testhost.com/test/path/name.html",
            onReady: function () {
                done();
            }
        });
    });
    afterEach(function(){
        destructTestListener(listener);
        document.title = "Integration Tests";
    });

    it("Sets the title to [host + pathname] +  '-- OWF Widget' if the widget does not have a GUID in system.api",function(){
        expect(document.title).toEqual("www.testhost.com/test/path/name.html -- OWF Widget");
    });
});