const request = require('request-promise');

class utilClass {
    
    getCandleDifferences(body) {
        
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
        
        return differenceArray;
        
    }
    
    getCandlesRequest(timeLimit) {
        return request('https://min-api.cryptocompare.com/data/v2/histominute?fsym=ETH&tsym=USD&limit= ' + timeLimit + '&api_key=5dec7fe66779ad98851f91aacca201d83e4fbff441f02a3bce260fbe93c4d987');
    }
    
    getAverageStreaks(differenceData) {
        
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
        
        //last 45 minutes of market data
        
        for (let i = differenceData.length - 1; i > differenceData.length - 21; i--) {
            if (differenceData[i] > 0) {
                marketSwing++;
            } else {
                marketSwing--;
            }
        }
        
        
        let negativeAverage = total / negativeAverageArr.length;
        
        console.log({positiveAverage: positiveAverage, negativeAverage: negativeAverage, currentStreak: ((direction == -1) ? -streak : streak), marketSwing: marketSwing});

        return {positiveAverage: positiveAverage, negativeAverage: negativeAverage, currentStreak: ((direction == -1) ? -streak : streak), marketSwing: marketSwing};
        
    }
    
    getCurrentPrice() {
        return request('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD&api_key=5dec7fe66779ad98851f91aacca201d83e4fbff441f02a3bce260fbe93c4d987');
    }

    trailingStopLoss(currentStopLoss, difference) {
        return currentStopLoss + difference;
    }
    
    trialingStopLossForShort(currentStopLoss, difference) {
        return currentStopLoss - difference;
    }
    
}

module.exports = utilClass;