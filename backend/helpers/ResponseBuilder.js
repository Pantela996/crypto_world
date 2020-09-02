/**
 * Return value from all repositories to the endpoints
 */
class ResponseBuilder {
    /**
     * Builds the standard repository response
     * @param {Boolean} success Indicates if the query succeeded
     * @param {String} groupCode ResponseCodes group (example: community or auth)
     * @param {String} messageCode ResponseCodes message from a certain group
     * @param {Number} statusCode Http status code
     * @param {Object} data Object containing DB return data
     */
    static BuildResponse(success, groupCode, messageCode, statusCode, data) {
      return {
        success: success,
        message: {
          groupCode: groupCode,
          messageCode: messageCode
        },
        status_code: statusCode,
        data: data
      }
    }
}
module.exports = ResponseBuilder;