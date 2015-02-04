describe("Widget Launcher", function() {
    var client;
    beforeEach(function(done) {
        client=new ozpIwc.Client({peerUrl:"http://localhost:16000"});
        client.connect().then(done);
    });
    
    it("OWF.Launcher.launch() and getLaunchData()",function(done) {
        var data="Hello World, #" + Date.now();
        client.api('data.api').watch("/owf-legacy-tests/launchData",function(packet,unregister) {
            expect(packet.entity.newValue).toEqual(data);
            unregister();
            done();
        });
        
        OWF.Launcher.launch({
            guid: "94c734b0-cbbb-4caf-9cb8-29a3d45afc84",
            launchOnlyIfClosed: true,
			title: 'Channel Listener Launched',
            data: data
        }, function(response) {
            // some tests here, I guess
		});
    });
    
    it("OWF.Launcher.launch() with null launch data",function(done) {
        client.api('data.api').watch("/owf-legacy-tests/launchData",function(packet,unregister) {
            console.log("Null LaunchData watch",arguments);
            expect(packet.entity.newValue.falsyType).toEqual("undefined");
            unregister();
            done();
        });
        
        OWF.Launcher.launch({
            guid: "94c734b0-cbbb-4caf-9cb8-29a3d45afc84"
        }, function(response) {
            // some tests here, I guess
		});
    });
    
});