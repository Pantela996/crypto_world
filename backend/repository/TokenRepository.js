const TokenQueryProcessor = require('../db/query_processors/TokenQueryProcessor');

class TokenRepository{

    static async CreateToken(req){
        try {
            const tokenFoundByName = await TokenQueryProcessor.Create();
        } catch(err){
            console.log(err);
        }
        
    }

}

module.exports = TokenRepository;