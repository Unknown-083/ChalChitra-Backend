import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token) throw new ApiError(401, "Unauthorized request!");
    
        const tokenInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(tokenInfo?._id).select("-password -refreshToken");
    
        if(!user) throw new ApiError(401, "Invalid Access Token!");
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while verifying JWT");
    }
})

export const verifyJWTWithoutError = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        const tokenInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(tokenInfo?._id).select("-password -refreshToken");
        req.user = user;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
})