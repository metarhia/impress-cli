#!/bin/sh

# PROVIDE: impress
# REQUIRE: NETWORK
# BEFORE:  DAEMON
# KEYWORD: shutdown

. /etc/rc.subr

name="impress"
procname="impress"

start_cmd="${name}_start"
stop_cmd="${name}_stop"
reload_cmd="${name}_reload"
status_cmd="${name}_status"

rcvar="${name}_enable"
command="/bin/${name}"
load_rc_config $name

impress_start()
{
	/bin/sh -c 'impress start'
}
impress_stop()
{
	/bin/sh -c 'impress stop'
}
impress_reload()
{
	/bin/sh -c 'impress restart'
}
impress_status()
{
	/bin/sh -c 'impress status'
}

run_rc_command "$1"