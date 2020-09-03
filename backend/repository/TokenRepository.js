const TokenQueryProcessor = require('../db/query_processors/TokenQueryProcessor');
const ResponseBuilder = require('../helpers/ResponseBuilder');
const ResponseCodes = require('../helpers/ResponseCodes');
const UserQueryProcessor = require('../db/query_processors/UserQueryProcessor');
const PortfolioQueryProcessor = require('../db/query_processors/PortfolioQueryProcessor');

class TokenRepository {

  static async CreateToken (req) {
    try {
      const userID = req.user.user_id;
      const tokenFoundByNameAndUser = await TokenQueryProcessor.GetOneByNameAndUser(req.body, userID);
      // 409 is conflict error
      if (tokenFoundByNameAndUser) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.NAME_ALREADY_EXISTS, 409, null);
      }
      const insertIntoToken = await TokenQueryProcessor.Create(req.body, userID);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, 'Success');
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, createToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async ApproveToken (req) {
    try {
      // It can be represented as enum in model
      if(req.user.role !== 1){
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.FORBIDDEN_ACCESS, 403, null);
      }

      const tokenFoundByNameAndUser = await TokenQueryProcessor.GetOneByNameAndUser(req.body, req.user.user_id);

      if (!tokenFoundByNameAndUser) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if(tokenFoundByNameAndUser.rows[0].status === 2){
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.ALREADY_APPROVED, 409, null);
      }

      const approvedToken = await TokenQueryProcessor.ApproveToken(req.body, req.user.user_id);
      console.log(approvedToken);
      const addedTokenToPortfolio = await PortfolioQueryProcessor.Create(approvedToken.rows[0].token_id, approvedToken.rows[0].user_id, approvedToken.rows[0].initial_coin_offering);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, 'Success');
    } catch(err) {
      console.log(err);
      console.log('Error in token repository, approveToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

}

module.exports = TokenRepository;
