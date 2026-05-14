const { Readable } = require("stream");
const cloudinary = require("../config/cloudinary");
exports.uploadBuffer = (file, folder = "lms") =>
  new Promise((resolve, reject) => {
    const resource_type = file.mimetype.startsWith("video/") ? "video" : "auto";
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type },
      (err, result) =>
        err
          ? reject(err)
          : resolve({
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: result.resource_type,
              originalName: file.originalname,
              bytes: file.size,
            }),
    );
    Readable.from(file.buffer).pipe(stream);
  });
exports.deleteMedia = async (publicId, resourceType = "image") =>
  publicId
    ? cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    : null;
