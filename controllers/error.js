exports.getError = (req, res, next) => {
  // res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
  res.status(404).render("404", { pageTitle: "Page Not Found", path: "/404" });

  // For handlebars render pages and add css file -------------------------------------------------------------------
  // .render("404", { pageTitle: "Page Not Found", errorCSS: true });
};
