var express = require('express');
var router = express.Router();
const Auth = require('../../middleware/Authenticator');
const UserRepo = require('../../repository/UserRepository');
const ResponseModel = require('../../models/ResponseModel');

router.post('/register', Auth.ValidateRegisterData, async (req, res) => {
  const registerUserModel = {
    password : req.body.password,
    email : req.body.email,
    name : req.body.name,
    birthday : req.body.birthday
  }
  const result = await UserRepo.RegisterUser(registerUserModel);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
}
);

router.post('/login', Auth.ValidateLoginData, async (req, res) => {
  const loginModel = {
    email : req.body.email,
    password : req.body.password
  }
  const result = await UserRepo.Login(loginModel);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
}
);

module.exports = router;
