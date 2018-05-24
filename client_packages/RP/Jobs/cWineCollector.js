"use strict"

const misc = require('/RP/cMisc');
const player = mp.players.local;


mp.events.add(
{
    "cWineCollectorStartCef" : () => {
        misc.prepareToCef();
        misc.openCef("package://RP/Browsers/Jobs/WineCollector/collector.html");
    },

    "cWineCollectorStartWork" : () => {
        mp.events.callRemote('sWineCollectorStartWork');
    },

    "cWineCollectorFinishCef" : (inject) => {
        misc.prepareToCef();
        misc.openCef("package://RP/Browsers/Jobs/WineCollector/collector.html");
        misc.injectCef(inject);
    },

    "cWineCollectorFinishWork" : () => {
        mp.events.callRemote('sWineCollectorFinishWork');
    },
    
});       



