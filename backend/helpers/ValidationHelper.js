const GLOBALS = require('../globals/Globals');

class ValidationHelper {
  static CheckAllParamsExist (object) {
    for (const value in object) {
      if (!object[value] || object[value] === '') return false;
      else continue;
    }
    return true;
  }

  static CheckParamsPresent(params){
    var allPresent = true;
    params.forEach(variable => {
      if (typeof variable === 'undefined' || variable === null) {
        allPresent = false;
      }
    });
    return allPresent;
  }

  static ValidateEmailFormat (email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  static CheckPasswordLength (pass) {
    return pass.length >= GLOBALS.MIN_PASSWORD_LENGTH;
  }

  static NumericValueCheck (number) {
    if(typeof number !== 'number'){
      return false;
    }
    return number > 0;
  }
}
module.exports = ValidationHelper;
