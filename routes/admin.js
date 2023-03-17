const express = require("express");
const path = require("path");

const rootDir = require("../util/path");

const Router = express.Router();

const products = [];

Router.get("/add-product", (req, res, next) => {
  res.status(200).sendFile(path.join(rootDir, "views", "add-product.html"));
});

Router.post("/product", (req, res, next) => {
  products.push({ title: req.body.title });
  res.status(200).redirect("/");
});

exports.routes = Router;
exports.products = products;
