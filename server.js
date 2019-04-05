var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;
var app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/unit18Populater";
mongoose.Promise=Promise;
mongoose.connect(MONGODB_URI);


// Initialize Express

var exphbs = require("express-handlebars");
// Configure middleware


// Parse request body as JSON



// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/", { useNewUrlParser: true });
mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });
// Routes

// A GET route for scraping the the onion website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("http://www.theonion.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h1").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
        result.summary = $(this)
        .children("p.summary")
        .text();

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  })
//   .catch(function(err) {
//     res.json(err);
//   });

// res.redirect("/");
//   });


// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({}).populate("comments").then(function(data) {
    res.render("index", {articles: data});
  })
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true }),{$push: {comments: dbComment}}.then(function(dbRes) {
        res.redirect("/");
      });
    })
  
  });
  
  app.post("/articles/delete/:id", function (req, res) {
    db.Comment.remove({_id: req.params.id}).then(function (dbRemove) {
      res.json(dbRemove);
    });
  });
  
  app.post("/articles/save/:id", function (req, res) {
    db.Article.findOneAndUpdate({_id: req.params.id}, {saved: true}).then(function (dbRes) {
      res.redirect("/");
    })
  })
  
  app.post("/articles/unsave/:id", function (req, res) {
    db.Article.findOneAndUpdate({_id: req.params.id}, {saved: false}).then(function (dbRes) {
      res.redirect("/");
    })
  })

    // .then(function(dbArticle) {
    //   // If we were able to successfully update an Article, send it back to the client
    //   res.json(dbArticle);
    // })
    // .catch(function(err) {
    //   // If an error occurred, send it to the client
    //   res.json(err);
    // });

app.get("/savedarticles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
    db.Article.find({saved: true}).populate("comments").then(function(data) {
      res.render("saved", {articles: data});
    }).catch(function (err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
