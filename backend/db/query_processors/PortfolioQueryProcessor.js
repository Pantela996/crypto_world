var PostgresDB = require('../PostgresDB');

class PortfolioQueryProcessor{
    static insertIntoPortfolioQuery = "INSERT INTO portfolio (user_id, token_id, amount) VALUES ($1,$2,$3) RETURNING *";
    static selectBaseTokenQuery = "SELECT * FROM portfolio where token_id = 9 and user_id = $1";
    static selectTokenByIDQuery = "SELECT * FROM portfolio where token_id = $1 and user_id = $2";
    static updatePortfolioBaseTokenQuery = "UPDATE portfolio SET amount = $1 where user_id = $2 and token_id = $3 RETURNING *";


    static async Create(tokenID, userID, amount){
        const result = await PostgresDB.client.query(this.insertIntoPortfolioQuery, [userID, tokenID, amount]);
        return result.rows[0];
    }

    static async GetPortfolioBaseTokenAmount(user){
        const result = await PostgresDB.client.query(this.selectBaseTokenQuery, [user.user_id]);
        return result.rows[0];
    }

    static async GetOneByID(tokenID, user){
        const result = await PostgresDB.client.query(this.selectTokenByIDQuery, [tokenID, user.user_id]);
        return result.rows[0];
    }

    static async UpdateTokenAmount(amount, userID, tokenID){
        const result = await PostgresDB.client.query(this.updatePortfolioBaseTokenQuery, [amount, userID, tokenID]);
        return result.rows[0];
    }

    

}

module.exports = PortfolioQueryProcessor;