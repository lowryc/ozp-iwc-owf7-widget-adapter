
(function() {
    var params=ozpIwc.util.parseQueryParams();
    var windowNameParams=ozpIwc.util.parseQueryParams(window.name);
    
    var adapter=new ozpIwc.Owf7ParticipantListener();

    adapter.addWidget({
        "url": params.url,
        "iframe": document.getElementById("widgetFrame"),
        "launchDataResource": windowNameParams["ozpIwc.inFlightIntent"]
    });
    console.log("Adapter: ",adapter.participants);
})();