'use strict';

require('colors');
const exec = require('child_process').exec;
const isWin = !!process.platform.match(/^win/);

// Execute shell command displaying output and possible errors
//
function execute(cmd, callback) {
  exec(cmd, (error, stdout /* stderr */) => {
    if (error) console.log(error.toString());
    else console.log(stdout);
    if (callback) callback();
  });
}

// Install Impress Application Server as a service
//
function installService() {
  process.chdir(__dirname);
  execute('chmod +x ./bin/install.sh', () => execute('./bin/install.sh'));
}

console.log('Impress Application Server CLI'.green.bold);
if (!isWin) installService();
