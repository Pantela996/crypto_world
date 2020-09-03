var express = require('express');
var router = express.Router();
const Auth = require('../../middleware/Authenticator');
const TokenRepository = require('../../repository/TokenRepository')

router.post('tokenIssueRequest', Auth.ValidateTokenRequest, async (req, res) => {
    try {
        const result = await TokenRepository.CreateToken(req);

    } catch(err) {
        console.log(err);
    }
})
 
module.exports = router;