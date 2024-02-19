require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true  });

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: String,
  short_url: Number
});

const Url = mongoose.model("Url", urlSchema);

const saveUrl = function(url, done) {
  Url.findOne({ original_url: url }, function(err, existingUrl) {
    if (err) return console.error(err);
    if (existingUrl) return done(null, existingUrl);

    Url.countDocuments({}, function(err, count) {
      if (err) return console.error(err);
      
      const shortUrlValue = count + 1;
      var newUrl = new Url({ original_url: url, short_url: shortUrlValue });
      newUrl.save(function(err, data) {
        if (err) return console.error(err);
        done(null, data);
      });
    });
  });
};

const findByShortURL = function(short_url, done) {
  Url.find({short_url: short_url}, function (err, urlFound) {
    if (err) return console.log(err);
    
    done(null, urlFound);
  });
}

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const isValidURL = (req, res, next) => {
  const url = req.body.url;

  // Check if URL is provided
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Parse URL to get hostname
  const { hostname } = new URL(url);

  // Perform DNS resolution to check if hostname is reachable
  dns.resolve(hostname, (err) => {
    if (err) {
      return res.send({ error: 'invalid url' });
    }
    // If DNS resolution succeeds, URL is valid
    next();
  });
};

app.route("/api/shorturl/:short_url?")
  .get((req, res) => {
    const shortUrl = req.params.short_url;

    if (!shortUrl || isNaN(parseInt(shortUrl))) return res.status(400).json({ error: 'Invalid short URL format' });

    findByShortURL(shortUrl, function (err, data) {
      if (err) return next(err);
      if (!data) return next({ message: "Missing callback argument" }); 
      
      res.redirect(data[0].original_url);
    });
  })
  .post(isValidURL, (req, res, next) => {
    const url = req.body.url;
    saveUrl(url, function (err, data) {
      if (err) return next(err);
      if (!data) return next({ message: "Missing callback argument" }); 

      res.send({original_url: data.original_url, short_url: data.short_url});
    });
  });

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
