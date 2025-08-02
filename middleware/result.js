// const logger = require("../config/logger");
module.exports = (res, data, status = 200, msg = "") => {
  // logger.log('info', {
  //     statusCode: status,
  //     message: data,
  // });

  return res.status(status).json({
    result: data,
    message: msg,
    statusCode: status,
  });
};
