//Dependencies
const express    = require('express');
const mustache   = require('mustache-express');
const session    = require('express-session');
const bodyparser = require('body-parser');
const cheerio    = require('cheerio');
const fs         = require('fs');
const path       = require('path');
const mysql      = require('promise-mysql');
const mv         = require('mv');
const fileUpload = require('express-fileupload');

const server     = express();

//Server configure
server.engine('mustache', mustache());
server.set('views', './views');
server.set('view engine', 'mustache');
server.use(bodyparser.urlencoded( { extended: false }));
server.use(express.static('public'));
server.use(session({
    secret: '98rncailevn-_DT83FZ@',
    resave: false,
    saveUninitialized: true
}));
server.use(fileUpload());

//Database configurations
const db = mysql.createConnection({
  host: "localhost",
  user: "username",
  password: "password",
  database: "Markup"
});

//GET REQUESTS
server.get('/', function(request, response) {
  response.render('welcome');
})

server.get('/main', function(request, response) {
  if (request.session.who !== undefined) {
    let connection;
    let scores;
    let avgScores;

    db.then(function(conn) {
      connection = conn;
      let results = connection.query('SELECT `*` FROM Scores');
      return results;
    }).then(function(rows) {
      scores = rows;
    }).then(function() {
      let avgResults = connection.query('SELECT `unique_id`, AVG(`score`) FROM Scores GROUP BY `unique_id`');
      return avgResults;
    }).then(function(avgRows) {
      let stringAvgRows;
      let newStringAvgRows;
      let finalJson;
      let finalJsonArray = [];

      for (let i = 0; i < avgRows.length; i++) {
        stringAvgRows = JSON.stringify(avgRows[i]);
        newStringAvgRows = stringAvgRows.replace('AVG(`score`)', 'score');
        finalJson = JSON.parse(newStringAvgRows);
        finalJsonArray.push(finalJson);
      }
      response.render('main', {
        currentUser: request.session.who.username,
        allScores: finalJsonArray,
        allScoresLine: "Average scores by users :"
      })
    })
  } else {
  response.redirect('/');
  }
})

//POST REQUESTS
server.post('/main', function(request, response) {
  let username = request.body.username;
  let password = request.body.password;

  if (username === '' || password === '') {
    response.redirect('/');
  } else {
    db.then(function(conn) {
      let result = conn.query('SELECT `username` FROM Users WHERE `username`="' + username + '" AND `password`="' + password + '"');
      return result;
    }).then(function(rows) {
      if (rows.length == 0) {
        response.render('welcome', { failed: "Username or password not found. Please try again."});
      } else {
        request.session.who = rows[0];
        response.redirect('/main');
        }
      })
    }
})

server.post('/sort', function(request, response) {
    if (request.session.who !== undefined) {
      if (request.body.sorttype === 'highToLow') {
        db.then(function(conn) {
          connection = conn;
          let results = connection.query('SELECT `*` from Scores ORDER BY `score` DESC')
          return results;
        }).then(function(rows) {
          console.log(rows);
          response.render('main', {
            allScoresLine : "Sort results : ",
            allScores: rows,
            currentUser : request.session.who.username
          })
        })
      } else if (request.body.sorttype === 'lowToHigh') {
        db.then(function(conn) {
          connection = conn;
          let results = connection.query('SELECT `*` from Scores ORDER BY `score` ASC')
          return results;
        }).then(function(rows) {
          response.render('main', {
            allScoresLine : "Sort results : ",
            allScores: rows,
            currentUser : request.session.who.username,
          })
        })
      }
    } else {
      response.redirect('/');
    }
})

server.post('/search', function(request, response) {
  if (request.session.who !== undefined) {
    if (request.body.search === '') {
      response.redirect('/main');
    } else {
      db.then(function(conn) {
        connection = conn;
        let results = connection.query('SELECT * from Scores WHERE `unique_id` = "' + request.body.search + '"');
        return results;
      }).then(function(rows) {
        if (rows.length === 0) {
          response.render('main', {
            noResults: "Sorry, we can't find any scored HTML that matches your search.",
            currentUser: request.session.who.username
          })
        } else {
          response.render('main', {
            allScoresLine : "Search results : ",
            allScores: rows,
            currentUser : request.session.who.username,
          })
        }
      })
    }
  } else {
    response.redirect('/');
  }
})

server.post('/filter', function(request, response) {
  if (request.session.who !== undefined) {
    if (request.body.daterange === '') {
      response.redirect('/main');
    } else {

      let splitDate = request.body.daterange.split(" - ");
      let firstDate =  splitDate[0];
      let secondDate = splitDate[1];

      db.then(function(conn) {
        connection = conn;
        let results = connection.query('SELECT * from Scores WHERE `created_at` BETWEEN "' + firstDate + '" and "' + secondDate + '"');
        return results;
      }).then(function(rows) {
        if (rows.length === 0) {
          response.render('main', {
            noResults: "Sorry, we can't find any scored HTML that matches your search.",
            currentUser: request.session.who.username
          })
        } else {
          response.render('main', {
            allScoresLine : "Filter results : ",
            allScores: rows,
            currentUser : request.session.who.username,
          })
        }
      })
    }
    response.redirect('/main');
  } else {
    response.redirect('/');
  }
})


server.post('/score', function (request, response) {
  if (request.session.who !== undefined) {
      if (!request.files) {
        response.render('main', {
          needFile: "Please choose a file to score.",
          currentUser: request.session.who.username
        })
      }
      if (request.files) {
        let uneditedFileToScore = request.files.htmlFile;
        let fileToScore;

        let currentDate = new Date();
        let yyyy = currentDate.getFullYear();
        let mm = currentDate.getMonth()+1;
        let dd = currentDate.getDate();

        if(dd < 10) { dd = '0'+dd; }
        if(mm < 10) { mm = '0'+mm; }

        currentDate = yyyy + '_' + mm + '_' + dd;

        let filePath = './data/' + request.session.who.username + '_' + currentDate + '.html'

        uneditedFileToScore.mv(filePath, function(err) {
          if (err) {
            return response.status(500).send(err);
          }

        });
      }
      fs.readdir('./data', function(err, items) {
      let htmlString;
        for (var i=0; i<items.length; i++) {
            let tempArray = items[i].split('.');
            let newString = tempArray[0];

            if (tempArray[1] === 'html') {
              htmlString = fs.readFileSync('./data/' + items[i], 'utf-8').toLowerCase();
              let $ = cheerio.load(htmlString);
              let count = 0;

              count += $('div').get().length*3;
              count += $('font').get().length*(-1);
              count += $('p').get().length*1;
              count += $('center').get().length*(-2);
              count += $('h1').get().length*3;
              count += $('big').get().length*(-2);
              count += $('h2').get().length*2;
              count += $('strike').get().length*(-1);
              count += $('html').get().length*5;
              count += $('tt').get().length*(-2);
              count += $('body').get().length*5;
              count += $('frameset').get().length*(-5);
              count += $('header').get().length*10;
              count += $('frame').get().length*(-5);
              count += $('footer').get().length*10;

              let newTempArray = newString.split('_');
              let uniqueId = newTempArray[0];
              let date = newTempArray[1] + '-' + newTempArray[2] + '-' + newTempArray[3];

              db.then(function(conn) {
                connection = conn;
                console.log('INSERT INTO Scores (`unique_id`, `score`, `created_at`) VALUES ("' + uniqueId + '", "' + count + '", "' + date + '")');
                connection.query('INSERT INTO Scores (`unique_id`, `score`, `created_at`) VALUES ("' + uniqueId + '", "' + count + '", "' + date + '")');
              })

              mv('./data/' + items[i], './data/scored/' + items[i], function(err) { console.log(err); });
            }
        }
      });
    response.redirect('/main');
  } else {
    response.redirect('/');
  }
});

server.post('/logout', function(request, response) {
  request.session.destroy(function() {
    response.render('welcome', {
      loggedOut : "You've been logged out. Please sign in to use the app."
    })
  });
})

//LISTEN
server.listen(3000, function() {
  console.log("Server is runnin!");
})
