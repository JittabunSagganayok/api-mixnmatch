const result = require("../middleware/result");

const tempUpload = require("../temp/upload_files");

exports.uploadImageS3 = async (req, res, next) => {
  try {
    const model = await tempUpload.uploadS3(req, res, function (error) {
      if (error) {
        result(res, error, 404, "upload error");
      }
      const rest = {
        S3: req.file,
        part: req.file.key,
        url:
          "https://s3dev-gramick.sgp1.cdn.digitaloceanspaces.com" +
          "/" +
          req.file.key,
      };
      result(res, rest, 200, "upload Success");
    });
  } catch (error) {
    next(error);
  }
};
