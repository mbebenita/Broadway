/**
 * Asynchronous client / server socket for communicating web workers.
 * 
 * Message Structure: {name: ... [,reply: ...], payload: ...}
 * 
 * Messages get routed using the name property. The reply property is automatically generated
 * whenever the sender registers an anonymous callback for a sendMessage call.
 */
var WorkerSocket = (function workerSocket() {
  function constructor(url) {
    this.client = url ? false : true;
    this.socket = this.client ? self : new Worker(url);
    this.dispatch = {};
    this.socket.addEventListener('message', function (event) {
      if (!event.data.name) {
        console.info("No message name.");
        return;
      }
      if (event.data.name in this.dispatch) {
        this.dispatch[event.data.name](event.data);
      } else {
        console.info("Unknown message name: " + event.data.name);
      }
    }.bind(this));
    
    if (this.client) {
      this.onReceiveMessage("internal-notify", function (message) {
        this.sendMessage(message.reply, null);
      }.bind(this));
    }
  }
  constructor.prototype = {
    /**
     * Register as a callback whenever a certain message is received.
     */
    onReceiveMessage: function(name, callback) {
      this.dispatch[name] = callback;
    },
    /**
     * Send a message and optionally register a callback. It's the responsibility of the client to send back a reply.
     */
    sendMessage: function(name, payload, callback) {
      var message = {name: name, payload: payload};
      if (callback) {
        message.reply = name + "-reply";
        this.onReceiveMessage(message.reply, callback);
      }
      this.socket.postMessage(message);
    },
    notify: function (callback) {
      if (!this.client) {
        this.sendMessage("internal-notify", null, callback);
      }
    }
  };
  return constructor;
})();