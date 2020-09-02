var ResponseCodes = require('../helpers/ResponseCodes');
/**
 * Standard API response object
 * Every API response is structured in this way
 * 
 * The groupCode and messageCode are taken from the [ResponseCodes]('../helpers/ResponseCodes')
 */
class ResponseModel {
  constructor() {
    this.message = {
      groupCode: '',
      messageCode: ResponseCodes.auth.SUCCESS
    };
    this.data = {};
  }
  Success(data = {}) {
    this.data = data;
    return this;
  }
  Failed(message = { groupCode: 'auth', messageCode: ResponseCodes.auth.INTERNAL_SERVER_ERROR }) {
    this.message = message;
    return this;
  }
}
module.exports = ResponseModel;