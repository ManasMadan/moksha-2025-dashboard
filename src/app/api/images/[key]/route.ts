import { NextRequest, NextResponse } from "next/server";
import { Client } from "minio";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "443"),
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
  region: process.env.MINIO_REGION || "",
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "eventimages";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    if (!key) {
      return NextResponse.json(
        { error: "Image key is required" },
        { status: 400 }
      );
    }

    const presignedUrl = await minioClient.presignedGetObject(
      BUCKET_NAME,
      key,
      24 * 60 * 60
    );

    return NextResponse.redirect(presignedUrl);
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to retrieve image" },
      { status: 500 }
    );
  }
}
