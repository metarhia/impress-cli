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

var impressPath = '/impress',
    applicationsDir = impressPath + '/applications',
    curDir = process.cwd(),
    commandName, command,
    parameters = process.argv,
    current = path.dirname(__filename.replace(/\\/g, '/'));
    //parent = path.basename(path.dirname(current));

global.applications = [];

// Execute shell command displaying output and possible errors
//
function execute(cmd) {
  exec(cmd, function(error, stdout, stderr) {
    console.log(stdout);
    if (error) console.log(error);
    if (stderr) console.log(stderr);
  });
}

// Release readline on exit
//
function doExit() {
  rl.close();
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
    '  impress autostart [on|off]'
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
    for (i = 0; i < applications.length; i++) console.log('    ' + applications[i].green.bold);
    doExit();
  },

  // impress add [path]
  //
  add: function() {

    function doInput() {
      rl.question("Enter application name: ", function(answer) {
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
    if (isWin) execute('start cmd /K "cd /d ' + impressPath.replace(/\//g, '\\') + ' & node server.js"' );
    else execute('/impress/node_modules/impress/bin/impress start');
    doExit();
  },
        
  // impress stop
  //
  stop: function() {
    if (isWin) console.log('Not implemented');
    else execute('/impress/node_modules/impress/bin/impress stop');
    doExit();
  },

  // impress restart
  //
  restart: function() {
    if (isWin) console.log('Not implemented');
    else execute('/impress/node_modules/impress/bin/impress restart');
    doExit();
  },

  // impress status
  //
  status: function() {
    if (isWin) console.log('Not implemented');
    else execute('/impress/node_modules/impress/bin/impress status');
    doExit();
  },

  // impress update
  //
  update: function() {
    execute('npm update');
    doExit();
  },

  // impress autostart
  //
  autostart: function() {
    if (parameters[1] === 'on') execute('/impress/node_modules/impress/bin/uninstall.sh');
    else if (parameters[1] === 'off') execute('/impress/node_modules/impress/bin/install.sh');
    else showHelp();
    doExit();
  }

};

console.log('Impress Application Server CLI'.bold);

// Parse command line
//
if (!fs.existsSync(impressPath)) notInstalled();
else {
  applications = fs.readdirSync(applicationsDir);
  if (parameters.length < 3) showHelp();
  else {
    parameters.shift();
    parameters.shift();
    commandName = parameters[0];
    command = commands[commandName];
    if (!command) showHelp();
    else command();
  }
}
