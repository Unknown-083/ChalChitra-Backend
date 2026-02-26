import { Router } from "express";
import {
  getCurrentUser,
  getUserChannelProfile,
  getUserWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateCurrentUserDetails,
  updateCurrentUserPassword,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/c/:id").get(verifyJWT, getUserChannelProfile);
// Secured Routes

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/get-user").get(verifyJWT, getCurrentUser);
router.route("/change-password").patch(verifyJWT, updateCurrentUserPassword);
router.route("/update-account").patch(verifyJWT, updateCurrentUserDetails);

router
  .route("/change-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/change-coverImage")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/history").get(verifyJWT, getUserWatchHistory);

export default router;
