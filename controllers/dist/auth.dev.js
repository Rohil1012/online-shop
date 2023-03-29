"use strict";

var User = require("../models/user");

exports.getLogin = function (req, res, next) {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: false
  });
};

exports.postLogin = function (req, res, next) {
  User.findById("64219d979f3c93f38c53ed03").then(function (user) {
    req.session.isLoggedIn = true;
    req.session.user = user;
    req.session.save(function (err) {
      console.log(err);
      res.redirect("/");
    });
  })["catch"](function (err) {
    return console.log(err);
  });
};

exports.postLogout = function (req, res, next) {
  req.session.destroy(function (err) {
    console.log(err);
    res.redirect("/");
  });
};