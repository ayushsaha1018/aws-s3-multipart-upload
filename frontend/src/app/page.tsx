"use client";

import React, { useState } from "react";
import axios from "axios";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUplaoding, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

  const handleUpload = async (file: any) => {
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;

    try {
      setIsUploading(true);

      if (file.size < CHUNK_SIZE) {
        return await singleFileUpload(fileName, file);
      } else {
        return await multipartFileUpload(fileName, file);
      }
    } catch (error: any) {
      console.error("Upload failed: ", error);
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const singleFileUpload = async (fileName: string, file: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/single-upload`,
        {
          fileName,
          contentType: file.type,
        }
      );

      const { url, publicLink } = response.data.data;

      const uploadResponse = await axios.put(url, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      if (uploadResponse.status === 200) {
        alert("File uploaded successfully.");
        return publicLink;
      } else {
        throw new Error("Upload failed.");
      }
    } catch (error: any) {
      console.error("Single file upload failed: ", error);
      throw error;
    }
  };

  const multipartFileUpload = async (fileName: string, file: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/start-multipart-upload`,
        {
          fileName,
          contentType: file.type,
        }
      );

      const { uploadId } = response.data.data;
      const totalSize = file.size;
      const numChunks = Math.ceil(totalSize / CHUNK_SIZE);

      const presignedUrlsResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/generate-presigned-url`,
        {
          fileName,
          uploadId,
          partNumbers: numChunks,
        }
      );

      const presignedUrls = presignedUrlsResponse.data.data.url;

      const parts = await uploadChunks(file, presignedUrls);

      const completeUploadResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/complete-multipart-upload`,
        {
          fileName,
          uploadId,
          parts,
        }
      );

      if (completeUploadResponse.status === 200) {
        alert("File uploaded successfully.");
        return completeUploadResponse.data.data.publicLink;
      } else {
        throw new Error("Upload failed.");
      }
    } catch (error: any) {
      console.error("Multipart file upload failed: ", error);
      throw error;
    }
  };

  const uploadChunks = async (file: any, presignedUrls: any) => {
    const totalSize = file.size;
    const numChunks = presignedUrls.length;

    const uploadPromises = [];
    const parts: any = [];

    for (let i = 0; i < numChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalSize);
      const chunk = file.slice(start, end);
      const presignedUrl = presignedUrls[i];

      uploadPromises.push(
        axios.put(presignedUrl, chunk, {
          headers: {
            "Content-Type": file.type,
          },
        })
      );
    }

    const uploadResponses = await Promise.all(uploadPromises);

    uploadResponses.forEach((response: any) => {
      parts.push({
        etag: response.headers.etag,
      });
    });

    return parts;
  };

  return (
    <div>
      <h1>Multipart Upload</h1>
      <br></br>
      {/* Input field to select file */}
      <input type="file" onChange={handleFileChange} name="file" id="myFile" />
      {/* Button to upload file */}
      <button
        onClick={() => handleUpload(file)}
        disabled={isUplaoding}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        {isUplaoding ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
