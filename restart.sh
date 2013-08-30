#!/bin/bash
if  pgrep node > /dev/null
then
	pkill node && screen -dmS pokemonshowdown nodejs app.js &
else 
	screen -dmS pokemonshowdown nodejs app.js &
fi

