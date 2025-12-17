const express = require("express");
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const router = express.Router();

const saltRounds = 10;

// Password policy: 8+ chars, lower + upper + number + symbol
const strongPw = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

// Guard for routes that require an authenticated session
const redirectLogin = (req, res, next) => {
  if (!req.session.user && !req.session.userId) return res.redirect("/login");
  next();
};

// GET /login
router.get("/login", (req, res) => {
  res.render("login", { title: "Login", error: null, form: { username: "" } });
});

// POST /login
router.post("/login", function (req, res, next) {
  let username = req.body.username;
  let password = req.body.password;
  let db = req.app.locals.db;

  let sqlquery = "SELECT id, username, password FROM users WHERE username = ?";

  db.query(sqlquery, [username], function (err, result) {
    if (err) {
      return next(err);
    }

    if (result.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Invalid credentials",
        form: { username },
      });
    }

    let user = result[0];

    bcrypt.compare(password, user.password, function (err, same) {
      if (err) {
        return next(err);
      }

      if (!same) {
        return res.render("login", {
          title: "Login",
          error: "Invalid credentials",
          form: { username },
        });
      }

      req.session.userId = user.username;
      req.session.user = { id: user.id, username: user.username };
      res.redirect("/");
    });
  });
});

// POST /loggedin
router.post("/loggedin", (req, res, next) => {
  req.url = "/login";
  return router.handle(req, res, next);
});

// GET /signup
router.get("/signup", (req, res) => {
  res.render("signup", { title: "Sign Up", error: null, form: { username: "", email: "" } });
});

// POST /signup
router.post(
  "/signup",
  [
    check("username")
      .trim()
      .isLength({ min: 5, max: 20 })
      .withMessage("Username must be 5–20 characters"),
    check("email")
      .trim()
      .isEmail()
      .withMessage("Enter a valid email address"),
    check("password")
      .custom((value) => strongPw.test(value))
      .withMessage(
        "Password must be 8+ chars and include a lowercase, uppercase, number, and symbol"
      ),
    check("confirm").custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Passwords do not match");
      return true;
    }),
  ],
  function (req, res, next) {
    const errors = validationResult(req);
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;
    let db = req.app.locals.db;

    let cleanUser = (username || "").trim();

    if (!errors.isEmpty()) {
      const first = errors.array()[0];
      return res.render("signup", {
        title: "Sign Up",
        error: first.msg,
        form: { username: cleanUser, email: (email || "").trim() },
      });
    }

    bcrypt.hash(password, saltRounds, function (err, hashedPassword) {
      if (err) {
        return next(err);
      }

      let sqlquery = "INSERT INTO users (username, email, password) VALUES (?,?,?)";
      let newrecord = [cleanUser, email.trim(), hashedPassword];

      db.query(sqlquery, newrecord, function (err, result) {
        if (err) {
          return next(err);
        }

        let selectQuery = "SELECT id, username FROM users WHERE username = ?";

        db.query(selectQuery, [cleanUser], function (err, rows) {
          if (err) {
            return next(err);
          }

          req.session.userId = rows[0].username;
          req.session.user = { id: rows[0].id, username: rows[0].username };
          res.redirect("/");
        });
      });
    });
  }
);

// POST /registered
router.post("/registered", (req, res, next) => {
  req.url = "/signup";
  return router.handle(req, res, next);
});

// GET /logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

module.exports = router;