import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  let image = req.file ? req.file.path : null;

  if (image) {
    image = await uploadOnCloudinary(image);
  }

  if (content.trim() === "") throw new ApiError(400, "Content is required!");

  const tweet = await Tweet.create({
    content,
    image: image ? { url: image.url, publicId: image.public_id } : null,
    owner: req.user._id,
  });

  if (!tweet) throw new ApiError(500, "Error while creating tweet!");

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet post created successfully!", tweet));
});

const getAllTweets = asyncHandler(async (req, res) => {
  const allTweets = await Tweet.aggregate([
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
              fullname: 1,
              avatar: { url: 1 },
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
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "comments"
      }
    },
    {
      $addFields: {
        commentsCount: { $size: "$comments" }
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      }
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        hasLiked: {
          $in: [req.user?._id || null, "$likes.likedBy"]
        }
      },
    },
    {
      $project: {
        likes: 0,
        comments: 0
      }
    }
  ]);

  if (!allTweets) throw new ApiError(500, "Error while fetching tweets!");

  return res
    .status(200)
    .json(new ApiResponse(200, "All Tweets fetched successfully!", allTweets));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
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
              fullname: 1,
              username: 1,
              avatar: { url: 1 },
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
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "comments"

      },
    },
    {
      $addFields: {
        commentsCount: { $size: "$comments" }
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      }
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        hasLiked: {
          $in: [req.user?._id || null, "$likes.likedBy"]
        }
      },
    },
    {
      $project: {
        likes: 0,
        comments: 0
      }
    }
  ]);

  if (!userTweets) throw new ApiError(500, "Error while fetching user tweets!");

  return res
    .status(200)
    .json(
      new ApiResponse(200, "User Tweets fetched successfully!", userTweets)
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!(tweetId && isValidObjectId(tweetId)))
    throw new ApiError(400, "Valid tweetId is required!");
  if (content.trim() === "") throw new ApiError(400, "Content is required!");

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content: content },
    },
    { new: true }
  );

  if (!updatedTweet) throw new ApiError(500, "Error while updating tweet!");

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet updated successfully!", updatedTweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!(tweetId && isValidObjectId(tweetId)))
    throw new ApiError(400, "Valid tweetId is required!");

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) throw new ApiError(404, "Tweet not found!");
  console.log(tweet);

  if (tweet.image && tweet.image.publicId) {
    const deleteImage = await deleteOnCloudinary(tweet.image?.publicId);
    if (!deleteImage) throw new ApiError(500, "Error while deleting tweet image from cloudinary!");
  }

  const response = await Tweet.findByIdAndDelete(tweetId, { new: true });

  if (!response) throw new ApiError(500, "Error while deleting tweet!");

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully!", {}));
});

export { createTweet, updateTweet, deleteTweet, getUserTweets, getAllTweets };
