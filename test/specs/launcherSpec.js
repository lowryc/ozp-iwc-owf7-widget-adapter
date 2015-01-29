describe("Widget Launcher", function() {
    var client;
    beforeEach(function(done) {
        client=new ozpIwc.Client({peerUrl:"http://localhost:16000"});
        client.connect().then(done);
    });
    

});