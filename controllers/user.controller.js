const UserModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
// const { Auth, LoginCredentials } = require('two-step-auth')

exports.registerUser = (req, res) => {
  const userData = req.body;

  bcrypt.hash(userData.password, 10).then((hashedPassword) => {
    var doc = new UserModel({
      fullName: userData.fullName,
      password: hashedPassword,
      mobileNumber: userData.mobileNumber,
    });

    doc.save((err, doc) => {
      if (err) {
        res.send({
          message: "Mobile Number already registered!!",
        });
      } else {
        var payload = {
          subject: [doc._id, doc.mobileNumber],
        };
        console.log(payload);
        var token = jwt.sign(payload, process.env.USER_SECRET_KEY);
        res.cookie("token", token, {
          expires: new Date(Date.now() + 604800000000),
          secure: true,
          httpOnly: true,
        });
        res
          .status(200)
          .send({ userId: doc._id, token: token, name: doc.fullName });
      }
    });
  });
};

exports.loginUser = (req, res) => {
  const userData = req.body;
  UserModel.findOne({ mobileNumber: userData.mobileNumber }, (err, doc) => {
    if (err) {
      res.send({
        err: err.message,
      });
      console.log(err);
    } else {
      if (doc) {
        bcrypt.compare(userData.password, doc.password).then((result) => {
          if (result) {
            const payload = {
              subject: [doc._id, doc.mobileNumber],
            };

            console.log(payload);

            const token = jwt.sign(payload, process.env.USER_SECRET_KEY, {
              expiresIn: "1h",
            });
            res.cookie("token", token, {
              expires: new Date(Date.now() + 604800000000),
              secure: true,
              httpOnly: true,
            });

            res
              .status(200)
              .send({ userId: doc._id, token: token, name: doc.fullName });
          } else {
            res.send({
              message: "Password is incorrect!",
            });
          }
        });
      } else {
        res.send({
          message: "Mobile Number is not registered!",
        });
      }
    }
  });
};

exports.forgotPassword = (req, res) => {
  const userData = req.body;

  UserModel.findOne({ mobileNumber: userData.mobileNumber }, (err, doc) => {
    if (doc) {
      bcrypt.hash(userData.password, 10).then((hashedPassword) => {
        doc.updateOne({ password: hashedPassword }, (err, doc) => {
          if (doc.nModified === 1) {
            res.send({
              message: "password changed!",
            });
          } else {
            res.send({
              message: "password already in use...",
            });
          }
        });
      });
    } else {
      res.send({
        message: "Mobile number is not registered!",
      });
    }
  });
};
