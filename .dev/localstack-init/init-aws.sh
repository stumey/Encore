#!/bin/bash

# Create S3 bucket for concert photos
awslocal s3 mb s3://encore-photos

# Create S3 bucket for ticket PDFs
awslocal s3 mb s3://encore-tickets

# Configure CORS for the photos bucket
awslocal s3api put-bucket-cors --bucket encore-photos --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:8081"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

# Create Cognito User Pool
awslocal cognito-idp create-user-pool \
  --pool-name encore-users \
  --auto-verified-attributes email \
  --username-attributes email \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }'

echo "LocalStack initialization complete!"
