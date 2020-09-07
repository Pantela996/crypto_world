var PostgresDB = require('../PostgresDB');

class PortfolioQueryProcessor{
    static insertIntoPortfolioQuery = "INSERT INTO portfolio (user_id, token_id, amount) VALUES ($1,$2,$3) RETURNING *";
    static selectBaseTokenQuery = "SELECT * FROM portfolio WHERE token_id = 9 AND user_id = $1";
    static selectTokenByIDQuery = "SELECT * FROM portfolio WHERE token_id = $1 AND user_id = $2";
    static updatePortfolioBaseTokenQuery = "UPDATE portfolio SET amount = $1 WHERE user_id = $2 AND token_id = $3 RETURNING *";
    static topHoldersSelected = "SELECT * FROM portfolio where token_id = $2 ORDER BY amount DESC LIMIT $1";
    static selectTokenUsersQuery = "SELECT portfolio.user_id, token_id, amount,name,email FROM portfolio INNER JOIN public.\"user\" ON portfolio.user_id =  public.\"user\".user_id WHERE token_id=$1";


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

    static async TopHolders(tokenID){
        console.log(tokenID);
        const result = await PostgresDB.client.query(this.topHoldersSelected, [5, tokenID]);
        return result.rows;
    }

    static async Holders(tokenID){
        const result = await PostgresDB.client.query(this.selectTokenUsersQuery, [tokenID]);
        return result.rows;
    }
    
}

module.exports = PortfolioQueryProcessor;