const request = require('request');
const fs = require('fs');

let options = {
    url: 'https://min-api.cryptocompare.com/data/v2/histominute?fsym=ETH&tsym=USD&limit=180&api_key=5dec7fe66779ad98851f91aacca201d83e4fbff441f02a3bce260fbe93c4d987',
}

request(options, dataprocessing);

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

        if (positive > 3 && data < 0) {
            positiveAverageArr.push(positive);
            positive = 0;
        } else if (negative > 3 && data >= 0) {
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

}