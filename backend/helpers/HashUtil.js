const bcrypt = require('bcrypt');

class HashUtil {
  static async Hash (input) {
    const hashedPassword = await new Promise((resolve, reject) => {
      bcrypt.hash(input, 10, function (err, hash) {
        if (err) reject(err);
        resolve(hash);
      });
    });
    return hashedPassword;
  }

  static async Compare (input, hashedInput) {
    console.log('Called');
    const isSame = await new Promise((resolve, reject) => {
      bcrypt.compare(input, hashedInput, function (err, result) {
        if (err) console.log(err);
        console.log(result);
        resolve(result);
      });
    });
    return isSame;
  }
}

module.exports = HashUtil;
