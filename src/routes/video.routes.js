import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  updateVideoDetails,
  updateVideoThumbnail,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyVideo } from "../middlewares/verifyVideo.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/").get(getAllVideos);
router.route("/:videoId").get(verifyVideo, getVideoById);

router.use(verifyJWT);


router.route("/upload-video").post(
  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
    {
      name: "videoFile",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

router.route("/delete/:videoId").delete(verifyVideo, deleteVideo);

router
  .route("/update/thumbnail/:videoId")
  .patch(verifyVideo, upload.single("thumbnail"), updateVideoThumbnail);
router
  .route("/update/:videoId")
  .patch(verifyVideo, upload.single("thumbnail"), updateVideoDetails);
// router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
