const express = require("express");
const router = express.Router();
const axios = require("axios");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { User } = require("../models/model.js");
const jwt = require("jsonwebtoken");
dotenv.config();



var admin = require("firebase-admin");

var serviceAccount = require("../../firebase.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://groff-oauth-default-rtdb.firebaseio.com"
});

router.post("/google", async(req, res) => {
    try {
        const adminInstance = await admin.auth()
        const userInfo = await adminInstance.verifyIdToken(req.body.idToken);

        const mail = userInfo.email;

        let token1;
        let user = await User.find({
            email: mail,
        }).exec();

        if (user.length >= 1) {
            token1 = jwt.sign({
                    email: user[0].email,
                    userId: user[0].id
                },
                process.env.JWT_KEY, {
                    expiresIn: "1h",
                }
            );
            return res.status(200).json({
                message: "Auth successful",
                token: token1,
            });
        } else {
            const useri = new User({
                _id: new mongoose.Types.ObjectId(),
                email: mail,
            });
            useri.save().then((result) => {
                console.log(result);
            });
            token1 = jwt.sign({
                    email: useri.email,
                    userId: useri._id,
                },
                process.env.JWT_KEY, {
                    expiresIn: "1h",
                }
            );
            return res.status(200).json({
                message: "Auth successful",
                token: token1,
                id: useri.id,
                email: useri.email
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            err: err
        });
    }
});


module.exports = router;