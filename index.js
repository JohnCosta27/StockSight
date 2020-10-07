const apiKey = "TI4UM493FM7QMUXH"; //API key from alpha vantage, so that we can use their API
const request = require('request');
const fs = require('fs');
const { Console } = require('console');

//request('https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=BTC&to_symbol=USD&interval=1min&apikey=' + apiKey, dataManipulation);

/*request('https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=ETH&to_currency=USD&apikey=' + apiKey, function(error, response, body) {
    console.log(body);
});*/

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

        if (first) {
            lastCandle = candle;
            first = false;
        } else {
            differenceArray.push(parseFloat(candle.open - lastCandle.open).toFixed(4) * 1);
            lastCandle = candle;
        }
    
    }

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

    return {positiveAverage: positiveAverage, negativeAverage: negativeAverage, currentStreak: (positive > 0) ? positive : -negative}

}

function movingDiffStrat(averages) { 

}