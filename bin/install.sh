#!/bin/sh
chmod +x $(pwd)/bin/uninstall.sh
chmod +x $(pwd)/bin/impress
rm -f /etc/init.d/impress
ln -s -f $(pwd)/bin/impress /etc/init.d/impress
if [ -f /etc/debian_version ]; then
  sudo update-rc.d impress defaults
elif [ $(pidof systemd) -eq 1 ]; then
  rm -f /etc/systemd/system/impress.service
  ln -s -f $(pwd)/bin/impress.service /etc/systemd/system/impress.service
  systemctl daemon-reload
  systemctl enable impress
elif [ -f /etc/redhat-release ]; then
  chkconfig --add impress
  chkconfig impress on
fi
