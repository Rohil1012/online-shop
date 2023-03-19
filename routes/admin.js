const express = require("express");
const path = require("path");

const rootDir = require("../util/path");

const Router = express.Router();

const products = [];

// /admin/add-product => GET
Router.get("/add-product", (req, res, next) => {
  // res.status(200).sendFile(path.join(rootDir, "views", "add-product.html"));

  res.render("add-product", {
    pageTitle: "Add Product",
    path: "/add-product",
    formsCSS: true,
    productCSS: true,
    activeAddProduct: true,
  });
});

// add-product => POST

Router.post("/add-product", (req, res, next) => {
  products.push({ title: req.body.title });
  res.status(200).redirect("/");
});

exports.routes = Router;
exports.products = products;
