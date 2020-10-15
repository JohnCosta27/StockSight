const request = require('request');
const fs = require('fs');

let options = {
    url: 'https://min-api.cryptocompare.com/data/v2/histominute?fsym=ETH&tsym=USD&limit=60&api_key=5dec7fe66779ad98851f91aacca201d83e4fbff441f02a3bce260fbe93c4d987',
}

let currentPosition = false;
let fakemoney = 500;

let stopLossValue = 0;
let type = 0; //type 1 is the regular buy, type 2 is the short position

let buyPrice = 0;
let lastPrice = 0;

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
    
    for (let i = differenceData.length - 1; i > differenceData.length - 31; i--) {
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
    
    request('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD&api_key=5dec7fe66779ad98851f91aacca201d83e4fbff441f02a3bce260fbe93c4d987', 
    function(error, response, body) {
        
        let currentPrice = JSON.parse(body).USD;

        //trialing between 0.2 and 0.8 for market entry so it does not enter to early or to late 
        if ((averages.marketSwing) >= 4  && averages.positiveAverage * 0.2 < averages.currentStreak && averages.positiveAverage * 0.8 > averages.currentStreak && currentPosition == false) {
            
            //Buy with positive swing
            
            let json = {price: currentPrice, position: "Buy"};
            console.log(json);
            stopLossValue = trailingStopLoss(currentPrice * 0.998, 0);
            currentPosition = true;
            //buyPosition = true
            fakemoney = fakemoney - currentPrice;
            type = 1;
            buyPrice = currentPrice;

            fs.appendFile('moving.txt', JSON.stringify(json)  + "\n", function (err) {
                if (err) throw err;
            });
            
            //trialing between 0.2 and 0.8 for market entry so it does not enter to early or to late 
        } else if ((averages.marketSwing) <= -4  && averages.negativeAverage * 0.2 < Math.abs(averages.currentStreak) && averages.negativeAverage * 0.8 > Math.abs(averages.currentStreak) && currentPosition == false) {
            
            //Short with negative swing
            
            let json = {price: currentPrice, position: "Short"};
            console.log(json);
            stopLossValue = trailingStopLossForShort(currentPrice * 1.002, 0);
            currentPosition = true;
            fakemoney = fakemoney + currentPrice;
            type = 2;
            buyPrice = currentPrice;

            fs.appendFile('moving.txt', JSON.stringify(json)  + "\n", function (err) {
                if (err) throw err;
            }); 
            
        }
        
        /*
            Selling section
        */
        
        if (type == 1) {

            /*
                This is the regular buy position
            */

            if (stopLossValue >= currentPrice && currentPosition == true) {
                
                //Sell the current open (buy) position
                
                fakemoney = fakemoney + currentPrice;
                let json = {price: currentPrice, position: "Sell", money: fakemoney};
                console.log(json);
                currentPosition = false;
                stopLossValue = trailingStopLoss(currentPrice * 0.998, 0);
                
                type = 0;

                fs.appendFile('moving.txt', JSON.stringify(json) + "\n", function (err) {
                    if (err) throw err;
                });
                
            }

            /*
                Might need updating
                This jumps the stop loss to properly stay within the profit windows
            */

            if (currentPrice - buyPrice > 0.0013 * buyPrice) {
                stopLossValue = trailingStopLoss(stopLossValue, 0.0013 * buyPrice);
            }

            /*
                Adjusts the stop loss
            */

           if (lastPrice < currentPrice) {
                stopLossValue = trailingStopLoss(stopLossValue, currentPrice - lastPrice);
            }

        } else if (type == 2) {
            
            /*
                This is the short position
            */

            if (stopLossValue <= currentPrice && currentPosition == true) {
                
                //Sell the current short position

                fakemoney = fakemoney - currentPrice;
                let json = {price: currentPrice, position: "End Short", money: fakemoney};
                console.log(json);
                currentPosition = false;
                stopLossValue = trailingStopLossForShort(currentPrice * 1.002, 0);
                
                type = 0;

                fs.appendFile('moving.txt', JSON.stringify(json)  + "\n", function (err) {
                    if (err) throw err;
                });
                
                
            }
            
            /*
                Might need updating
                This jumps the stop loss to properly stay within the profit windows
            */

           if (buyPrice - currentPrice > 0.0013 * buyPrice) {
                stopLossValue = trailingStopLossForShort(stopLossValue, 0.0013 * buyPrice);
            }

            /*
                Adjusts the stop loss
            */

           if (lastPrice > currentPrice) {
                stopLossValue = trailingStopLossForShort(stopLossValue, lastPrice - currentPrice);
            }

        }
        
        console.log("Current price: " + currentPrice + " | " + "Stop Loss Value: " + stopLossValue);
        lastPrice = currentPrice;

    });
    
}

/*
Only to be ran WHEN AND ONLY WHEN, prices increase, never run on a decrease.
*/

function trailingStopLoss(currentStopLoss, difference) {
    return currentStopLoss + difference;
}


function trailingStopLossForShort(currentStopLoss, difference){
    return currentStopLoss - difference
}