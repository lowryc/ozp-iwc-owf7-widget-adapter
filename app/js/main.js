
(function() {
    var params=ozpIwc.util.parseQueryParams();
    var windowNameParams=ozpIwc.util.parseQueryParams(window.name);
    
    var adapter=new ozpIwc.Owf7ParticipantListener();
    var hash=window.location.hash;
    
    if(!hash) {
        // not a real guid, but it's the way OWF 7 does it
        var S4=function(){
        	return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        };
        hash=(S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
		window.location.hash=hash;
    } else {
        hash=hash.replace("#","");
    }
    
    adapter.addWidget({
        "url": params.url,
        "iframe": document.getElementById("widgetFrame"),
        "launchDataResource": windowNameParams["ozpIwc.inFlightIntent"],
        "guid": "eb5435cf-4021-4f2a-ba69-dde451d12551",
        "instanceId": hash
    });
//    console.log("Adapter: ",adapter.participants);
})();