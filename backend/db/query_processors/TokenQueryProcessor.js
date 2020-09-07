var PostgresDB = require('../PostgresDB');

class TokenQueryProcessor{

    static insertIntoTokenQuery = "INSERT INTO token (name, initial_coin_offering, price_per_unit, user_id) VALUES ($1,$2,$3,$4) RETURNING *";
    static selectTokenByNameQuery = "SELECT * FROM token WHERE name = $1";
    static selectTokenByIDQuery = "SELECT * FROM token WHERE token_id = $1";
    static updateTokenStatusByNameQuery = "UPDATE token SET status = $1 WHERE name = $2 AND user_id = $3 RETURNING *";
    static selectUserTokensQuery = "SELECT token.user_id, token_id, public.\"user\".name,email FROM token INNER JOIN public.\"user\" ON token.user_id =  public.\"user\".user_id WHERE token.user_id = $1";
    static selectActiveTokensQuery = "SELECT * FROM token where status = 2";

    static async Create(token, userID){
        console.log(userID);
        const result = await PostgresDB.client.query(this.insertIntoTokenQuery, [token.name, token.initial_coin_offering, token.price_per_unit, userID]);
        return result.rows[0];
    }

    static async GetOneByName(token){
        const result = await PostgresDB.client.query(this.selectTokenByNameQuery, [token.name]);
        if (result && result.rows.length === 0) {
            return false;
        }
        return result.rows[0];
    }

    static async GetOneByID(token){
        const result = await PostgresDB.client.query(this.selectTokenByIDQuery, [token.token_id]);
        if (result && result.rows.length === 0) {
            return false;
        }
        return result.rows[0];
    }

    static async ApproveToken(token, userID){
        const result = await PostgresDB.client.query(this.updateTokenStatusByNameQuery, [2, token.name, userID]);
        return result.rows[0];
    }

    static async Reject(token, userID){
        const result = await PostgresDB.client.query(this.updateTokenStatusByNameQuery, [1, token.name, userID]);
        return result.rows[0];
    }

    static async UserTokens(userID) {
        const result = await PostgresDB.client.query(this.selectUserTokensQuery, [userID]);
        return result.rows;
    }

    static async Active(){
        const result = await PostgresDB.client.query(this.selectActiveTokensQuery);
        return result.rows;
    }

}

module.exports = TokenQueryProcessor;