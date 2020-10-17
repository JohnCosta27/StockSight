const utilClass = require('./util.js')
const strat1Class = require('./strats/strat1.js');

const util = new utilClass();
const strat1 = new strat1Class();

setInterval(function() {
    util.getCurrentPrice().then(price => {
        
        util.getCandlesRequest(60).then(data => {
            strat1.trade(price, util.getAverageStreaks(util.getCandleDifferences(data)));
        });
        
    });
}, 5000);