const utilClass = require('./util.js')
const strat1Class = require('./strats/strat1.js');
const WebSocket = require('ws');
const fs = require('fs');

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

let highest = 0;
let lowest = 99999999;
let ageHighest = 0;
let ageLowest = 0;

let money = 100; 
let eth = 0;
let profit = 0;
let buyPrice = 0;

let endTime = Date.now() + 10000;

connection.onmessage = function (event) {
    
    let data = JSON.parse(event.data);
    let price = data.p;
    
    //Get highs and lows and how old they are.
    //{High: ###, ageHigh: ###, Low: ###, ageLow: ###, price: ###}
    
    if (price >= highest) {
        highest = price;
        ageHighest = 0;
    }
    
    if (price <= lowest) {
        lowest = price;
        ageLowest = 0;
    }
    
    ageHighest++;
    ageLowest++;
    
    if (Date.now() >= endTime) {
        
        if (eth == 0) {
            
            if (ageHighest < ageLowest) {
                eth = money / price;
                money = 0;
                buyPrice = price;
                console.log("Bought at: " + price);
                console.log("-----------");
            }

        } else {
            
            if (price <= buyPrice * 0.999 || price >= buyPrice * 1.0015) {
                
                profit += eth * (price - buyPrice);
                money = eth * price;
                eth = 0;
                
                console.log("Sold at: " + price);
                console.log("Profit: "+ profit)
                console.log("-----------");
                
            }
            
        }
        
        let outputData = {high: highest, ageHighest: ageHighest, low: lowest, ageLow: ageLowest, price: price};
        endTime = Date.now() + 10000;
        highest = 0;
        lowest = 99999999;
        ageHighest = 0;
        ageLowest = 0;
        prices = [];
        fs.appendFile('./moving.txt', JSON.stringify(outputData)  + "\n", function (err) {
            if (err) throw err;
        });
        
    }
    
}