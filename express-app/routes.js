const express = require("express"),
  router = express.Router();

//GET home page.
router.get("/", function(req, res) {
  res.render("index", { title: "Express" });
});

router.get("/pageTwo", function(req, res) {
  res.render("pageTwo", { title: "Page 2" });
});

router.get("/pageThree", function(req, res) {
  res.render("pageThree", { title: "Page 3" });
});

router.get("/pageFour", function(req, res) {
  res.render("pageFour", { title: "Page 4" });
});

module.exports = router;
