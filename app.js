var express = require('express');
var net = require('net');
var app = express();

app.get('/:ip\::port(\\d+)/', function (req, res){
  requestGameInfo(res, req.params.ip, req.params.port);
});

app.listen(1234);

var requestGameInfo = function requestGameInfo(res, address, port) {
  var netComGI = new Buffer([0, 4, 0, 0, 0, 9]);
  var socket = new net.Socket();
  var hasErrors = false;
  var errors;
  var data = {};
  socket.setTimeout(5500, function () {
    errors = {};
    errors.code = 'TIMEOUT';
    errors.message = 'Socket timeout';
    hasErrors = true;
    socket.destroy();
  })
  try {
    socket.connect(port, address, function() {
      socket.write(netComGI);
    });
  } catch (e) {
    errors = e;
    console.error(e);
    hasErrors = true;
  }

  socket.on('data', function (bdata) {
    var buffData = bdata.toJSON().data;
    if (buffData.length > 0) {
      var size = ((buffData[0] << 8) | buffData[1]);
      var packetType = ((buffData[2] << 24) | (buffData[3] << 16) | (buffData[4] << 8) | (buffData[5]));
      if (packetType == 9) {
        data = JSON.parse(bdata.toString('utf8', 6, 6 + size - 5));
        socket.destroy();
      }
    }

  });

  socket.on('close', function() {
    if (hasErrors) {
      if (errors.code == 'ECONNREFUSED' || errors.code == 'EHOSTUNREACH' || errors.code == 'TIMEOUT') {
        console.error(errors);
        res.json({status: 404, message: 'Unable to reach game server, make sure your ports are open.'});
      } else {
        console.error(errors);
        res.json({status: 500, message: 'An unknown error has occured. If this state persists, please contact the developers.'});
      }
    } else {
      //updateServer(req, res, address, port, key, data);
      console.log(data);
      res.json(data);
    }
  });

  socket.on('error', function (err) {
    errors = err;
    console.error(err);
    hasErrors = true;
  })
};
