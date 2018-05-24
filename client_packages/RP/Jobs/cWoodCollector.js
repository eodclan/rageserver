"use strict"

const misc = require('/RP/cMisc');
const player = mp.players.local;


mp.events.add(
{
    "cWoodCollectorStartCef" : () => {
        misc.prepareToCef();
        misc.openCef("package://RP/Browsers/Jobs/WoodCollector/collector.html");
    },

    "cWoodCollectorStartWork" : () => {
        mp.events.callRemote('sWoodCollectorStartWork');
    },

    "cWoodCollectorFinishCef" : (inject) => {
        misc.prepareToCef();
        misc.openCef("package://RP/Browsers/Jobs/WoodCollector/collector.html");
        misc.injectCef(inject);
    },

    "cWoodCollectorFinishWork" : () => {
        mp.events.callRemote('sWoodCollectorFinishWork');
    },
    
});       



