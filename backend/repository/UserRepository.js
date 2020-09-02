const HashUtil = require('../helpers/HashUtil')
const UserQueryProcessor = require('../db/query_processors/UserQueryProcessor');
const ResponseBuilder = require('../helpers/ResponseBuilder');
const ResponseCodes = require('../helpers/ResponseCodes');
const { all } = require('../routes/user_routes/userRoutes');

class UserRepository{
   
    
    static async RegisterUser(req){
        const userFoundByEMail = await UserQueryProcessor.UserWithEmailExists(req.body);

        // 409 is conflict error
        if(userFoundByEMail === true) {
            return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.EMAIL_ALREADY_EXISTS, 409, null);
        }

        // Succeded
        req.body.password = await HashUtil.Hash(req.body.password);
        const insertIntoUser = await UserQueryProcessor.CreateUser(req.body);
        return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, insertIntoUser);
    }

    static async GetAllUsers() {
        const allUsers = await UserQueryProcessor.GetAllUsers();
        return allUsers;
    }
}

module.exports = UserRepository;