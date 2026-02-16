import { addComment, deleteComment, getComments, updateComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.use(verifyJWT);

// Video comments routes
router.route("/v/:videoId")
    .get(getComments)
    .post(addComment)

// Tweet comments routes
router.route("/t/:tweetId")
    .get(getComments)
    .post(addComment)

// Comment update and delete routes (works for both video and tweet comments)
router.route("/:commentId")
    .patch(updateComment)
    .delete(deleteComment)

export default router