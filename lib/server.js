var WebSocketServer = require('websocket').server,
    emptyPort = require('empty-port'),
    debug = require('debug')('marionette-js-logger:server'),
    http = require('http');

var PORT_START = 60000;

function locatePort(callback) {
  emptyPort({ startPort: PORT_START }, callback);
}

function Server(handleMessage) {
  if (typeof handleMessage === 'function') {
    this.handleMessage = handleMessage;
  }
}

Server.prototype = {
  _initEvents: function(server) {
    server.on('connect', function(con) {
      debug('client connect');
      con.on('message', function(message) {
        debug('client message', message);
        var json;
        try {
          json = JSON.parse(message.utf8Data);
        } catch (e) {
          debug('malformated message', message);
        }
        this.handleMessage(json);
      }.bind(this));
    }.bind(this));
  },

  handleMessage: function(event) {
    console.log('[marionette log] %s', event.message);
  },

  listen: function(port, callback) {
    if (typeof port === 'function') {
      callback = port;
      port = null;
    }

    var self = this;
    function startServer(err, port) {
      if (err) return callback && callback(err);

      var httpServer = http.createServer().listen(port);
      var webSocketServer = new WebSocketServer({
        httpServer: httpServer,
        autoAcceptConnections: true
      });

      self.httpServer = httpServer;
      self.port = port;
      self.wsServer = webSocketServer;
      self._initEvents(webSocketServer);
      callback && callback(null, httpServer, port);
    }

    if (!port) {
      locatePort(startServer);
    } else {
      startServer(null, port);
    }
  },

  close: function(done) {
    if (this.httpServer) {
      this.wsServer.shutDown();
      return this.httpServer.close(done);
    }
    process.nextTick(done);
  }
};

module.exports.Server = Server;
