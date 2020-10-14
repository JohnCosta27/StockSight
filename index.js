const request = require('request');
const fs = require('fs');

let options = {
    url: 'https://min-api.cryptocompare.com/data/v2/histominute?fsym=ETH&tsym=USD&limit=180&api_key=5dec7fe66779ad98851f91aacca201d83e4fbff441f02a3bce260fbe93c4d987',
}

request(options, dataprocessing);

let money = 100;

/*
Notes:
The last item in the array is the closest to us in minutes.
*/

function dataprocessing(error, response, body) {
    
    let json = JSON.parse(body);
    
    let candles = json.Data.Data;
    
    let differenceArray = [];
    let first = true;
    let lastCandle = {};
    
    for (let candle of candles) {
        //console.log(candle.open);
        if (first) {
            lastCandle = candle;
            first = false;
        } else {
            differenceArray.push(parseFloat(candle.open - lastCandle.open).toFixed(4) * 1);
            lastCandle = candle;
        }
        
    }
    
    for (let num of differenceArray) console.log(num);
    
    //movingDiffStrat(calculateAverageStreaks(differenceArray));
    
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
    
    let negativeAverage = total / negativeAverageArr.length;

    return {positiveAverage: positiveAverage, negativeAverage: negativeAverage, currentStreak: ((direction == -1) ? -streak : streak)};
    
}

function movingDiffStrat(averages) { 
    
    //Pull current price.
    //If it hits our losing average, buy
    //Store the initial buy price.
    //Calculate stop loss value
    //Wait 1 min
    //Check price, if it hits stop loss value, sell, else. Wait 1 min
    //Go to line 4

    let stopLossValue = 0;
    let lastPrice = 0;
    let started = false;

    setInterval(function() {
        request('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD&api_key=5dec7fe66779ad98851f91aacca201d83e4fbff441f02a3bce260fbe93c4d987', function(error, response, body) {
        

        let currentPrice = JSON.parse(body).USD;

        if (!started) {
            lastPrice = currentPrice;
            started = true;
            stopLossValue = trailingStopLoss(currentPrice);
        } else {
            
            if (lastPrice < currentPrice) {
                //Increased, change stoploss
                stopLossValue = trailingStopLoss(currentPrice);
            }
            
        }
        
        console.log("Current price: " + currentPrice + " | " + "Stop Loss Value: " + stopLossValue);

        if (counter > 0.8 * averages.negativeAverage) {
            //Buy
        }

        if (stopLossValue >= currentPrice) {
            //Sell
        }
        
        lastPrice = currentPrice;
        
        });
    }, 5000);


}

/*
Only to be ran WHEN AND ONLY WHEN, prices increase, never run on a decrease.
*/

function trailingStopLoss(currentPrice) {
    
    let stopValue = 1;
    let n = 0.003;

    stopValue = currentPrice * (1 - n);
    
    return stopValue;
    
}