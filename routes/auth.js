const express = require("express");

const { check, body } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
    body("password", "Password has to be valid.")
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);

router.post(
  "/signup",
  [
    // validation of email using check function and then we call the method isEmail for validation
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")

      // We use custom method is tells the user that this is a email address type we want and already exist or not
      .custom((value, { req }) => {
        return (
          User.findOne({ email: value })
            // Checks if userDocumnent(User with this email) are already in User database then we do not have to create new user and retun reject promise with error message
            .then((userDoc) => {
              if (userDoc) {
                return Promise.reject(
                  "Email exists already, please pick a different one!"
                );
              }
            })
        );
      })
      .normalizeEmail(),

    // For password is valid
    body(
      "password",
      // Defalut error msg for all validators we don't need to write in every validator withMessage...
      "Please enter a password with only numbers and text and at least 5 characters."
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),

    // For confirm password is match with password check
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords have to match!");
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
