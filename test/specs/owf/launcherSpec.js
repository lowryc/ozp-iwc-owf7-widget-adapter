describe("Widget Launcher", function () {
    var client;
    beforeEach(function (done) {
        client = new ozpIwc.Client({peerUrl: "http://localhost:13000"});
        client.connect().then(done);
    });

    it("OWF.Launcher.launch() on a guid not registered", function (done) {
        var data = "Hello World, #" + Date.now();
        OWF.Launcher.launch({
            guid: "FAKE_GUID_FAKE_GUID",
            launchOnlyIfClosed: true,
            title: 'Channel Listener Launched',
            data: data
        }, function (response) {
            expect(response.error).toEqual(true);
            done();
        });
    });

    it("OWf.Launcher.launch() on a registered guid", function (done) {
        var data = "Hello World, #" + Date.now();
        OWF.Launcher.launch({
            guid: "94c734b0-cbbb-4caf-9cb8-29a3d45afc84",
            launchOnlyIfClosed: true,
            title: 'Channel Listener Launched',
            data: data
        }, function (response) {
            expect(response.error).toEqual(false);
            done();
        });
    });
    it("OWF.Launcher.launch() with null launch data", function (done) {
        client.api('data.api').watch("/owf-legacy-tests/launchData", function (packet, unregister) {
            console.log("Null LaunchData watch", arguments);
            expect(packet.entity.newValue.falsyType).toEqual("undefined");
            unregister();
            done();
        });

        OWF.Launcher.launch({
            guid: "94c734b0-cbbb-4caf-9cb8-29a3d45afc84"
        }, function (response) {
            expect(response.error).toEqual(false);
            done();
        });
    });

});