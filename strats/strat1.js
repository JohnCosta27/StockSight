const utilClass = require('../util.js');
const fs = require('fs');
let util = new utilClass();

class strat1Class {
    
    constructor(money) {
        
        this.money = money;
        this.openPosition = false;
        this.jump = false;
        this.stopLossValue = 0;
        this.buyPrice = 0;
        this.lastPrice = 0;
        this.maxValueForStopLoss = 0;
        
    }
    
    trade(price, averages) {
        
        let currentPrice = JSON.parse(price).USD;
        
        //trialing between 0.2 and 0.8 for market entry so it does not enter to early or to late 
        if (averages.marketSwing >= 2  && averages.positiveAverage * 0.2 < averages.currentStreak && averages.positiveAverage > averages.currentStreak && this.openPosition == false) {
            
            //Buy with positive swing
            
            let json = {price: currentPrice, position: "Buy"};
            console.log(json);
            this.stopLossValue = util.trailingStopLoss(currentPrice * 0.998, 0);
            this.openPosition = true;
            this.money = this.money - currentPrice;
            this.buyPrice = currentPrice;
            
            fs.appendFile('./moving.txt', JSON.stringify(json)  + "\n", function (err) {
                if (err) throw err;
            });
            
            //trialing between 0.2 and 0.8 for market entry so it does not enter to early or to late 
        }
        
        /*
        Selling section
        */
        
        if (this.stopLossValue >= currentPrice && this.openPosition == true) {
            
            //Sell the current open (buy) position
            
            this.money = this.money + currentPrice;
            let json = {price: currentPrice, position: "Sell", money: this.money};
            console.log(json);
            this.openPosition = false;
            this.jump = false;
            this.stopLossValue = util.trailingStopLoss(currentPrice * 0.998, 0);
            
            fs.appendFile('./moving.txt', JSON.stringify(json) + "\n", function (err) {
                if (err) throw err;
            });
            
        }
        
        /*
        Might need updating
        This jumps the stop loss to properly stay within the profit windows
        */
        
        if (currentPrice - this.buyPrice > 0.0013 * this.buyPrice && this.jump == false) {
            this.stopLossValue = util.trailingStopLoss(this.stopLossValue, 0.0013 * this.buyPrice);
            this.jump = true 
        }
        
        /*
        Adjusts the stop loss
        */
        
        if (currentPrice > this.maxValueForStopLoss) {
            this.stopLossValue = util.trailingStopLoss(this.stopLossValue, currentPrice - this.lastPrice)
            this.maxValueForStopLoss = currentPrice
        }
        
        
        console.log("Current price: " + currentPrice + " | " + "Stop Loss Value: " + this.stopLossValue);
        this.lastPrice = currentPrice;
        
    }
    
}

module.exports = strat1Class;