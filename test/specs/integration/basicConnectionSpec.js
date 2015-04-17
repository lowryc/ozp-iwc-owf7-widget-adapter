describe("Adapter supports basic function", function() {

    it("OWF.Util.isInContainer()",function() {
       expect(OWF.Util.isInContainer()).toBe(true);
    });
    it("OWF.Util.isRunningInOWF()",function() {
       expect(OWF.Util.isRunningInOWF()).toBe(true);
    });
    it("OWF.Util.guid()",function() {
       expect(OWF.Util.guid()).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    });
});


