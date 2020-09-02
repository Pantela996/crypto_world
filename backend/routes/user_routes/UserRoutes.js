var express = require('express');
var router = express.Router();
const Auth = require('../../middleware/Authenticator');
const userRepo = require('../../repository/UserRepository');
const ResponseModel = require('../../models/ResponseModel');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

router.get('/all', Auth.AuthenticateToken, async (req, res) => {
  try {
    const result = await userRepo.GetAllUsers();
    if (result.success) {
      res.json(new ResponseModel().Success(result.data));
    } else {
      res.json(new ResponseModel().Failed(result.message));
    }
  } catch (err) {
    console.log(err);
  }
});

router.post('/register', Auth.ValidateRegisterData, async (req, res) => {
  try {
    const result = await userRepo.RegisterUser(req);
    if (result.success) {
      res.json(new ResponseModel().Success(result.data));
    } else {
      res.json(new ResponseModel().Failed(result.message));
    }
  } catch (err) {
    console.log(err);
  }
}
);

router.post('/login', Auth.ValidateLoginData, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await userRepo.Login(req);
    
    if (result.success) {
      const accessToken = jwt.sign(result, process.env.ACCESS_TOKEN_SECRET);
      res.json(new ResponseModel().Success(accessToken));
    } else {
      res.json(new ResponseModel().Failed(result.message));
    }
  } catch (err) {
    console.log(err);
  }
});
module.exports = router;
