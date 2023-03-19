const express = require("express");
const path = require("path");

const rootDir = require("../util/path");

const adminData = require("./admin");

const Router = express.Router();

Router.get("/", (req, res, next) => {
  //  for simple html-file content
  // console.log("shop.js", adminData.products);
  // res.sendFile(path.join(rootDir, "views", "shop.html"));

  // for pug template content
  const products = adminData.products;
  res.render("shop", {
    prods: products,
    pageTitle: "Shop",
    path: "/",
    hasProducts: products.length > 0,
    activeShop: true,
    productCSS: true,
  });
});

module.exports = Router;
