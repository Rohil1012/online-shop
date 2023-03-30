// For encrypted passwords in the database
const bcrypt = require("bcryptjs");

// Create unique secure random value
const crypto = require("crypto");

const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

require("dotenv").config();
const User = require("../models/user");

// const tarnsporter = nodemailer.createTransport(
//   sendgridTransport({
//     auth: {
//       api_key: process.env.API_KEY
//     },
//   })
// );

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

exports.getLogin = (req, res, next) => {
  // console.log(req.flash("error"));

  // checks if message length is greater than 0 then flash message
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
  });
};

exports.getSignup = (req, res, next) => {
  // checks if message length is greater than 0 then flash message
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.postLogin = (req, res, next) => {
  // Extract the email and password from the request body
  const email = req.body.email;
  const password = req.body.password;

  // Find user by email, if user is not found in database then redirect the login page
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid Email or Password!");
        return res.redirect("/login");
      }
      // if user is found , we want to check hashed password of the user using bcrypt compare method

      // password is extacting from the body and user.password is coming from the database User
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          // if doMatch is true that means password are equal, the user entered the valid password
          if (doMatch) {
            req.session.isLoggedIn = true;
            // user we retrieved from the database and we want to save that session only redirect in that session after we saved it successfully.
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          // else redirect to the login page and give flash message
          req.flash("error", "Invalid Email or Password!");
          res.redirect("/login");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  User.findOne({ email: email })
    // Checks if userDocumnent(User with this email) are already in User database then we do not have to create new user and redirect signup page
    .then((userDoc) => {
      if (userDoc) {
        // console.log("This user is already signed up with this email");
        req.flash(
          "error",
          "Email exists already, please pick a different one!"
        );
        return res.redirect("/signup");
      }

      // else create new user and redirect login page
      // generate hash password value of 12 rounds of encryption
      return (
        bcrypt
          .hash(password, 12)

          // nested Promise for user creation
          .then((hashedPassword) => {
            const user = new User({
              email: email,
              password: hashedPassword,
              cart: { items: [] },
            });
            return user.save();
          })
          .then((result) => {
            res.redirect("/login");
            // return tarnsporter.sendMail({
            //   to: email,
            //   from: "rohilgajera@gmail.com",
            //   subject: "Signup succeeded!",
            //   html: "<h1>You successfully signed up!</h1>",
            // });
            let details = {
              from: "rohilgajera@gmail.com",
              to: email,
              subject: "Signup succeeded!",
              html: "<h1>You successfully signed up!</h1>",
            };
            return transporter.sendMail(details, (err) => {
              if (err) {
                console.log(err);
              } else {
                console.log("Email sent");
              }
            });
          })
          .catch((err) => {
            console.log(err);
          })
      );
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  // generate some 32 random bites
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }

    // create a token from buffer in hexadecimal value to ASCII value character
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email found!");
          return res.redirect("/reset");
        }

        // If user found in database then we assign resetToken and resetTokenExpiration fields to that user.
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        let details = {
          to: req.body.email,
          from: "rohilgajera@gmail.com",
          subject: "Password reset",
          html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
          `,
        };
        return transporter.sendMail(details, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Email sent");
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  // take token from parameters when user click the link
  const token = req.params.token;

  // find token with reset token field and matching with token we have in params and valid from a date perspactive
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      let message = req.flash("error");
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
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  // Extract userid, newpassword and passwordtoken form body
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  // find User and I'll find the user where the resetToken is equal to PasswordToken
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      // Hash pass in the new password we create
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;

      // undefined because now we don't need to store this two fields, this fields are only store when we have to reset the password
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
    });
};
