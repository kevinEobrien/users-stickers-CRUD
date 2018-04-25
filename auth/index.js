const express = require("express");
const bcrypt= require("bcrypt");
const router= express.Router();

const User= require("../db/user");

router.get("/", (request, response) => {
  response.json({
    message: "🔐"
  });
});

function validateUser(user){
  const validEmail= typeof user.email == "string" && user.email.trim() != "";
  const validPassword= typeof user.password == "string" && user.password.trim() != "" && user.password.trim().length >= 6;
  return validEmail && validPassword;
}

router.post("/signup", (req, res, next) => {
  if(validateUser(req.body)){
    User
      .getOneByEmail(req.body.email)
      .then(user => {
        console.log("user", user);
        if(!user){
          bcrypt.hash(req.body.password, 10)
            .then((hash) => {

              const user = {
                email: req.body.email,
                password: hash,
                created_at: new Date ()
              };

              User
                .create(user)
                .then(id => {
                  res.json({
                    id,
                    message: "✅"
                  });
                });
            });
        }else{
          next(new Error("email in use"));
        }
      });
   
  } else {
    next(new Error("Invalid user"));
  }
}); 

router.post("/login", (req, res, next) => {
  if(validateUser(req.body)){
    User
      .getOneByEmail(req.body.email)
      .then(user => {
        console.log("user", user);
        if(user){
          bcrypt
            .compare(req.body.password, user.password).then((result) => {
              if(result ){
                const isSecure= req.app.get("env") != "development";
                res.cookie("user-id", user.id, {
                  httpOnly: true,
                  secure: isSecure,
                  signed: true
                });
                res.json({
                  message: "Logged in!🔐 "
                }); 
              }else{
                next(new Error("Invalid login"));
              }
            });
        }else{  
          next(new Error("Invalid login"));
        }
      }); 
  }   
});

module.exports= router;