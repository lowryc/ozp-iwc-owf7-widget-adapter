## Accessing a Legacy Widget Through the Adapter
When using a legacy widget, it is accessed as a query parameter of the legacy widget adapter. The adapter should be
deployed along side the IWC deployment as explained in the [Hosting the Legacy Adapter guide](hosting.md).

### Verify the Adapter is deployed
The adapter should sit in the IWC deployed directory and be accessed at `owf7adapter.html`. For example, if the IWC is
deployed at `http://ozp.deployment.com/iwc`, the adapter will be at `http://ozp.deployment.com/iwc/owf7adapter.html`.

If this page returns a `404` error, the administrator of the IWC deployment has not added the adapter to the IWC
directory. If the adapter is deployed correctly a blank page will load. This is valid as a legacy widget has not been
given to the adapter to load.

### Adapting a Legacy Widget

#### Encoding the Url
To use a legacy widget with the adapter, its url must be encoded as it is passed as a query parameter to the adapter.
For example, if the legacy widget to be loaded is at `http://owf.deployment.com/helloWorld.html` the url is encoded to
be `http%3A%2F%2Fowf.deployment.com%2FhelloWorld.html`.

There are multiple tools available online for encoding urls, [this tool](http://pressbin.com/tools/urlencode_urldecode/)
is one of them. If accesing the browser console is possible, running
`encodeURIComponent("<URL>")` will yield the encoded url.

#### Adding the Url parameter
The adapter expects a query parameter `url` which is to be the url of the legacy widget as encoded above. To add this
query parameter, a `?url=<encoded URL>` is added after the `owf7adapter.html`, where `<encoded URL>` does not contain
any quotations.

#### Putting it all Together
Using the example deployment path above, `http://ozp.deployment.com/iwc/owf7adapter.html`, and the example legacy
widget, `http://owf.deployment.com/helloWorld.html`, the `helloWorld.html` widget would be accessible using the IWC by
accessing the following url:

```
http://owf.deployment.com/helloWorld.html?url=http%3A%2F%2Fowf.deployment.com%2FhelloWorld.html
```