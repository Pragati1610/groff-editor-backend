const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const { User } = require("../models/model.js");

// get all files for a user

router.get("/:userId", [check("Authorization")], (req, res) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      error: error.array(),
    });
  }
  let userId = req.params.userId;
  User.find({ _id: userId })
    .select("files")
    .exec()
    .then((docs) => {
      const response = {
        count: docs.length,
        searches: docs.map((doc) => {
          return {
            files: doc.files,
          };
        }),
      };
      res.status(200).json(response);
    })
    .catch((err) => {
      console.log(err.toString());
      res.status(500).json({
        err: err,
      });
    });
});

// create a new file

router.patch(
  "/createFile/:userId",
  [check("fileName"), check("Authorization")],
  (req, res) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(422).json({
        error: error.array(),
      });
    }

    const token = req.header("Authorization");
    let email;
    try {
      email = jwt.verify(token, process.env.JWT_KEY);
    } catch (err) {
      console.log(err);
      return res.status(403).json({
        message: err,
      });
    }

    let id = req.params.userId;

    let fileName = req.body.fileName;
    let fileData = "";

    User.updateOne(
      {
        _id: id,
      },
      {
        $push: {
          files: {
            fileName: fileName,
            fileData: fileData,
          },
        },
      }
    )
      .exec()
      .then((result) => {
        res.status(200).json({
          message: "File created",
          created: {
            fileName: fileName,
            fileData: fileData,
          },
        });
      })
      .catch((err) => {
        return res.status(500).json({
          err: err
        });
      });


    // User.find({
    //   _id: id, 
    //   "files.fileName": fileName
    // }).exec().then((result)=>{
    //   console.log(result);
    //   if(result.length>2){
    //     return res.status(409).json({
    //       message: "file with that name already exists"
    //     });
    //   }

    // }).catch((err)=>{
    //   return res.status(500).json({
    //       err: err
    //     });
    // });
  }
);

// rename a file

router.patch('/rename/:userId', [check("fileName"), check("Authorization")],
  (req, res) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(422).json({
        error: error.array(),
      });
    }

    const token = req.header("Authorization");
    let email;
    try {
      email = jwt.verify(token, process.env.JWT_KEY);
    } catch (err) {
      console.log(err);
      return res.status(403).json({
        message: err,
      });
    }
    let newFileName = req.body.newFileName;
    let id=req.params.userId;
    let fileId=req.params.fileId;
      
    User.find({
      _id: id, 
      "files._id": fileId
    }).exec().then((result)=>{

      if(result<1){
        return res.status(409).json({
          message: "no file exists with that name"
        });
      }
        let filter={
          _id: id,
          "files._id": fileId
        };

        let update={
          $set: {
            "files.$.fileName": newFileName
          }
        }

       User.findOneAndUpdate(filter, update).exec()
      .then((result) => {
        res.status(200).json({
          message: "Filename updated",
          created: {
            result: result
          },
        });
      })
      .catch((err) => {
        console.log(err);
      });


    }).catch((err)=>{
      console.log(err);
    });

  }
);

// get one file for a user : 

const escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

router.get("/:userId/:fileName", [check("Authorization")], (req, res) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      error: error.array(),
    });
  }

  const token = req.header("Authorization");
  let email;
  try {
    email = jwt.verify(token, process.env.JWT_KEY);
  } catch (err) {
    console.log(err);
    return res.status(403).json({
      message: err,
    });
  }

  const regex = new RegExp(escapeRegex(req.params.fileName), 'gi');


  const id = req.params.userId;
  User.find({
    _id: id,
    "files.fileName": regex,
  })
    .select("files")
    .exec()
    .then((doc) => {
      console.log(doc);
      if (doc) {
        res.status(200).json(doc[0].files);
      } else {
        res.status(404).json({
          message: "No data saved for this file name",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        err: err,
      });
    });
});

// get a file for a user



// delete a file

router.delete("/:userId&:fileName", [check("Authorization")], (req, res) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({
      error: error.array(),
    });
  }

  const token = req.header("Authorization");
  let email;
  try {
    email = jwt.verify(token, process.env.JWT_KEY);
  } catch (err) {
    console.log(err);
    return res.status(403).json({
      message: err,
    });
  }

  const id = req.params.userId;
  const fileName = req.params.fileName;
  User.updateOne(
    {
      _id: id,
    },
    {
      $pull: {
        "files.fileName": fileName,
      },
    }
  )
    .exec()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
