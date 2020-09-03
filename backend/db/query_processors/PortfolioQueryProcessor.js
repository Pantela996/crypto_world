var PostgresDB = require('../PostgresDB');
const { use } = require('../../routes/token_routes/TokenRoutes');

class PortfolioQueryProcessor{
    static insertIntoPortfolioQuery = "INSERT INTO portfolio (user_id, token_id, amount) VALUES ($1,$2,$3) RETURNING *";

    
    static async Create(tokenID, userID, amount){
        console.log(tokenID,userID, amount);
        const result = await PostgresDB.client.query(this.insertIntoPortfolioQuery, [userID, tokenID, amount]);
        return result;
    }

}

module.exports = PortfolioQueryProcessor;