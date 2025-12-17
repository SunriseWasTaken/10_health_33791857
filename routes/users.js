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
router.post("/login", async function (req, res, next) {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const db = req.app.locals.db;

    const [rows] = await db.execute(
      "SELECT id, username, password FROM users WHERE username = ?",
      [username]
    );

    if (!rows.length) {
      return res.render("login", {
        title: "Login",
        error: "Invalid credentials",
        form: { username },
      });
    }

    const user = rows[0];
    const same = await bcrypt.compare(password, user.password);

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
  } catch (err) {
    next(err);
  }
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
      .withMessage("Username must be 5-20 characters"),
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
  async function (req, res, next) {
    try {
      const errors = validationResult(req);
      const username = req.body.username;
      const email = req.body.email;
      const password = req.body.password;
      const db = req.app.locals.db;

      const cleanUser = (username || "").trim();

      if (!errors.isEmpty()) {
        const first = errors.array()[0];
        return res.render("signup", {
          title: "Sign Up",
          error: first.msg,
          form: { username: cleanUser, email: (email || "").trim() },
        });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await db.execute("INSERT INTO users (username, email, password) VALUES (?,?,?)", [
        cleanUser,
        email.trim(),
        hashedPassword,
      ]);

      const [rows] = await db.execute("SELECT id, username FROM users WHERE username = ?", [
        cleanUser,
      ]);

      req.session.userId = rows[0].username;
      req.session.user = { id: rows[0].id, username: rows[0].username };
      res.redirect("/");
    } catch (err) {
      next(err);
    }
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
