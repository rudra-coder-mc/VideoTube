import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

const healthcheck = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const response = new ApiResponse(200, "ok", "Health check Pass");
  res.status(200).json(response); // Send the response without returning it
});

export default healthcheck;
