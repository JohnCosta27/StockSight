const apiKey = "TI4UM493FM7QMUXH"; //API key from alpha vantage, so that we can use their API
const request = require('request');
const fs = require('fs');

request('https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=USD&to_symbol=USD&interval=1min&apikey=' + apiKey, dataManipulation);

request('https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=ETH&to_currency=USD&apikey=' + apiKey, function(error, response, body) {
    console.log(body);
});

function dataManipulation(error, response, body) {
    let startingPoint = body.indexOf('"Meta Data": {') + 14;
    body = body.slice(startingPoint);
    
    console.log(body);

    fs.writeFile("moving.txt", body, function(err) {
        if (err) return console.log(error);
    })

    let hourdiff = [];
    
    let splitBody = body.split("\n");
    splitBody.shift();
    
    let hours = 3;

    for (let i = 901; i < 1080; i = i + 3) {
        hourdiff.push(splitBody[i]);
    }
    
    let numberData = [];
    
    for (let line of hourdiff) {
        numberData.push(line.slice(line.indexOf(": ") + 3, line.length - 1) * 1);
    }

    let differenceData = [];

    for (let i = 1; i < numberData.length; i++) {
        differenceData.push(parseFloat((numberData[i - 1] - numberData[i]).toFixed(4)));
    }

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

        if (positive > 0 && data < 0) {
            positiveAverageArr.push(positive);
            positive = 0;
        } else if (negative > 0 && data >= 0) {
            negativeAverageArr.push(negative);
            negative = 0;
        }

    }

    let total = 0;
    for (let num of positiveAverageArr) {
        total += num;
    }

    let positiveAverage = total / positiveAverageArr.length;

    for (let num of negativeAverageArr) {
        total += num;
    }

    let negativeAverage = total / negativeAverageArr.length;

    console.log("Average Positive Streak: " + positiveAverage);
    console.log("Average Negative Streak: " + negativeAverage);



}