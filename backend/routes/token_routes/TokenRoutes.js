var express = require('express');
var router = express.Router();
const Auth = require('../../middleware/Authenticator');
const TokenRepository = require('../../repository/TokenRepository');
const ResponseModel = require('../../models/ResponseModel');

router.post('/createIssueRequest', [Auth.ValidateTokenRequest, Auth.AuthenticateToken], async (req, res) => {
  const result = await TokenRepository.CreateToken(req);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.put('/approveIssueRequest', [Auth.VerifyDataPresence, Auth.AuthenticateToken], async (req, res) => {
  const result = await TokenRepository.ApproveToken(req);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.post('/createPurchaseRequest', [Auth.VerifyDataPresence, Auth.AuthenticateToken], async (req, res) => {
  const result = await TokenRepository.CreatePurchase(req);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

module.exports = router;
