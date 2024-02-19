require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true  });
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  count: 0,
  log: [{
    description: String,
    duration: Number,
    date: Date
  }]
});
const User = mongoose.model("User", userSchema);

const addUser = function(username, done) {
  User.findOne({ username: username }, function(err, existingUser) {
    if (err) return console.error(err);
    if (existingUser) return done(null, existingUser);

    var newUser = new User({ username: username, log: [], count: 0 });
    newUser.save(function(err, data) {
      if (err) return console.error(err);
      done(null, data);
    });
  });
};

const addExercise = function(userId, newExercise, done) {
  User.findById(userId, function(err, userFound) {
    if (err) return console.log(err);

    userFound.log.push(newExercise);
    userFound.count = userFound.count + 1;
    userFound.save(function(err, data) {
      if (err) return console.error(err);

      done(null, data);
    });
  });
}

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  addUser(username, function (err, data) {
    if (err) return next(err);
    if (!data) return next({ message: "user null" }); 

    res.send({username: data.username, _id: data._id});
  });
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, 'username _id'); // Fetch only username and _id fields
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  try {
    const { from, to, limit } = req.query;
    const user = await User.findById(req.params._id); // Fetch only username and _id fields
    let newLogs = []
    user.log.forEach(element => {
      let push = true;
      if(from && new Date(from) > element.date) {
        push = false;
      }

      if(to && new Date(to) < element.date) {
        push = false;
      }

      if(limit && newLogs.length >= parseInt(limit)) {
        push = false;
      }

      if(push) {
        newLogs.push({
          description: element.description,
          duration: element.duration,
          date: element.date.toLocaleDateString('en-US', options).replaceAll(',', '')
        });
      }
    });
    
    res.send({_id: user._id, username: user.username, count: user.count, log: newLogs});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const { _id } = req.params;
  let { description, duration, date } = req.body;
  duration = parseInt(duration);
  
  if(!date) {
    date = new Date();
  } else {
    date = new Date(date);
  }

  addExercise(_id, { description, duration, date }, function (err, data) {
    if (err) return next(err);
    if (!data) return next({ message: "Missing callback argument" }); 

    const options = { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options).replaceAll(',', '');

    res.json({
      _id: data._id,
      username: data.username,
      date: formattedDate,
      duration: duration,
      description: description
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
