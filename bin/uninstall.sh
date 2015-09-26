#!/bin/sh
impress stop
if [ -f /etc/debian_version ]; then
  sudo update-rc.d impress disable
elif [ $(pidof systemd) -eq 1 ]; then
  systemctl disable impress
  rm -f /etc/systemd/system/impress.service
elif [ -f /etc/redhat-release ]; then
  chkconfig impress off
  chkconfig --del impress
  rm -f /etc/init.d/impress
elif [ "$(uname -s)" = 'FreeBSD' ]; then
  rm -f /etc/rc.d/impress
  sed -iE '/#enable impress/ { N; d; }' /etc/rc.conf
fi
