"use strict";

var path = require("path");

var express = require("express");

var bodyParser = require("body-parser");

var mongoose = require("mongoose");

var session = require("express-session");

var MongoDBStore = require("connect-mongodb-session")(session);

var csrf = require("csurf");

var flash = require('connect-flash');

var port = 3000;

var errorController = require("./controllers/error");

var User = require("./models/user");

var MONGODB_URI = "mongodb+srv://rohil:ETfOcAwiectKvGtg@cluster0.wyqyer0.mongodb.net/shop";
var app = express(); // used to store and retrieve session data in the specified MongoDB database.

var store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions"
}); // Cross-site-request-forgery protection

var csrfProtection = csrf();
app.set("view engine", "ejs");
app.set("views", "views");

var adminRoutes = require("./routes/admin");

var shopRoutes = require("./routes/shop");

var authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express["static"](path.join(__dirname, "public"))); // set up session handling in an Express.js application with MongoDB session storage

app.use(session({
  secret: "my secret",
  resave: false,
  saveUninitialized: false,
  store: store
})); // middleware for csrf protection

app.use(csrfProtection);
app.use(flash()); // this middleware is used to ensure that user data is available to subsequent middleware functions and
// route handlers in the request-response cycle for authenticated requests.

app.use(function (req, res, next) {
  if (!req.session.user) {
    return next();
  }

  User.findById(req.session.user._id).then(function (user) {
    req.user = user;
    next();
  })["catch"](function (err) {
    return console.log(err);
  });
}); // middleware for checking every routes for csrftoken and logging in or not?

app.use(function (req, res, next) {
  // it allows us to set local veriablea that are passed into the views
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorController.get404);
mongoose.connect(MONGODB_URI).then(function (result) {
  console.log("Connected Successfully!");
  var server = app.listen(port, function () {
    console.log("Example app listening at http://localhost:".concat(port));
  });
  server.on("error", function (error) {
    if (error.code === "EADDRINUSE") {
      console.error("Port ".concat(port, " is already in use"));
    } else {
      console.error("An error occurred: ".concat(error));
    }
  });
})["catch"](function (err) {
  console.log(err);
});