describe("Owf7Participant", function() {
    var listener,participant;

    beforeEach(function(){
        listener = initTestListener().listener;
        participant = listener.addWidget({
            url: "http://www.testhost.com/test/path/name.html"
        });
    });
    afterEach(function(){
        destructTestListener(listener);
    });

    it("Sets the title to [host + pathname] +  '-- OWF Widget' if unable to get the application name from system.api",function(done){
        participant.setWidgetTitle(function(title){
            expect(title).toEqual("www.testhost.com/test/path/name.html -- OWF Widget");
            document.title = "Integration Tests";
            done();
        });
    });
});