/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var gadgets = gadgets || {};

/**
 * @fileoverview General purpose utilities that gadgets can use.
 */

/**
 * @static
 * @class Provides general-purpose utility functions.
 * @name gadgets.util
 */

gadgets.util = function() {
  /**
   * Parses URL parameters into an object.
   * @return {Array.&lt;String&gt;} The parameters
   */
  function parseUrlParams() {
    // Get settings from url, 'hash' takes precedence over 'search' component
    // don't use document.location.hash due to browser differences.
    var query;
    var l = document.location.href;
    var queryIdx = l.indexOf("?");
    var hashIdx = l.indexOf("#");
    if (hashIdx === -1) {
      query = l.substr(queryIdx + 1);
    } else {
      // essentially replaces "#" with "&"
      query = [l.substr(queryIdx + 1, hashIdx - queryIdx - 1), "&",
               l.substr(hashIdx + 1)].join("");
    }
    return query.split("&");
  }

  var parameters = null;
  var features = {};
  var onLoadHandlers = [];

  // Maps code points to the value to replace them with.
  // If the value is "false", the character is removed entirely, otherwise
  // it will be replaced with an html entity.
  var escapeCodePoints = {
   // nul; most browsers truncate because they use c strings under the covers.
   0 : false,
   // new line
   10 : true,
   // carriage return
   13 : true,
   // double quote
   34 : true,
   // single quote
   39 : true,
   // less than
   60 : true,
   // greater than
   62 : true,
   // Backslash
   92 : true,
   // line separator
   8232 : true,
   // paragraph separator
   8233 : true
  };

  /**
   * Regular expression callback that returns strings from unicode code points.
   *
   * @param {Array} match Ignored
   * @param {String} value The codepoint value to convert
   * @return {String} The character corresponding to value.
   */
  function unescapeEntity(match, value) {
    return String.fromCharCode(value);
  }

  /**
   * Initializes feature parameters.
   */
  function init(config) {
    features = config["core.util"] || {};
  }
  if (gadgets.config) {
    gadgets.config.register("core.util", null, init);
  }

  return /** @scope gadgets.util */ {

    /**
     * Gets the URL parameters.
     *
     * @return {Object} Parameters passed into the query string
     * @member gadgets.util
     * @private Implementation detail.
     */
    getUrlParameters : function () {
      if (parameters !== null) {
        return parameters;
      }
      parameters = {};
      var pairs = parseUrlParams();
      var unesc = window.decodeURIComponent ? decodeURIComponent : unescape;
      for (var i = 0, j = pairs.length; i < j; ++i) {
        var pos = pairs[i].indexOf('=');
        if (pos === -1) {
          continue;
        }
        var argName = pairs[i].substring(0, pos);
        var value = pairs[i].substring(pos + 1);
        // difference to IG_Prefs, is that args doesn't replace spaces in
        // argname. Unclear on if it should do:
        // argname = argname.replace(/\+/g, " ");
        value = value.replace(/\+/g, " ");
        parameters[argName] = unesc(value);
      }
      return parameters;
    },

    /**
     * Creates a closure that is suitable for passing as a callback.
     * Any number of arguments
     * may be passed to the callback;
     * they will be received in the order they are passed in.
     *
     * @param {Object} scope The execution scope; may be null if there is no
     *     need to associate a specific instance of an object with this
     *     callback
     * @param {Function} callback The callback to invoke when this is run;
     *     any arguments passed in will be passed after your initial arguments
     * @param {Object} var_args Initial arguments to be passed to the callback
     *
     * @member gadgets.util
     * @private Implementation detail.
     */
    makeClosure : function (scope, callback, var_args) {
      // arguments isn't a real array, so we copy it into one.
      var baseArgs = [];
      for (var i = 2, j = arguments.length; i < j; ++i) {
       baseArgs.push(arguments[i]);
      }
      return function() {
        // append new arguments.
        var tmpArgs = baseArgs.slice();
        for (var i = 0, j = arguments.length; i < j; ++i) {
          tmpArgs.push(arguments[i]);
        }
        return callback.apply(scope, tmpArgs);
      };
    },

    /**
     * Utility function for generating an "enum" from an array.
     *
     * @param {Array.<String>} values The values to generate.
     * @return {Map&lt;String,String&gt;} An object with member fields to handle
     *   the enum.
     *
     * @private Implementation detail.
     */
    makeEnum : function (values) {
      var obj = {};
      for (var i = 0, v; v = values[i]; ++i) {
        obj[v] = v;
      }
      return obj;
    },

    /**
     * Gets the feature parameters.
     *
     * @param {String} feature The feature to get parameters for
     * @return {Object} The parameters for the given feature, or null
     *
     * @member gadgets.util
     */
    getFeatureParameters : function (feature) {
      return typeof features[feature] === "undefined"
          ? null : features[feature];
    },

    /**
     * Returns whether the current feature is supported.
     *
     * @param {String} feature The feature to test for
     * @return {Boolean} True if the feature is supported
     *
     * @member gadgets.util
     */
    hasFeature : function (feature) {
      return typeof features[feature] !== "undefined";
    },

    /**
     * Registers an onload handler.
     * @param {Function} callback The handler to run
     *
     * @member gadgets.util
     */
    registerOnLoadHandler : function (callback) {
      onLoadHandlers.push(callback);
    },

    /**
     * Runs all functions registered via registerOnLoadHandler.
     * @private Only to be used by the container, not gadgets.
     */
    runOnLoadHandlers : function () {
      for (var i = 0, j = onLoadHandlers.length; i < j; ++i) {
        onLoadHandlers[i]();
      }
    },

    /**
     * Escapes the input using html entities to make it safer.
     *
     * If the input is a string, uses gadgets.util.escapeString.
     * If it is an array, calls escape on each of the array elements
     * if it is an object, will only escape all the mapped keys and values if
     * the opt_escapeObjects flag is set. This operation involves creating an
     * entirely new object so only set the flag when the input is a simple
     * string to string map.
     * Otherwise, does not attempt to modify the input.
     *
     * @param {Object} input The object to escape
     * @param {Boolean} opt_escapeObjects Whether to escape objects.
     * @return {Object} The escaped object
     * @private Only to be used by the container, not gadgets.
     */
    escape : function(input, opt_escapeObjects) {
      if (!input) {
        return input;
      } else if (typeof input === "string") {
        return gadgets.util.escapeString(input);
      } else if (typeof input === "array") {
        for (var i = 0, j = input.length; i < j; ++i) {
          input[i] = gadgets.util.escape(input[i]);
        }
      } else if (typeof input === "object" && opt_escapeObjects) {
        var newObject = {};
        for (var field in input) if (input.hasOwnProperty(field)) {
          newObject[gadgets.util.escapeString(field)]
              = gadgets.util.escape(input[field], true);
        }
        return newObject;
      }
      return input;
    },

    /**
     * Escapes the input using html entities to make it safer.
     *
     * Currently not in the spec -- future proposals may change
     * how this is handled.
     *
     * TODO: Parsing the string would probably be more accurate and faster than
     * a bunch of regular expressions.
     *
     * @param {String} str The string to escape
     * @return {String} The escaped string
     */
    escapeString : function(str) {
      var out = [], ch, shouldEscape;
      for (var i = 0, j = str.length; i < j; ++i) {
        ch = str.charCodeAt(i);
        shouldEscape = escapeCodePoints[ch];
        if (shouldEscape === true) {
          out.push("&#", ch, ";");
        } else if (shouldEscape !== false) {
          // undefined or null are OK.
          out.push(str.charAt(i));
        }
      }
      return out.join("");
    },

    /**
     * Reverses escapeString
     *
     * @param {String} str The string to unescape.
     */
    unescapeString : function(str) {
      return str.replace(/&#([0-9]+);/g, unescapeEntity);
    }
  };
}();
// Initialize url parameters so that hash data is pulled in before it can be
// altered by a click.
gadgets.util.getUrlParameters();


/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * @fileoverview
 * The global object gadgets.json contains two methods.
 *
 * gadgets.json.stringify(value) takes a JavaScript value and produces a JSON
 * text. The value must not be cyclical.
 *
 * gadgets.json.parse(text) takes a JSON text and produces a JavaScript value.
 * It will return false if there is an error.
*/

var gadgets = gadgets || {};

/**
 * @static
 * @class Provides operations for translating objects to and from JSON.
 * @name gadgets.json
 */

/**
 * Port of the public domain JSON library by Douglas Crockford.
 * See: http://www.json.org/json2.js
 */
gadgets.json = function () {

  /**
   * Formats integers to 2 digits.
   * @param {Number} n
   */
  function f(n) {
    return n < 10 ? '0' + n : n;
  }

  Date.prototype.toJSON = function () {
    return [this.getUTCFullYear(), '-',
           f(this.getUTCMonth() + 1), '-',
           f(this.getUTCDate()), 'T',
           f(this.getUTCHours()), ':',
           f(this.getUTCMinutes()), ':',
           f(this.getUTCSeconds()), 'Z'].join("");
  };

  // table of character substitutions
  var m = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"' : '\\"',
    '\\': '\\\\'
  };

  /**
   * Converts a json object into a string.
   */
  function stringify(value) {
    var a,          // The array holding the partial texts.
        i,          // The loop counter.
        k,          // The member key.
        l,          // Length.
        r = /["\\\x00-\x1f\x7f-\x9f]/g,
        v;          // The member value.

    switch (typeof value) {
    case 'string':
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe ones.
      return r.test(value) ?
          '"' + value.replace(r, function (a) {
            var c = m[a];
            if (c) {
              return c;
            }
            c = a.charCodeAt();
            return '\\u00' + Math.floor(c / 16).toString(16) +
                (c % 16).toString(16);
            }) + '"'
          : '"' + value + '"';
    case 'number':
    // JSON numbers must be finite. Encode non-finite numbers as null.
      return isFinite(value) ? String(value) : 'null';
    case 'boolean':
    case 'null':
      return String(value);
    case 'object':
    // Due to a specification blunder in ECMAScript,
    // typeof null is 'object', so watch out for that case.
      if (!value) {
        return 'null';
      }
      // toJSON check removed; re-implement when it doesn't break other libs.
      a = [];
      if (typeof value.length === 'number' &&
          !(value.propertyIsEnumerable('length'))) {
        // The object is an array. Stringify every element. Use null as a
        // placeholder for non-JSON values.
        l = value.length;
        for (i = 0; i < l; i += 1) {
          a.push(stringify(value[i]) || 'null');
        }
        // Join all of the elements together and wrap them in brackets.
        return '[' + a.join(',') + ']';
      }
      // Otherwise, iterate through all of the keys in the object.
      for (k in value) if (value.hasOwnProperty(k)) {
        if (typeof k === 'string') {
          v = stringify(value[k]);
          if (v) {
            a.push(stringify(k) + ':' + v);
          }
        }
      }
      // Join all of the member texts together and wrap them in braces.
      return '{' + a.join(',') + '}';
    }
  }

  return {
    stringify: stringify,
    parse: function (text) {
// Parsing happens in three stages. In the first stage, we run the text against
// regular expressions that look for non-JSON patterns. We are especially
// concerned with '()' and 'new' because they can cause invocation, and '='
// because it can cause mutation. But just to be safe, we want to reject all
// unexpected forms.

// We split the first stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace all backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

      if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/b-u]/g, '@').
          replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
          replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
        return eval('(' + text + ')');
      }
      // If the text is not JSON parseable, then return false.

      return false;
    }
  };
}();


/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview Remote procedure call library for gadget-to-container,
 * container-to-gadget, and gadget-to-gadget (thru container) communication.
 */

var gadgets = gadgets || {};

/**
 * @static
 * @class Provides operations for making rpc calls.
 * @name gadgets.rpc
 */
gadgets.rpc = function() {
  //alert("Initing gadgets.rpc");
  // General constants.
  var CALLBACK_NAME = '__cb';
  var DEFAULT_NAME = '';

  // Consts for FrameElement.
  var FE_G2C_CHANNEL = '__g2c_rpc';
  var FE_C2G_CHANNEL = '__c2g_rpc';

  // Consts for NIX. VBScript doesn't
  // allow items to start with _ for some reason,
  // so we need to make these names quite unique, as
  // they will go into the global namespace.
  var NIX_WRAPPER = 'GRPC____NIXVBS_wrapper';
  var NIX_GET_WRAPPER = 'GRPC____NIXVBS_get_wrapper';
  var NIX_HANDLE_MESSAGE = 'GRPC____NIXVBS_handle_message';
  var NIX_CREATE_CHANNEL = 'GRPC____NIXVBS_create_channel';

  // JavaScript reference to the NIX VBScript wrappers.
  // Gadgets will have but a single channel under
  // nix_channels['..'] while containers will have a channel
  // per gadget stored under the gadget's ID.
  var nix_channels = {};

  var services = {};
  var iframePool = [];
  var relayUrl = {};
  var useLegacyProtocol = {};
  var authToken = {};
  var callId = 0;
  var callbacks = {};
  var setup = {};
  var sameDomain = {};
  var params = {};

  // Load the authentication token for speaking to the container
  // from the gadget's parameters, or default to '0' if not found.
  if (gadgets.util) {
    params = gadgets.util.getUrlParameters();
	//alert("gadget params: " + params);
  }

  authToken['..'] = params.rpctoken || params.ifpctok || 0;

  //ifpc mods
  var URL_LIMIT = 2000;
  var messagesIn = {};
  var useMultiPartMessages = {};
  //ifpc mods


  /*
   * Return a short code representing the best available cross-domain
   * message transport available to the browser.
   *
   * + For those browsers that support native messaging (various implementations
   *   of the HTML5 postMessage method), use that. Officially defined at
   *   http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html.
   *
   *   postMessage is a native implementation of XDC. A page registers that
   *   it would like to receive messages by listening the the "message" event
   *   on the window (document in DPM) object. In turn, another page can
   *   raise that event by calling window.postMessage (document.postMessage
   *   in DPM) with a string representing the message and a string
   *   indicating on which domain the receiving page must be to receive
   *   the message. The target page will then have its "message" event raised
   *   if the domain matches and can, in turn, check the origin of the message
   *   and process the data contained within.
   *
   *     wpm: postMessage on the window object.
   *        - Internet Explorer 8+
   *        - Safari (latest nightlies as of 26/6/2008)
   *        - Firefox 3+
   *        - Opera 9+
   *
   *     dpm: postMessage on the document object.
   *        - Opera 8+
   *
   * + For Internet Explorer before version 8, the security model allows anyone
   *   parent to set the value of the "opener" property on another window,
   *   with only the receiving window able to read it.
   *   This method is dubbed "Native IE XDC" (NIX).
   *
   *   This method works by placing a handler object in the "opener" property
   *   of a gadget when the container sets up the authentication information
   *   for that gadget (by calling setAuthToken(...)). At that point, a NIX
   *   wrapper is created and placed into the gadget by calling
   *   theframe.contentWindow.opener = wrapper. Note that as a result, NIX can
   *   only be used by a container to call a particular gadget *after* that
   *   gadget has called the container at least once via NIX.
   *
   *   The NIX wrappers in this RPC implementation are instances of a VBScript
   *   class that is created when this implementation loads. The reason for
   *   using a VBScript class stems from the fact that any object can be passed
   *   into the opener property.
   *   While this is a good thing, as it lets us pass functions and setup a true
   *   bidirectional channel via callbacks, it opens a potential security hole
   *   by which the other page can get ahold of the "window" or "document"
   *   objects in the parent page and in turn wreak havok. This is due to the
   *   fact that any JS object useful for establishing such a bidirectional
   *   channel (such as a function) can be used to access a function
   *   (eg. obj.toString, or a function itself) created in a specific context,
   *   in particular the global context of the sender. Suppose container
   *   domain C passes object obj to gadget on domain G. Then the gadget can
   *   access C's global context using:
   *   var parentWindow = (new obj.toString.constructor("return window;"))();
   *   Nulling out all of obj's properties doesn't fix this, since IE helpfully
   *   restores them to their original values if you do something like:
   *   delete obj.toString; delete obj.toString;
   *   Thus, we wrap the necessary functions and information inside a VBScript
   *   object. VBScript objects in IE, like DOM objects, are in fact COM
   *   wrappers when used in JavaScript, so we can safely pass them around
   *   without worrying about a breach of context while at the same time
   *   allowing them to act as a pass-through mechanism for information
   *   and function calls. The implementation details of this VBScript wrapper
   *   can be found in the setupChannel() method below.
   *
   *     nix: Internet Explorer-specific window.opener trick.
   *       - Internet Explorer 6
   *       - Internet Explorer 7
   *
   * + For Gecko-based browsers, the security model allows a child to call a
   *   function on the frameElement of the iframe, even if the child is in
   *   a different domain. This method is dubbed "frameElement" (fe).
   *
   *   The ability to add and call such functions on the frameElement allows
   *   a bidirectional channel to be setup via the adding of simple function
   *   references on the frameElement object itself. In this implementation,
   *   when the container sets up the authentication information for that gadget
   *   (by calling setAuth(...)) it as well adds a special function on the
   *   gadget's iframe. This function can then be used by the gadget to send
   *   messages to the container. In turn, when the gadget tries to send a
   *   message, it checks to see if this function has its own function stored
   *   that can be used by the container to call the gadget. If not, the
   *   function is created and subsequently used by the container.
   *   Note that as a result, FE can only be used by a container to call a
   *   particular gadget *after* that gadget has called the container at
   *   least once via FE.
   *
   *     fe: Gecko-specific frameElement trick.
   *        - Firefox 1+
   *
   * + For all others, we have a fallback mechanism known as "ifpc". IFPC
   *   exploits the fact that while same-origin policy prohibits a frame from
   *   accessing members on a window not in the same domain, that frame can,
   *   however, navigate the window heirarchy (via parent). This is exploited by
   *   having a page on domain A that wants to talk to domain B create an iframe
   *   on domain B pointing to a special relay file and with a message encoded
   *   after the hash (#). This relay, in turn, finds the page on domain B, and
   *   can call a receipt function with the message given to it. The relay URL
   *   used by each caller is set via the gadgets.rpc.setRelayUrl(..) and
   *   *must* be called before the call method is used.
   *
   *     ifpc: Iframe-based method, utilizing a relay page, to send a message.
   */
  function getRelayChannel() {
//    return 'ifpc';
    return typeof window.postMessage === 'function' ? 'wpm' :
           typeof window.postMessage === 'object' ? 'wpm':
           typeof document.postMessage === 'function' ? 'dpm' :
           window.ActiveXObject ? 'nix' :
           navigator.product === 'Gecko' ? 'fe' :
           'ifpc';
  }

  /**
   * Conducts any initial global work necessary to setup the
   * channel type chosen.
   */
  function setupChannel() {
    // If the channel type is one of the native
    // postMessage based ones, setup the handler to receive
    // messages.
    if (relayChannel === 'dpm' || relayChannel === 'wpm') {
      var onmessage = function (packet) {
        // TODO validate packet.domain for security reasons
        var msg=null;
        try{
            msg=gadgets.json.parse(packet.data);
        } catch(e) {
            // assume it was message from some other system and fall through
        }
        if(msg) {
            process(msg);
        }
      }

      if (typeof window.addEventListener != 'undefined') {
        window.addEventListener('message', onmessage, false);
      } else if (typeof window.attachEvent != 'undefined') {
        window.attachEvent('onmessage', onmessage);
      }

    }

    // If the channel type is NIX, we need to ensure the
    // VBScript wrapper code is in the page and that the
    // global Javascript handlers have been set.
    if (relayChannel === 'nix') {

       //alert('nix setup!');

      // VBScript methods return a type of 'unknown' when
      // checked via the typeof operator in IE. Fortunately
      // for us, this only applies to COM objects, so we
      // won't see this for a real Javascript object.
      if (typeof window[NIX_GET_WRAPPER] !== 'unknown') {
        window[NIX_HANDLE_MESSAGE] = function(data) {
          process(gadgets.json.parse(data));
        };

        window[NIX_CREATE_CHANNEL] = function(name, channel, token) {
          // Verify the authentication token of the gadget trying
          // to create a channel for us.
          if (authToken[name] == token) {
            nix_channels[name] = channel;
          }
        };

        // Inject the VBScript code needed.
        var vbscript =
          // We create a class to act as a wrapper for
          // a Javascript call, to prevent a break in of
          // the context.
          'Class ' + NIX_WRAPPER + '\n '

          // An internal member for keeping track of the
          // name of the document (container or gadget)
          // for which this wrapper is intended. For
          // those wrappers created by gadgets, this is not
          // used (although it is set to "..")
          + 'Private m_Intended\n'

          // Stores the auth token used to communicate with
          // the gadget. The GetChannelCreator method returns
          // an object that returns this auth token. Upon matching
          // that with its own, the gadget uses the object
          // to actually establish the communication channel.
          + 'Private m_Auth\n'

          // Method for internally setting the value
          // of the m_Intended property.
          + 'Public Sub SetIntendedName(name)\n '
          + 'If isEmpty(m_Intended) Then\n'
          + 'm_Intended = name\n'
          + 'End If\n'
          + 'End Sub\n'

          // Method for internally setting the value of the m_Auth property.
          + 'Public Sub SetAuth(auth)\n '
          + 'If isEmpty(m_Auth) Then\n'
          + 'm_Auth = auth\n'
          + 'End If\n'
          + 'End Sub\n'

          // A wrapper method which actually causes a
          // message to be sent to the other context.
          + 'Public Sub SendMessage(data)\n '
          + NIX_HANDLE_MESSAGE + '(data)\n'
          + 'End Sub\n'

          // Returns the auth token to the gadget, so it can
          // confirm a match before initiating the connection
          + 'Public Function GetAuthToken()\n '
          + 'GetAuthToken = m_Auth\n'
          + 'End Function\n'

          // Method for setting up the container->gadget
          // channel. Not strictly needed in the gadget's
          // wrapper, but no reason to get rid of it. Note here
          // that we pass the intended name to the NIX_CREATE_CHANNEL
          // method so that it can save the channel in the proper place
          // *and* verify the channel via the authentication token passed
          // here.
          + 'Public Sub CreateChannel(channel, auth)\n '
          + 'Call ' + NIX_CREATE_CHANNEL + '(m_Intended, channel, auth)\n'
          + 'End Sub\n'
          + 'End Class\n'

          // Function to get a reference to the wrapper.
          + 'Function ' + NIX_GET_WRAPPER + '(name, auth)\n'
          + 'Dim wrap\n'
          + 'Set wrap = New ' + NIX_WRAPPER + '\n'
          + 'wrap.SetIntendedName name\n'
          + 'wrap.SetAuth auth\n'
          + 'Set ' + NIX_GET_WRAPPER + ' = wrap\n'
          + 'End Function';

        try {
          //alert('execScript! '+vbscript);
          window.execScript(vbscript, 'vbscript');
        } catch (e) {

          //alert('exception! back to ifpc');
          // Fall through to IFPC.
          relayChannel = 'ifpc';
        }
      }
    }
  }

  //Store the parsed window.name configuration, if necessary
  var config = null;

  //Parse the window.name configuration and cache it.  Handle the case
  //where containers use a JSON string in the window name and a plain string,
//  function getConfig() {
//    if (config == null) {
//        config = {};
//        if (window.name.charAt(0) != '{') {
//            config.rpcId = window.name;
//            config.kernel = true;
//        } else {
//            config = gadgets.json.parse(window.name);
//            config.rpcId = config.id;
//            return config;
//        }
//    } else {
//        return config;
//    }
//  }

  //Get the IFrame ID from the window.name property.  Handle three cases
  //1. OWF Webtop, which assumes IFrame IDs are identical to window names
  //2. OWF Kernel, which assumes that IFrame IDs are contianed in the window name as JSON as the id field
  //3. Others, which use a plain string in the window name and assume the IFrame id is also this plain string
//  function getId(windowName) {
//    var conf = getConfig();
//    if (conf.kernel)
//        return conf.rpcId;
//    else
//        return windowName;
//  }

  function getId(windowName) {
    if (windowName.charAt(0) != '{') {
      return windowName
    }
    else {
      var obj = gadgets.json.parse(windowName);
      var id = obj.id;
      return gadgets.json.stringify({id:obj.id});
    }
  }

  // Pick the most efficient RPC relay mechanism
  var relayChannel = getRelayChannel();
  //alert('relaychannel is '+relayChannel);

  // Conduct any setup necessary for the chosen channel.
  setupChannel();

  // Create the Default RPC handler.
  services[DEFAULT_NAME] = function() {
    //suppress this error - no one should ever try to use a service that wasn't registered using our api
    //throw new Error('Unknown RPC service: ' + this.s);
  };

  // Create a Special RPC handler for callbacks.
  services[CALLBACK_NAME] = function(callbackId, result) {
    var callback = callbacks[callbackId];
    if (callback) {
      delete callbacks[callbackId];
      callback(result);
    }
  };

  /**
   * Conducts any frame-specific work necessary to setup
   * the channel type chosen. This method is called when
   * the container page first registers the gadget in the
   * RPC mechanism. Gadgets, in turn, will complete the setup
   * of the channel once they send their first messages.
   */
  function setupFrame(frameId, token) {
    if (setup[frameId]) {
      return;
    }

    if (relayChannel === 'fe') {
      try {
        var frame = document.getElementById(frameId);
        frame[FE_G2C_CHANNEL] = function(args) {
          process(gadgets.json.parse(args));
        };
      } catch (e) {
        // Something went wrong. System will fallback to
        // IFPC.
      }
    }

    if (relayChannel === 'nix') {
      try {
        var frame = document.getElementById(frameId);
        var wrapper = window[NIX_GET_WRAPPER](frameId, token);
        frame.contentWindow.opener = wrapper;
      } catch (e) {
        // Something went wrong. System will fallback to
        // IFPC.
        //alert('setupFrame Error!:'+e.message);

      }
    }

    setup[frameId] = true;
  }

  /**
   * Encodes arguments for the legacy IFPC wire format.
   *
   * @param {Object} args
   * @return {String} the encoded args
   */
  function encodeLegacyData(args) {
    var stringify = gadgets.json.stringify;
    var argsEscaped = [];
    for(var i = 0, j = args.length; i < j; ++i) {
      argsEscaped.push(encodeURIComponent(stringify(args[i])));
    }
    return argsEscaped.join('&');
  }

  /**
   * Helper function to process an RPC request
   * @param {Object} rpc RPC request object
   * @private
   */
    function process(rpc) {
    //
    // RPC object contents:
    //   s: Service Name
    //   f: From
    //   c: The callback ID or 0 if none.
    //   a: The arguments for this RPC call.
    //   t: The authentication token.
    //
    if (rpc && typeof rpc.s === 'string' && typeof rpc.f === 'string' &&
        rpc.a instanceof Array) {

      //ensure id is compatible
      rpc.f = getId(rpc.f);

      // Validate auth token.
      if (authToken[rpc.f]) {
        // We allow type coercion here because all the url params are strings.
        if (authToken[rpc.f] != rpc.t) {
          throw new Error("Invalid auth token.");
        }
      }

      // If there is a callback for this service, attach a callback function
      // to the rpc context object for asynchronous rpc services.
      //
      // Synchronous rpc request handlers should simply ignore it and return a
      // value as usual.
      // Asynchronous rpc request handlers, on the other hand, should pass its
      // result to this callback function and not return a value on exit.
      //
      // For example, the following rpc handler passes the first parameter back
      // to its rpc client with a one-second delay.
      //
      // function asyncRpcHandler(param) {
      //   var me = this;
      //   setTimeout(function() {
      //     me.callback(param);
      //   }, 1000);
      // }
      if (rpc.c) {
        rpc.callback = function(result) {
          gadgets.rpc.call(rpc.f, CALLBACK_NAME, null, rpc.c, result);
        };
      }

      // Call the requested RPC service.
      var result = (services[rpc.s] ||
                    services[DEFAULT_NAME]).apply(rpc, rpc.a);

      // If the rpc request handler returns a value, immediately pass it back
      // to the callback. Otherwise, do nothing, assuming that the rpc handler
      // will make an asynchronous call later.
      if (rpc.c && typeof result != 'undefined') {
        gadgets.rpc.call(rpc.f, CALLBACK_NAME, null, rpc.c, result);
      }
    }
  }

  /**
   * Attempts to conduct an RPC call to the specified
   * target with the specified data via the NIX
   * method. If this method fails, the system attempts again
   * using the known default of IFPC.
   *
   * @param {String} targetId Module Id of the RPC service provider.
   * @param {String} serviceName Name of the service to call.
   * @param {String} from Module Id of the calling provider.
   * @param {Object} rpcData The RPC data for this call.
   */
  function callNix(targetId, serviceName, from, rpcData) {
    try {
//       alert('try nix targetId='+targetId);
//       alert('try nix from='+from);
      if (from != '..') {
//        alert('try nix1');
        // Call from gadget to the container.
        var handler = nix_channels['..'];

//        alert('Nix handler='+handler);
        //alert('GetAuthToken'+("GetAuthToken" in window.opener));
//        alert('window.opener='+window.opener);

        // If the gadget has yet to retrieve a reference to
        // the NIX handler, try to do so now. We don't do a
        // typeof(window.opener.GetAuthToken) check here
        // because it means accessing that field on the COM object, which,
        // being an internal function reference, is not allowed.
        // "in" works because it merely checks for the prescence of
        // the key, rather than actually accessing the object's property.
        // This is just a sanity check, not a validity check.
        if (!handler && window.opener && "GetAuthToken" in window.opener) {
//          alert('try nix - handler');
          handler = window.opener;

          // Create the channel to the parent/container.
          // First verify that it knows our auth token to ensure it's not
          // an impostor.
          if (handler.GetAuthToken() == authToken['..']) {
            // Auth match - pass it back along with our wrapper to finish.
            // own wrapper and our authentication token for co-verification.
            var token = authToken['..'];
            handler.CreateChannel(window[NIX_GET_WRAPPER]('..', token),
                                  token);
            // Set channel handler
            nix_channels['..'] = handler;
            window.opener = null;
          }
        }

        // If we have a handler, call it.
        if (handler) {
          //alert('sent nix');
          handler.SendMessage(rpcData);
          return;
        }

//        alert('Nix did not send3');
      } else {
        // Call from container to a gadget[targetId].
//        alert('try nix2 - nix_channels[targetId]='+nix_channels[targetId]);

        // If we have a handler, call it.
        if (nix_channels[targetId]) {
//          alert('sent nix');
          nix_channels[targetId].SendMessage(rpcData);
          return;
        }

//        alert('Nix did not send1');
      }

//      alert('Nix did not send2');

    } catch (e) {
//      alert('Nix Failed!:'+e);
    }

//    alert('fallback ifpc');

    // If we have reached this point, something has failed
    // with the NIX method, so we default to using
    // IFPC for this call.
    callIfpc(targetId, serviceName, from, rpcData);
  }

  /**
   * Attempts to conduct an RPC call to the specified
   * target with the specified data via the FrameElement
   * method. If this method fails, the system attempts again
   * using the known default of IFPC.
   *
   * @param {String} targetId Module Id of the RPC service provider.
   * @param {String} serviceName Service name to call.
   * @param {String} from Module Id of the calling provider.
   * @param {Object} rpcData The RPC data for this call.
   * @param {Array.<Object>} callArgs Original arguments to call()
   */
  function callFrameElement(targetId, serviceName, from, rpcData, callArgs) {
    //alert('callFrameElement!');
    try {
      if (from != '..') {
        // Call from gadget to the container.
        var fe = window.frameElement;

        if (typeof fe[FE_G2C_CHANNEL] === 'function') {
          // Complete the setup of the FE channel if need be.
          if (typeof fe[FE_G2C_CHANNEL][FE_C2G_CHANNEL] !== 'function') {
            fe[FE_G2C_CHANNEL][FE_C2G_CHANNEL] = function(args) {
              process(gadgets.json.parse(args));
            };
          }

          // Conduct the RPC call.
          fe[FE_G2C_CHANNEL](rpcData);
          return;
        }
      } else {
        // Call from container to gadget[targetId].
        var frame = document.getElementById(targetId);

        if (typeof frame[FE_G2C_CHANNEL] === 'function' &&
            typeof frame[FE_G2C_CHANNEL][FE_C2G_CHANNEL] === 'function') {

          // Conduct the RPC call.
          frame[FE_G2C_CHANNEL][FE_C2G_CHANNEL](rpcData);
          return;
        }
      }
    } catch (e) {
    }

    // If we have reached this point, something has failed
    // with the FrameElement method, so we default to using
    // IFPC for this call.
    callIfpc(targetId, serviceName, from, rpcData, callArgs);
  }

  /**
   * Conducts an RPC call to the specified
   * target with the specified data via the IFPC
   * method.
   *
   * @param {String} targetId Module Id of the RPC service provider.
   * @param {String} serviceName Service name to call.
   * @param {String} from Module Id of the calling provider.
   * @param {Object} rpcData The RPC data for this call.
   * @param {Array.<Object>} callArgs Original arguments to call()
   */
  function callIfpc(targetId, serviceName, from, rpcData, callArgs) {
    //alert("CONTAINER IFPC params: " + targetId + " " + serviceName + " " + from + " " + rpcData + " " + callArgs);
    // Retrieve the relay file used by IFPC. Note that
    // this must be set before the call, and so we conduct
    // an extra check to ensure it is not blank.
    var relay = gadgets.rpc.getRelayUrl(targetId);

    if (!relay) {
      throw new Error('No relay file assigned for IFPC');
    }

    // The RPC mechanism supports two formats for IFPC (legacy and current).
    var src = null,
        queueOut = [];
    if (useLegacyProtocol[targetId]) {
      // Format: #iframe_id&callId&num_packets&packet_num&block_of_data
      src = [relay, '#', encodeLegacyData([from, callId, 1, 0,
             encodeLegacyData([from, serviceName, '', '', from].concat(
               callArgs))])].join('');
      queueOut.push(src);
    } else {

      // Format: #targetId & sourceId@callId & packetNum & packetId & packetData
      src = [relay, '#', encodeURIComponent(targetId), '&', from, '@', callId, '&'].join('');
      if (!useMultiPartMessages[targetId]) {
        // Format: #targetId & sourceId@callId & packetNum & packetId & packetData
        queueOut.push([src, 1, '&', 0, '&', , encodeURIComponent(rpcData)].join(''));

      }
      else {
        var message = encodeURIComponent(rpcData),
            payloadLength = URL_LIMIT - src.length,
            numPackets = Math.ceil(message.length / payloadLength),
            packetIdx = 0,
            part;
        while (message.length > 0) {
          part = message.substring(0, payloadLength);
          message = message.substring(payloadLength);
          queueOut.push([src, numPackets, '&', packetIdx, '&', part].join(''));
          packetIdx += 1;
        }

      }

    }

    // Conduct the IFPC call by creating the Iframe with
    // the relay URL and appended message.
    do {
      emitInvisibleIframe(queueOut.shift(),targetId);
    } while (queueOut.length > 0);
    return true;


  }

  //IE only: return true if a target iframe id is in a child popup window
  function isInPopup(targetId) {
    if (!targetId) {
      return false;
    }
    if (targetId == "..") {
      return false;
    }
    var frame = document.getElementById(targetId);
    if (frame) {
      return false;
    }
    if (typeof _childWindows === 'undefined') {
      return false;
    }
    return true;
  }

  //IE only: Queue of messages for child windows
  window._childWindowMessageQueue = [];
  //IE only: Unique increasing ID for all messages put on the child window queue
  window._childWindowMessageId = 0;
  //IE only: Allow a child window to retrieve a message from the queue
  window._getChildWindowMessage = function(msgId) {
    var q = _childWindowMessageQueue;
    for(var ii=0; ii < q.length; ii++) {
      var m = q[ii];
      if (m.id == msgId) {
        return m;
      }
    }
  }

  function isMessageComplete(arr, total) {
    for (var i = total - 1; i >= 0; --i) {
      if (typeof arr[i] === 'undefined') {
        return false;
      }
    }
    return true;
  }

  /**
   * Helper function to emit an invisible IFrame.
   * @param {String} src SRC attribute of the IFrame to emit.
   * @private
   */
  function emitInvisibleIframe(src, targetId) {
    if (isInPopup(targetId)) {
        //IE only:
        //Queue the message for our child iframes, which will poll for them.
        //We do this because in IE a parent window does not have access to the
        //document of child popup windows, and hence cannot emit an iframe
        //within them
        var id = window._childWindowMessageId;
        id++;
        window._childWindowMessageQueue.push({id:id, target:targetId, src:src});
        window._childWindowMessageId++;
        if(window._childWindowMessageQueue.length > 20) {
          window._childWindowMessageQueue.shift();
        }
        return;
    }
    var iframe;
    // Recycle IFrames
    for (var i = iframePool.length - 1; i >=0; --i) {
      var ifr = iframePool[i];
      try {
        if (ifr && (ifr.recyclable || ifr.readyState === 'complete')) {
          ifr.parentNode.removeChild(ifr);
          if (window.ActiveXObject) {
            // For MSIE, delete any iframes that are no longer being used. MSIE
            // cannot reuse the IFRAME because a navigational click sound will
            // be triggered when we set the SRC attribute.
            // Other browsers scan the pool for a free iframe to reuse.
            iframePool[i] = ifr = null;
            iframePool.splice(i, 1);
          } else {
            ifr.recyclable = false;
            iframe = ifr;
            break;
          }
        }
      } catch (e) {
        // Ignore; IE7 throws an exception when trying to read readyState and
        // readyState isn't set.
      }
    }
    // Create IFrame if necessary
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.style.border = iframe.style.width = iframe.style.height = '0px';
      iframe.style.visibility = 'hidden';
      iframe.style.position = 'absolute';
      iframe.onload = function() { this.recyclable = true; };
      iframePool.push(iframe);
    }
    iframe.src = src;
    setTimeout(function() { document.body.appendChild(iframe); }, 0);
  }

    //Find a target IFrame or window based off an RPC ID, allowing for
    //the fact that child popup windows with IFrames might exist.
    function getTargetWin(id) {
      if (typeof id === "undefined" || id === "..") {
          // Chrome 30 throws SecurityError when accessing opener property on window.parent
          try {
            //Check to see if we are an iframe in a child window, and if so use the opener
            if(sameDomain[id] !== false && window.parent.opener) {
                return window.parent.opener.parent;
            }
          }
          catch(e) {}
          //Normal case, we are an IFrame in a page
          return window.parent;
      }

      //At this point we are a container looking for a child iframe

      // Cast to a String to avoid an index lookup.
      id = String(id);

      var target = null;

      // Try window.frames first
      //apparently in FF using window.frames will return a bogus window object if the
      //iframe was removed and re-added to the document so it's always better to just do
      //a dom lookup
//      target = window.frames[id];
//      if (target) {
//          return target;
//      }

      // Fall back to getElementById()
      target = document.getElementById(id);
      if (target && target.contentWindow) {
        return target.contentWindow;
      }

      // At this point we have missed on searching for child iframes
      // in the main browser window, so search popup windows
      // This assumes the container is keeping a list of child
      // windows in the global _childWindows array
      if (typeof _childWindows !== 'undefined') {
          for(var ii=0; ii<_childWindows.length;ii++) {
              var childWindow = _childWindows[ii];
              try {
                  //In IE 8, this will throw an exception.
                  if (childWindow.document) {
                      target = childWindow.document.getElementById(id);
                  }
              } catch(e) {
                  //BUG. Don't know how to support
                  //direct WMP calls from parent to child popups
                  //in IE 8.
              }
              if (target && target.contentWindow) {
                return target.contentWindow;
              }
          }
      }
      return null;
    }


  /**
   * Attempts to make an rpc by calling the target's receive method directly.
   * This works when gadgets are rendered on the same domain as their container,
   * a potentially useful optimization for trusted content which keeps
   * RPC behind a consistent interface.
   * @param {String} target Module id of the rpc service provider
   * @param {String} from Module id of the caller (this)
   * @param {String} callbackId Id of the call
   * @param {String} rpcData JSON-encoded RPC payload
   * @return
   */
  function callSameDomain(target, rpc) {
    var fn;

    if (sameDomain[target] !== false) {
      // Seed with a negative, typed value to avoid
      // hitting this code path repeatedly
      var targetEl = getTargetWin(target);

      try {
        // If this succeeds, then same-domain policy applied
//        sameDomain[target] = targetEl.gadgets.rpc.receiveSameDomain;
        fn = targetEl.gadgets.rpc.receiveSameDomain;
      } catch (e) {
        // Usual case: different domains
      }
    }

    if (typeof fn === 'function') {
      // Call target's receive method
      fn(rpc);
      sameDomain[target] = true;
      return true;
    }
    else
        sameDomain[target] = false;

    return false;
  }

  // gadgets.config might not be available, such as when serving container js.
  if (gadgets.config) {
    /**
     * Initializes RPC from the provided configuration.
     */
    function init(config) {
	  //alert("CONTAINER Config: " + config);
      // Allow for wild card parent relay files as long as it's from a
      // white listed domain. This is enforced by the rendering servlet.
      if (config.rpc.parentRelayUrl.substring(0, 7) === 'http://') {
        relayUrl['..'] = config.rpc.parentRelayUrl;
      } else {
        // It's a relative path, and we must append to the parent.
        // We're relying on the server validating the parent parameter in this
        // case. Because of this, parent may only be passed in the query, not
        // the fragment.
        var params = document.location.search.substring(0).split("&");
		//alert("Init Config method - Setting Params: " + params);
        var parentParam = "";
        for (var i = 0, param; param = params[i]; ++i) {
          // Only the first parent can be validated.
          if (param.indexOf("parent=") === 0) {
            parentParam = decodeURIComponent(param.substring(7));
            break;
          }
        }
        relayUrl['..'] = parentParam + config.rpc.parentRelayUrl;
      }
      useLegacyProtocol['..'] = !!config.rpc.useLegacyProtocol;
    }

    var requiredConfig = {
      parentRelayUrl : gadgets.config.NonEmptyStringValidator
    };
    gadgets.config.register("rpc", requiredConfig, init);
  }

  return /** @scope gadgets.rpc */ {
    /**
     * Registers an RPC service.
     * @param {String} serviceName Service name to register.
     * @param {Function} handler Service handler.
     *
     * @member gadgets.rpc
     */
    register: function(serviceName, handler) {
	//alert("CONTAINER REGISTER VARIABLES: " + serviceName + " -|- " + handler);
      if (serviceName == CALLBACK_NAME) {
        throw new Error("Cannot overwrite callback service");
      }

      if (serviceName == DEFAULT_NAME) {
        throw new Error("Cannot overwrite default service:"
                        + " use registerDefault");
      }
	  services[serviceName] = handler;
    },

    /**
     * Unregisters an RPC service.
     * @param {String} serviceName Service name to unregister.
     *
     * @member gadgets.rpc
     */
    unregister: function(serviceName) {
      if (serviceName == CALLBACK_NAME) {
        throw new Error("Cannot delete callback service");
      }

      if (serviceName == DEFAULT_NAME) {
        throw new Error("Cannot delete default service:"
                        + " use unregisterDefault");
      }

      delete services[serviceName];
    },

    /**
     * Registers a default service handler to processes all unknown
     * RPC calls which raise an exception by default.
     * @param {Function} handler Service handler.
     *
     * @member gadgets.rpc
     */
    registerDefault: function(handler) {
      services[''] = handler;
    },

    /**
     * Unregisters the default service handler. Future unknown RPC
     * calls will fail silently.
     *
     * @member gadgets.rpc
     */
    unregisterDefault: function() {
      delete services[''];
    },

    /**
     * Calls an RPC service.
     * @param {String} targetId Module Id of the RPC service provider.
     *                          Empty if calling the parent container.
     * @param {String} serviceName Service name to call.
     * @param {Function|null} callback Callback function (if any) to process
     *                                 the return value of the RPC request.
     * @param {*} var_args Parameters for the RPC request.
     *
     * @member gadgets.rpc
     */
    call: function(targetId, serviceName, callback, var_args) {
      ++callId;
	  targetId = getId(targetId) || '..';
      if (callback) {
        callbacks[callId] = callback;
      }

      // Default to the container calling.
      var from = '..';

      if (targetId === '..') {
//        from = window.name;
        from = getId(window.name);
      }

      // Not used by legacy, create it anyway...
      var rpc = {
        s: serviceName,
        f: from,
        c: callback ? callId : 0,
        a: Array.prototype.slice.call(arguments, 3),
        t: authToken[targetId]
      };

      // If target is on the same domain, call method directly
      if (callSameDomain(targetId, rpc)) {
        return;
      }

      var rpcData = gadgets.json.stringify(rpc);

      var channelType = relayChannel;

      // If we are told to use the legacy format, then we must
      // default to IFPC.
      if (useLegacyProtocol[targetId]) {
        channelType = 'ifpc';
      }

      //alert('channelType:'+channelType);
      switch (channelType) {
        case 'dpm': // use document.postMessage.
          // Get the window from the document. Fixes a bug with postMessage
          // calls on a target that had been removed then appended to the document object
            var targetWin = getTargetWin(targetId);
            var targetDoc = targetWin.document;

          if (targetDoc != null)
            try {
              targetDoc.postMessage(rpcData);
            } catch (e) {
              callIfpc(targetId, serviceName, from, rpcData, rpc.a);
            }
          break;

        case 'wpm': // use window.postMessage.
          // Get the window from the document. Fixes a bug with postMessage
          // calls on a target that had been removed then appended to the document object
            var targetWin = getTargetWin(targetId);

          if (targetWin != null) {
            try {
              targetWin.postMessage(rpcData, "*");//relayUrl[targetId]);
            } catch (e) {
              callIfpc(targetId, serviceName, from, rpcData, rpc.a);
            }
          }
          break;

        case 'nix': // use NIX.
          //alert('callNix!');
          callNix(targetId, serviceName, from, rpcData);
          break;

        case 'fe': // use FrameElement.
          callFrameElement(targetId, serviceName, from, rpcData, rpc.a);
          break;

        default: // use 'ifpc' as a fallback mechanism.
          callIfpc(targetId, serviceName, from, rpcData, rpc.a);
          break;
      }
    },

    /**
     * Gets the relay URL of a target frame.
     * @param {String} targetId Name of the target frame.
     * @return {String|undefined} Relay URL of the target frame.
     *
     * @member gadgets.rpc
     */
    getRelayUrl: function(targetId) {
      return relayUrl[targetId];
    },

    /**
     * Sets the relay URL of a target frame.
     * @param {String} targetId Name of the target frame.
     * @param {String} url Full relay URL of the target frame.
     * @param {Boolean} opt_useLegacy True if this relay needs the legacy IFPC
     *     wire format.
     *
     * @member gadgets.rpc
     */
    setRelayUrl: function(targetId, url, opt_useLegacy, useMultiPartMessagesForIFPC) {
      relayUrl[targetId] = url;
      useLegacyProtocol[targetId] = !!opt_useLegacy;
      useMultiPartMessages[targetId] = !!useMultiPartMessagesForIFPC;
    },

    /**
     * Sets the auth token of a target frame.
     * @param {String} targetId Name of the target frame.
     * @param {String} token The authentication token to use for all
     *     calls to or from this target id.
     *
     * @member gadgets.rpc
     */
    setAuthToken: function(targetId, token) {
      authToken[targetId] = token;
      setupFrame(targetId, token);
    },

    /**
     * Gets the RPC relay mechanism.
     * @return {String} RPC relay mechanism. See above for
     *   a list of supported types.
     *
     * @member gadgets.rpc
     */
    getRelayChannel: function() {
      return relayChannel;
    },

    /**
     * Receives and processes an RPC request. (Not to be used directly.)
     * @param {Array.<String>} fragment An RPC request fragment encoded as
     *        an array. The first 4 elements are target id, source id & call id,
     *        total packet number, packet id. The last element stores the actual
     *        JSON-encoded and URI escaped packet data.
     *
     * @member gadgets.rpc
     */
    receive: function(fragment) {
      if (fragment.length > 4) {
//        // TODO parse fragment[1..3] to merge multi-fragment messages
//        process(gadgets.json.parse(
//            decodeURIComponent(fragment[fragment.length - 1])));

        var from = fragment[1],   // in the form of "<from>@<callid>"
            numPackets = parseInt(fragment[2], 10),
            packetIdx = parseInt(fragment[3], 10),
            payload = fragment[fragment.length - 1],
            completed = numPackets === 1;

        // if message is multi-part, store parts in the proper order
        if (numPackets > 1) {
          if (!messagesIn[from]) {
            messagesIn[from] = [];
          }
          messagesIn[from][packetIdx] = payload;
          // check if all parts have been sent
          if (isMessageComplete(messagesIn[from], numPackets)) {
            payload = messagesIn[from].join('');
            delete messagesIn[from];
            completed = true;
          }
        }

        // complete message sent
        if (completed) {
          process(gadgets.json.parse(decodeURIComponent(payload)));
        }
      }
    },

    /**
     * Receives and processes an RPC request sent via the same domain.
     * (Not to be used directly). Converts the inbound rpc object's
     * Array into a local Array to pass the process() Array test.
     * @param {Object} rpc RPC object containing all request params
     */
    receiveSameDomain: function(rpc) {
      // Pass through to local process method but converting to a local Array
      rpc.a = Array.prototype.slice.call(rpc.a);
	  window.setTimeout(function() { process(rpc) }, 0);
    }
  };
}();


/**
 * 
 * @param {object} config
 * @param {object} config.iframe - The iframe that contains the widget for this participant
 * @param {object} config.listener - The parent OWF7ParticipantListener
 * @param {object} config.client - The InternalParticipant for this widget.
 * @param {string} config.guid - The GUID for the widget that this is an instance of.
 * @param {string} config.instanceId - The GUID for the widget instance.
 * @param {string} config.url - The launch URL for this widget.
 * @param {string} config.rpcId - The iframe.id that is used as the ID for RPC.
 * @param {string} [config.launchDataResource=undefined] - The intents.api resource that contains the launch data for the widget, or null for no launch data.
 * @param {boolean} [config.externalInit=false] - Set to true if the iframe has been initialized elsewhere, such as when embedded in OWF 7.
 */

ozpIwc.Owf7Participant=function(config) {
    config = config || {};
    if(!config.iframe) { throw "Needs an iframe";}
    if(!config.listener) { throw "Needs to have an OWF7ParticipantListener";}
    if(!config.client) {throw "Needs an IWC Client";}
    if(!config.guid) { throw "Must be assigned a guid for this widget";}
    if(!config.instanceId) { throw "Needs an widget instance id";}
    if(!config.url) { throw "Needs a url for the widget"; }
    if(!config.rpcId) { throw "Needs a rpcId for the widget"; }
    
    this.iframe=config.iframe;
    this.listener=config.listener;
    this.client=config.client;
    this.url=config.url;
    this.instanceId=config.instanceId;
    this.widgetGuid=config.guid;
    this.rpcId=config.rpcId;
    
    this.inDrag=false;
    this.lastMouseMove=Date.now();
    
    // Do a lookup on these two at some point
    this.widgetQuery="?lang=en_US&owf=true&themeName=a_default&themeContrast=standard&themeFontSize=12";
    
    this.launchData=null;
    var self=this;
    // number of milliseconds to wait before sending another mousemove event
    this.mouseMoveDelay=250;

    if(config.launchDataResource) {
        this.client.send({
            dst: "intents.api",
            resource: config.launchDataResource,
            action: "get"
        }, function (response, done) {
            if (response.response === 'ok') {
                self.launchData = response.entity.entity.launchData;
            }
            if(!config.externalInit) {
                self.initIframe();
            }
            done();
        });
    } else {
        if(!config.externalInit) {
            this.initIframe();
        }
    }
};

ozpIwc.Owf7Participant.prototype.initIframe=function() {
      
	// these get turned into the iframes name attribute
	// Refer to js/eventing/container.js:272
	this.widgetParams={
		"id": this.instanceId,
		"webContextPath":"/owf",
		"preferenceLocation": this.listener.prefsUrl,
		"relayUrl":  this.listener.rpcRelay, 
		"url": this.url,
		"guid": this.widgetGuid,
		// fixed values
		"layout":"desktop",
		"containerVersion":"7.0.1-GA",
		"owf":true,
		"lang":"en_US",
		"currentTheme":{
			"themeName":"a_default",
			"themeContrast":"standard",
			"themeFontSize":12
		},		
		"version":1,
		"locked":false,
        "data": this.launchData
	};
	this.subscriptions={};
	this.iframe.setAttribute("name",JSON.stringify(this.widgetParams));
    this.iframe.setAttribute("src",this.widgetParams.url+this.widgetQuery);
    this.iframe.setAttribute("id",this.rpcId);
    
    this.registerDragAndDrop();
};
ozpIwc.Owf7Participant.pubsubChannel=function(channel) {
    return "/owf-legacy/eventing/"+channel;
};
ozpIwc.Owf7Participant.rpcChannel=function(channel) {
    return "/owf-legacy/gadgetsRpc/"+channel;
};

ozpIwc.Owf7Participant.prototype.onContainerInit=function(sender,message) {
    // The container sends params, but the widget JS ignores them
    if ((window.name === "undefined") || (window.name === "")) {
        window.name = "ContainerWindowName" + Math.random();
    }
    var initMessage = gadgets.json.parse(message);
    var useMultiPartMessagesForIFPC = initMessage.useMultiPartMessagesForIFPC;
    var idString = this.rpcId;//null;
//		if (initMessage.id.charAt(0) !== '{') {
//				idString = initMessage.id;
//		}
//		else {
//				var obj = gadgets.json.parse(initMessage.id);
//				var id = obj.id;
//				idString = gadgets.json.stringify({id:obj.id});
//		}

    gadgets.rpc.setRelayUrl(idString, initMessage.relayUrl, false, useMultiPartMessagesForIFPC);
    gadgets.rpc.setAuthToken(idString, 0);
    var jsonString = '{\"id\":\"' + window.name + '\"}';
    gadgets.rpc.call(idString, 'after_container_init', null, window.name, jsonString);
};
    
ozpIwc.Owf7Participant.prototype.onPublish=function(command, channel, message, dest) {
    if(this["hookPublish"+channel] && !this["hookPublish"+channel].call(this,message)) {
        return;
    }
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.pubsubChannel(channel),
        "action": "set",
        "entity": message
    });
};


ozpIwc.Owf7Participant.prototype.onSubscribe=function(command, channel, message, dest) {
    var self=this;
    this.subscriptions[channel]=true;
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.pubsubChannel(channel),
        "action": "watch"
    },function(packet,unregister) {
        if(packet.response !== "changed") return;

        if(self["hookReceive"+channel] && !self["hookReceive"+channel].call(self,packet.entity.newValue)) {
            return;
        }
        if(self.subscriptions[channel]) { 
            // from shindig/pubsub_router.js:77    
            //gadgets.rpc.call(subscriber, 'pubsub', null, channel, sender, message);
            gadgets.rpc.call(self.rpcId, 'pubsub', null, channel, null, packet.entity.newValue);
        }else {
            unregister();
        };
    });
};
ozpIwc.Owf7Participant.prototype.onUnsubscribe=function(command, channel, message, dest) {
    this.subscriptions[channel]=false;
};


ozpIwc.Owf7Participant.prototype.onLaunchWidget=function(sender,msg,rpc) {
    msg=JSON.parse(msg);    
    // ignore title, titleRegex, and launchOnlyIfClosed
    this.client.send({
        dst: "system.api",
        resource: "/application/" + msg.guid,
        action: "launch",
        contentType: "text/plain",
        entity: msg.data
    },function(reply,unregister) {
      //gadgets.rpc.call(rpc.f, '__cb', null, rpc.c, {
      rpc.callback({
        error: false,
        newWidgetLaunched: true,
        uniqueId: "unknown,not supported yet"
      });
      unregister();
    });
};

//=======================================================================
// Drag and Drop MADNESS
//=======================================================================

/* All Drag and Drop messages look like:
 * {
        sender: this.widgetEventingController.getWidgetId(),
        pageX: e.pageX,
        pageY: e.pageY,
        screenX: e.screenX,
        screenY: e.screenY
    }
 */

ozpIwc.Owf7Participant.prototype.convertToLocalCoordinates=function(msg) {
    // translate to container coordinates
    var rv=this.listener.convertToLocalCoordinates(msg);

    // this calculates the position of the iframe relative to the document,
    // accounting for scrolling, padding, etc.  If we started at zero, this
    // would be the iframe's coordinates inside the document.  Instead, we started
    // at the mouse location relative to the adapter, which gives the location
    // of the event inside the iframe content.
    // http://www.kirupa.com/html5/get_element_position_using_javascript.htm
    
    // should work in most browsers: http://www.quirksmode.org/dom/w3c_cssom.html#elementview
    // IE < 7: will miscalculate by skipping ancestors that are "position:relative"
    // IE, Opera: not work if there's a "position:fixed" in the ancestors
    var element=this.iframe;
    while(element) {        
        rv.pageX += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        rv.pageY += (element.offsetTop - element.scrollTop + element.clientTop);        
        element = element.offsetParent;    
    }

    return rv;
};

ozpIwc.Owf7Participant.prototype.inIframeBounds=function(location) {
    // since we normalized the coordinates, we can just check to see if they are 
    // within the dimensions of the iframe.
    return location.pageX >= 0 && location.pageX < this.iframe.clientWidth &&
           location.pageY >= 0 && location.pageY < this.iframe.clientHeight;
};

ozpIwc.Owf7Participant.prototype.onFakeMouseMoveFromClient=function(msg) {
    // originally translated the pageX/pageY to container coordinates.  With
    // the adapter, we're translating from screen coordinates so don't need to 
    // do any modification
//    console.log("Fake mouse move:",msg);
    var now=Date.now();
    var deltaT=now-this.lastMouseMove;
    if(deltaT < this.mouseMoveDelay) {
        return;
    }
//    console.log("Sending mouse move",msg);
    this.lastMouseMove=now;
    this.client.send({
       "dst": "data.api",
       "resource": ozpIwc.Owf7Participant.rpcChannel("_fake_mouse_move"),
       "action": "set",
       "entity": msg
    });
    
};

// Only sent if the client is a flash widget (dunno why?).  Otherwise, it sends a _dragStopInWidgetName
ozpIwc.Owf7Participant.prototype.onFakeMouseUpFromClient=function(msg) {
    // originally translated the pageX/pageY to container coordinates.  With
    // the adapter, we're translating from screen coordinates so don't need to 
    // do any modification
    this.client.send({
       "dst": "data.api",
       "resource": ozpIwc.Owf7Participant.rpcChannel("_fake_mouse_up"),
       "action": "set",
       "entity": msg
    });
};

/* Receive a fake mouse event from another widget.  Do the conversions and
 * finagling that the container would have done in OWF 7.
 */
ozpIwc.Owf7Participant.prototype.onFakeMouseMoveFromOthers=function(msg) {
    if(!("screenX" in msg && "screenY" in msg)) {
        return;
    }

    this.lastPosition=msg;
    if(msg.sender===this.rpcId) {
        return;
    }
    var localizedEvent=this.convertToLocalCoordinates(msg);
//    console.log("Received Fake mouse move at page("
//        +localizedEvent.pageX+","+localizedEvent.pageY+")");
    if(this.inIframeBounds(localizedEvent)) {
        this.mouseOver=true;
        gadgets.rpc.call(this.rpcId, '_fire_mouse_move', null,localizedEvent);
    } else {
        if(this.mouseOver) {
//            console.log("Faking an mouse dragOut at page("
//                +localizedEvent.pageX+","+localizedEvent.pageY+")");
            // this.eventingContainer.publish(this.dragOutName, null, lastEl.id);
            // fake the pubsub event directly to the recipient
            gadgets.rpc.call(this.rpcId, 'pubsub', null, "_dragOutName", "..", null);
        }
        this.mouseOver=false;
    }
};


/* Receive a fake mouse event from another widget.  Do the conversions and
 * finagling that the container would have done in OWF 7.
 */
ozpIwc.Owf7Participant.prototype.onFakeMouseUpFromOthers=function(msg) {
    var localizedEvent=this.convertToLocalCoordinates(msg);
    if(this.inIframeBounds(localizedEvent)) {
//        console.log("Received Fake mouse up at page("
//            +localizedEvent.pageX+","+localizedEvent.pageY+")");    
        gadgets.rpc.call(this.rpcId, '_fire_mouse_up', null,localizedEvent);
    } else {
        // send a mouse up over container message
        // @see dd/WidgetDragAndDropContainer.js:257
        
        // this.eventingContainer.publish(this.dragStopInContainerName, null);
        // TODO: not sure if the cancel goes here
//        this.client.send({
//            "dst": "data.api",
//            "resource": this.pubsubChannel("_dragStopInContainer"),
//            "action": "set",
//            "entity": msg  // ignored, but changes the value to trigger watches
//        });
    }
};

ozpIwc.Owf7Participant.prototype.registerDragAndDrop=function() {
    var self=this;
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.rpcChannel("_fake_mouse_up"),
        "action": "watch"
    },function(packet,unregister) {
        if(packet.response!=="changed") return;
        self.onFakeMouseUpFromOthers(packet.entity.newValue);
    });
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.rpcChannel("_fake_mouse_move"),
        "action": "watch"
    },function(packet,unregister) {
        if(packet.response!=="changed") return;
        self.onFakeMouseMoveFromOthers(packet.entity.newValue);
    });
 
};
//==========================
// Hook the pubsub channels for drag and drop
//==========================

// No action needed, just let the move as normal for these:
// _dragStart: publish, receive
// _dragOverWidget:  publish, receive (not used by client)

 
// cancel the publish, since these should originate from the container, not widgets
ozpIwc.Owf7Participant.prototype.hookPublish_dragOutName=function() {return false;};
ozpIwc.Owf7Participant.prototype.hookPublish_dropReceiveData=function() { return false; };
ozpIwc.Owf7Participant.prototype.hookPublish_dropReceiveData=function() { return false; };

// cancel the receive, since these should not originate from outside the adapter
ozpIwc.Owf7Participant.prototype.hookReceive_dragSendData=function() { return false;};
ozpIwc.Owf7Participant.prototype.hookReceive_dragOutName=function() { return false;};
ozpIwc.Owf7Participant.prototype.hookReceive_dropReceiveData=function() { return false; };


// these all start the drag state
ozpIwc.Owf7Participant.prototype.hookReceive_dragStart=function(message) {
//    console.log("Starting external drag on ",message);
    this.inDrag=true;
    return true; 
};
ozpIwc.Owf7Participant.prototype.hookPublish_dragStart=function(message) {
//    console.log("Starting internal drag on ",message);
    this.inDrag=true;
    return true; 
};

// these all stop the drag state
ozpIwc.Owf7Participant.prototype.hookReceive_dragStopInContainer=function() {
//    console.log("Stopping drag in container");
    this.inDrag=false;
    return true; 
};
ozpIwc.Owf7Participant.prototype.hookReceive_dragStopInWidget=function() {
//    console.log("Stopping drag in widget");
    this.inDrag=false;
    return true; 
};

// Merely store the dragData for later.
ozpIwc.Owf7Participant.prototype.hookPublish_dragSendData=function(message) {
//    console.log("Setting drag data to ",message);
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.rpcChannel("_dragSendData_value"),
        "action": "set",
        "entity": message
    });
    return false;
};

ozpIwc.Owf7Participant.prototype.hookPublish_dragStopInWidget=function(message) {
    // this always published from the widget that initiated the drag
    // so we need to figure out who to send it to
    
    // make sure the mouse is actually over the widget so that it can't steal
    // the drag from someone else
    if(!this.mouseOver) {
//        console.log("dragStopInWidget, but not over myself.  Faking mouse event",this.lastPosition);
        this.onFakeMouseUpFromClient(this.lastPosition);

        return false;
    }
    // this widget claims the drag, give it the drag data
    var self=this;
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.rpcChannel("_dragSendData_value"),
        "action": "get"
    },function(packet,unregister) {
        unregister();

        if(packet.response==="ok") {
//            console.log("Completing drag of data ",packet.entity);
            gadgets.rpc.call(self.rpcId, 'pubsub', null, "_dropReceiveData", "..", packet.entity);
        } else {
            console.log("Unable to fetch drag data",packet);
        }
        // tell everyone else that the container took over the drag
        // also handles the case where the we couldn't get the dragData for some reason by
        // canceling the whole drag operation
        // is this duplicative of the same event in _fake_mouse_up?
        
        self.client.send({
            "dst": "data.api",
            "resource": ozpIwc.Owf7Participant.pubsubChannel("_dragStopInContainer"),
            "action": "set",
            "entity": Date.now()  // ignored, but changes the value to trigger watches
        });
    });
    

    return true;
};

(function() {
    var absolutePath = function(href) {
        var link = document.createElement("a");
        link.href = href;
        return (link.protocol+"//"+link.host+link.pathname+link.search+link.hash);
    };
    

ozpIwc.Owf7ParticipantListener=function(config) {
	config = config || {};
//    if(!config.url) { throw "Needs a url for the widget"; }
//    if(!config.iframe) { throw "Needs an iframe";}
//    if(!config.client) {throw "Needs an IWC Client";}

    this.rpcRelay=absolutePath(config.rpcRelay || "rpc_relay.uncompressed.html");
	this.prefsUrl=absolutePath(config.prefsUrl || ozpIwc.owf7PrefsUrl || "/owf/prefs");
    this.participants={};
    this.offsetX=config.offsetX;
    this.offsetY=config.offsetY;
    
    this.client=new ozpIwc.InternalParticipant();
    ozpIwc.defaultRouter.registerParticipant(this.client);    
    
    if ((window.name === "undefined") || (window.name === "")) {
        window.name = "ContainerWindowName" + Math.random();
    }
    this.installDragAndDrop();
    var rpcString=function(rpc) {
		return "[service:" + rpc.s + ",from:" + rpc.f + "]:" + JSON.stringify(rpc.a);
	};
//	console.log("Registering RPC hooks");
	gadgets.rpc.registerDefault(function() {
		console.log("Unknown rpc " + rpcString(this));
	});
    
	var self=this;
    var getParticipant=function(id) {
        var p=self.participants[id];
        if(!p) {
            throw "Unknown participant";
        }
        return p;
    };
    
    // try to find our position on screen to help with cross-window drag and drop
    this.xOffset=window.screenX+window.outerWidth -document.body.clientWidth - 10;
    this.yOffset=window.screenY+window.outerHeight - document.body.clientHeight - 30;


    
	/**
	 * Called by the widget to connect to the container
	 * @see js/eventing/Container.js:26 for the containerInit function that much of this is copied from
	 * @see js/eventing/Container.js:104 for the actual rpc.register
	 */
	gadgets.rpc.register('container_init',function(sender,message) {
        getParticipant(this.f).onContainerInit(sender,message);
	});

	/**
	 * @param {string} command - publish | subscribe | unsubscribe
	 * @param {string} channel - the OWF7 channel
	 * @param {string} message - the message being published
	 * @param {string} dest - the ID of the recipient if this is point-to-point
	 * @see js/eventing/Container.js:376
	 * @see js-lib/shindig/pubsub.js
	 * @see js-lib/shindig/pubsub_router.js
	 */
//    var subscriptions={};
	gadgets.rpc.register('pubsub',function(command, channel, message, dest) {
        var p=getParticipant(this.f);
        switch (command) {
            case 'publish': 
                p.onPublish(command, channel, message, dest);
                break;
            case 'subscribe':
                p.onSubscribe(command, channel, message, dest);
                break;
            case 'unsubscribe': break;
                p.onUnsubscribe(command, channel, message, dest);
                break;
        }
	});
    
    // Launcher API
// The handling of the rpc event is in WidgetLauncherContainer
// @see js/launcher/WidgetLauncherContainer.js:22, 36
// msg: {
//    universalName: 'universal name of widget to launch',  //universalName or guid maybe identify the widget to be launched
//    guid: 'guid of widget to launch',
//    title: 'title to replace the widgets title' the title will only be changed if the widget is opened.
//    titleRegex: optional regex used to replace the previous title with the new value of title
//    launchOnlyIfClosed: true, //if true will only launch the widget if it is not already opened.
//                                   //if it is opened then the widget will be restored
//    data: dataString  //initial launch config data to be passed to a widget only if the widget is opened.  this must be a string
// });
//  The steps to launch a widget are defined in dashboard.launchWidgetInstance
//  @see js/components/dashboard/Dashboard.js:427
//  The "iframe properties" come from Dashboard.onBeforeWidgetLaunch
//  @see js/components/dashboard/Dashboard.js:318
//  @see js\eventing\Container.js:237 for getIframeProperties()
// WidgetIframeComponent actually creates the iframe tag.
// @see js\components\widget\WidgetIframeComponent.js:15
	gadgets.rpc.register('_WIDGET_LAUNCHER_CHANNEL',function(sender, msg) {
        var p=getParticipant(this.f);
        p.onLaunchWidget(sender,msg,this);
	});
    

	
    /**
     * _fake_mouse_move is needed for drag and drop.  The container code is at
     * @see reference\js\dd\WidgetDragAndDropContainer.js:52
     */
    gadgets.rpc.register('_fake_mouse_move',function(msg) {
		// @see @see reference\js\dd\WidgetDragAndDropContainer.js:52
        getParticipant(this.f).onFakeMouseMoveFromClient(msg);
	});
    
    gadgets.rpc.register('_fake_mouse_up',function(msg) {
		// @see @see reference\js\dd\WidgetDragAndDropContainer.js:52
         getParticipant(this.f).onFakeMouseUpFromClient(msg);
	});
    gadgets.rpc.register('_fake_mouse_out',function(){ /*ignored*/});
    
    var IGNORE=function(){};
    // @see js/components/keys/KeyEventing.js
    gadgets.rpc.register('_widget_iframe_ready',IGNORE);
    
//
//	// Intents API
//	
//	// used for both handling and invoking intents
//	// @see js/intents/WidgetIntentsContainer.js:32 for reference
//	gadgets.rpc.register('_intents',function(senderId, intent, data, destIds) {
//	});
//	
//	// used by widgets to register an intent
//	// @see js/intents/WidgetIntentsContainer.js:85 for reference
//	gadgets.rpc.register('_intents_receive',function(intent, destWidgetId) {
//	});
//

//
//	// WidgetProxy readiness
//	// @see js/kernel/kernel-rpc-base.js:130
//	gadgets.rpc.register('_widgetReady',function(widgetId) {
//	});
//	// @see js/kernel/kernel-rpc-base.js:147
//	gadgets.rpc.register('_getWidgetReady',function(widgetId, srcWidgetId) {
//	});
//
//	// OWF.log
//	gadgets.rpc.register('Ozone.log',function() {
//	});
//
//	// Widget State functions

//	gadgets.rpc.register('after_container_init',function() {
//	});
//
//	gadgets.rpc.register('_WIDGET_STATE_CHANNEL_' + instanceId,function() {
//	});


};
ozpIwc.Owf7ParticipantListener.prototype.makeGuid=function() {
    // not a real guid, but it's the way OWF 7 does it
    var S4=function(){
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

ozpIwc.Owf7ParticipantListener.prototype.updateMouseCoordinates=function(e) {
//      console.log("Updating coords from("+this.xOffset+","+this.yOffset+")");
      this.xOffset=e.screenX-e.clientX;
      this.yOffset=e.screenY-e.clientY;
//      console.log("     to ("+this.xOffset+","+this.yOffset+")");
};

ozpIwc.Owf7ParticipantListener.prototype.convertToLocalCoordinates=function(msg,element) {
    // copy the message
    var rv={};
    for(var k in msg) {
        rv[k]=msg[k];
    }

    // start with the location relative to the adapter's top-left
    rv.pageX=msg.screenX-this.xOffset;
    rv.pageY=msg.screenY-this.yOffset;

    // this calculates the position of the iframe relative to the document,
    // accounting for scrolling, padding, etc.  If we started at zero, this
    // would be the iframe's coordinates inside the document.  Instead, we started
    // at the mouse location relative to the adapter, which gives the location
    // of the event inside the iframe content.
    // http://www.kirupa.com/html5/get_element_position_using_javascript.htm
    
    // should work in most browsers: http://www.quirksmode.org/dom/w3c_cssom.html#elementview
    // IE < 7: will miscalculate by skipping ancestors that are "position:relative"
    // IE, Opera: not work if there's a "position:fixed" in the ancestors
    while(element) {        
        rv.pageX += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        rv.pageY += (element.offsetTop - element.scrollTop + element.clientTop);        
        element = element.offsetParent;    
    }

    return rv;
};
ozpIwc.Owf7ParticipantListener.prototype.addWidget=function(config) {
  // From the caller: config.url and config.iframe
  config.listener=this;
  config.client=new ozpIwc.InternalParticipant();
  ozpIwc.defaultRouter.registerParticipant(config.client);
  config.guid=config.instanceId || "eb5435cf-4021-4f2a-ba69-dde451d12551"; // FIXME: generate
  config.instanceId=config.instanceId || this.makeGuid(); // FIXME: generate
  config.rpcId=gadgets.json.stringify({id:config.instanceId});
  this.participants[config.rpcId]=new ozpIwc.Owf7Participant(config);
  
  // @see js\state\WidgetStateContainer.js:35
  gadgets.rpc.register('_WIDGET_STATE_CHANNEL_'+config.instanceId,function(){});
};

ozpIwc.Owf7ParticipantListener.prototype.cancelDrag=function() {
    this.inDrag=false;
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.pubsubChannel("_dragStopInContainer"),
        "action": "set",
        "entity": Date.now()  // ignored, but changes the value to trigger watches
    });
};

ozpIwc.Owf7ParticipantListener.prototype.installDragAndDrop=function() {
    var self=this;
    var updateMouse=function(evt) {self.updateMouseCoordinates(evt);};
    
    document.addEventListener("mouseenter",updateMouse);
    document.addEventListener("mouseout",updateMouse);
    
    this.client.send({
       "dst":"data.api",
       "resource": ozpIwc.Owf7Participant.pubsubChannel("_dragStart"),
       "action": "watch"       
    },function(reply) {
        if(reply.response === "changed") {
            self.inDrag=true;        
        }
    });
    this.client.send({
        "dst": "data.api",
        "resource": ozpIwc.Owf7Participant.pubsubChannel("_dragStopInContainer"),
        "action": "watch"
    },function(reply) {
        if(reply.response === "changed") {
            self.inDrag=false;        
        }
    });    
    
    document.addEventListener("mousemove",function(e) {
        self.updateMouseCoordinates(e);
//        console.log("Adapter mousemove at ",e);
        if(self.inDrag && (e.buttons&1) !== 1) {
            console.log("Canceling drag");
            self.cancelDrag();
        }
    },false);
//    document.addEventListener("mouseup",function(e) {
////        if(self.inDrag) {
////            return;
////        }
//        self.onFakeMouseUpFromClient({
//            sender: self.rpcId,
//            pageX: e.pageX,
//            pageY: e.pageY,
//            screenX: e.screenX,
//            screenY: e.screenY
//        });
//    },false);
};
})();
//# sourceMappingURL=ozp-iwc-owf7-widget-adapter.js.map