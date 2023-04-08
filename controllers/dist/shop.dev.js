"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var fs = require("fs");

var path = require("path"); // require("dotenv").config();


var stripe = require("stripe")(process.env.STRIPE_PVT_KEY);

var PDFDocument = require("pdfkit");

var Product = require("../models/product");

var Order = require("../models/order");

var ITEMS_PER_PAGE = 3;

exports.getProducts = function (req, res, next) {
  var page = +req.query.page || 1;
  var totalItems;
  Product.find().countDocuments().then(function (numProducts) {
    totalItems = numProducts;
    return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);
  }).then(function (products) {
    res.render("shop/product-list", {
      prods: products,
      pageTitle: "Products",
      path: "/products",
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
    });
  })["catch"](function (err) {
    var error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getProduct = function (req, res, next) {
  var prodId = req.params.productId;
  Product.findById(prodId).then(function (product) {
    res.render("shop/product-detail", {
      product: product,
      pageTitle: product.title,
      path: "/products"
    });
  })["catch"](function (err) {
    var error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getIndex = function (req, res, next) {
  var page = +req.query.page || 1;
  var totalItems; // Count the number of products in the database

  Product.find().countDocuments().then(function (numProducts) {
    totalItems = numProducts;
    return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);
  }).then(function (products) {
    res.render("shop/index", {
      prods: products,
      pageTitle: "Shop",
      path: "/",
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
    });
  })["catch"](function (err) {
    var error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getCart = function (req, res, next) {
  req.user.populate("cart.items.productId") // .execPopulate()
  .then(function (user) {
    var products = user.cart.items;
    res.render("shop/cart", {
      path: "/cart",
      pageTitle: "Your Cart",
      products: products
    });
  })["catch"](function (err) {
    console.log(err); // const error = new Error(err);
    // error.httpStatusCode = 500;
    // return next(error);
  });
};

exports.postCart = function (req, res, next) {
  var prodId = req.body.productId;
  Product.findById(prodId).then(function (product) {
    return req.user.addToCart(product);
  }).then(function (result) {
    res.redirect("/cart");
  })["catch"](function (err) {
    console.log(err); // const error = new Error(err);
    // error.httpStatusCode = 500;
    // return next(error);
  });
};

exports.postCartDeleteProduct = function (req, res, next) {
  var prodId = req.body.productId;
  req.user.removeFromCart(prodId).then(function (result) {
    res.redirect("/cart");
  })["catch"](function (err) {
    var error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getCheckout = function (req, res, next) {
  var products;
  var total = 0;
  req.user.populate("cart.items.productId") // .execPopulate()
  .then(function (user) {
    products = user.cart.items;
    total = 0;
    products.forEach(function (p) {
      total += p.quantity * p.productId.price;
    });
    return stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: products.map(function (p) {
        return {
          price_data: {
            currency: "inr",
            unit_amount: p.productId.price * 100,
            product_data: {
              name: p.productId.title,
              description: p.productId.description
            }
          },
          quantity: p.quantity
        };
      }),
      mode: "payment",
      success_url: req.protocol + "://" + req.get("host") + "/checkout/success",
      // => http://localhost:3000
      cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel"
    });
  }).then(function (session) {
    res.render("shop/checkout", {
      path: "/checkout",
      pageTitle: "Checkout",
      products: products,
      totalSum: total,
      sessionId: session.id
    });
  })["catch"](function (err) {
    // const error = new Error(err);
    // error.httpStatusCode = 500;
    // return next(error);
    console.log(err);
  });
};

exports.getCheckoutSuccess = function (req, res, next) {
  req.user.populate("cart.items.productId") // .execPopulate()
  .then(function (user) {
    var products = user.cart.items.map(function (i) {
      return {
        quantity: i.quantity,
        product: _objectSpread({}, i.productId._doc)
      };
    });
    var order = new Order({
      user: {
        email: req.user.email,
        userId: req.user
      },
      products: products
    });
    return order.save();
  }).then(function (result) {
    return req.user.clearCart();
  }).then(function () {
    res.redirect("/orders");
  })["catch"](function (err) {
    var error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getOrders = function (req, res, next) {
  Order.find({
    "user.userId": req.user._id
  }).then(function (orders) {
    res.render("shop/orders", {
      path: "/orders",
      pageTitle: "Your Orders",
      orders: orders
    });
  })["catch"](function (err) {
    var error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
}; // exports.postOrder = (req, res, next) => {
//   req.user
//     .populate("cart.items.productId")
//     // .execPopulate()
//     .then((user) => {
//       const products = user.cart.items.map((i) => {
//         return { quantity: i.quantity, product: { ...i.productId._doc } };
//       });
//       const order = new Order({
//         user: {
//           email: req.user.email,
//           userId: req.user,
//         },
//         products: products,
//       });
//       return order.save();
//     })
//     .then((result) => {
//       return req.user.clearCart();
//     })
//     .then(() => {
//       res.redirect("/orders");
//     })
//     .catch((err) => {
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };


exports.getInvoice = function (req, res, next) {
  var orderId = req.params.orderId;
  Order.findById(orderId).then(function (order) {
    if (!order) {
      return next(new Error("No order found."));
    }

    if (order.user.userId.toString() !== req.user._id.toString()) {
      return next(new Error("Unauthorized"));
    }

    var invoiceName = "invoice-" + orderId + ".pdf";
    var invoicePath = path.join("data", "invoices", invoiceName);
    var pdfDoc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="' + invoiceName + '"');
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text("Invoice", {
      underline: true
    });
    pdfDoc.text("-----------------------");
    var totalPrice = 0;
    order.products.forEach(function (prod) {
      totalPrice = totalPrice + prod.quantity * prod.product.price;
      pdfDoc.fontSize(14).text(prod.product.title + " - " + prod.quantity + " x " + "$" + prod.product.price);
    });
    pdfDoc.text("----------");
    pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);
    pdfDoc.end(); // fs.readFile(invoicePath, (err, data) => {
    //   if (err) {
    //     return next(err);
    //   }
    //   res.setHeader('Content-Type', 'application/pdf');
    //   res.setHeader(
    //     'Content-Disposition',
    //     'inline; filename="' + invoiceName + '"'
    //   );
    //   res.send(data);
    // });
    // const file = fs.createReadStream(invoicePath);
    // file.pipe(res);
  })["catch"](function (err) {
    return next(err);
  });
};