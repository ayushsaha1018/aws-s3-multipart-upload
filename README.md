# S3 File Upload System

This repository contains a file upload system that uses AWS SDK v3 to upload files to an S3 bucket. The system handles both small files (less than 10MB) and large files (more than 10MB) using different upload methods.

## Features

- Uploads files to an S3 bucket using AWS SDK v3
- Handles files less than 10MB using pre-signed URLs
- Processes files larger than 10MB using multipart uploads
- Generates pre-signed URLs for each chunk in multipart uploads
- Combines multipart uploads into a single file

## Upload Process

### Small Files (< 10MB)
1. A pre-signed URL is generated
2. The file is uploaded directly using the pre-signed URL

### Large Files (> 10MB)
1. A multipart upload ID is generated
2. The file is split into chunks
3. For each chunk, a pre-signed URL is generated
4. Chunks are uploaded using their respective pre-signed URLs
5. After all chunks are uploaded, they are combined into a single file

## AWS Configuration

### IAM User Setup

1. Create an IAM user for S3 access
2. Attach the `AmazonS3FullAccess` policy to the user
3. Generate access keys for the IAM user
4. Use these access keys in your application for AWS SDK authentication

## S3 Bucket Configuration

### Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable ACLs",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:PutBucketAcl",
        "s3:GetBucketAcl"
      ],
      "Resource": "arn:aws:s3:::bucket_name"
    }
  ]
}
```

### CORS Policy

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```
