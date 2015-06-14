'use strict';

require('colors');
var exec = require('child_process').exec;
var isWin = !!process.platform.match(/^win/);

// Execute shell command displaying output and possible errors
//
function execute(cmd) {
  exec(cmd, function(error, stdout, stderr) {
    console.log(stdout);
    if (error) console.log(error);
    if (stderr) console.log(stderr);
  });
}

// Install Impress Application Server as a service
//
function installService() {
  exec('chmod +x ./bin/install.sh', function() {
    exec('./bin/install.sh');
  });
}

console.log('Impress Application Server CLI'.green.bold);
if (!isWin) installService();
