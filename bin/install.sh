#!/bin/sh
chmod +x $(pwd)/bin/uninstall.sh
chmod +x $(pwd)/bin/impress
sudo ln -s -f $(pwd)/cli.js /bin/impress
sudo rm -f /etc/init.d/impress
sudo ln -f $(pwd)/bin/impress /etc/init.d/impress
if [ "$(uname -s)" = 'FreeBSD' ]; then
  ln -f $(pwd)/impress-freebsd.sh /etc/rc.d/impress
  chmod +x /etc/rc.d/impress
  ln -s /usr/local/bin/node /bin/node
  printf '#enable impress\nimpress_enable="YES"\n' >>  /etc/rc.conf
elif [ -f /etc/debian_version ]; then
  sudo update-rc.d impress defaults
elif [ -n "$(command -v systemctl)" ]; then
  sudo rm -f /etc/systemd/system/impress.service
  sudo ln -f $(pwd)/bin/impress.service /etc/systemd/system/impress.service
  sudo systemctl daemon-reload
  sudo systemctl enable impress
  sudo systemctl -l status impress
elif [ -f /etc/redhat-release ]; then
  chkconfig --add impress
  chkconfig impress on
  if [ ! -f /usr/bin/killall ]; then
    yum -y install psmisc
  fi
fi
