var params=ozpIwc.util.parseQueryParams();


var adapter=new ozpIwc.Owf7ParticipantListener();
adapter.addWidget({
    "url": params.url,
    "iframe": document.getElementById("widgetFrame")
});

console.log("Adapter: ",adapter.participants);