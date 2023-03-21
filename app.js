const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const errorController = require("./controllers/error");

const port = 3000;

const app = express();

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

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.getError);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
