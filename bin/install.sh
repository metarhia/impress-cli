#!/bin/sh
chmod +x ./bin/uninstall.sh
chmod +x ./bin/impress
ln -s ./bin/impress /etc/init.d
if [ -f /etc/debian_version ]; then
  sudo update-rc.d impress defaults
elif [ $(pidof systemd) -eq 1 ]; then
  ln -s ./bin/impress.service /etc/systemd/system
  systemctl daemon-reload
  systemctl enable impress
elif [ -f /etc/redhat-release ]; then
  chkconfig --add impress
  chkconfig impress on
fi
