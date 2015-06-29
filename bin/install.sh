#!/bin/sh
chmod +x $(pwd)/bin/uninstall.sh
chmod +x $(pwd)/bin/impress
ln -s -f $(pwd)/cli.js /bin/impress
rm -f /etc/init.d/impress
ln -f $(pwd)/bin/impress /etc/init.d/impress
if [ -n "command -v systemctl" ]; then
  rm -f /etc/systemd/system/impress.service
  ln -f $(pwd)/bin/impress.service /etc/systemd/system/impress.service
  systemctl daemon-reload
  systemctl enable impress
  systemctl -l status impress
elif [ -f /etc/debian_version ]; then
  sudo update-rc.d impress defaults
elif [ -f /etc/redhat-release ]; then
  chkconfig --add impress
  chkconfig impress on
fi
