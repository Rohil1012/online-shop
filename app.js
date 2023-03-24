const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

const errorController = require("./controllers/error");
const sequelize = require("./util/database");
const Product = require("./models/product");
const User = require("./models/user");

const app = express();

const port = 3000;

// If we have to use handlebars files then simply pass hbs view engine to express --------------------------------------------

// const expressHbs = require("express-handlebars");

// app.engine(
//   "hbs",
//   expressHbs({
//     layoutsDir: "views/layouts/",
//     defaultLayout: "main-layout",
//     extname: "hbs",
//   })
// );
// app.set("view engine", "hbs");

// If we have to use pug files then simply pass pug view engine to express --------------------------------------------
// app.set("view engine", "pug");
// app.set("views", "views");

// If we have to use EJS files then simply pass EJS view engine to express --------------------------------------------

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  User.findByPk(1)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
User.hasMany(Product);

sequelize
  // .sync({ force: true })
  .sync()
  .then((result) => {
    return User.findByPk(1);
    // console.log(result);
  })
  .then((user) => {
    if (!user) {
      return User.create({ name: "Rohil", email: "rohil@gmail.com" });
    }
    return user;
  })
  .then((user) => {
    // console.log(user);
    app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

// if server error occured,
// server.on("error", (error) => {
//   if (error.code === "EADDRINUSE") {
//     console.error(`Port ${port} is already in use`);
//   } else {
//     console.error(`An error occurred: ${error}`);
//   }
// });