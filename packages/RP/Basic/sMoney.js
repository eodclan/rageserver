"use strict"

const misc = require('../sMisc');

async function getMoney(player) {
   	const d = await misc.query(`SELECT money FROM users WHERE username = '${player.name}'`);
	player.call("cMoneyUpdate", [d[0].money]);
	return d[0].money;
};
module.exports.getMoney = getMoney;

async function changeMoney(player, value) {
	if (!misc.isValueNumber(value)) {
		misc.log.error(`changeMoney | Money is not a number: ${value}`);
		return false;
	}
	if (player.info.money + value < 0) {
		return false;
	}
	await misc.query(`UPDATE users SET money = money + ${value} WHERE username = '${player.name}'`);
	player.info.money += value;
	player.call("cMoneyUpdate", [player.info.money]);
	return true;
};
module.exports.changeMoney = changeMoney;

async function addToBankMoneyOffline(name, value, comment) {
	if (!misc.isValueNumber(value) || value < 0) return;
	await misc.query(`UPDATE users SET bmoney = bmoney + ${value} WHERE username = '${name}'`);
	for (let j = 0; j < mp.players.length; j++) {
		const player = mp.players.at(j);
		if (player.name === name) {
			player.info.bmoney += value;
			player.call("cMoneySendNotification", [`New payment: ~g~$${value}. ~w~${comment}`]);
			break;
		}
	}
}
module.exports.addToBankMoneyOffline = addToBankMoneyOffline;

async function payTaxOffline(username, value, comment) {
	if (!misc.isValueNumber(value) || value < 0) return;
	const d = await misc.query(`SELECT tmoney FROM users WHERE username = '${username}'`);
	if (value > d[0].tmoney) {
		return false;
	}
	await misc.query(`UPDATE users SET tmoney = tmoney - ${value} WHERE username = '${username}'`);
	for (let j = 0; j < mp.players.length; j++) {
		const player = mp.players.at(j);
		if (player.name === username) {
			player.info.tmoney -= value;
			player.call("cMoneySendNotification", [`New tax payment: ~g~$${value}. ~w~${comment}`]);
			break;
		}
	}
	return true;
}
module.exports.payTaxOffline = payTaxOffline;


async function getCash(player, summ) {
	if (!misc.isValueNumber(summ) || player.info.bmoney < summ) {
		return;
	}
	const before = `$${player.info.money} $${player.info.bmoney} $${player.info.tmoney}`;
	await misc.query(`UPDATE users SET money = money + ${summ}, bmoney = bmoney - ${summ} WHERE username = '${player.name}'`);
	player.info.money += summ;
	player.info.bmoney -= summ;
	player.call("cMoneyUpdate", [player.info.money]);
	logATMOperation(player, before);
}

async function putCash(player, summ) {
	if (!misc.isValueNumber(summ) || player.info.money < summ) {
		return;
	}
	const before = `$${player.info.money} $${player.info.bmoney} $${player.info.tmoney}`;
	await misc.query(`UPDATE users SET money = money - ${summ}, bmoney = bmoney + ${summ} WHERE username = '${player.name}'`);
	player.info.money -= summ;
	player.info.bmoney += summ;
	player.call("cMoneyUpdate", [player.info.money]);
	logATMOperation(player, before);
}

async function getTaxMoney(player, summ) {
	if (!misc.isValueNumber(summ) || player.info.tmoney < summ) {
		return;
	}
	const before = `$${player.info.money} $${player.info.bmoney} $${player.info.tmoney}`;
	await misc.query(`UPDATE users SET money = money + ${summ}, tmoney = tmoney - ${summ} WHERE username = '${player.name}'`);
	player.info.money += summ;
	player.info.tmoney -= summ;
	player.call("cMoneyUpdate", [player.info.money]);
	logATMOperation(player, before);
}

async function putTaxMoney(player, summ) {
	if (!misc.isValueNumber(summ) || player.info.money < summ) {
		return;
	}
	const before = `$${player.info.money} $${player.info.bmoney} $${player.info.tmoney}`;
	await misc.query(`UPDATE users SET money = money - ${summ}, tmoney = tmoney + ${summ} WHERE username = '${player.name}'`);
	player.info.money -= summ;
	player.info.tmoney += summ;
	player.call("cMoneyUpdate", [player.info.money]);
	logATMOperation(player, before);
}

function logATMOperation(player, before) {
	const after = `$${player.info.money} $${player.info.bmoney} $${player.info.tmoney}`;
	misc.log.debug(`ATM | ${player.name} | ${before} > ${after}`);
}

mp.events.add(
{		
	"sGetCash" : (player, summ) => {
		getCash(player, summ);
	},

	"sPutCash" : (player, summ) => {
		putCash(player, summ);
	},

	"sGetTaxMoney" : (player, summ) => {
		getTaxMoney(player, summ);
	},

	"sPutTaxMoney" : (player, summ) => {
		putTaxMoney(player, summ);
	},

	"sKeys-E" : (player) => {
		if (!misc.isPlayerLoggedIn(player)) return;
		if (player.info.canOpen.ATM) {
			openATMMenu(player);
		}
	},
	
	
});






function CreateATM(x, y, z) {
	const colshape = mp.colshapes.newSphere(x, y, z, 0.5);
	colshape.setVariable("ATM", true);
	const Blip = mp.blips.new(500, new mp.Vector3(x, y, z),
	{
		name: "ATM",
		color: 2,		
		shortRange: true,
		scale: 0.75,
	});
}

function openATMMenu(player) {
	const str1 = `app.cash = ${player.info.money};`;
	const str2 = `app.bmoney = ${player.info.bmoney};`;
	const str3 = `app.tmoney = ${player.info.tmoney};`;
	const str4 = `setTimeout(load, 300);`; // For add transition effect
	const str = str1 + str2 + str3 + str4;
	player.call("cShowATMCef", ["package://RP/Browsers/ATM/atm.html"]);
	player.call("cInjectCef", [str]);
	misc.log.debug(`${player.name} enters ATM`);
}


mp.events.add(
{
	"playerEnterColshape" : (player, shape) => {
		if (!shape.getVariable("ATM") || player.vehicle || !misc.isPlayerLoggedIn(player)) {
			return;
		}
		player.info.canOpen.ATM = true;
		player.notify(`Press ~b~E ~s~to open ATM Menu`);
	},

	"playerExitColshape" : (player, shape) => {
		if (!shape.getVariable("ATM")) {
			return;
		}
		player.info.canOpen.ATM = false;
	},
	
});



CreateATM(-95.54, 6457.14, 31.46); // bank pb
CreateATM(-97.26, 6455.38, 31.46); // bank pb
CreateATM(-254.56, 6338.20, 32.42); // hospital
CreateATM(155.828, 6642.827, 31.602); // petrolstation with customs
CreateATM(174.161, 6637.827, 31.573); // petrolstation with customs
CreateATM(1701.28, 6426.46, 32.76); // petrolstation
CreateATM(-386.816, 6046.031, 31.502); // sherriff
CreateATM(2683.132, 3286.739, 55.241); // shop
CreateATM(1702.736, 4933.596, 42.064); // shop
CreateATM(-132.967, 6366.445, 31.475); // shop
CreateATM(-283.024, 6226.01, 31.493); // shop
CreateATM(119.044, -883.928, 31.123); // shop
CreateATM(24.403, -945.994, 29.358); // shop
CreateATM(5.183, -919.858, 29.558); // shop
CreateATM(-3240.933, 997.656, 12.55); // normal
CreateATM(-3240.615, 1008.511, 12.831); // shop
CreateATM(-3044.012, 594.831, 7.737); // normal
CreateATM(-3040.86, 593.082, 7.909); // shop
CreateATM(147.483, -1035.644, 29.343); // normal
CreateATM(-2975.107, 380.143, 14.999); // normal
CreateATM(295.726, -895.955, 29.215); // normal
CreateATM(296.508, -893.821, 29.232); // normal
CreateATM(-2072.424, -317.043, 13.316); // normal
CreateATM(-1314.806, -836.086, 16.96); // normal
CreateATM(-1315.889, -834.565, 16.962); // normal
CreateATM(289.106, -1256.872, 29.441); // normal
CreateATM(-1109.373, -1690.819, 4.375); // normal
CreateATM(288.75, -1282.301, 29.642); // normal
CreateATM(-821.631, -1082.003, 11.132); // normal
CreateATM(-56.918, -1752.176, 29.421); // normal
CreateATM(-717.614, -915.864, 19.216); // normal
CreateATM(112.641, -819.372, 31.338); // normal
CreateATM(111.427, -775.402, 31.437); // normal
CreateATM(-203.85, -861.401, 30.268); // normal
CreateATM(-57.86, -92.967, 57.791); // normal
CreateATM(-537.67, -854.41, 29.302); // normal
CreateATM(158.645, 234.112, 106.626); // normal
CreateATM(238.265, 234.112, 106.287); // normal
CreateATM(237.314, 217.927, 106.287); // normal
CreateATM(236.522, 219.628, 106.287); // normal
CreateATM(285.476, 143.485, 104.173); // normal
CreateATM(356.883, 173.482, 103.069); // normal

