/* eslint-disable object-shorthand */

"use strict";

// Using a closure to not leak anything but the API to the outside world.
(function (exports) {

  var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
  // var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
  var { ExtensionSupport } = ChromeUtils.import("resource:///modules/ExtensionSupport.jsm");

  let windowListener;

  class WindowListener extends ExtensionCommon.EventEmitter {
    constructor(extension) {
      super();
      this.extension = extension;
      this.callbackCount = 0;
    }

    get listenerId() {
      return `experiment_listener_${this.extension.uuid}_${this.extension.instanceId}`;
    }

    handleEvent(event) {
      // console.log("handler", event);
      let input = event.target.closest("input");
      // console.log("window: ", w);
      // Emit "toolbar-clicked" and send toolbar.id, event.clientX, event.clientY to
      // the registered callbacks.
      windowListener.emit("to-address-blur");
    }

    add(callback) {
      // Registering the callback for "to-address-blur".
      this.on("to-address-blur", callback);
      this.callbackCount++;

      if (this.callbackCount == 1) {
        ExtensionSupport.registerWindowListener(this.listenerId, {
          chromeURLs: [
            "chrome://messenger/content/messengercompose/messengercompose.xhtml",
          ],
          onLoadWindow: function (window) {
            let toAddrInput = window.document.getElementById("toAddrInput");
            toAddrInput.addEventListener("blur", windowListener.handleEvent);
          },
        });
      }
    }

    remove(callback) {
      // Un-Registering the callback for "to-address-blur".
      this.off("to-address-blur", callback);
      this.callbackCount--;

      if (this.callbackCount == 0) {
        for (let window of ExtensionSupport.openWindows) {
          if ([
            "chrome://messenger/content/messengercompose/messengercompose.xhtml",
          ].includes(window.location.href)) {
            // let toolbox = window.document.getElementById("mail-toolbox");
            let toAddrInput = window.document.getElementById("toAddrInput");
            toAddrInput.removeEventListener("blur", this.handleEvent);
            // removeEventListenerAll(toAddrInput)
          }
        }
        ExtensionSupport.unregisterWindowListener(this.listenerId);
      }
    }
  };

  class AddrInputListener extends ExtensionCommon.ExtensionAPI {
    // An alternative to defining a constructor here, is to use the onStartup
    // event. However, this causes the API to be instantiated directly after the
    // add-on has been loaded, not when the API is first used. Depends on what is
    // desired.
    constructor(extension) {
      super(extension);
      windowListener = new WindowListener(extension);
    }

    getAPI(context) {
      return {
        // Again, this key must have the same name.
        AddrInputListener: {
          // An event. Most of this is boilerplate you don't need to worry about, just copy it.
          onEditingFinished: new ExtensionCommon.EventManager({
            context,
            name: "AddrInputListener.onEditingFinished",
            // In this function we add listeners for any events we want to listen to, and return a
            // function that removes those listeners. To have the event fire in your extension,
            // call fire.async.
            register(fire) {
              function callback(event, id, x, y) {
                return fire.async(id, x, y);
              }
              windowListener.add(callback);
              return function () {
                windowListener.remove(callback);
              };
            },
          }).api(),

        },
      };
    }

    onShutdown(isAppShutdown) {
      if (isAppShutdown) {
        return;
      }
    }
  };

  // Export the api by assigning in to the exports parameter of the anonymous closure
  // function, which is the global this.
  exports.AddrInputListener = AddrInputListener;

})(this)
