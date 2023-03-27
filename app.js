//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
mongoose.connect("mongodb://127.0.0.1:27017/usersDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] })
const User = new mongoose.model("User", userSchema);






app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});
app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }).then((user) => {
        if (!user) {
            res.send("User not found");
        }
        else {
            bcrypt.compare(password, user.password, function(err, result) {
                if(result == true){
                    res.render("secrets");
                }
            });
        }
    })
})

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    const email = req.body.username;
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (!err) {
            const newUser = new User({
                email: email,
                password: hash
            });
            newUser.save();
            res.render("secrets");
        }
    });
});

app.listen(3000, () => {
    console.log("Server listening on 3000");
});
