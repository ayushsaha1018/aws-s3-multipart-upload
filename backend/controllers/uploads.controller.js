import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

dotenv.config();

// List of allowed MIME types for images and videos
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/webm",
];

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const generateSinglePreSignedUrl = asyncHandler(async (req, res) => {
  const { fileName, contentType } = req.body;

  if (!fileName) throw new ApiError(400, "Filename not present");

  if (!contentType) throw new ApiError(400, "Content Type not present");

  if (!allowedMimeTypes.includes(contentType)) {
    throw new ApiError(
      400,
      "Invalid content type. Only images and videos are allowed"
    );
  }

  const key = `${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });

  const url = await getSignedUrl(s3Client, command);

  const publicLink = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}/${key}`;

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { url, publicLink },
        "Presigned url created successfully"
      )
    );
});

const startMultipartUpload = asyncHandler(async (req, res) => {
  const { fileName, contentType } = req.body;

  if (!fileName) throw new ApiError(400, "Filename not present");

  if (!contentType) throw new ApiError(400, "Content Type not present");

  if (!allowedMimeTypes.includes(contentType)) {
    throw new ApiError(
      400,
      "Invalid content type. Only images and videos are allowed"
    );
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    ContentType: contentType,
    ACL: "public-read",
  };

  const command = new CreateMultipartUploadCommand(params);

  const { UploadId } = await s3Client.send(command);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { uploadId: UploadId },
        "Multipart upload inititated successfully"
      )
    );
});

const generatePreSignedUrlForMultipart = asyncHandler(async (req, res) => {
  const { fileName, uploadId, partNumbers } = req.body;
  const totalParts = Array.from({ length: partNumbers }, (_, i) => i + 1);

  const presignedUrls = await Promise.all(
    totalParts.map(async (partNumber) => {
      const commandParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
        PartNumber: partNumber,
        UploadId: uploadId,
      };

      const command = new UploadPartCommand(commandParams);
      const url = await getSignedUrl(s3Client, command, {
        expiresIn: 3600 * 3,
      });

      return url;
    })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { url: presignedUrls },
        "Multipart upload inititated successfully"
      )
    );
});

const completeMultipartUpload = asyncHandler(async (req, res) => {
  const { fileName, uploadId, parts } = req.body;

  const command = new CompleteMultipartUploadCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    UploadId: uploadId,

    MultipartUpload: {
      Parts: parts.map((part, i) => ({
        ETag: part.etag,
        PartNumber: i + 1,
      })),
    },
  });

  const data = await s3Client.send(command);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { publicLink: data.Location },
        "Multipart upload completed successfully"
      )
    );
});

export {
  generateSinglePreSignedUrl,
  startMultipartUpload,
  generatePreSignedUrlForMultipart,
  completeMultipartUpload,
};
