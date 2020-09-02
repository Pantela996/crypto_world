const {check, validationResult} = require('express-validator');


class Authenticaton {

    static ValidateRegisterData(req,res,next){
        next();
    }
}



module.exports = Authenticaton;