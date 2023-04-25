//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose= require("passport-local-mongoose");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: "THis is secret key for HMAC",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const { Session } = require('express-session');
mongoose.connect("mongodb://127.0.0.1:27017/usersDB");

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

/* register passport-local-mongoose */
passport.use(User.createStrategy({}));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* Oauth2.0 google */
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id , email: profile.emails[0].value}, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", passport.authenticate("local", {username : "email"}), (req, res) => {
    console.log(req.body);
    console.log(req.user);
    const username = req.body.username;
    const password = req.body.password;
    res.send("Success login");

    /*User.findOne({ email: username }).then((user) => {
        if (!user) {
            res.send("User not found");
        }
        else {
            bcrypt.compare(password, user.password, function (err, result) {
                if (result == true) {
                    res.render("secrets");
                }
            });
        }
    })*/
});

app.get("/logout", (req, res)=>{
    req.logOut((err)=>{
        if(!err)
            res.send("logout success");
    });
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    const email = req.body.username;
    const password= req.body.password;
    User.register(new User({email: email}),password, (err,user)=>{
        if(err){
            res.redirect("/register");
        }
        else{
            res.send("Success new user");
        }
    });
});

app.get("/secrets", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.get("/auth/google", passport.authenticate("google", { scope: ['profile', 'email'] }));

app.get("/auth/google/secrets", passport.authenticate("google", 
            {failureRedirect:"/login"}), (req,res)=>{
                res.redirect("/secrets");
});

app.listen(3000, () => {
    console.log("Server listening on 3000");
});
