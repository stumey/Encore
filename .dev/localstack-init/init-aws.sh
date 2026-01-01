#!/bin/bash

# LocalStack S3 Initialization Script
# This script runs automatically when LocalStack starts

echo "Initializing LocalStack S3..."

# Create S3 bucket for concert media (photos/videos)
awslocal s3 mb s3://encore-media

# Configure CORS for browser-based uploads
awslocal s3api put-bucket-cors --bucket encore-media --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:8081"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

# Verify bucket was created
echo ""
echo "Created S3 buckets:"
awslocal s3 ls

echo ""
echo "LocalStack S3 initialization complete!"
echo "Bucket 'encore-media' is ready for uploads at http://localhost:4566"
