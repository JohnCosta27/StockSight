const request = require('request');
const fs = require('fs');

let options = {
    url: 'https://min-api.cryptocompare.com/data/v2/histominute?fsym=ETH&tsym=USD&limit=60&api_key=5dec7fe66779ad98851f91aacca201d83e4fbff441f02a3bce260fbe93c4d987',
}

request(options, dataprocessing);

let purchases = [];
let currentPosition = false;
let fakemoney = 500;

let stopLossValue = 0;
let lastPrice = 0;
let started = false;

/*
Notes:
The last item in the array is the closest to us in minutes.
*/

master();

function master() {
    setInterval(function() {
        request(options, dataprocessing); 
    }, 5000);
}

function dataprocessing(error, response, body) {
    
    let json = JSON.parse(body);
    
    let candles = json.Data.Data;
    
    let differenceArray = [];
    let first = true;
    let lastCandle = {};
    
    for (let candle of candles) {
        if (first) {
            lastCandle = candle;
            first = false;
        } else {
            differenceArray.push(parseFloat(candle.open - lastCandle.open).toFixed(4) * 1);
            lastCandle = candle;
        }
        
    }
    
    movingDiffStrat(calculateAverageStreaks(differenceArray));
    console.log(calculateAverageStreaks(differenceArray));
    
}

function calculateAverageStreaks(differenceData) {
    
    let positive = 0;
    let negative = 0;
    let positiveAverageArr = [];
    let negativeAverageArr = [];
    
    for (let data of differenceData) {
        
        if (data >= 0) {
            positive++;
        } else {
            negative++
        } 
        
        if (positive >= 3 && data < 0) {
            positiveAverageArr.push(positive);
            positive = 0;
        } else if (negative >= 3 && data >= 0) {
            negativeAverageArr.push(negative);
            negative = 0;
        }
        
    }
    
    let streak = 1;
    let direction = 0;
    for (let i = differenceData.length - 1; i >= 0; i--) {
        
        
        if (direction == 0) {
            if (differenceData[i] >= 0) {
                direction = 1;
            } else {
                direction = -1;
            }
        } else if (direction == -1) {
            if (differenceData[i] < 0) streak++
            else i = -1;
        } else {
            if (differenceData[i] >= 0) streak++
            else i = -1;
        }
        
    }
    
    if (positive > 0) positiveAverageArr.push(positive)
    else negativeAverageArr.push(negative);
    
    let total = 0;
    for (let num of positiveAverageArr) {
        total += num;
    }
    
    let positiveAverage = total / positiveAverageArr.length;
    
    for (let num of negativeAverageArr) {
        total += num;
    }
    
    //Calculate market swing value
    
    let marketSwing = 0;
    
    for (let i = differenceData.length - 1; i > differenceData.length - 16; i--) {
        if (differenceData[i] > 0) {
            marketSwing++;
        } else {
            marketSwing--;
        }
    }
    
    
    let negativeAverage = total / negativeAverageArr.length;
    
    return {positiveAverage: positiveAverage, negativeAverage: negativeAverage, currentStreak: ((direction == -1) ? -streak : streak), marketSwing: marketSwing};
    
}

function movingDiffStrat(averages) { 
    
    //Pull current price.
    //If it hits our losing average, buy
    //Store the initial buy price.
    //Calculate stop loss value
    //Wait 1 min
    //Check price, if it hits stop loss value, sell, else. Wait 1 min
    //Go to line 4
    
    request('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD&api_key=5dec7fe66779ad98851f91aacca201d83e4fbff441f02a3bce260fbe93c4d987', function(error, response, body) {
    
    let currentPrice = JSON.parse(body).USD;
    
    if (!started) {
        lastPrice = currentPrice;
        started = true;
        stopLossValue = trailingStopLoss(currentPrice * 0.998, 0);
    } else {
        
        if (lastPrice < currentPrice) {
            //Increased, change stoploss
            stopLossValue = trailingStopLoss(stopLossValue, currentPrice - lastPrice);
            lastPrice = currentPrice;
        }
        
    }
    
    console.log("Current price: " + currentPrice + " | " + "Stop Loss Value: " + stopLossValue);
    
    if (Math.abs(averages.marketSwing) > 0.8 * averages.negativeAverage && averages.marketSwing < 0 && currentPosition == false) {
        //Buy
        let json = {price: currentPrice, position: "Buy"};
        console.log(json);
        purchases.push(json);
        stopLossValue = trailingStopLoss(currentPrice * 0.998, 0);
        currentPosition = true;
        fakemoney = fakemoney - currentPrice;
        
        fs.appendFile('moving.txt', JSON.stringify(json), function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
        
    }
    
    if (stopLossValue >= currentPrice && currentPosition == true) {
        //sell
        fakemoney = fakemoney + currentPrice;
        let json = {price: currentPrice, position: "Sell", money: fakemoney};
        console.log(json);
        purchases.push(json);
        currentPosition = false;
        stopLossValue = trailingStopLoss(currentPrice * 0.998, 0);
        
        fs.appendFile('moving.txt', JSON.stringify(json), function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
    }
    
    lastPrice = currentPrice;
    
});


}

/*
Only to be ran WHEN AND ONLY WHEN, prices increase, never run on a decrease.
*/

function trailingStopLoss(currentStopLoss, difference) {
    return currentStopLoss + difference;
}