#!/bin/sh
chmod +x ./bin/uninstall.sh
chmod +x ./bin/impress
chmod +x ./server.sh
cp ./bin/impress /etc/init.d
chmod +x /etc/init.d/impress
if [ -f /etc/debian_version ]; then
  sudo update-rc.d impress defaults
elif [ $(pidof systemd) -eq 1 ]; then
  cp ./bin/impress.service /etc/systemd/system
  systemctl daemon-reload
  systemctl enable impress
elif [ -f /etc/redhat-release ]; then
  chkconfig --add impress
  chkconfig impress on
fi
