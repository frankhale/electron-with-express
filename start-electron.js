const electron = require("electron");

const proc = require("child_process");

proc.spawn(electron, ["."]);