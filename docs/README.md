# Ozp IWC Owf7-widget Adapter
This adapter allows an existing OWF 7 widget to "ride on top" of the OZP IWC bus. Legacy widgets can communicate with
one another on the IWC bus if they each are accessed through the adapter.

## Is this Adapter Needed in my Deployment?
* Do you include owf-widget-min.js in your widget AND use `Ozone.*` or `OWF.*` Javascript APIs?
  * No:  You don't need the adapter.
  * Yes: See the [Accessing a Legacy Widget Through the Adapter Guide](accessing.md).
* Does your OZP provider automatically wrap OWF 7 widgets?
  * No: See the [Accessing a Legacy Widget Through the Adapter Guide](accessing.md).
  * Yes:  Follow their instructions on how to mark your widget as requiring the adapter.

