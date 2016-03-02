const electron = require('electron-prebuilt');
const proc = require('child_process');
const child = proc.spawn(electron, ['.']);
