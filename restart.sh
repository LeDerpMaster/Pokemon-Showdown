#!/bin/bash
if  pgrep node > /dev/null
then
	pkill node && nohup node app.js &
else 
	nohup node app.js &
fi

