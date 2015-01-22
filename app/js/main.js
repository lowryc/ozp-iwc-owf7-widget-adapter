var params=ozpIwc.util.parseQueryParams();
var client=new ozpIwc.InternalParticipant();
ozpIwc.defaultRouter.registerParticipant(client);

var adapter=new ozpIwc.Owf7ParticipantListener({
    "url": params.url,
    "iframe": document.getElementById("widgetFrame"),
    "client": client
});

