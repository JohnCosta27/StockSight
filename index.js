const apiKey = "TI4UM493FM7QMUXH"; //API key from alpha vantage, so that we can use their API
const alpha = require('alphavantage')({key: apiKey});

alpha.data.intraday('NDAQ', 'compact', 'json', '60min').then(data => {
    console.log(data);
});