const utilClass = require('./util.js')
const strat1Class = require('./strats/strat1.js');
const WebSocket = require('ws');

const util = new utilClass();
const strat1 = new strat1Class();

/*setInterval(function() {
    util.getCurrentPrice().then(price => {
        
        util.getCandlesRequest(60).then(data => {
            strat1.trade(price, util.getAverageStreaks(util.getCandleDifferences(data)));
        });
        
    });
}, 5000);*/

let connection = new WebSocket("wss://stream.binance.com:9443/ws/ethusdt@trade");

connection.onmessage = function (event) {
    console.log(event.data);
}