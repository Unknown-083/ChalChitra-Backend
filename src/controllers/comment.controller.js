import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const getComments = asyncHandler(async (req, res) => {
  const { videoId, tweetId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Determine which type and validate
  const contentType = videoId ? "video" : tweetId ? "tweet" : null;
  const contentId = videoId || tweetId;

  if (!contentId) 
    throw new ApiError(400, `${contentType === "video" ? "Video" : "Tweet"} Id is missing`);

  const matchStage = contentType === "video" 
    ? { video: new mongoose.Types.ObjectId(contentId) }
    : { tweet: new mongoose.Types.ObjectId(contentId) };

  const comments = await Comment.aggregate([
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner"
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        hasLiked: {
          $in: [req.user?._id || null, "$likes.likedBy"],
        }
      },
    },
    {
      $skip: (parseInt(page) - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
    },
    {
      $project: {
        _id: 1,
        content: 1,
        video: 1,
        tweet: 1,
        owner: {
          username: 1,
          avatar: { url: 1 },
        },
        createdAt: 1,
        updatedAt: 1,
        likesCount: 1,
        hasLiked: 1,
      },
    },
  ]);

  if (!comments)
    throw new ApiError(500, "Error while fetching comments!");

  const totalComments = await Comment.countDocuments(matchStage);

  return res.status(200).json(
    new ApiResponse(200, "Fetched comments successfully!", {
      comments,
      totalComments,
      page,
      totalPages: Math.ceil(totalComments / limit),
    })
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { videoId, tweetId } = req.params;

  const contentId = videoId || tweetId;
  const contentType = videoId ? "video" : "tweet";

  if (!contentId) throw new ApiError(400, `${contentType === "video" ? "Video" : "Tweet"} Id is missing`);
  if (content.trim() === "") throw new ApiError(400, "Comment is empty!");

  const commentData = {
    content: content,
    owner: req.user?._id,
  };

  // Add either video or tweet field based on content type
  commentData[contentType] = contentId;

  const addedComment = await Comment.create(commentData);

  if (!addedComment) throw new ApiError(500, "Error while adding the comment!");

  return res
    .status(200)
    .json(new ApiResponse(200, "Added comment successfully!", addedComment));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!(commentId && content))
    throw new ApiError(400, "Comment Id or content is missing");

  const oldComment = await Comment.findById(commentId);
  if (!oldComment)
    throw new ApiError(400, "Comment doesn't exists with this ID");

  if (!oldComment.owner.equals(req.user._id))
    throw new ApiError(402, "You are not authorized to update this comment");

  const newComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content: content },
    },
    { new: true }
  );

  if (!newComment) throw new ApiError(500, "Error while updating the comment!");

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Updated the comment successfully!", newComment)
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(400, "Invalid Comment Id");
  if (!comment.owner.equals(req.user._id))
    throw new ApiError(400, "You are not authorized to delete this comment");

  const response = await Comment.findByIdAndDelete(commentId, { new: true });

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment deleted successfully", {}));
});

export { getComments, addComment, updateComment, deleteComment };