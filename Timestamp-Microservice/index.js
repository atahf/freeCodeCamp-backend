// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/:date?", (req, res, next) => {
    const param = req.params.date;
    let date = new Date();

    req.bad_date = false;

    if(param) {
      if (!isNaN(param)) {
        date = new Date(parseInt(param));
      } else if (Date.parse(param)) {
        date = new Date(param);
      } else {
        req.bad_date = true;
      }
    }

    req.unix = date.valueOf();
    req.utc = date.toUTCString();

    next();
  }, (req, res) => {
    if(req.bad_date) {
      res.send({ error : "Invalid Date" });
    }

    res.send({
      unix: req.unix,
      utc: req.utc
    });
})


// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
