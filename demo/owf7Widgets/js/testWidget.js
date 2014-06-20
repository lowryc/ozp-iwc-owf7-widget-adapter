OWF.ready(function() {
	$('#header').text("Hellow, I'm a widget!");
	
	// Publish call
	OWF.Eventing.publish("pubsub.hello.world","HI EVERYONE!");
	
	OWF.Preferences.getUserPreference({
		namespace:'com.company.widget', 
		name:'First President',
		onSuccess:function(pref) {
			$("body").append($("<li>")
							.text("getUserPrefs returned")
							.append($('<pre>').text(JSON.stringify(pref)))
			);
		}, 
		onFailure: function(error,status) {
			$("body").append($("<li>")
							.text("getUserPrefs error: " + error + ", status=" + status)
			);
		}
	});
	OWF.Preferences.findWidgets({
		searchParams: {
				widgetName: 'Channel Listener'
		},
		onSuccess:function(result) {
			$("body").append($("<li>")
							.text("findWidgets returned")
							.append($('<pre>').text(JSON.stringify(result)))
			);
		},
		onFailure:function(err) {
			$("body").append($("<li>")
							.text("findWidgets error")
							.append($('<pre>').text(JSON.stringify(err)))
			);
		} 
});
});

