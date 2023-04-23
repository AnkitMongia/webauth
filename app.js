//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose= require("passport-local-mongoose");

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
    password: String
});

userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy({}));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


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
})

app.listen(3000, () => {
    console.log("Server listening on 3000");
});
