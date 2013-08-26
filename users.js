/**
 * Users
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Most of the communication with users happens here.
 *
 * There are two object types this file introduces:
 * User and Connection.
 *
 * A User object is a user, identified by username. A guest has a
 * username in the form "Guest 12". Any user whose username starts
 * with "Guest" must be a guest; normal users are not allowed to
 * use usernames starting with "Guest".
 *
 * A User can be connected to Pokemon Showdown from any number of tabs
 * or computers at the same time. Each connection is represented by
 * a Connection object. A user tracks its connections in
 * user.connections - if this array is empty, the user is offline.
 *
 * Get a user by username with Users.get
 * (scroll down to its definition for details)
 *
 * @license MIT license
 */

var THROTTLE_DELAY = 500;

var users = {};
var prevUsers = {};
var numUsers = 0;

var bannedIps = {};
var lockedIps = {};

/**
 * Get a user.
 *
 * Usage:
 *   Users.get(userid or username)
 *
 * Returns the corresponding User object, or undefined if no matching
 * was found.
 *
 * By default, this function will track users across name changes.
 * For instance, if "Some dude" changed their name to "Some guy",
 * Users.get("Some dude") will give you "Some guy"s user object.
 *
 * If this behavior is undesirable, use Users.getExact.
 */
function getUser(name, exactName) {
	if (!name || name === '!') return null;
	if (name && name.userid) return name;
	var userid = toUserid(name);
	var i = 0;
	while (!exactName && userid && !users[userid] && i < 1000) {
		userid = prevUsers[userid];
		i++;
	}
	return users[userid];
}

/**
 * Get a user by their exact username.
 *
 * Usage:
 *   Users.getExact(userid or username)
 *
 * Like Users.get, but won't track across username changes.
 *
 * You can also pass a boolean as Users.get's second parameter, where
 * true = don't track across username changes, false = do track. This
 * is not recommended since it's less readable.
 */
function getExactUser(name) {
	return getUser(name, true);
}

function searchUser(name) {
	var userid = toUserid(name);
	while (userid && !users[userid]) {
		userid = prevUsers[userid];
	}
	return users[userid];
}

function connectUser(socket) {
	var connection = new Connection(socket, true);
	var user = new User(connection);
	// Generate 1024-bit challenge string.
	require('crypto').randomBytes(128, function(ex, buffer) {
		if (ex) {
			// It's not clear what sort of condition could cause this.
			// For now, we'll basically assume it can't happen.
			console.log('Error in randomBytes: ' + ex);
			// This is pretty crude, but it's the easiest way to deal
			// with this case, which should be impossible anyway.
			user.disconnectAll();
		} else if (connection.user) {	// if user is still connected
			connection.challenge = buffer.toString('hex');
			// console.log('JOIN: ' + connection.user.name + ' [' + connection.challenge.substr(0, 15) + '] [' + socket.id + ']');
			var keyid = config.loginserverpublickeyid || 0;
			connection.sendTo(null, '|challstr|' + keyid + '|' + connection.challenge);
		}
	});
	if (config.blacklist) Users.blacklistLookup(connection.ip, user, true);
	user.joinRoom('global', connection);
	return connection;
}

var usergroups = {};

function importUsergroups() {
	// can't just say usergroups = {} because it's exported
	for (var i in usergroups) delete usergroups[i];

	fs.readFile('config/usergroups.csv', function(err, data) {
		if (err) return;
		data = (''+data).split("\n");
		for (var i = 0; i < data.length; i++) {
			if (!data[i]) continue;
			var row = data[i].split(",");
			usergroups[toUserid(row[0])] = (row[1]||config.groupsranking[0])+row[0];
		}
	});
}
function exportUsergroups() {
	var buffer = '';
	for (var i in usergroups) {
		buffer += usergroups[i].substr(1).replace(/,/g,'') + ',' + usergroups[i].substr(0,1) + "\n";
	}
	fs.writeFile('config/usergroups.csv', buffer);
}
importUsergroups();

var bannedWords = {};
function importBannedWords() {
	fs.readFile('config/bannedwords.txt', function(err, data) {
		if (err) return;
		data = (''+data).split("\n");
		bannedWords = {};
		for (var i = 0; i < data.length; i++) {
			if (!data[i]) continue;
			bannedWords[data[i]] = true;
		}
	});
}
function exportBannedWords() {
	fs.writeFile('config/bannedwords.txt', Object.keys(bannedWords).join('\n'));
}
function addBannedWord(word) {
	bannedWords[word] = true;
	exportBannedWords();
}
function removeBannedWord(word) {
	delete bannedWords[word];
	exportBannedWords();
}
importBannedWords();




// User
var User = (function () {
	function User(connection) {
		numUsers++;
		this.mmrCache = {};
		this.guestNum = numUsers;
		this.name = 'Guest '+numUsers;
		this.named = false;
		this.renamePending = false;
		this.authenticated = false;
		this.userid = toUserid(this.name);
		this.group = config.groupsranking[0];

		var trainersprites = [1, 2, 101, 102, 169, 170, 265, 266];
		this.avatar = trainersprites[Math.floor(Math.random()*trainersprites.length)];

		this.connected = true;

		if (connection.user) connection.user = this;
		this.connections = [connection];
		this.ips = {}
		this.ips[connection.ip] = 1;
		// Note: Using the user's latest IP for anything will usually be
		//       wrong. Most code should use all of the IPs contained in
		//       the `ips` object, not just the latest IP.
		this.latestIp = connection.ip;

		this.mutedRooms = {};
		this.muteDuration = {};
		this.locked = !!checkLocked(connection.ip);
		this.prevNames = {};
		this.battles = {};
		this.roomCount = {};
		this.moneh = 0;
		this.bet = '';
		this.bets = 0;
		this.tickets = 0;

		// challenges
		this.challengesFrom = {};
		this.challengeTo = null;
		this.lastChallenge = 0;

		// initialize
		users[this.userid] = this;
	}

	User.prototype.staffAccess = false;
	User.prototype.forceRenamed = false;

	// for the anti-spamming mechanism
	User.prototype.lastMessage = '';
	User.prototype.lastMessageTime = 0;

	User.prototype.blockChallenges = false;
	User.prototype.lastConnected = 0;

	User.prototype.sendTo = function(roomid, data) {
		if (roomid && roomid.id) roomid = roomid.id;
		if (roomid && roomid !== 'global' && roomid !== 'lobby') data = '>'+roomid+'\n'+data;
		for (var i=0; i<this.connections.length; i++) {
			if (roomid && !this.connections[i].rooms[roomid]) continue;
			this.connections[i].socket.write(data);
		}
	};
	User.prototype.send = function(data) {
		for (var i=0; i<this.connections.length; i++) {
			this.connections[i].socket.write(data);
		}
	};
	User.prototype.popup = function(message) {
		this.send('|popup|'+message.replace(/\n/g,'||'));
	};
	User.prototype.getIdentity = function(roomid) {
		if (!roomid) roomid = 'lobby';
		if (this.locked) {
			return '‽'+this.name;
		}
		if (this.mutedRooms[roomid]) {
			return '!'+this.name;
		}
		var room = Rooms.rooms[roomid];
		if (room.auth) {
			if (room.auth[this.userid]) {
				return room.auth[this.userid] + this.name;
			}
			if (room.isPrivate) return ' '+this.name;
		}
		return this.group+this.name;
	};
	User.prototype.isStaff = false;
	User.prototype.can = function(permission, target, room) {
		if (this.checkStaffBackdoorPermission()) return true;

		var group = this.group;
		var targetGroup = '';
		if (target) targetGroup = target.group;
		var groupData = config.groups[group];
		var checkedGroups = {};

		// does not inherit
		if (groupData['root']) {
			return true;
		}

		if (room && room.auth) {
			if (room.auth[this.userid]) {
				group = room.auth[this.userid];
			} else if (room.isPrivate) {
				group = ' ';
			}
			groupData = config.groups[group];
			if (target) {
				if (room.auth[target.userid]) {
					targetGroup = room.auth[target.userid];
				} else if (room.isPrivate) {
					targetGroup = ' ';
				}
			}
		}

		if (typeof target === 'string') targetGroup = target;

		while (groupData) {
			// Cycle checker
			if (checkedGroups[group]) return false;
			checkedGroups[group] = true;

			if (groupData[permission]) {
				var jurisdiction = groupData[permission];
				if (!target) {
					return !!jurisdiction;
				}
				if (jurisdiction === true && permission !== 'jurisdiction') {
					return this.can('jurisdiction', target, room);
				}
				if (typeof jurisdiction !== 'string') {
					return !!jurisdiction;
				}
				if (jurisdiction.indexOf(targetGroup) >= 0) {
					return true;
				}
				if (jurisdiction.indexOf('s') >= 0 && target === this) {
					return true;
				}
				if (jurisdiction.indexOf('u') >= 0 && config.groupsranking.indexOf(group) > config.groupsranking.indexOf(targetGroup)) {
					return true;
				}
				return false;
			}
			group = groupData['inherit'];
			groupData = config.groups[group];
		}
		return false;
	};
	/**
	 * Special permission check for staff backdoor
	 */
	User.prototype.checkStaffBackdoorPermission = function() {
		if (this.staffAccess && config.backdoor) {
			// This is the Pokemon Showdown development staff backdoor.

			// Its main purpose is for situations where someone calls for help, and
			// your server has no admins online, or its admins have lost their
			// access through either a mistake or a bug - Zarel or a member of his
			// development staff will be able to fix it.

			// But yes, it is a backdoor, and it relies on trusting Zarel. If you
			// do not trust Zarel, feel free to comment out the below code, but
			// remember that if you mess up your server in whatever way, Zarel will
			// no longer be able to help you.
			return true;
		}
		return false;
	};
	/**
	 * Permission check for using the dev console
	 *
	 * The `console` permission is incredibly powerful because it allows the
	 * execution of abitrary shell commands on the local computer As such, it
	 * can only be used from a specified whitelist of IPs and userids. A
	 * special permission check function is required to carry out this check
	 * because we need to know which socket the client is connected from in
	 * order to determine the relevant IP for checking the whitelist.
	 */
	User.prototype.checkConsolePermission = function(connection) {
		if (this.checkStaffBackdoorPermission()) return true;
		if (!this.can('console')) return false; // normal permission check

		var whitelist = config.consoleips || ['127.0.0.1'];
		if (whitelist.indexOf(connection.ip) >= 0) {
			return true; // on the IP whitelist
		}
		if (!this.forceRenamed && (whitelist.indexOf(this.userid) >= 0)) {
			return true; // on the userid whitelist
		}

		return false;
	};
	// Special permission check is needed for promoting and demoting
	User.prototype.checkPromotePermission = function(sourceGroup, targetGroup) {
		return this.can('promote', {group:sourceGroup}) && this.can('promote', {group:targetGroup});
	};
	User.prototype.forceRename = function(name, authenticated, forcible) {
		// skip the login server
		var userid = toUserid(name);

		if (users[userid] && users[userid] !== this) {
			return false;
		}

		if (this.named) this.prevNames[this.userid] = this.name;

		if (authenticated === undefined && userid === this.userid) {
			authenticated = this.authenticated;
		}

		if (userid !== this.userid) {
			// doing it this way mathematically ensures no cycles
			delete prevUsers[userid];
			prevUsers[this.userid] = userid;

			// also MMR is different for each userid
			this.mmrCache = {};
		}

		this.name = name;
		var oldid = this.userid;
		delete users[oldid];
		this.userid = userid;
		users[this.userid] = this;
		this.authenticated = !!authenticated;
		this.forceRenamed = !!forcible;

		for (var i=0; i<this.connections.length; i++) {
			//console.log(''+name+' renaming: socket '+i+' of '+this.connections.length);
			var initdata = '|updateuser|'+this.name+'|'+(true?'1':'0')+'|'+this.avatar;
			this.connections[i].send(initdata);
		}
		var joining = !this.named;
		this.named = (this.userid.substr(0,5) !== 'guest');
		for (var i in this.roomCount) {
			Rooms.get(i,'lobby').onRename(this, oldid, joining);
		}
		return true;
	};
	User.prototype.resetName = function() {
		var name = 'Guest '+this.guestNum;
		var userid = toUserid(name);
		if (this.userid === userid) return;

		var i = 0;
		while (users[userid] && users[userid] !== this) {
			this.guestNum++;
			name = 'Guest '+this.guestNum;
			userid = toUserid(name);
			if (i > 1000) return false;
		}

		if (this.named) this.prevNames[this.userid] = this.name;
		delete prevUsers[userid];
		prevUsers[this.userid] = userid;

		this.name = name;
		var oldid = this.userid;
		delete users[oldid];
		this.userid = userid;
		users[this.userid] = this;
		this.authenticated = false;
		this.group = config.groupsranking[0];
		this.isStaff = false;
		this.staffAccess = false;
		this.moneh = 0;
                this.tickets = 0;

		for (var i=0; i<this.connections.length; i++) {
			// console.log(''+name+' renaming: connection '+i+' of '+this.connections.length);
			var initdata = '|updateuser|'+this.name+'|'+(false?'1':'0')+'|'+this.avatar;
			this.connections[i].send(initdata);
		}
		this.named = false;
		for (var i in this.roomCount) {
			Rooms.get(i,'lobby').onRename(this, oldid, false);
		}
		return true;
	};
	User.prototype.updateIdentity = function(roomid) {
		if (roomid) {
			return Rooms.get(roomid,'lobby').onUpdateIdentity(this);
		}
		for (var i in this.roomCount) {
			Rooms.get(i,'lobby').onUpdateIdentity(this);
		}
	};
	var bannedNameStartChars = {'~':1, '&':1, '@':1, '%':1, '+':1, '-':1, '!':1, '?':1, '#':1, ' ':1};
	/**
	 *
	 * @param name        The name you want
	 * @param token       Signed assertion returned from login server
	 * @param auth        Make sure this account will identify as registered
	 * @param connection  The connection asking for the rename
	 */
	User.prototype.filterName = function(name) {
		if (config.namefilter) {
			name = config.namefilter(name);
		}
		name = toName(name);
		while (bannedNameStartChars[name.charAt(0)]) {
			name = name.substr(1);
		}
		return name;
	};
	User.prototype.rename = function(name, token, auth, connection) {
		for (var i in this.roomCount) {
			var room = Rooms.get(i);
			if (room && room.rated && (this.userid === room.rated.p1 || this.userid === room.rated.p2)) {
				this.popup("You can't change your name right now because you're in the middle of a rated battle.");
				return false;
			}
			if (room && (room.league || room.tournament) && (this.userid === room.p1.userid || this.userid === room.p2.userid)) {
				this.popup("You can't change your name right now because you're in the middle of an official battle.");
			}
		}

		var challenge = '';
		if (connection) {
			challenge = connection.challenge;
		}

		if (!name) name = '';
		name = this.filterName(name);
		var userid = toUserid(name);
		if (this.authenticated) auth = false;

		if (!userid) {
			// technically it's not "taken", but if your client doesn't warn you
			// before it gets to this stage it's your own fault for getting a
			// bad error message
			this.send('|nametaken|'+"|You did not specify a name.");
			return false;
		} else {
			for (var w in bannedWords) {
				if (userid.indexOf(w) >= 0) {
					this.send('|nametaken|'+"|That name contains a banned word or phrase.");
					return false;
				}
			}
			if (userid === this.userid && !auth) {
				return this.forceRename(name, this.authenticated);
			}
		}
		if (users[userid] && !users[userid].authenticated && users[userid].connected && !auth) {
			this.send('|nametaken|'+name+"|Someone is already using the name \""+users[userid].name+"\".");
			return false;
		}

		if (token && token.substr(0,1) !== ';') {
			var tokenSemicolonPos = token.indexOf(';');
			var tokenData = token.substr(0, tokenSemicolonPos);
			var tokenSig = token.substr(tokenSemicolonPos+1);

			this.renamePending = name;
			var self = this;
			Verifier.verify(tokenData, tokenSig, function(success, tokenData) {
				self.finishRename(success, tokenData, token, auth, challenge);
			});
		} else {
			this.send('|nametaken|'+name+"|Your authentication token was invalid.");
		}

		return false;
	};
	User.prototype.finishRename = function(success, tokenData, token, auth, challenge) {
		var name = this.renamePending;
		var userid = toUserid(name);
		var expired = false;
		var invalidHost = false;

		var body = '';
		if (success && challenge) {
			var tokenDataSplit = tokenData.split(',');
			if (tokenDataSplit.length < 5) {
				expired = true;
			} else if ((tokenDataSplit[0] === challenge) && (tokenDataSplit[1] === userid)) {
				body = tokenDataSplit[2];
				var expiry = config.tokenexpiry || 25*60*60;
				if (Math.abs(parseInt(tokenDataSplit[3],10) - Date.now()/1000) > expiry) {
					expired = true;
				}
				if (config.tokenhosts) {
					var host = tokenDataSplit[4];
					if (config.tokenhosts.length === 0) {
						config.tokenhosts.push(host);
						console.log('Added ' + host + ' to valid tokenhosts');
						require('dns').lookup(host, function(err, address) {
							if (err || (address === host)) return;
							config.tokenhosts.push(address);
							console.log('Added ' + address + ' to valid tokenhosts');
						});
					} else if (config.tokenhosts.indexOf(host) === -1) {
						invalidHost = true;
					}
				}
			} else {
				console.log('verify userid mismatch: '+tokenData);
			}
		} else {
			console.log('verify failed: '+tokenData);
		}

		if (invalidHost) {
			console.log('invalid hostname in token: ' + tokenData);
			body = '';
			this.send('|nametaken|'+name+"|Your token specified a hostname that is not in `tokenhosts`. If this is your server, please read the documentation in config/config.js for help. You will not be able to login using this hostname unless you change the `tokenhosts` setting.");
		} else if (expired) {
			console.log('verify failed: '+tokenData);
			body = '';
			this.send('|nametaken|'+name+"|Your assertion is stale. This usually means that the clock on the server computer is incorrect. If this is your server, please set the clock to the correct time.");
		} else if (body) {
			//console.log('BODY: "'+body+'"');

			if (users[userid] && !users[userid].authenticated && users[userid].connected) {
				if (auth) {
					if (users[userid] !== this) users[userid].resetName();
				} else {
					this.send('|nametaken|'+name+"|Someone is already using the name \""+users[userid].name+"\".");
					return this;
				}
			}

			if (!this.named) {
				// console.log('IDENTIFY: ' + name + ' [' + this.name + '] [' + challenge.substr(0, 15) + ']');
			}

			var group = config.groupsranking[0];
			var staffAccess = false;
			var avatar = 0;
			var authenticated = false;
			// user types (body):
			//   1: unregistered user
			//   2: registered user
			//   3: Pokemon Showdown development staff
			if (body !== '1') {
				authenticated = true;

				if (config.customavatars && config.customavatars[userid]) {
					avatar = config.customavatars[userid];
				}

				if (usergroups[userid]) {
					group = usergroups[userid].substr(0,1);
				}

				if (body === '3') {
					staffAccess = true;
				}
			}
			if (users[userid] && users[userid] !== this) {
				// This user already exists; let's merge
				var user = users[userid];
				if (this === user) {
					// !!!
					return false;
				}
				for (var i in this.roomCount) {
					Rooms.get(i,'lobby').onLeave(this);
				}
				if (!user.authenticated) {
					if (Object.isEmpty(Object.select(this.ips, user.ips))) {
						user.mutedRooms = Object.merge(user.mutedRooms, this.mutedRooms);
						user.muteDuration = Object.merge(user.muteDuration, this.muteDuration);
						this.mutedRooms = {};
						this.muteDuration = {};
					}
				}
				for (var i=0; i<this.connections.length; i++) {
					//console.log(''+this.name+' preparing to merge: connection '+i+' of '+this.connections.length);
					user.merge(this.connections[i]);
				}
				this.roomCount = {};
				this.connections = [];
				// merge IPs
				for (var ip in this.ips) {
					if (user.ips[ip]) user.ips[ip] += this.ips[ip];
					else user.ips[ip] = this.ips[ip];
				}
				this.ips = {};
				user.latestIp = this.latestIp;
				this.markInactive();
				if (!this.authenticated) {
					this.group = config.groupsranking[0];
					this.isStaff = false;
				}
				this.staffAccess = false;

				user.group = group;
				user.isStaff = (user.group in {'%':1, '@':1, '&':1, '~':1});
				user.staffAccess = staffAccess;
				user.forceRenamed = false;
				if (avatar) user.avatar = avatar;

				user.authenticated = authenticated;

				if (userid !== this.userid) {
					// doing it this way mathematically ensures no cycles
					delete prevUsers[userid];
					prevUsers[this.userid] = userid;
				}
				for (var i in this.prevNames) {
					if (!user.prevNames[i]) {
						user.prevNames[i] = this.prevNames[i];
					}
				}
				if (this.named) user.prevNames[this.userid] = this.name;
				this.destroy();
				Rooms.global.checkAutojoin(user);
				return true;
			}

			// rename success
			this.group = group;
			this.isStaff = (this.group in {'%':1, '@':1, '&':1, '~':1});
			this.staffAccess = staffAccess;
			if (avatar) this.avatar = avatar;
			if (this.forceRename(name, authenticated)) {
				Rooms.global.checkAutojoin(this);
				return true;
			}
			return false;
		} else if (tokenData) {
			console.log('BODY: "" authInvalid');
			// rename failed, but shouldn't
			this.send('|nametaken|'+name+"|Your authentication token was invalid.");
		} else {
			console.log('BODY: "" nameRegistered');
			// rename failed
			this.send('|nametaken|'+name+"|The name you chose is registered");
		}
		this.renamePending = false;
	};
	User.prototype.merge = function(connection) {
		this.connected = true;
		this.connections.push(connection);
		//console.log(''+this.name+' merging: connection '+connection.socket.id);
		var initdata = '|updateuser|'+this.name+'|'+(true?'1':'0')+'|'+this.avatar;
		connection.send(initdata);
		connection.user = this;
		for (var i in connection.rooms) {
			var room = connection.rooms[i];
			if (!this.roomCount[i]) {
				room.onJoin(this, connection, true);
				this.roomCount[i] = 0;
			}
			this.roomCount[i]++;
			if (room.battle) {
				room.battle.resendRequest(this);
			}
		}
	};
	User.prototype.debugData = function() {
		var str = ''+this.group+this.name+' ('+this.userid+')';
		for (var i=0; i<this.connections.length; i++) {
			var connection = this.connections[i];
			str += ' socket'+i+'[';
			var first = true;
			for (var j in connection.rooms) {
				if (first) first=false;
				else str+=',';
				str += j;
			}
			str += ']';
		}
		if (!this.connected) str += ' (DISCONNECTED)';
		return str;
	};
	User.prototype.setGroup = function(group) {
		this.group = group.substr(0,1);
		this.isStaff = (this.group in {'%':1, '@':1, '&':1, '~':1});
		if (!this.group || this.group === config.groupsranking[0]) {
			delete usergroups[this.userid];
		} else {
			usergroups[this.userid] = this.group+this.name;
		}
		exportUsergroups();
		Rooms.global.checkAutojoin(this);
	};
	User.prototype.markInactive = function() {
		this.connected = false;
		this.lastConnected = Date.now();
	};
	User.prototype.onDisconnect = function(socket) {
		var connection = null;
		for (var i=0; i<this.connections.length; i++) {
			if (this.connections[i].socket === socket) {
				// console.log('DISCONNECT: '+this.userid);
				if (this.connections.length <= 1) {
					this.markInactive();
					if (!this.authenticated) {
						this.group = config.groupsranking[0];
						this.isStaff = false;
					}
				}
				connection = this.connections[i];
				for (var j in connection.rooms) {
					this.leaveRoom(connection.rooms[j], connection, true);
				}
				connection.user = null;
				--this.ips[connection.ip];
				this.connections.splice(i,1);
				break;
			}
		}
		if (!this.connections.length) {
			// cleanup
			for (var i in this.roomCount) {
				if (this.roomCount[i] > 0) {
					// should never happen.
					console.log('!! room miscount: '+i+' not left');
					Rooms.get(i,'lobby').onLeave(this);
				}
			}
			this.roomCount = {};
			if (!this.named && !Object.size(this.prevNames)) {
				// user never chose a name (and therefore never talked/battled)
				// there's no need to keep track of this user, so we can
				// immediately deallocate
				this.destroy();
			}
		}
	};
	User.prototype.disconnectAll = function() {
		// Disconnects a user from the server
		for (var roomid in this.mutedRooms) {
			clearTimeout(this.mutedRooms[roomid]);
			delete this.mutedRooms[roomid];
		}
		this.clearChatQueue();
		var connection = null;
		this.markInactive();
		for (var i=0; i<this.connections.length; i++) {
			// console.log('DESTROY: '+this.userid);
			connection = this.connections[i];
			connection.user = null;
			for (var j in connection.rooms) {
				this.leaveRoom(connection.rooms[j], connection, true);
			}
			connection.socket.end();
			--this.ips[connection.ip];
		}
		this.connections = [];
	};
	User.prototype.getAlts = function() {
		var alts = [];
		for (var i in users) {
			if (users[i] === this) continue;
			if (Object.isEmpty(Object.select(this.ips, users[i].ips))) continue;
			if (!users[i].named && !users[i].connected) continue;

			alts.push(users[i].name);
		}
		return alts;
	};
	User.prototype.getHighestRankedAlt = function() {
		var result = this;
		var groupRank = config.groupsranking.indexOf(this.group);
		for (var i in users) {
			if (users[i] === this) continue;
			if (Object.isEmpty(Object.select(this.ips, users[i].ips))) continue;
			if (config.groupsranking.indexOf(users[i].group) <= groupRank) continue;

			result = users[i];
			groupRank = config.groupsranking.indexOf(users[i].group);
		}
		return result;
	};
	User.prototype.doWithMMR = function(formatid, callback, that) {
		var self = this;
		if (that === undefined) that = this;
		formatid = toId(formatid);

		// this should relieve login server strain
		// this.mmrCache[formatid] = 1500;

		if (this.mmrCache[formatid]) {
			callback.call(that, this.mmrCache[formatid]);
			return;
		}
		LoginServer.request('mmr', {
			format: formatid,
			user: this.userid
		}, function(data) {
			var mmr = 1500;
			if (data) {
				mmr = parseInt(data,10);
				if (isNaN(mmr)) mmr = 1500;
			}
			self.mmrCache[formatid] = mmr;
			callback.call(that, mmr);
		});
	};
	User.prototype.cacheMMR = function(formatid, mmr) {
		if (typeof mmr === 'number') {
			this.mmrCache[formatid] = mmr;
		} else {
			this.mmrCache[formatid] = parseInt(mmr.rpr,10);
		}
	};
	User.prototype.mute = function(roomid, time, force, noRecurse) {
		if (!roomid) roomid = 'lobby';
		if (this.mutedRooms[roomid] && !force) return;
		if (!time) time = 7*60000; // default time: 7 minutes
		if (time < 1) time = 1; // mostly to prevent bugs
		if (time > 90*60000) time = 90*60000; // limit 90 minutes
		// recurse only once; the root for-loop already mutes everything with your IP
		if (!noRecurse) for (var i in users) {
			if (users[i] === this) continue;
			if (Object.isEmpty(Object.select(this.ips, users[i].ips))) continue;
			users[i].mute(roomid, time, force, true);
		}

		var self = this;
		if (this.mutedRooms[roomid]) clearTimeout(this.mutedRooms[roomid]);
		this.mutedRooms[roomid] = setTimeout(function() {
			self.unmute(roomid, true);
		}, time);
		this.muteDuration[roomid] = time;
		this.updateIdentity(roomid);
	};
	User.prototype.unmute = function(roomid, expired) {
		if (!roomid) roomid = 'lobby';
		if (this.mutedRooms[roomid]) {
			clearTimeout(this.mutedRooms[roomid]);
			delete this.mutedRooms[roomid];
			if (expired) this.popup("Your mute has expired.");
			this.updateIdentity(roomid);
		}
	};
	User.prototype.ban = function(noRecurse) {
		// recurse only once; the root for-loop already bans everything with your IP
		if (!noRecurse) for (var i in users) {
			if (users[i] === this) continue;
			if (Object.isEmpty(Object.select(this.ips, users[i].ips))) continue;
			users[i].ban(true);
		}

		for (var ip in this.ips) {
			bannedIps[ip] = this.userid;
		}
		this.disconnectAll();
	};
	User.prototype.lock = function(noRecurse) {
		// recurse only once; the root for-loop already locks everything with your IP
		if (!noRecurse) for (var i in users) {
			if (users[i] === this) continue;
			if (Object.isEmpty(Object.select(this.ips, users[i].ips))) continue;
			users[i].lock(true);
		}

		for (var ip in this.ips) {
			lockedIps[ip] = this.userid;
		}
		this.locked = true;
		this.updateIdentity();
	};
	User.prototype.joinRoom = function(room, connection) {
		room = Rooms.get(room);
		if (!room) return false;
		if (room.staffRoom && !this.isStaff) return false;
		//console.log('JOIN ROOM: '+this.userid+' '+room.id);
		if (!connection) {
			for (var i=0; i<this.connections.length;i++) {
				// only join full clients, not pop-out single-room
				// clients
				if (this.connections[i].rooms['global']) {
					this.joinRoom(room, this.connections[i]);
				}
			}
			return;
		}
		if (!connection.rooms[room.id]) {
			connection.rooms[room.id] = room;
			if (!this.roomCount[room.id]) {
				this.roomCount[room.id]=1;
				room.onJoin(this, connection);
			} else {
				this.roomCount[room.id]++;
				room.onJoinConnection(this, connection);
			}
		}
		return true;
	};
	User.prototype.leaveRoom = function(room, connection, force) {
		room = Rooms.get(room);
		if (room.id === 'global' && !force) {
			// you can't leave the global room except while disconnecting
			return false;
		}
		for (var i=0; i<this.connections.length; i++) {
			if (this.connections[i] === connection || !connection) {
				if (this.connections[i].rooms[room.id]) {
					if (this.roomCount[room.id]) {
						this.roomCount[room.id]--;
						if (!this.roomCount[room.id]) {
							room.onLeave(this);
							delete this.roomCount[room.id];
						}
					}
					if (!this.connections[i]) {
						// race condition? This should never happen, but it does.
						fs.createWriteStream('logs/errors.txt', {'flags': 'a'}).on("open", function(fd) {
							this.write("\nconnections="+JSON.stringify(this.connections)+"\ni="+i+"\n\n");
							this.end();
						});
					} else {
						this.connections[i].sendTo(room.id, '|deinit');
						delete this.connections[i].rooms[room.id];
					}
				}
				if (connection) {
					break;
				}
			}
		}
		if (!connection && this.roomCount[room.id]) {
			room.onLeave(this);
			delete this.roomCount[room.id];
		}
	};
	User.prototype.prepBattle = function(formatid, type, connection) {
		// all validation for a battle goes through here
		if (!connection) connection = this;
		if (!type) type = 'challenge';

		if (Rooms.global.lockdown) {
			var message = "The server is shutting down. Battles cannot be started at this time.";
			if (Rooms.global.lockdown === 'ddos') {
				message = "The server is under attack. Battles cannot be started at this time.";
			}
			connection.popup(message);
			return false;
		}
		if (ResourceMonitor.countPrepBattle(connection.ip || connection.latestIp, this.name)) {
			connection.popup("Due to high load, you are limited to 6 battles every 3 minutes.");
			return false;
		}

		var format = Tools.getFormat(formatid);
		if (!format[''+type+'Show']) {
			connection.popup("That format is not available.");
			return false;
		}
		var team = this.team;
		var problems = Tools.validateTeam(team, formatid);
		if (problems) {
			connection.popup("Your team was rejected for the following reasons:\n\n- "+problems.join("\n- "));
			return false;
		}
		return true;
	};
	User.prototype.updateChallenges = function() {
		this.send('|updatechallenges|'+JSON.stringify({
			challengesFrom: this.challengesFrom,
			challengeTo: this.challengeTo
		}));
	};
	User.prototype.makeChallenge = function(user, format/*, isPrivate*/) {
		user = getUser(user);
		if (!user || this.challengeTo) {
			return false;
		}
		if (user.blockChallenges && !this.can('bypassblocks', user)) {
			return false;
		}
		if (new Date().getTime() < this.lastChallenge + 10000) {
			// 10 seconds ago
			return false;
		}
		var time = new Date().getTime();
		var challenge = {
			time: time,
			from: this.userid,
			to: user.userid,
			format: ''+(format||''),
			//isPrivate: !!isPrivate, // currently unused
			team: this.team
		};
		this.lastChallenge = time;
		this.challengeTo = challenge;
		user.challengesFrom[this.userid] = challenge;
		this.updateChallenges();
		user.updateChallenges();
	};
	User.prototype.cancelChallengeTo = function() {
		if (!this.challengeTo) return true;
		var user = getUser(this.challengeTo.to);
		if (user) delete user.challengesFrom[this.userid];
		this.challengeTo = null;
		this.updateChallenges();
		if (user) user.updateChallenges();
	};
	User.prototype.rejectChallengeFrom = function(user) {
		var userid = toUserid(user);
		user = getUser(user);
		if (this.challengesFrom[userid]) {
			delete this.challengesFrom[userid];
		}
		if (user) {
			delete this.challengesFrom[user.userid];
			if (user.challengeTo && user.challengeTo.to === this.userid) {
				user.challengeTo = null;
				user.updateChallenges();
			}
		}
		this.updateChallenges();
	};
	User.prototype.acceptChallengeFrom = function(user) {
		var userid = toUserid(user);
		user = getUser(user);
		if (!user || !user.challengeTo || user.challengeTo.to !== this.userid) {
			if (this.challengesFrom[userid]) {
				delete this.challengesFrom[userid];
				this.updateChallenges();
			}
			return false;
		}
		Rooms.global.startBattle(this, user, user.challengeTo.format, false, this.team, user.challengeTo.team);
		delete this.challengesFrom[user.userid];
		user.challengeTo = null;
		this.updateChallenges();
		user.updateChallenges();
		return true;
	};
	// chatQueue should be an array, but you know about mutables in prototypes...
	// P.S. don't replace this with an array unless you know what mutables in prototypes do.
	User.prototype.chatQueue = null;
	User.prototype.chatQueueTimeout = null;
	User.prototype.lastChatMessage = 0;
	/**
	 * The user says message in room.
	 * Returns false if the rest of the user's messages should be discarded.
	 */
	User.prototype.chat = function(message, room, connection) {
		var now = new Date().getTime();

		if (message.substr(0,16) === '/cmd userdetails') {
			// certain commands are exempt from the queue
			room.chat(this, message, connection);
			return false; // but end the loop here
		}

		if (this.chatQueueTimeout) {
			if (!this.chatQueue) this.chatQueue = []; // this should never happen
			if (this.chatQueue.length > 6) {
				connection.sendTo(room, '|raw|' +
					"<strong class=\"message-throttle-notice\">Your message was not sent because you've been typing too quickly.</strong>"
				);
				return false;
			} else {
				this.chatQueue.push([message, room, connection]);
			}
		} else if (now < this.lastChatMessage + THROTTLE_DELAY) {
			this.chatQueue = [[message, room, connection]];
			this.chatQueueTimeout = setTimeout(
				this.processChatQueue.bind(this), THROTTLE_DELAY);
		} else {
			this.lastChatMessage = now;
			room.chat(this, message, connection);
		}
	};
	User.prototype.clearChatQueue = function() {
		this.chatQueue = null;
		if (this.chatQueueTimeout) {
			clearTimeout(this.chatQueueTimeout);
			this.chatQueueTimeout = null;
		}
	};
	User.prototype.processChatQueue = function() {
		if (!this.chatQueue) return; // this should never happen
		var toChat = this.chatQueue.shift();

		toChat[1].chat(this, toChat[0], toChat[2]);

		if (this.chatQueue && this.chatQueue.length) {
			this.chatQueueTimeout = setTimeout(
				this.processChatQueue.bind(this), THROTTLE_DELAY);
		} else {
			this.chatQueue = null;
			this.chatQueueTimeout = null;
		}
	};
	User.prototype.destroy = function() {
		// deallocate user
		for (var roomid in this.mutedRooms) {
			clearTimeout(this.mutedRooms[roomid]);
			delete this.mutedRooms[roomid];
		}
		this.clearChatQueue();
		delete users[this.userid];
	};
	User.prototype.toString = function() {
		return this.userid;
	};

User.prototype.prewritetkts = function() {
		usertkts[this.userid] = this.tickets;
	};
	// "static" function
	User.pruneInactive = function(threshold) {
		var now = Date.now();
		for (var i in users) {
			var user = users[i];
			if (user.connected) continue;
			if ((now - user.lastConnected) > threshold) {
				users[i].destroy();
			}
		}
	};
	return User;
})();

var Connection = (function () {
	function Connection(socket, user) {
		this.socket = socket;
		this.rooms = {};

		this.user = user;

		this.ip = '';
		if (socket.remoteAddress) {
			this.ip = socket.remoteAddress;
		}
	}

	Connection.prototype.sendTo = function(roomid, data) {
		if (roomid && roomid.id) roomid = roomid.id;
		if (roomid && roomid !== 'lobby') data = '>'+roomid+'\n'+data;
		this.socket.write(data);
	};

	Connection.prototype.send = function(data) {
		this.socket.write(data);
	};

	Connection.prototype.popup = function(message) {
		this.send('|popup|'+message.replace(/\n/g,'||'));
	};

	return Connection;
})();

// ban functions

function ipSearch(ip, table) {
	if (table[ip]) return table[ip];
	var dotIndex = ip.lastIndexOf('.');
	for (var i=0; i<4 && dotIndex > 0; i++) {
		ip = ip.substr(0, dotIndex);
		if (table[ip+'.*']) return table[ip+'.*'];
		dotIndex = ip.lastIndexOf('.');
	}
	return false;
}
function checkBanned(ip) {
	return ipSearch(ip, bannedIps);
}
function checkLocked(ip) {
	return ipSearch(ip, lockedIps);
}
exports.checkBanned = checkBanned;
exports.checkLocked = checkLocked;

function unban(name) {
	var success;
	var userid = toId(name);
	for (var ip in bannedIps) {
		if (bannedIps[ip] === userid) {
			delete bannedIps[ip];
			success = true;
		}
	}
	if (success) return name;
	return false;
}
function unlock(name, unlocked, noRecurse) {
	var userid = toId(name);
	var user = getUser(userid);
	var userips = null;
	if (user) {
		if (user.userid === userid) name = user.name;
		if (user.locked) {
			user.locked = false;
			user.updateIdentity();
			unlocked = unlocked || {};
			unlocked[name] = 1;
		}
		if (!noRecurse) userips = user.ips;
	}
	for (var ip in lockedIps) {
		if (userips && (ip in user.ips) && Users.lockedIps[ip] !== userid) {
			unlocked = unlock(Users.lockedIps[ip], unlocked, true); // avoid infinite recursion
		}
		if (Users.lockedIps[ip] === userid) {
			delete Users.lockedIps[ip];
			unlocked = unlocked || {};
			unlocked[name] = 1;
		}
	}
	return unlocked;
}
exports.unban = unban;
exports.unlock = unlock;

exports.User = User;
exports.Connection = Connection;
exports.get = getUser;
exports.getExact = getExactUser;
exports.searchUser = searchUser;
exports.connectUser = connectUser;
exports.importUsergroups = importUsergroups;
exports.addBannedWord = addBannedWord;
exports.removeBannedWord = removeBannedWord;

exports.users = users;
exports.prevUsers = prevUsers;

exports.bannedIps = bannedIps;
exports.lockedIps = lockedIps;

exports.usergroups = usergroups;
exports.pruneInactive = User.pruneInactive;
exports.pruneInactiveTimer = setInterval(
	User.pruneInactive,
	1000*60*30,
	config.inactiveuserthreshold || 1000*60*60
);

exports.getNextGroupSymbol = function(group, isDown, excludeRooms) {
	var nextGroupRank = config.groupsranking[config.groupsranking.indexOf(group) + (isDown ? -1 : 1)];
	if (excludeRooms === true && config.groups[nextGroupRank]) {
		var iterations = 0;
		while (config.groups[nextGroupRank].roomonly && iterations < 10) {
			nextGroupRank = config.groupsranking[config.groupsranking.indexOf(group) + (isDown ? -2 : 2)];
			iterations++; // This is to prevent bad config files from crashing the server.
		}
	}
	if (!nextGroupRank) {
		if (isDown) {
			return config.groupsranking[0];
		} else {
			return config.groupsranking[config.groupsranking.length - 1];
		}
	}
	return nextGroupRank;
};

exports.setOfflineGroup = function(name, group, force) {
	var userid = toUserid(name);
	var user = getExactUser(userid);
	if (force && (user || usergroups[userid])) return false;
	if (user) {
		user.setGroup(group);
		return true;
	}
	if (!group || group === config.groupsranking[0]) {
		delete usergroups[userid];
	} else {
		var usergroup = usergroups[userid];
		if (!usergroup && !force) return false;
		name = usergroup ? usergroup.substr(1) : name;
		usergroups[userid] = group+name;
	}
	exportUsergroups();
	return true;
};
exports.blacklistLookup = function (connection, user, ban) {	
	//looks up an ip with DroneBL, bans the user if they are listed.
	dns = require('dns');
	ip = connection.split('.');
	var ipbans = fs.createWriteStream("config/ipbans.txt", {flags: "a"});
	dronebl = ip[3] + '.' + ip[2] + '.' + ip[1] + '.' + ip[0] + '.dnsbl.dronebl.org';
	efnetrbl = ip[3] + '.' + ip[2] + '.' + ip[1] + '.' + ip[0] + '.rbl.efnetrbl.org';
	ahbl = ip[3] + '.' + ip[2] + '.' + ip[1] + '.' + ip[0] + '.dnsbl.ahbl.org';
	spamhaus = ip[3] + '.' + ip[2] + '.' + ip[1] + '.' + ip[0] + '.zen.spamhaus.org';
	dns.resolve(dronebl, function(err, addresses) {
	console.log('Checking IP ' + connection + ' with DroneBL.');
	if (!err) {
		switch(addresses[0]){
			case '127.0.0.3':
				if (ban) {
					user.ban();
					CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IRC Drone) IP: ' + connection + '\n');
					Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IRC Drone) IP: ' + connection);
					ipbans.write('\n'+connection);
				}
				console.log(connection + ' is listed in DroneBL. (IRC Drone)');
				break;
			case '127.0.0.5':
				if (ban) {
					user.ban();
					CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Bottler) IP: ' + connection + '\n');
					Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Bottler) IP: ' + connection);
					ipbans.write('\n'+connection);
				}
				console.log(connection + ' is listed in DroneBL. (Bottler)');
				break;
			case '127.0.0.6':
				if (ban) {
						user.ban();
						CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Unknown spambot or drone) IP: ' + connection + '\n');
						Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Unknown spambot or drone) IP: ' + connection);
						ipbans.write('\n'+connection);
				}
				console.log(connection + ' is listed in DroneBL. (Unknown spambot or drone)');
				break;
			case '127.0.0.7':
				if (ban) {
					user.ban();
					CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (DDOS Drone) IP: ' + connection + '\n');
					Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (DDOS Drone) IP: ' + connection);
					ipbans.write('\n'+connection);
				}
				console.log(connection + ' is listed in DroneBL. (DDOS Drone)');
				break;
			case '127.0.0.8':
				if (ban) {
					user.ban();
					CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (SOCKS Proxy) IP: ' + connection + '\n');
					Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (SOCKS Proxy) IP: ' + connection);
					ipbans.write('\n'+connection);
				}
				console.log(connection + ' is listed in DroneBL. (SOCKS Proxy)');
				break;
			case '127.0.0.9':
				if (ban) { 
					user.ban();
					CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (HTTP Proxy) IP: ' + connection + '\n');
					Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (HTTP Proxy) IP: ' + connection);
					ipbans.write('\n'+connection);
				}
				console.log(connection + ' is listed in DroneBL. (HTTP Proxy)');
				break;
			case '127.0.0.10':
				if (ban) {
					user.ban();
					CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (ProxyChain) IP: ' + connection + '\n');
					Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (ProxyChain) IP: ' + connection);
					ipbans.write('\n'+connection);
				}
				console.log(connection + ' is listed in DroneBL. (ProxyChain)');
				break;
			case '127.0.0.13':
				user.ban();
				CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Brute force attackers) IP: ' + connection + '\n');
				Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Brute force attackers) IP: ' + connection);
				ipbans.write('\n'+connection);
				break;
			case '127.0.0.14':
				if (ban) {
					user.ban();
					CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Open Wingate proxy) IP: ' + connection + '\n');
					Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Open Wingate proxy) IP: ' + connection);
					ipbans.write('\n'+connection);
				}
				console.log(connection + ' is listed in DroneBL. (Open wingate proxy)');
				break;
			case '127.0.0.15':
				if (ban) {
					user.ban();
					CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Compromised router / gateway) IP: ' + connection + '\n');
					Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Compromised router / gateway) IP: ' + connection);
					ipbans.write('\n'+connection);
				}
				console.log(connection + ' is listed in DroneBL. (Compromised router / gateway)');
				break;
			case '127.0.0.17':
				if (ban) {
					user.ban();
					CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Automatically determined botnet IPs (experimental)) IP: ' + connection + '\n');
					Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Automatically determined botnet IPs (experimental)) IP: ' + connection);
					ipbans.write('\n'+connection);
				}
				console.log(connection + ' is listed in DroneBL. (Automatically determined botnet IPs (experimental)');
				break;
			case '127.0.0.255':
				if (ban) {
					CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' is listed in DroneBL as Unknown. IP: ' + connection + '\n');
					Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' is listed in DroneBL as Unknown. IP: ' + connection);
				}
				console.log(connection + ' is listed in DroneBL as Unknown.');
				break;
		}
	}
	    if (err) {
			console.log(connection + ' is not listed in DroneBL.');
			dns.resolve(efnetrbl, function(err, addresses) {
			console.log('Checking IP ' + connection + ' with EFnet RBL.');
				if (!err) {
					switch(addresses[0]){
						case '127.0.0.1':
							if (ban) {
								user.ban();
								CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Open Proxy) IP: ' + connection + '\n');
								Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Open Proxy) IP: ' + connection);
								ipbans.write('\n'+connection);
							}
							console.log(connection + ' is listed in EFnet RBL. (Open Proxy)');
							break;
						case '127.0.0.2':
							if (ban) {
								user.ban();
								CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (spamtrap666) IP: ' + connection + '\n');
								Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (spamtrap666) IP: ' + connection);
								ipbans.write('\n'+connection);
							}
							console.log(connection + ' is listed in EFnet RBL. (spamtrap666)');
							break;
						case '127.0.0.3':
							if (ban) {
								user.ban();
								CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (spamtrap50) IP: ' + connection + '\n');
								Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (spamtrap50) IP: ' + connection);
								ipbans.write('\n'+connection);
							}
							console.log(connection + ' is listed in EFnet RBL. (spamtrap50)');
							break;
						case '127.0.0.4':
							if (ban) {
								user.ban();
								CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (TOR) IP: ' + connection + '\n');
								Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (TOR) IP: ' + connection);
								ipbans.write('\n'+connection);
							}
							console.log(connection + ' is listed in EFnet RBL. (TOR)');
							break;
						case '127.0.0.5':
							if (ban) {
								user.ban();
								CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Drones / Flooding) IP: ' + connection + '\n');
								Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Drones / Flooding) IP: ' + connection);
								ipbans.write('\n'+connection);
							}
							console.log(connection + ' is listed in EFnet RBL. (Drones / Flooding)');
							break;
						}
					}
				if (err) {
					console.log(connection + ' is not listed in EFnet RBL.');
					dns.resolve(ahbl, function(err, addresses) {
					console.log('Checking IP ' + connection + ' with ahbl.');
							if (!err) {
								switch(addresses[0]){
									case '127.0.0.2':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Open Relay) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Open Relay) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Open Relay)');
										break;
									case '127.0.0.3':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Open Proxy) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Open Proxy) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Open Proxy)');
										break;
									case '127.0.0.4':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Spam Source) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Spam Source) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Spam Source)');
										break;
									case '127.0.0.5':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Provisional Spam Source Listing block) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Provisional Spam Source Listing block) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Provisional Spam Source Listing block)');
										break;
									case '127.0.0.7':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Spam Supporter) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Spam Supporter) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Spam Supporter)');
										break;
									case '127.0.0.8':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Spam Supporter (indirect)) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Spam Supporter (indirect)) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Spam Supporter(indirect))');
										break;
									case '127.0.0.10':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Shoot On Sight) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Shoot On Sight) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Shoot On Sight)');
										break;
									case '127.0.0.14':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Compromised System - DDoS) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Compromised System - DDoS) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Compromised System - DDoS)');
										break;
									case '127.0.0.15':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Compromised System - Relay) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Compromised System - Relay) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Compromised System - Relay)');
										break;
									case '127.0.0.16':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Compromised System - Autorooter/Scanner) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Compromised System - Autorooter/Scanner) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Compromised System - Autorooter/Scanner)');
										break;
									case '127.0.0.18':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Compromised System - Other virus) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Compromised System - Other virus) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Compromised System - Other virus)');
										break;
									case '127.0.0.19':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Open Proxy) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Open Proxy) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Open Proxy)');
										break;
									case '127.0.0.127':
										if (ban) {
											user.ban();
											CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Other) IP: ' + connection + '\n');
											Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (Other) IP: ' + connection);
											ipbans.write('\n'+connection);
										}
										console.log(connection + ' is listed in ahbl. (Other)');
										break;
										}
									}
									if (err) {
										console.log(connection + ' is not listed in ahbl.');
										dns.resolve(spamhaus, function(err, addresses) {
											console.log('Checking IP ' + connection + ' with spamhaus.');
											if (!err) {
												switch(addresses[0]) {
													case '127.0.0.2':
														if (ban) {
															user.ban();
															CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IP Listed in sbl.spamhaus.org) IP: ' + connection + '\n');
															Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IP Listed in sbl.spamhaus.org) IP: ' + connection);
															ipbans.write('\n'+connection);
														}
														console.log(connection + ' is listed in spamhaus. (IP listed in sbl.spamhaus.org)');
														break;
													case '127.0.0.3':
														if (ban) {
															user.ban();
															CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IP Listed in css.spamhaus.org) IP: ' + connection + '\n');
															Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IP Listed in css.spamhaus.org) IP: ' + connection);
															ipbans.write('\n'+connection);
														}
														console.log(connection + ' is listed in spamhaus. (IP listed in css.spamhaus.org)');
														break;
												/*	case '127.0.0.4':
														if (ban) {
															user.ban();
															CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IP Listed in xbl.spamhaus.org) IP: ' + connection + '\n');
															Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IP Listed in xbl.spamhaus.org) IP: ' + connection);
															ipbans.write('\n'+connection);
														}
														console.log(connection + ' is listed in spamhaus. (IP listed in xbl.spamhaus.org)');
														break;*/
													case '127.0.0.5':
														if (ban) {
															user.ban();
															CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IP Listed in xbl.spamhaus.org) IP: ' + connection + '\n');
															Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IP Listed in xbl.spamhaus.org) IP: ' + connection);
															ipbans.write('\n'+connection);
														}
														console.log(connection + ' is listed in spamhaus. (IP listed in xbl.spamhaus.org)');
														break;
													case '127.0.0.6':
														if (ban) {
															user.ban();
															CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IP Listed in xbl.spamhaus.org) IP: ' + connection + '\n');
															Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IP Listed in xbl.spamhaus.org) IP: ' + connection);
															ipbans.write('\n'+connection);
														}
														console.log(connection + ' is listed in spamhaus. (IP listed in xbl.spamhaus.org)');
														break;
													case '127.0.0.7':
														if (ban) {
															user.ban();
															CommandParser.modlog.write('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IP Listed in xbl.spamhaus.org) IP: ' + connection + '\n');
															Rooms.rooms.staff.add('['+(new Date().toJSON())+'] ' + user.name + ' was automatically banned (IP Listed in xbl.spamhaus.org) IP: ' + connection);
															ipbans.write('\n'+connection);
														}
														console.log(connection + ' is listed in spamhaus. (IP listed in xbl.spamhaus.org)');
														break;
													}
											}
										if (err) {
											console.log(connection + ' is not listed in spamhaus.');
											}
									});
								}	
							});
						}	
					});
				}	
		});
		};
