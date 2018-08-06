#!/usr/bin/env node

'use strict';

const os = require('os');
const fs = require('fs');
const ncp = require('ncp').ncp;
const cp = require('child_process');
const metasync = require('metasync');
const concolor = require('concolor');
const readline = require('readline');

const isWin = !!process.platform.match(/^win/);

ncp.limit = 16;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const nodePar = [
  ['stack-trace-limit', 1000],
  ['allow-natives-syntax'],
  ['max_old_space_size', 2048]
].map(par => `--${par.join('=')}`).join(' ');


const linkFileName = __dirname + '/impress.link';
const existsLink = fs.existsSync(linkFileName);
let impressPath = '/impress';

if (existsLink) {
  try {
    impressPath = fs.readFileSync(linkFileName, 'utf8');
  } catch (e) {
    // just do not change impressPath
  }
}

const applicationsDir = impressPath + '/applications';
const curDir = process.cwd();
let commandName, command;
const parameters = process.argv;

let pkgPlace = impressPath + '/node_modules/impress/package.json';
let pkgExists = fs.existsSync(pkgPlace);
let pkgData;

if (!pkgExists) {
  pkgPlace = impressPath + 'package.json';
  pkgExists = fs.existsSync(pkgPlace);
}

if (pkgExists) {
  try {
    pkgData = require(pkgPlace);
  } catch (err) {
    console.log(err.toString());
  }
} else {
  pkgData = { version: '' };
}

global.applications = [];

// Execute shell command displaying output and possible errors
const execute = (cmd, callback) => {
  cp.exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
    error = error || stderr;
    if (error) {
      console.log(concolor.error(error.toString()));
    } else {
      console.log(stdout);
    }
    if (callback) callback();
  });
};

// Release readline on exit
const doExit = () => {
  rl.close();
  process.chdir(curDir);
  process.exit(0);
};

// Command line commands list
const showHelp = () => {
  console.log(
    concolor.b('Syntax:\n') +
    concolor.white('  impress path <path>\n' +
    '  impress start\n' +
    '  impress stop [-f|--force]\n' +
    '  impress restart [-f|--force]\n' +
    '  impress status\n' +
    '  impress version\n' +
    '  impress update\n' +
    '  impress autostart [on|off]\n' +
    '  impress list\n' +
    '  impress add [path]\n' +
    '  impress remove [name]\n' +
    '  impress new [name]')
  );
  doExit();
};

// Commands
const commands = {
  list() { // impress list
    console.log('  Applications: ');
    for (let i = 0; i < applications.length; i++) {
      console.log(concolor.info('    ' + applications[i]));
    }
    doExit();
  },

  add() { // impress add [path]
    let applicationName = parameters[1];

    const doAdd = () => {
      const applicationPath = applicationsDir + '/' + applicationName;
      const applicationLink = applicationPath + '/application.link';
      fs.mkdirSync(applicationPath);
      fs.writeFileSync(applicationLink, curDir);
      console.log(
        'Application "' + applicationName +
        '" added with link to: ' + curDir
      );
      doExit();
    };

    const doInput = () => {
      rl.question('Enter application name: ', (answer) => {
        if (!applications.includes(answer)) {
          applicationName = answer;
          doAdd();
          doExit();
        } else {
          console.log('Application "' + answer + '" already exists');
          doInput();
        }
      });
    };

    if (applicationName) doAdd();
    else doInput();
  },

  remove() { // impress remove [name]
    console.log('Not implemented');
    doExit();
  },

  new() { // impress new [name]
    console.log('Not implemented');
    doExit();
  },

  start() { // impress start

    const startFailed = () => {
      console.log(concolor.error(
        'Failed to start Impress Application Server\n' +
        'See logs in ' + impressPath + '/log/ for details'
      ));
    };

    const checkStarted = (callback) => {
      fs.readFile('./run.pid', (err, pid) => {
        if (err) {
          startFailed();
          return callback();
        }

        cp.exec('kill -0 ' + pid, (err) => {
          if (err) {
            startFailed();
          }

          callback();
        });
      });
    };

    const finalize = () => {
      fs.unlink('./run.pid', () => {
        doExit();
      });
    };

    if (isWin) {
      execute(
        'start cmd /K "cd /d ' + impressPath.replace(/\//g, '\\') +
        ' & node ' + nodePar + ' server.js"', doExit
      );
    } else {
      const command = (
        'cd ' + impressPath + '; nohup node ' + nodePar +
        ' server.js > /dev/null 2>&1 & echo $! > ' + __dirname + '/run.pid'
      );
      execute(command, () => {
        setTimeout(() => {
          checkStarted(finalize);
        }, 2000);
      });
    }
  },

  stop(callback) { // impress stop
    callback = callback || doExit;
    const force = ['-f', '--force'].includes(parameters[1]);
    if (isWin) {
      console.log('Not implemented');
      callback();
      return;
    }
    cp.exec('ps -A | awk \'{if ($4 == "impress") print $1, $5}\'',
      (err, stdout, stderr) => {
        const error = err || stderr;
        if (error) {
          console.log(concolor.error(error.toString()));
          callback();
          return;
        }

        let processes = stdout.toString()
          .split('\n')
          .filter(line => line !== '')
          .map(line => {
            const parsedLine = line.split(' ');
            return { pid: parsedLine[0], workerId: parsedLine[1] };
          });

        if (!force) processes = processes.filter(
          parsedLine => parsedLine.workerId === 'srv'
        );

        metasync.series(processes, (worker, cb) => {
          let command = 'kill ';
          if (force) command += '-9 ';
          execute(command + worker.pid, cb);
        }, (err) => {
          if (err) {
            console.log(concolor.error(err.toString()));
          } else {
            console.log('Stopped');
          }
          callback();
        });
      }
    );
  },

  restart() { // impress restart
    if (isWin) {
      console.log('Not implemented');
      doExit();
    } else {
      commands.stop(commands.start);
    }
  },

  status() { // impress status
    if (isWin) {
      console.log('Not implemented');
      doExit();
    } else {
      execute(
        'ps aux | grep "impress\\|%CPU" | grep -v "grep\\|status"',
        () => {
          console.log('Stopped');
          doExit();
        }
      );
    }
  },

  version() { // impress version
    console.log(
      ' Impress AS: ' + pkgData.version + '\n' +
      '    Node.js: ' + process.versions.node + '\n' +
      '         v8: ' + process.versions.v8 + '\n' +
      '      libuv: ' + process.versions.uv + '\n' +
      '       zlib: ' + process.versions.zlib + '\n' +
      '   Open SSL: ' + process.versions.openssl + '\n' +
      'HTTP parser: ' + process.versions.http_parser + '\n' +
      '         OS: ' + os.type() + ' ' + os.release() + ' ' + os.arch()
    );
    doExit();
  },

  update() { // impress update
    if (isWin) {
      console.log('Not implemented');
      doExit();
    } else {
      execute(
        'npm update -g impress-cli; cd ' + impressPath + '; npm update', doExit
      );
    }
  },

  autostart() { // impress autostart
    if (isWin) {
      console.log('Not implemented');
      doExit();
    } else if (parameters[1] === 'on') {
      execute('sudo ./bin/install.sh', () => {
        console.log('Installed to autostart on system boot');
        doExit();
      });
    } else if (parameters[1] === 'off') {
      execute('sudo ./bin/uninstall.sh', () => {
        console.log('Uninstalled from autostart on system boot');
        doExit();
      });
    } else {
      showHelp();
    }
  },

  path() { // impress autostart
    if (parameters[1]) {
      impressPath = parameters[1];
      fs.writeFileSync('./impress.link', impressPath);
    }
    console.log(concolor.info('  Path: ' + impressPath));
    doExit();
  }

};

console.log('Impress Application Server ' + concolor.info(pkgData.version));
process.chdir(__dirname);

// Parse command line
if (parameters.length < 3) {
  showHelp();
} else {
  if (fs.existsSync(applicationsDir)) {
    global.applications = fs.readdirSync(applicationsDir);
  }
  parameters.shift();
  parameters.shift();
  commandName = parameters[0];
  command = commands[commandName];
  if (!command) showHelp();
  else command();
}
