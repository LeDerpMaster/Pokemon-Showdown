#!/bin/bash
if  pgrep node > /dev/null
then
	pkill node && screen -dmS pokemonshowdown node app.js 
else 
	screen -dmS pokemonshowdown node app.js 
fi

