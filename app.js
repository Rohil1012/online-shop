const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");

const port = 3000;

const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URI =
  "mongodb+srv://rohil:ETfOcAwiectKvGtg@cluster0.wyqyer0.mongodb.net/shop";

const app = express();

// used to store and retrieve session data in the specified MongoDB database.
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

// Cross-site-request-forgery protection
const csrfProtection = csrf();

// for image file storage (Add product) configuration

const fileStorage = multer.diskStorage({
  // set the path for storing images
  destination: (req, file, cb) => {
    cb(null, "images");
  },

  // for image name store in images folder
  filename: (req, file, cb) => {
    const currentDate = new Date().toISOString().slice(0, 10);
    const ext = path.extname(file.originalname);
    cb(null, currentDate + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

// set up session handling in an Express.js application with MongoDB session storage
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// middleware for csrf protection
app.use(csrfProtection);
app.use(flash());

// middleware for checking every routes for generate csrftoken and logging in or not?
app.use((req, res, next) => {
  // it allows us to set local veriable that are passed into the views and generate csrfToken
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// this middleware is used to ensure that user data is available to subsequent middleware functions and
// route handlers in the request-response cycle for authenticated requests.
app.use((req, res, next) => {
  // throw new Error("Dummy");
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      // if there is not user then call next directly
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).render(...);
  // res.redirect("/500");
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    console.log("Connected Successfully!");
    const server = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use`);
      } else {
        console.error(`An error occurred: ${error}`);
      }
    });
  })
  .catch((err) => {
    console.log(err);
  });
