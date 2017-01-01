#!/usr/bin/env node

'use strict';

require('colors');

const os = require('os');
const fs = require('fs');
const ncp = require('ncp').ncp;
const cp = require('child_process');
const metasync = require('metasync');
const readline = require('readline');

const isWin = !!process.platform.match(/^win/);

ncp.limit = 16;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const nodePar = (
  '--stack-trace-limit=1000 --allow-natives-syntax --max_old_space_size=2048'
);

const linkFileName = __dirname + '/impress.link';
const existsLink = fs.existsSync(linkFileName);
let impressPath = '/impress';

if (existsLink) {
  impressPath = fs.readFileSync(linkFileName, 'utf8');
}

const applicationsDir = impressPath + '/applications';
const curDir = process.cwd();
let commandName, command;
const parameters = process.argv;

let pkgPlace = impressPath + '/node_modules/impress/package.json',
    pkgExists = fs.existsSync(pkgPlace),
    pkgData;

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
} else pkgData = { version: '' };

global.applications = [];

// Execute shell command displaying output and possible errors
//
function execute(cmd, callback) {
  cp.exec(cmd, { cwd: __dirname }, (error, stdout /* stderr */) => {
    if (error) console.log(error.toString());
    else console.log(stdout);
    if (callback) callback();
  });
}

// Release readline on exit
//
function doExit() {
  rl.close();
  process.chdir(curDir);
  process.exit(0);
}

// Command line commands list
//
function showHelp() {
  console.log(
    'Syntax:\n' +
    '  impress path <path>\n' +
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
    '  impress new [name]'
  );
  doExit();
}

// Command line commands
//
const commands = {

  // impress list
  //
  list() {
    console.log('  Applications: ');
    let i;
    for (i = 0; i < applications.length; i++) {
      console.log('    ' + applications[i].green.bold);
    }
    doExit();
  },

  // impress add [path]
  //
  add() {

    let applicationName = parameters[1];
    if (applicationName) doAdd(); else doInput();

    function doInput() {
      rl.question('Enter application name: ', (answer) => {
        if (applications.indexOf(answer) === -1) {
          applicationName = answer;
          doAdd();
          doExit();
        } else {
          console.log('Application "' + answer + '" already exists');
          doInput();
        }
      });
    }

    function doAdd() {
      const applicationPath = applicationsDir + '/' + applicationName;
      const applicationLink = applicationPath + '/application.link';
      fs.mkdirSync(applicationPath);
      fs.writeFileSync(applicationLink, curDir);
      console.log(
        'Application "' + applicationName +
        '" added with link to: ' + curDir
      );
      doExit();
    }

  },

  // impress remove [name]
  //
  remove() {
    console.log('Not implemented');
    doExit();
  },

  // impress new [name]
  //
  new() {
    console.log('Not implemented');
    doExit();
  },

  // impress start
  //
  start() {

    function checkStarted(callback) {
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
    }

    function startFailed() {
      console.log(
        'Failed to start Impress Application Server'.bold.red + '\n' +
        ('See logs in ' + impressPath + '/log/ for details').bold.red
      );
    }

    function finalize() {
      fs.unlink('./run.pid');
      doExit();
    }

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

  // impress stop
  //
  stop(callback) {
    callback = callback || doExit;

    let force = false;
    if (['-f', '--force'].indexOf(parameters[1]) !== -1) {
      force = true;
    }

    if (isWin) {
      console.log('Not implemented');
      callback();
    } else {
      cp.exec('ps -A | awk \'{if ($4 == "impress") print $1, $5}\'',
        (err, stdout, stderr) => {
          const error = err || stderr;
          if (error) {
            console.log(error.toString().red.bold);
            callback();
          }

          const processes = stdout.toString().split('\n').filter((line) =>
             line !== ''
          ).map((line) => {
            const parsedLine = line.split(' ');
            return { pid: parsedLine[0], workerId: parsedLine[1] };
          }).sort((first, second) => {
            if (first.workerId  === 'srv') return -1;
            if (second.workerId === 'srv') return 1;
            return 0;
          });

          metasync.series(processes, (worker, cb) => {
            let command = 'kill ';
            if (force) command += '-9 ';
            execute(command + worker.pid, cb);
          }, (err) => {
            if (err) console.log(err.toString().red.bold);
            else console.log('Stopped');
            callback();
          });
        }
      );
    }
  },

  // impress restart
  //
  restart() {
    if (isWin) {
      console.log('Not implemented');
      doExit();
    } else {
      commands.stop(commands.start);
    }
  },

  // impress status
  //
  status() {
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

  // impress version
  //
  version() {
    console.log(
      ' Impress AS: ' + pkgData.version + '\n' +
      '    Node.js: ' + process.versions['node'] + '\n' +
      '         v8: ' + process.versions['v8'] + '\n' +
      '      libuv: ' + process.versions['uv'] + '\n' +
      '       zlib: ' + process.versions['zlib'] + '\n' +
      '   Open SSL: ' + process.versions['openssl'] + '\n' +
      'HTTP parser: ' + process.versions['http_parser'] + '\n' +
      '         OS: ' + os.type() + ' ' + os.release() + ' ' + os.arch()
    );
    doExit();
  },

  // impress update
  //
  update() {
    if (isWin) {
      console.log('Not implemented');
      doExit();
    } else {
      execute(
        'npm update -g impress-cli; cd ' + impressPath + '; npm update', doExit
      );
    }
  },

  // impress autostart
  //
  autostart() {
    if (isWin) {
      console.log('Not implemented');
      doExit();
    } else if (parameters[1] === 'on') {
      execute('./bin/install.sh', () => {
        console.log('Installed to autostart on system boot');
        doExit();
      });
    } else if (parameters[1] === 'off') {
      execute('./bin/uninstall.sh', () => {
        console.log('Uninstalled from autostart on system boot');
        doExit();
      });
    } else showHelp();
  },

  // impress autostart
  //
  path() {
    if (parameters[1]) {
      impressPath = parameters[1];
      fs.writeFileSync('./impress.link', impressPath);
    }
    console.log('  Path: ' + impressPath.green.bold);
    doExit();
  }

};

console.log(('Impress Application Server ' + pkgData.version).green.bold);
process.chdir(__dirname);

// Parse command line
//
if (parameters.length < 3) showHelp();
else {
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
