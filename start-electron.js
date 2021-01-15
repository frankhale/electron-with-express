const electron = require("electron"),
  proc = require("child_process");

proc.spawn(electron, ["."]);
