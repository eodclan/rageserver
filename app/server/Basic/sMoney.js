"use strict"

const misc = require('../sMisc');
const i18n = require('../sI18n');


class atmsClass{
	constructor() {
		mp.events.add({
			"playerEnterColshape" : (player, shape) => {
				if (!player.loggedIn || player.vehicle || !shape.atm) return;
				player.canOpen.ATM = true;
				player.notify(i18n.get('sMoney', 'enterATM', player.lang));
			},
			"sKeys-E" : (player) => {
				if (!player.loggedIn || !player.canOpen.ATM) return;
				this.openMenu(player);
			},
			"playerExitColshape" : (player, shape) => {
				if (!player.loggedIn || !shape.atm) return;
				player.canOpen.ATM = false;
			},

			"sMoney-GetCash" : (player, value) => {
				this.getCash(player, value);
			},

			"sMoney-PutCash" : (player, value) => {
				this.putCash(player, value);
			},

			"sMoney-GetTaxMoney" : (player, value) => {
				this.getTaxMoney(player, value);
			},

			"sMoney-PutTaxMoney" : (player, value) => {
				this.putTaxMoney(player, value);
			},

			"sMoney-PayFine" : (player, i) => {
				this.payFine(player, i);
			},
		});
	}

	createATM(x, y, z) {
		const shape = mp.colshapes.newSphere(x, y, z, 0.5);
		shape.atm = true;
		mp.blips.new(500, new mp.Vector3(x, y, z),
		{
			name: "ATM",
			color: 2,		
			shortRange: true,
			scale: 0.75,
		});
	}

	getPlayerMoneyInfo(player) {
		const str1 = `app.cash = ${player.money.cash};`;
		const str2 = `app.bank = ${player.money.bank};`;
		const str3 = `app.tax = ${player.money.tax};`;
		const str4 = `app.loadFines('${JSON.stringify(player.money.fines)}');`;
		let totalFine = 0;
		if (Array.isArray(player.money.fines)) {
			for (let fine of player.money.fines) {
				totalFine += fine.val;
			}
		}
		const str5 = `app.fine = ${totalFine};`;
		const str = str1 + str2 + str3 + str4 + str5;
		return str;
	}

	openMenu(player) {
		const str1 = this.getPlayerMoneyInfo(player);
		const str2 = `setTimeout(load, 300);`; // For add transition effect
		const execute = str1 + str2;
		player.call("cMoney-ShowATM", [player.lang, execute]);
		misc.log.debug(`${player.name} enters ATM`);
	}

	loadATMs() {
		this.createATM(-95.54, 6457.14, 31.46); // bank pb
		this.createATM(-97.26, 6455.38, 31.46); // bank pb
		this.createATM(-254.56, 6338.20, 32.42); // hospital
		this.createATM(155.828, 6642.827, 31.602); // petrolstation with customs
		this.createATM(174.161, 6637.827, 31.573); // petrolstation with customs
		this.createATM(1701.28, 6426.46, 32.76); // petrolstation
		this.createATM(-386.816, 6046.031, 31.502); // sherriff
		this.createATM(2683.132, 3286.739, 55.241); // shop
		this.createATM(1702.736, 4933.596, 42.064); // shop
		this.createATM(-132.967, 6366.445, 31.475); // shop
		this.createATM(-283.024, 6226.01, 31.493); // shop
		this.createATM(119.044, -883.928, 31.123); // shop
		this.createATM(24.403, -945.994, 29.358); // shop
		this.createATM(5.183, -919.858, 29.558); // shop
		this.createATM(-3240.933, 997.656, 12.55); // normal
		this.createATM(-3240.615, 1008.511, 12.831); // shop
		this.createATM(-3044.012, 594.831, 7.737); // normal
		this.createATM(-3040.86, 593.082, 7.909); // shop
		this.createATM(147.483, -1035.644, 29.343); // normal
		this.createATM(-2975.107, 380.143, 14.999); // normal
		this.createATM(295.726, -895.955, 29.215); // normal
		this.createATM(296.508, -893.821, 29.232); // normal
		this.createATM(-2072.424, -317.043, 13.316); // normal
		this.createATM(-1314.806, -836.086, 16.96); // normal
		this.createATM(-1315.889, -834.565, 16.962); // normal
		this.createATM(289.106, -1256.872, 29.441); // normal
		this.createATM(-1109.373, -1690.819, 4.375); // normal
		this.createATM(288.75, -1282.301, 29.642); // normal
		this.createATM(-821.631, -1082.003, 11.132); // normal
		this.createATM(-56.918, -1752.176, 29.421); // normal
		this.createATM(-717.614, -915.864, 19.216); // normal
		this.createATM(112.641, -819.372, 31.338); // normal
		this.createATM(111.427, -775.402, 31.437); // normal
		this.createATM(-203.85, -861.401, 30.268); // normal
		this.createATM(-57.86, -92.967, 57.791); // normal
		this.createATM(-537.67, -854.41, 29.302); // normal
		this.createATM(158.645, 234.112, 106.626); // normal
		this.createATM(238.265, 234.112, 106.287); // normal
		this.createATM(237.314, 217.927, 106.287); // normal
		this.createATM(236.522, 219.628, 106.287); // normal
		this.createATM(285.476, 143.485, 104.173); // normal
		this.createATM(356.883, 173.482, 103.069); // normal		
	}

	updateATMInfo(player) {
		const str = this.getPlayerMoneyInfo(player);
		player.call("cInjectCef", [str]);
	}

	logATMOperation(player, before) {
		player.call("cMoney-Update", [player.money.cash]);
		const after = `$${player.money.cash} $${player.money.bank} $${player.money.tax}`;
		misc.log.debug(`ATM | ${player.name} | ${before} >>> ${after}`);
	}

	async getCash(player, summ) {
		if (!player.loggedIn || !misc.isValueNumber(summ) || player.money.bank < summ) return;
		const before = `$${player.money.cash} $${player.money.bank} $${player.money.tax}`;
		await misc.query(`UPDATE usersMoney SET cash = cash + ${summ}, bank = bank - ${summ} WHERE id = '${player.basic.id}'`);
		player.money.cash += summ;
		player.money.bank -= summ;
		this.logATMOperation(player, before);
		this.updateATMInfo(player);
	}

	async putCash(player, summ) {
		if (!player.loggedIn || !misc.isValueNumber(summ) || player.money.cash < summ) return;
		const before = `$${player.money.cash} $${player.money.bank} $${player.money.tax}`;
		await misc.query(`UPDATE usersMoney SET cash = cash - ${summ}, bank = bank + ${summ} WHERE id = '${player.basic.id}'`);
		player.money.cash -= summ;
		player.money.bank += summ;
		this.logATMOperation(player, before);
		this.updateATMInfo(player);
	}

	async getTaxMoney(player, summ) {
		if (!player.loggedIn || !misc.isValueNumber(summ) || player.money.tax < summ) return;
		const before = `$${player.money.cash} $${player.money.bank} $${player.money.tax}`;
		await misc.query(`UPDATE usersMoney SET cash = cash + ${summ}, tax = tax - ${summ} WHERE id = '${player.basic.id}'`);
		player.money.cash += summ;
		player.money.tax -= summ;
		this.logATMOperation(player, before);
		this.updateATMInfo(player);
	}

	async putTaxMoney(player, summ) {
		if (!player.loggedIn || !misc.isValueNumber(summ) || player.money.cash < summ) return;
		const before = `$${player.money.cash} $${player.money.bank} $${player.money.tax}`;
		await misc.query(`UPDATE usersMoney SET cash = cash - ${summ}, tax = tax + ${summ} WHERE id = '${player.basic.id}'`);
		player.money.cash -= summ;
		player.money.tax += summ;
		this.logATMOperation(player, before);
		this.updateATMInfo(player);
	}

	async payFine(player, index) {
		if (!player.loggedIn || !misc.isValueNumber(index) || !player.money.fines[index] || player.money.cash < player.money.fines[index].val) return;
		const before = `$${player.money.cash} $${player.money.bank} $${player.money.tax}`;
		const fineValue = player.money.fines[index].val;
		player.money.cash -= fineValue;
		player.money.fines.splice(index, 1);
		await misc.query(`UPDATE usersMoney SET cash = cash - ${fineValue}, fines = '${JSON.stringify(player.money.fines)}' WHERE id = '${player.basic.id}'`);
		this.logATMOperation(player, before);
		misc.log.debug(`-$${fineValue} fine`);
		this.updateATMInfo(player);
	}

}
const atms = new atmsClass();
atms.loadATMs();






class sMoney {
	constructor() {

	}

	async createNewUser() {
		await misc.query(`INSERT INTO usersMoney (cash) VALUES ('1500')`);
	}

	async loadUser(player) {
		const d = await misc.query(`SELECT * FROM usersMoney WHERE id = '${player.basic.id}' LIMIT 1`);
		player.money = {
			cash: d[0].cash,
			bank: d[0].bank,
			tax: d[0].tax,
			fines: JSON.parse(d[0].fines),
		}
		player.call("cMoney-Update", [d[0].cash]);
	}

	async changeMoney(player, value) {
		if (!misc.isValueNumber(value)) {
			misc.log.error(`changeMoney | Money is not a number: ${value}`);
			return false;
		}
		if (player.money.cash + value < 0) {
			player.notify(`~r~${i18n.get('sMoney', 'notEnoughCash', player.lang)}!`);
			return false;
		}
		await misc.query(`UPDATE usersMoney SET cash = cash + ${value} WHERE id = '${player.basic.id}'`);
		player.money.cash += value;
		player.call("cMoney-Update", [player.money.cash]);
		return true;
	}

	async addBankMoney(id, value, comment) {
		if (!misc.isValueNumber(id) || !misc.isValueNumber(value) || value < 0) return;
		await misc.query(`UPDATE usersMoney SET bank = bank + ${value} WHERE id = '${id}' LIMIT 1`);
		const player = misc.getPlayer(id);
		if (!player) return;
		player.money.bank += value;
		player.call("cMoney-SendNotification", [`${i18n.get('sMoney', 'addBankMoney', player.lang)}: ~g~$${value}. ~w~${comment}`]);
	}

	async payTaxOffline(id, value, comment) {
		if (!misc.isValueNumber(id) || !misc.isValueNumber(value) || value < 0) return;
		const d = await misc.query(`SELECT tax FROM usersMoney WHERE id = '${id}' LIMIT 1`);
		if (value > d[0].tax) return false;
		await misc.query(`UPDATE usersMoney SET tax = tax - ${value} WHERE id = '${id}'`);
		const player = misc.getPlayer(id);
		if (!player) return;
		player.money.tax -= value;
		player.call("cMoney-SendNotification", [`${i18n.get('sMoney', 'payTaxOffline', player.lang)}: ~g~$${value}. ~w~${comment}`]);
		return true;
	}

	async newFine(id, value, comment) {
		if (!misc.isValueNumber(id) || !misc.isValueNumber(value) || value < 0) return;
		const d = await misc.query(`SELECT fines FROM usersMoney WHERE id = '${id}' LIMIT 1`);
		let fines = JSON.parse(d[0].fines);
		if (!fines) fines = [];
		const newFine = {
			date: new Date().toLocaleString(),
			val: value,
			txt: comment,
		}
		fines.push(newFine);
		await misc.query(`UPDATE usersMoney SET fines = '${JSON.stringify(fines)}' WHERE id = '${id}'`);
		const player = misc.getPlayer(id);
		if (!player) return;
		player.money.fines = fines;
		player.call("cMoney-SendNotification", [`${i18n.get('sMoney', 'newFine', player.lang)}: ~r~$${value}. ~w~${comment}`]);
	}

}
const money = new sMoney();



function createNewUser() {
	return money.createNewUser();
}
module.exports.createNewUser = createNewUser;

function loadUser(player) {
	return money.loadUser(player);
}
module.exports.loadUser = loadUser;

function getCash(player) {
	return player.money.cash;
};
module.exports.getCash = getCash;

function changeMoney(player, value) {
	return money.changeMoney(player, value);
};
module.exports.changeMoney = changeMoney;

async function addToBankMoney(id, value, comment) {
	return money.addBankMoney(id, value, comment);
}
module.exports.addToBankMoney = addToBankMoney;

async function payTaxOffline(id, value, comment) {
	return money.payTaxOffline(id, value, comment);
}
module.exports.payTaxOffline = payTaxOffline;

async function newFine(id, value, comment) {
	return money.newFine(id, value, comment);
}
module.exports.newFine = newFine;