var PostgresDB = require('../PostgresDB');

class PortfolioQueryProcessor{
    static insertIntoPortfolioQuery = "INSERT INTO portfolio (user_id, token_id, amount) VALUES ($1,$2,$3) RETURNING *";
    static selectBaseTokenQuery = "SELECT * FROM portfolio where token_id = 9 and user_id = $1";
    static selectTokenByIDQuery = "SELECT * FROM portfolio where token_id = $1 and user_id = $2";


    static async Create(tokenID, userID, amount){
        const result = await PostgresDB.client.query(this.insertIntoPortfolioQuery, [userID, tokenID, amount]);
        return result;
    }

    static async GetPortfolioBaseTokenAmount(user){
        console.log(user.user_id);
        const result = await PostgresDB.client.query(this.selectBaseTokenQuery, [user.user_id]);
        return result;
    }

    static async GetOneByID(tokenID, user){
        console.log(user.user_id, tokenID);
        const result = await PostgresDB.client.query(this.selectTokenByIDQuery, [tokenID, user.user_id]);
        return result;
    }

}

module.exports = PortfolioQueryProcessor;