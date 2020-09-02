const bcrypt = require('bcrypt');

class HashUtil {
    constructor(){
        hashedValue = "";
    }
    static async Hash(input) {
        const hashedPassword = await new Promise((resolve, reject) => {
          bcrypt.hash(input, 10, function(err, hash) {
            if (err) reject(err)
            resolve(hash)
          });
        })
        return hashedPassword;
      }
}

module.exports = HashUtil;