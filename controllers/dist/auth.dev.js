"use strict";

// For encrypted passwords in the database
var bcrypt = require("bcryptjs"); // Create unique secure random value


var crypto = require("crypto");

var nodemailer = require("nodemailer");

var sendgridTransport = require("nodemailer-sendgrid-transport");

require("dotenv").config();

var User = require("../models/user"); // const tarnsporter = nodemailer.createTransport(
//   sendgridTransport({
//     auth: {
//       api_key: process.env.API_KEY
//     },
//   })
// );


var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

exports.getLogin = function (req, res, next) {
  // console.log(req.flash("error"));
  // checks if message length is greater than 0 then flash message
  var message = req.flash("error");

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message
  });
};

exports.getSignup = function (req, res, next) {
  // checks if message length is greater than 0 then flash message
  var message = req.flash("error");

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message
  });
};

exports.postLogout = function (req, res, next) {
  req.session.destroy(function (err) {
    console.log(err);
    res.redirect("/");
  });
};

exports.postLogin = function (req, res, next) {
  // Extract the email and password from the request body
  var email = req.body.email;
  var password = req.body.password; // Find user by email, if user is not found in database then redirect the login page

  User.findOne({
    email: email
  }).then(function (user) {
    if (!user) {
      req.flash("error", "Invalid Email or Password!");
      return res.redirect("/login");
    } // if user is found , we want to check hashed password of the user using bcrypt compare method
    // password is extacting from the body and user.password is coming from the database User


    bcrypt.compare(password, user.password).then(function (doMatch) {
      // if doMatch is true that means password are equal, the user entered the valid password
      if (doMatch) {
        req.session.isLoggedIn = true; // user we retrieved from the database and we want to save that session only redirect in that session after we saved it successfully.

        req.session.user = user;
        return req.session.save(function (err) {
          console.log(err);
          res.redirect("/");
        });
      } // else redirect to the login page and give flash message


      req.flash("error", "Invalid Email or Password!");
      res.redirect("/login");
    })["catch"](function (err) {
      console.log(err);
      res.redirect("/login");
    });
  })["catch"](function (err) {
    return console.log(err);
  });
};

exports.postSignup = function (req, res, next) {
  var email = req.body.email;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  User.findOne({
    email: email
  }) // Checks if userDocumnent(User with this email) are already in User database then we do not have to create new user and redirect signup page
  .then(function (userDoc) {
    if (userDoc) {
      // console.log("This user is already signed up with this email");
      req.flash("error", "Email exists already, please pick a different one!");
      return res.redirect("/signup");
    } // else create new user and redirect login page
    // generate hash password value of 12 rounds of encryption


    return bcrypt.hash(password, 12) // nested Promise for user creation
    .then(function (hashedPassword) {
      var user = new User({
        email: email,
        password: hashedPassword,
        cart: {
          items: []
        }
      });
      return user.save();
    }).then(function (result) {
      res.redirect("/login"); // return tarnsporter.sendMail({
      //   to: email,
      //   from: "rohilgajera@gmail.com",
      //   subject: "Signup succeeded!",
      //   html: "<h1>You successfully signed up!</h1>",
      // });

      var details = {
        from: "rohilgajera@gmail.com",
        to: email,
        subject: "Signup succeeded!",
        html: "<h1>You successfully signed up!</h1>"
      };
      return transporter.sendMail(details, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Email sent");
        }
      });
    })["catch"](function (err) {
      console.log(err);
    });
  })["catch"](function (err) {
    console.log(err);
  });
};

exports.getReset = function (req, res, next) {
  var message = req.flash("error");

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message
  });
};

exports.postReset = function (req, res, next) {
  // generate some 32 random bites
  crypto.randomBytes(32, function (err, buffer) {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    } // create a token from buffer in hexadecimal value to ASCII value character


    var token = buffer.toString("hex");
    User.findOne({
      email: req.body.email
    }).then(function (user) {
      if (!user) {
        req.flash("error", "No account with that email found!");
        return res.redirect("/reset");
      } // If user found in database then we assign resetToken and resetTokenExpiration fields to that user.


      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      return user.save();
    }).then(function (result) {
      res.redirect("/");
      var details = {
        to: req.body.email,
        from: "rohilgajera@gmail.com",
        subject: "Password reset",
        html: "\n            <p>You requested a password reset</p>\n            <p>Click this <a href=\"http://localhost:3000/reset/".concat(token, "\">link</a> to set a new password.</p>\n          ")
      };
      return transporter.sendMail(details, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Email sent");
        }
      });
    })["catch"](function (err) {
      console.log(err);
    });
  });
};

exports.getNewPassword = function (req, res, next) {
  // take token from parameters when user click the link
  var token = req.params.token; // find token with reset token field and matching with token we have in params and valid from a date perspactive

  User.findOne({
    resetToken: token,
    resetTokenExpiration: {
      $gt: Date.now()
    }
  }).then(function (user) {
    var message = req.flash("error");

    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    res.render("auth/new-password", {
      path: "/new-password",
      pageTitle: "New Password",
      errorMessage: message,
      // we send user-id with newpassword.ejs and passwordToken (That is token Which I had Extracting from URL) also
      userId: user._id.toString(),
      passwordToken: token
    });
  })["catch"](function (err) {
    console.log(err);
  });
};

exports.postNewPassword = function (req, res, next) {
  // Extract userid, newpassword and passwordtoken form body
  var newPassword = req.body.password;
  var userId = req.body.userId;
  var passwordToken = req.body.passwordToken;
  var resetUser; // find User and I'll find the user where the resetToken is equal to PasswordToken

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: {
      $gt: Date.now()
    },
    _id: userId
  }).then(function (user) {
    // Hash pass in the new password we create
    resetUser = user;
    return bcrypt.hash(newPassword, 12);
  }).then(function (hashedPassword) {
    resetUser.password = hashedPassword; // undefined because now we don't need to store this two fields, this fields are only store when we have to reset the password

    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save();
  }).then(function (result) {
    res.redirect("/login");
  })["catch"](function (err) {
    console.log(err);
  });
};