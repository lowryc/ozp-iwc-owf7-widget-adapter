/* jshint unused:false */
var ozpIwc = ozpIwc || {};

//Karma doesn't like referencing gadgets on the parent. Just set the window as its own parent if needed
if(!window.parent.gadgets) {
    window.parent = window;
}