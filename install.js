'use strict';

const exec = require('child_process').exec;
const concolor = require('concolor');

const isWin = !!process.platform.match(/^win/);

function execute(
  // Execute shell command displaying output and possible errors
  cmd,
  callback
) {
  exec(cmd, (error, stdout /* stderr */) => {
    if (error) {
      console.log(concolor.error(error.toString()));
    } else {
      console.log(stdout);
    }
    if (callback) callback();
  });
}

function installService(
  // Install Impress Application Server as a service
) {
  process.chdir(__dirname);
  execute('chmod +x ./bin/install.sh', () => {
    execute('./bin/install.sh');
  });
}

console.log(concolor.info('Impress Application Server CLI'));

if (!isWin) installService();
