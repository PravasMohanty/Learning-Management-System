const express = require("express");
const upload = require("../middleware/upload");
const uploadService = require("../services/uploadService");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    res.json(await uploadService.uploadBuffer(req.file, req.body.folder));
  }),
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    res.json(
      await uploadService.deleteMedia(req.body.publicId, req.body.resourceType),
    );
  }),
);

module.exports = router;
