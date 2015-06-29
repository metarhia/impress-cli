'use strict';

require('colors');
var exec = require('child_process').exec;
var isWin = !!process.platform.match(/^win/);

// Execute shell command displaying output and possible errors
//
function execute(cmd, callback) {
  exec(cmd, function(error, stdout /* stderr */) {
    if (error) console.log(error.toString());
    else console.log(stdout);
    if (callback) callback();
  });
}

// Install Impress Application Server as a service
//
function installService() {
  process.chdir(__dirname);
  execute('chmod +x ./bin/install.sh', function() {
    execute('./bin/install.sh');
  });
}

console.log('Impress Application Server CLI'.green.bold);
if (!isWin) installService();
