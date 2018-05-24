"use strict"

const misc = require('../sMisc');
const moneyAPI = require('../Basic/sMoney');
const clothes = require('../Character/sClothes');

const treeMarkersList = [];
let menuShape, dropMarker, dropShape;
const checkPoints = [
    {x: 1892.16, y: 4834.523, z: 46.003 },
    {x: 1879.971, y: 4846.516, z: 45.232 },
    {x: 1896.245, y: 4831.984, z: 46.041 },
    {x: 1915.743, y: 4808.663, z: 44.732 },
    {x: 1920.009, y: 4803.968, z: 44.344 },
];



function createEntities() {
	const mainMenu =  {x: 1931.338, y: 4809.429, z: 43.918};
    const posToDrop = {x: 1883.491, y: 4830.207, z: 45.459};
	
	// mainMenu
	const menuMarker = mp.markers.new(1, new mp.Vector3(mainMenu.x, mainMenu.y, mainMenu.z - 1), 0.75,
	{
		color: [0, 255, 0, 100],
		visible: true,
	});
	menuShape = mp.colshapes.newSphere(mainMenu.x, mainMenu.y, mainMenu.z, 1);

	const blip = mp.blips.new(364, new mp.Vector3(mainMenu.x, mainMenu.y, mainMenu.z),
	{	
        name: "Wein Sammler Job",
		shortRange: true,
		scale: 0.7,
		color: 17,
	});
	
	//dropMenu
	dropMarker = mp.markers.new(1, new mp.Vector3(posToDrop.x, posToDrop.y, posToDrop.z - 1), 0.75,
	{
		color: [255, 165, 0, 100],
		visible: true,
	});
	dropShape = mp.colshapes.newSphere(posToDrop.x, posToDrop.y, posToDrop.z, 1);

	
	for (let i = 0; i < checkPoints.length; i++) {
		const marker = mp.markers.new(1, new mp.Vector3(checkPoints[i].x, checkPoints[i].y, checkPoints[i].z - 1), 3,
		{
			color: [255, 165, 0, 50],
			visible: false,
        });
        marker.WineCollectorTree = i;
		treeMarkersList.push(marker);
        const colshape = mp.colshapes.newSphere(checkPoints[i].x, checkPoints[i].y, checkPoints[i].z, 3);
        colshape.WineCollectorTree = i;
    }
}

function openMainMenu(player) {
    if (player.info.activeJob.name === "Wine Collector") {
        return player.call("cWineCollectorFinishCef", ['app.loadFinish();']);
    }
    player.call("cWineCollectorStartCef");
}

function startWork(player) {
    player.info.activeJob = {
        name: "Wine Collector",
        collected: 0,
        activeTree: false,
    };
    createRandomCheckPoint(player);
    player.notify("~g~Du hast den Wein Sammlerjob begonnen!");
    misc.log.debug(`${player.name} started Wine Collector job!`);
    dropMarker.showFor(player);
    if (player.model === 1885233650) {
		setWorkingClothesForMan(player);
	}
	else {
		setWorkingClothesForWoman(player);
	}

    function setWorkingClothesForMan(player) {
        player.setProp(0, 14, 0); //Hat
        player.setClothes(11, 78, misc.getRandomInt(0, 15), 0); //Top
        player.setClothes(3, 14, 0, 0);
        player.setClothes(252, 0, 0, 0);
        player.setClothes(4, 0, misc.getRandomInt(0, 15), 0); // Legs
    }
    function setWorkingClothesForWoman(player) {
        player.setProp(0, 14, 0); //Hat
        player.setClothes(11, 78, misc.getRandomInt(0, 7), 0); //Top
        player.setClothes(3, 9, 0, 0);
        player.setClothes(82, 0, 0, 0);
        player.setClothes(4, 1, misc.getRandomInt(0, 15), 0); // Legs
    }
}

function createRandomCheckPoint(player) {
   
    const i = misc.getRandomInt(0, checkPoints.length - 1)
    if (i === player.info.activeJob.activeTree) {
		return createRandomCheckPoint(player);
    }
    hideActiveCheckPoint(player);
    treeMarkersList[i].showFor(player);
    player.info.activeJob.activeTree = i;
    return i;
}

function enteredTreeShape(player) {
    player.stopAnimation();
    player.info.activeJob.collected += misc.getRandomInt(1, 2);
    player.notify(`Du hast ~g~${player.info.activeJob.collected} ~w~Weintraube in deinem Rucksack!`);
    if (player.info.activeJob.collected < 20) {
        return createRandomCheckPoint(player);
    }
    hideActiveCheckPoint(player);
    player.notify("~g~Dein Rucksack ist voll! Bring es zum Stellplatz!");
}


function hideActiveCheckPoint(player) {
    if (typeof player.info.activeJob.activeTree !== "number") return;
    const i = player.info.activeJob.activeTree;
    treeMarkersList[i].hideFor(player);
    player.info.activeJob.activeTree = false;
}


function enteredDropShape(player) {
    player.stopAnimation();
    if (player.info.activeJob.collected === 0) {
        return player.notify(`Dein Rucksack ist leer!`);
    }
    const earnedMoney = player.info.activeJob.collected * 6;
    moneyAPI.changeMoney(player, earnedMoney);
    player.notify(`Du hast verdient ~g~${earnedMoney}$! ~w~Mach so weiter!`);
    misc.log.debug(`${player.name} earned ${earnedMoney}$!`);
    player.info.activeJob.collected = 0;
    if (!player.info.activeJob.activeTree) {
        createRandomCheckPoint(player);
    }
}

function finishWork(player) {
    hideActiveCheckPoint(player);
    player.info.activeJob = {
        name: false,
    };
    player.notify("~g~Du hast den Job beendet!");
    misc.log.debug(`${player.name} finished Wine Collector job!`);
    dropMarker.hideFor(player);
    clothes.loadPlayerClothes(player);
}




mp.events.add(
{
    "playerEnterColshape" : (player, shape) => {
        if (player.vehicle || !player.info) return;
        if (shape === menuShape) {
            player.info.canOpen.WineCollector = true;
            player.notify(`Benutzen Sie ~b~ E ~s~, um den Job zu betreten`);
        }
        else if (player.info.activeJob.name === "Wine Collector" && shape.WineCollectorTree === player.info.activeJob.activeTree) {
            player.playAnimation('anim@mp_snowball', 'pickup_snowball', 1, 47);
            setTimeout(enteredTreeShape, 2400, player);
        }
        else if (shape === dropShape && player.info.activeJob.name === "Wine Collector") {
            player.playAnimation('anim@mp_snowball', 'pickup_snowball', 1, 47);
            setTimeout(enteredDropShape, 2400, player);
        }
    },

    "playerExitColshape" : (player, shape) => {
        if (shape === menuShape) {
            return player.info.canOpen.WineCollector = false;
        }
    },
    
    "sKeys-E" : (player) => {
        if (!player.info || !player.info.loggedIn || !player.info.canOpen.WineCollector) return;
        if (player.info.activeJob.name && player.info.activeJob.name !== "Wine Collector") {
            return player.nofity("Du arbeitest bereits an einem Job!");
        }
        openMainMenu(player);
    },

    "sWineCollectorStartWork" : (player) => {
        startWork(player);
    },

    "sWineCollectorFinishWork" : (player) => {
        finishWork(player);
    },

});






createEntities();