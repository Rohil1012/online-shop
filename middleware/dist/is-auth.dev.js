"use strict";

// Used in Routes files directly add is-auth
module.exports = function (req, res, next) {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }

  next();
};