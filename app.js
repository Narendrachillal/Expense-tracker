const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Expense = require("./models/expense");
const User = require("./models/user");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const port = 9090;
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));

const ejsMate = require("ejs-mate");
app.engine("ejs", ejsMate);

mongoose
  .connect("mongodb://127.0.0.1:27017/expenses")
  .then(() => console.log("Connected!"));

const session = require("express-session");
const sessioOptions = {
  secret: "mySuperSecretCode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    exprire: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
//MIDDLEWEAR THE GENERATE THE SESSION
app.use(session(sessioOptions));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  next();
};

const flash = require("connect-flash");
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/login", (req, res) => {
  res.render("index.ejs");
});

const authentication = passport.authenticate("local", {
  failureFlash: true,
  failureRedirect: "/login",
});

app.post("/login", authentication, (req, res) => {
  req.flash("success", "Logged-In Succesfully");
  res.redirect("/expenses");
});

app.get("/logout", (req, res) => {
  req.flash("success", "Logged-Out Succesfully");
  res.redirect("/login");
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email });
    await User.register(newUser, password);
    req.flash("success", "User Registered Successfully");
    res.redirect("/login");
  } catch (error) {
    req.flash("error", "Registration failed. Please try again.");
    res.redirect("/register");
  }
});

//READ
app.get("/expenses", isLoggedIn, async (req, res) => {
  let userId = req.user.id;
  let expenses = await Expense.find({ Author: userId });
  res.render("expenses.ejs", { expenses });
});

//CREATE
app.get("/expenses/new", isLoggedIn, (req, res) => {
  res.render("new.ejs");
});

app.post("/expenses/new", isLoggedIn, async (req, res) => {
  try {
    let newData = new Expense(req.body.expenses);
    newData.Author = req.user.id;
    await newData.save();
    req.flash("success", "New Expense Added");
    res.redirect("/expenses");
  } catch (error) {
    req.flash("error", "Failed to add new Expenses");
    res.redirect("/expenses");
  }
});

// app.get("/expenses/:id/summaries"),
//   (req, res) => {
//     res.send("summaried");
//   };

//UPDATE
app.get("/expenses/:id/edit", async (req, res) => {
  let { id } = req.params;
  let editExpenses = await Expense.findById(id);
  res.render("edit.ejs", { editExpenses });
});

app.patch("/expenses/:id", async (req, res) => {
  try {
    let { id } = req.params;
    let editExpenses = await Expense.findByIdAndUpdate(id, {
      ...req.body.expenses,
    });
    req.flash("success", "Expense Edited");
    res.redirect("/expenses");
  } catch (error) {
    req.flash("error", "Failed to Update the Expense");
    res.redirect("/expenses");
  }
});

//DELETE
app.delete("/expenses/:id", async (req, res) => {
  try {
    let { id } = req.params;
    await Expense.findByIdAndDelete(id);
    req.flash("success", "Expense Deleted Succesfully");
    res.redirect("/expenses");
  } catch (error) {
    req.flash("error", "Something went Wrong");
    res.redirect("/expenses");
  }
});

app.listen(port, () => {
  console.log(`Listening at the Port ${port}`);
});
