#!/usr/bin/env node

'use strict';

require('colors');

var fs = require('fs'),
    path = require('path'),
    ncp = require('ncp').ncp,
    readline = require('readline'),
    exec = require('child_process').exec;
    //spawn = require('child_process').spawn,
    //async = require('async');

var isWin = !!process.platform.match(/^win/);

ncp.limit = 16;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var nodePar = '--stack-trace-limit=1000 --allow-natives-syntax --max_old_space_size=2048',
    linkFileName = __dirname + '/impress.link',
    existsLink = fs.existsSync(linkFileName),
    impressPath = existsLink ? fs.readFileSync(linkFileName, 'utf8') : '/impress',
    applicationsDir = impressPath + '/applications',
    curDir = process.cwd(),
    commandName, command,
    parameters = process.argv,
    current = path.dirname(__filename.replace(/\\/g, '/'));
    //parent = path.basename(path.dirname(current));


global.applications = [];

// Execute shell command displaying output and possible errors
//
function execute(cmd, callback) {
  exec(cmd, function(error, stdout, stderr) {
    if (error) console.log(error.toString());
    else console.log(stdout);
    if (callback) callback();
  });
}

// Release readline on exit
//
function doExit() {
  rl.close();
  process.exit(0);
}

// Command line commands list
//
function showHelp() {
  console.log(
    'Syntax:\n'+
    '  impress list\n'+
    '  impress add [path]\n'+
    '  impress remove [name]\n'+
    '  impress new [name]\n'+
    '  impress start\n'+
    '  impress stop\n'+
    '  impress restart\n'+
    '  impress status\n'+
    '  impress update\n'+
    '  impress autostart [on|off]\n'+
    '  impress path <path>'
  );
  doExit();
}

function notInstalled() {
  console.log('  Error: not installed as a service (globally)'.red.bold);
  process.exit(0);
}

// Command line commands
//
var commands = {

  // impress list
  //
  list: function() {
    console.log('  Applications: ');
    var i;
    for (i = 0; i < applications.length; i++) {
      console.log('    ' + applications[i].green.bold);
    }
    doExit();
  },

  // impress add [path]
  //
  add: function() {

    function doInput() {
      rl.question('Enter application name: ', function(answer) {
        if (applications.indexOf(answer) === -1) {
          applicationName = answer;
          doAdd();
          doExit();
        } else {
          console.log('Application "' +answer+ '" already exists');
          doInput();
        }
      });
    }

    function doAdd() {
      var applicationPath = applicationsDir + '/' + applicationName,
          applicationLink = applicationPath + '/' + 'application.link';
      fs.mkdirSync(applicationPath);
      fs.writeFileSync(applicationLink, curDir);
      console.log('Application "' + applicationName + '" added with link to: ' + curDir);
      doExit();
    }

    var applicationName = parameters[1];
    if (applicationName) doAdd(); else doInput();

  },

  // impress remove [name]
  //
  remove: function() {
    console.log('Not implemented');
    doExit();
  },

  // impress new [name]
  //
  new: function() {
    console.log('Not implemented');
    doExit();
  },

  // impress start
  //
  start: function() {
    if (isWin) execute('start cmd /K "cd /d ' + impressPath.replace(/\//g, '\\') + ' & node ' + nodePar + ' server.js"', doExit);
    else execute('cd ' + impressPath + '; nohup node ' + nodePar + ' server.js > /dev/null 2>&1 &', doExit);
  },
        
  // impress stop
  //
  stop: function() {
    if (isWin) {
      console.log('Not implemented');
      doExit();
    } else execute('killall "impress srv"', doExit);
  },

  // impress restart
  //
  restart: function() {
    if (isWin) {
      console.log('Not implemented');
      doExit();
    } else execute('killall "impress srv"', commands.start);
  },

  // impress status
  //
  status: function() {
    if (isWin) {
      console.log('Not implemented');
      doExit();
    } else execute('ps aux | grep "impress\\|%CPU" | grep -v "grep\\|status"', doExit);
  },

  // impress update
  //
  update: function() {
    if (isWin) {
      console.log('Not implemented');
      doExit();
    } else execute('npm update -g impress-cli; cd ' + impressPath +'; npm update', doExit);
  },

  // impress autostart
  //
  autostart: function() {
    if (isWin) {
      console.log('Not implemented');
      doExit();
    } else {
      if (parameters[1] === 'on') execute(__dirname + '/bin/install.sh', doExit);
      else if (parameters[1] === 'off') execute(__dirname + '/bin/uninstall.sh', doExit);
      else showHelp();
    }
  },

  // impress autostart
  //
  path: function() {
    if (parameters[1]) {
      impressPath = parameters[1]
      fs.writeFileSync(__dirname + '/impress.link', impressPath);
    }
    console.log('  Path: ' + impressPath.green.bold);
    doExit();
  }

};

console.log('Impress Application Server CLI'.green.bold);

// Parse command line
//
if (parameters.length < 3) showHelp();
else {
  if (fs.existsSync(applicationsDir)) applications = fs.readdirSync(applicationsDir);
  parameters.shift();
  parameters.shift();
  commandName = parameters[0];
  command = commands[commandName];
  if (!command) showHelp();
  else command();
}
