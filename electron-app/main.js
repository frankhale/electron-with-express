var app = require('app');
var BrowserWindow = require('browser-window');

var mainWindow = null;

app.on('window-all-closed', function() {
  if (process.platform != 'darwin')
    app.quit();
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
  "auto-hide-menu-bar": true,
  "web-preferences": {
    "node-integration": false
  },
	width: 600,
	height: 400});

	mainWindow.loadUrl('http://127.0.0.1:3000/');
  //mainWindow.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
