var express = require('express');
var router = express.Router();
const Auth = require('../../middleware/Authenticator');
const userRepo = require('../../repository/UserRepository');
const ResponseModel = require('../../models/ResponseModel');

router.get('/allUsers', async(req,res) => {
    const insertIntoUser = await userRepo.GetAllUsers();
    res.json(insertIntoUser.rows);
});

router.post('/register', Auth.ValidateRegisterData, async(req,res) => {
        try {
            const result = await userRepo.RegisterUser(req);
            if (result.success) {
                res.json(new ResponseModel().Success(result.data));
            }
            else {
                res.json(new ResponseModel().Failed(result.message));
            }
        } catch (err){
            console.log(err);
        }
    }
);
module.exports = router;