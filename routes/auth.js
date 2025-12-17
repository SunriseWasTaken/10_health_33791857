const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

// GET /login
router.get("/login", (req, res) => {
  res.render("login", { title: "Login", error: null });
});

// POST /login
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const db = req.app.locals.db;

    const [rows] = await db.execute(
      "SELECT id, username, password FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.render("login", { title: "Login", error: "Invalid credentials" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.render("login", { title: "Login", error: "Invalid credentials" });
    }

    req.session.user = { id: user.id, username: user.username };
    res.redirect("/");
  } catch (err) {
    next(err);
  }
});

// GET /logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;