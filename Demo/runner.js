var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  
  var urlInfo = url.parse(req.url);
  var filePath = '.' + urlInfo.pathname;
  
  console.log("Requested: " + filePath);
  
  var contentType = 'text/html';
  switch (path.extname(filePath)) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.264':
      contentType = 'application/octet-stream';
      break;
  }
  
  path.exists(filePath, function (exists) {
    if (exists) {
      fs.readFile(filePath, function (error, content) {
        if (error) {
          res.writeHead(500);
          res.end();
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
          console.log("Served Requested: " + filePath);
        }
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });
}).listen(8000, "127.0.0.1");

console.log('Server running at http://127.0.0.1:8000/');

function extend() {
  var t = {};
  for (var a in arguments) {
    for (var k in arguments[a]) {
      t[k] = arguments[a][k];
    }
  }
  return t;
}

function expand(pre, obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }      
  var result = [];
  var tmp = {};
  
  function foo(k) {
    var key = keys[k];
    obj[key].split(",").forEach(function (val) {
      tmp[key] = val;
      if (k < keys.length - 1) {
        foo(k + 1);
      } else {
        result.push(extend(pre, tmp));
      }
    });
  }
  foo(0);
  return result;
}

var command = '/Users/mbebenita/Desktop/Nightly.app/Contents/MacOS/firefox';
var configs = [];

configs = configs.concat(expand({}, {
  clip: "mozilla_story.264",
  mode: "none",
  deblocking: "none",
  filterHorLuma: "none",
  filterVerLumaEdge: "none",
  getBoundaryStrengths: "none",
  sample: "0,1,2"
}));

console.log(configs);

var spawn = require('child_process').spawn;
var argsPrefix = '-no-remote -P Broadway http://localhost:8000/broadway.html?';

function next() {
  if (configs.length > 0) {
    var args = argsPrefix + escape(JSON.stringify(configs.pop()));
    console.log(args);
    var child = spawn(command, args.split(' '));
    child.on('exit', function (code, signal) {
      console.log('Child process terminated ' + signal);
      setTimeout(next, 0);
    });
    
    setTimeout(function() {
      child.kill('SIGHUP');
    }, 10000);
  }
}

next();

