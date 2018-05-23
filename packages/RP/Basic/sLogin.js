"use strict"

const misc = require('../sMisc');
const charCreator = require('../Character/sCharacterCreator');
const clothes = require('../Character/sClothes');
const crypto = require('crypto');


function hashPassword(str) {
    const cipher = crypto.createCipher('aes192', 'a pass');
	let encrypted = cipher.update(str, 'utf8', 'hex'); 
    encrypted += cipher.final('hex');
    return encrypted;
}

function showSuccess(player) {
    const str = "showSuccess();";
    player.call("cInjectCef", [str]);
}

function showError(player) {
    const str = "showError();";
    player.call("cInjectCef", [str]);
}

function showLoginCef(player) {
    player.call("cShowLoginCef", ["package://RP/Browsers/Login/login.html"]);
}

function showRegisterCef(player) {
    player.call("cShowLoginCef", ["package://RP/Browsers/Login/register.html"]);
}

mp.events.add(
{
    "playerReady" : async (player) => {
        player.spawn(new mp.Vector3(3222, 5376, 20));
        player.dimension = 1001;
        const d = await misc.query(`SELECT username, password FROM users WHERE username = '${player.name}'`);
        if (!d[0]) {
            showRegisterCef(player);
        }
        else if(d[0].username === player.name) {
            showLoginCef(player);
            player.info = d[0];
        }
        misc.log.debug(`${player.name} connected`);
    },
        
    "sTryRegister" : async (player, pass) => {
        const d = await misc.query(`SELECT username FROM users ORDER BY id DESC LIMIT 5`);
        for (let i = 0; i < d.length; i++) {
			if (d[i].username === player.name) {
                return showError(player);
			}
        }
        showSuccess(player);
        const newPass = hashPassword(pass);
        const firstSpawn = {
            x: -164,
            y: 6426,
            z: 32,
        }
        const position = misc.convertOBJToJSON(firstSpawn, 48);
        const query1 = misc.query(`INSERT INTO users (username, password, money, position, dim, signupdate) VALUES ('${player.name}', '${newPass}', '1500', '${position}', '0', '${new Date()}')`);
        const query2 = charCreator.insertNewUser();
        await Promise.all([query1, query2]);
        setTimeout(showLoginCef, 2000, player);
        misc.log.debug(`${player.name} register an account`);
        player.info = {
            username: player.name,
            password: newPass,
        };
    },

    "sTryLogin" : async (player, pass) => {
        const hash = hashPassword(pass);
		if (hash !== player.info.password) {
            misc.log.debug(`${player.name} entered wrong password!`);
            return showError(player);
        }
        showSuccess(player);
        await loadPlayerAccount(player);
        await charCreator.loadPlayerAppearance(player);
        await clothes.loadPlayerClothes(player);
        misc.log.debug(`${player.name} logged in`);
    },
    
    "playerQuit" : (player, exitType, reason) => {
        if (!player.info || !player.info.loggedIn) return;
        savePlayerAccount(player);
    },

    "playerDeath" : (player, reason, killer) => { // Temporary Respawn;
        player.spawn(new mp.Vector3(player.position));
        player.health = 90;
    },

});

mp.events.addCommand(
{
    'save' : (player) => {
        if (player.info.adminLvl < 1) return;
        savePlayerAccount(player);
        player.outputChatBox(`Account successfully saved!`);
    }, 

    'wp' : (player, _, weaponName) => {
        if (player.info.adminLvl < 2) return;
	if (weaponName.trim().length > 0)
        	player.giveWeapon(mp.joaat(`weapon_${weaponName}`), 100);
    	else
        	player.outputChatBox(`<b>Command syntax:</b> /weapon [weapon_name]`); 
    },

    'tp' : (player, _, x, y ,z) => {
        if (player.info.adminLvl < 2) return;
	if (!isNaN(parseFloat(x)) && !isNaN(parseFloat(y)) && !isNaN(parseFloat(z)))
        	player.position = new mp.Vector3(parseFloat(x),parseFloat(y),parseFloat(z));
    	else
        	player.outputChatBox(`<b>Command syntax:</b> /tp [x] [y] [z]`);
    },

    'vrep' : (player) => {
        if (player.info.adminLvl < 1) return;
	if (player.vehicle)
        	player.vehicle.repair();
	else
        	player.outputChatBox(`<b>Error:</b> you are not in the vehicle!`);
    },

    'tp2p' : (player, _, playerID) => {
        if (player.info.adminLvl < 2) return;
	if (playerID && playerID.trim().length > 0) {
        let sourcePlayer = mp.players.at(parseInt(playerID));
        if (sourcePlayer) {
            let playerPos = sourcePlayer.position;
            playerPos.x += 1;
            player.position = playerPos;
        } else {
            player.outputChatBox(`<b>Warp:</b> player with such ID not found!`);
        }
	} else
        player.outputChatBox(`<b>Command syntax:</b> /tp2p [player_id]`);
    },
	
	
    'v' : (player, fullText, model) => {  // Temporary vehicle spawning
		let vehicle = mp.vehicles.new(model, player.position,
		{
            heading: player.heading,
        });
        const color = misc.getRandomInt(0, 159);
        vehicle.setColor(color, color);
        player.putIntoVehicle(vehicle, -1);
        misc.log.debug(`${player.name} spawned ${model}`);
    },
    
    'pos' : (player, fullText, model) => { 
        if (player.info.adminLvl < 1) return;
        const pos = player.position;
        let rot;
        if (player.vehicle) {
            rot = player.vehicle.rotation.z
        }
        else {
            rot = player.heading;
        }
        const str = `x: ${misc.roundNum(pos.x, 3)}, y: ${misc.roundNum(pos.y, 3)}, z: ${misc.roundNum(pos.z, 3)}, rot: ${misc.roundNum(rot, 2)}`;
        player.outputChatBox(str);
        misc.log.debug(str);
	},
    
});       
    

function savePlayerAccount(player) {
    const position = misc.convertOBJToJSON(player.position, player.heading, 0.1);
    misc.query(`UPDATE users SET position = '${position}', dim = '${player.dimension}', lastlogindate = '${new Date()}' WHERE username = '${player.name}'`);
    misc.log.debug(`${player.name} disconnected`);
}

async function loadPlayerAccount(player) {
    const d = await misc.query(`SELECT * FROM users WHERE username = '${player.name}'`);
    player.info = {
        loggedIn: true,
        id: d[0].id,
        money: d[0].money,
        bmoney: d[0].bmoney,
        tmoney: d[0].tmoney,
        canOpen: {
            ATM: false,
        },
        adminLvl: d[0].adminlvl,
        activeJob: {
            name: false,
        },
        hasBusiness: d[0].hasBusiness,
    }
    misc.setPlayerPosFromJSON(player, d[0].position);
    player.dimension = d[0].dim;
    player.call("cMoneyUpdate", [d[0].money]);
    player.call("cCloseCefAndDestroyCam");
}
