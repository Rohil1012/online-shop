"use strict";

var deleteProduct = function deleteProduct(btn) {
  var prodId = btn.parentNode.querySelector("[name=productId]").value;
  var csrf = btn.parentNode.querySelector("[name=_csrf]").value; // This is element what I want to remove when I click on delete button

  var productElement = btn.closest("article");
  fetch("/admin/product/" + prodId, {
    method: "DELETE",
    headers: {
      "csrf-token": csrf
    }
  }).then(function (result) {
    return result.json();
  }).then(function (data) {
    console.log(data); // This is for remove this product without loading the page we simply use method of javascript

    productElement.parentNode.removeChild(productElement);
  })["catch"](function (err) {
    console.log(err);
  });
};