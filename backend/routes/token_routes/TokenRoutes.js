var express = require('express');
var router = express.Router();
const Auth = require('../../middleware/Authenticator');
const TokenRepository = require('../../repository/TokenRepository');
const ResponseModel = require('../../models/ResponseModel');

router.post('/createIssueRequest', [Auth.ValidateTokenRequest, Auth.AuthenticateToken], async (req, res) => {
  const result = await TokenRepository.CreateToken(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.put('/approveIssueRequest', [Auth.VerifyDataPresence, Auth.AuthenticateToken], async (req, res) => {
  const result = await TokenRepository.ApproveToken(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.put('/rejectIssueRequest', [Auth.VerifyDataPresence, Auth.AuthenticateToken], async (req, res) => {
  const result = await TokenRepository.RejectToken(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.post('/:token_id/createPurchaseRequest/:seller_id', [Auth.VerifyDataPresence, Auth.AuthenticateToken], async (req, res) => {
  const result = await TokenRepository.CreatePurchase(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.put('/approvePurchaseRequest', Auth.AuthenticateToken, async (req, res) => {
  const result = await TokenRepository.ApproveRequest(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

module.exports = router;
