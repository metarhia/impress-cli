'use strict';

const exec = require('child_process').exec;
const concolor = require('concolor');

const isWin = !!process.platform.match(/^win/);

// Execute shell command displaying output and possible errors
const execute = (cmd, callback) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(concolor.error(error.toString()));
      console.error(concolor.error(stderr));
    } else {
      console.log(stdout);
    }
    if (callback) callback();
  });
};

// Install Impress Application Server as a service
const installService = () => {
  process.chdir(__dirname);
  execute('chmod +x ./bin/install.sh', () => {
    execute('sudo ./bin/install.sh');
  });
};

console.log(concolor.info('Impress Application Server CLI'));

if (!isWin) installService();
