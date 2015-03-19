ozp-izp-owf7-widget-adapter
===========================

This allows an existing OWF 7 widget to "ride on top" of the OZP IWC bus.

## OWF 7 API support
See IWC-Mapped Actions.xlsx for details.

* Working
  * Eventing
  * Drag & Drop
  * Launcher
  * Preferences
* Future Support
  * Intents
  * RPC
  * State
* Webtop-dependent
  * Chrome
* Not prioritized
  * Metrics
  * Log

## Drag & Drop caveats
OWF7 did not use the HTML5 drag and drop.  This creates some artifacts when running outside of the webtop.
* Drag indicators will only appear over OWF 7 widgets.
* There's a 3 pixel white "gutter" around the widget that calibrate's it's location on the screen.  Drag indicators may not appear in the correct place until the mouse crosses this gutter.

## OWF and OZP IWC cross-communications.
The OWF API is mapped to a subset of IWC functionality, placing the onus on the IWC application to support backward compatibility with legacy widgets.  Guides and helper libraries for this are forthcoming.

# For Widget Developers

## Initial Checklist
* Do you include owf-widget-min.js in your widget AND use `Ozone.*` or `OWF.*` Javascript APIs?
  * NO:  You don't need the adapter.
* Does your OZP provider automatically wrap OWF 7 widgets?
  * YES:  Follow their instructions on how to mark your widget as requiring the adapter.


## Wrapping your widget
1. Get the adapter URL for your OZP provider.  Usually it will be the IWC Bus URL followed by `owf7adapter.html`.
2. Find your widget's launch URL.  Usually found in your provider's MarketPlace or your widget descriptor.
3. Pass your launch URL through `encodeURIComponent`.  You can use [this tool](http://pressbin.com/tools/urlencode_urldecode/) or type `encodeURIComponent('http://widget.example.com')` on your browsers developer tools console.
4. Start with the adapter URL, add `?url=`, and finish with your encoded launch URL.

###Example:

1. Adapter URL= https://ozp.example.com
2. Widget Launch URL= https://widget.example.com
3. Encoded Launch URL= https%3A%2F%2Fexample.com
4. Wrapped URL = https://ozp.example.com?url=https%3A%2F%2Fexample.com

Follow your OZP providers instructions on how to update your widget's launch URL to the wrapped URL.

Installation
============
Note:  This only needs to be done when building an OZP backend.  If you're not sure that you need to
install the legacy adapter, then you don't.
* Widget developers do NOT need to do this.  It should be handled by your OZP provider.
* All packaged OZP distributions should have this built-in or instructions on how to enable it.


1. Drop the contents of `dist` into the same directory as the IWC (i.e. owf7adapter.html and iframe_peer.html in the same directory).
2. Modify `owf7adapter.html` if the defaults are not correct (`ozpIwc.apiRootUrl="api"; ozpIwc.owf7PrefsUrl="/owf/prefs";`)







