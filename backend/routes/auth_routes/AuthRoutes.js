var express = require('express');
var router = express.Router();
const Auth = require('../../middleware/Authenticator');
const UserRepo = require('../../repository/UserRepository');
const ResponseModel = require('../../models/ResponseModel');


router.post('/register', Auth.ValidateRegisterData, async (req, res) => {
    const result = await UserRepo.RegisterUser(req);
    if (result.success) {
      res.json(new ResponseModel().Success(result.data));
    } else {
      res.json(new ResponseModel().Failed(result.message));
    }
}
);
  
router.post('/login', Auth.ValidateLoginData, async (req, res) => {
  const result = await UserRepo.Login(req);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
}
);

module.exports = router;