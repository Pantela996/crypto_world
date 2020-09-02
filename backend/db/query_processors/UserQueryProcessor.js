var PostgresDB = require('../PostgresDB');

class UserQueryProcessor{

    static insertIntoUserQuery = "INSERT INTO public. \"user\" (name, birthday, email,password,creation_date, role, banned) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *";
    static selectUserByEmailQuery = "SELECT * FROM public. \"user\" where email = $1";
    static selectAllFromUser = "SELECT * FROM public. \"user\"";

    static async Create(user){
        const result = await PostgresDB.client.query
            (this.insertIntoUserQuery,
            [user.name, user.birthday, user.email, user.password, user.creation_date, user.role,user.banned]);
        return result;
    }

    static async GetOneByEmail(user){
        const result = await PostgresDB.client.query(this.selectUserByEmailQuery, [user.email]);
        if (result.rows.length === 0) {
            return false;
        }
        return result;
    }

    static async GetAll(){
        const result = await PostgresDB.client.query(this.selectAllFromUser);
        return result;
    }

}

module.exports = UserQueryProcessor;