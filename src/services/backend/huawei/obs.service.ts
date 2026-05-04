import axios from "axios";
import ObsClient from "esdk-obs-nodejs";

const access_key =
  process.env.OBS_ACCESS_KEY || process.env.OBS_ACCOUNT_ID || "";
const secret_key = process.env.OBS_SECRET_KEY || "";

const obsClient =
  access_key && secret_key
    ? new ObsClient({
        access_key_id: access_key,
        secret_access_key: secret_key,
        server:
          process.env.OBS_ENDPOINT || "obs.ap-southeast-2.myhuaweicloud.com",
      })
    : null;

export const ObsService = {
  /**
   * Upload file to OBS
   * @param bucket Bucket name
   * @param key File path in bucket
   * @param sourceFile Buffer or local path
   * @param contentType MIME type
   */
  async uploadFile(
    bucket: string,
    key: string,
    sourceFile: Buffer,
    contentType: string,
  ) {
    let targetBucket = bucket || process.env.OBS_BUCKET_NAME || "";

    if (!targetBucket && process.env.OBS_DOMAIN) {
      targetBucket = process.env.OBS_DOMAIN.split(".")[0];
    }

    // If we have SDK and Keys, use them
    if (obsClient) {
      try {
        const res = await obsClient.putObject({
          Bucket: targetBucket,
          Key: key,
          Body: sourceFile,
          ContentType: contentType,
        });

        if (res.CommonMsg.Status < 300) {
          const domain =
            process.env.OBS_DOMAIN || "obs.ap-southeast-2.myhuaweicloud.com";
          return {
            success: true,
            url: `https://${targetBucket}.${domain}/${key}`,
          };
        }
        throw new Error(
          `OBS SDK Upload failed: ${res.CommonMsg.Code} - ${res.CommonMsg.Message}`,
        );
      } catch (error: any) {
        console.error("OBS SDK Error:", error);
        // If it's a "Bucket is required" or Auth error, try fallback to direct axios PUT
      }
    }

    // Fallback or Direct: Use Axios PUT if the bucket is publicly writable or using a proxy URL
    const bucketUrl = process.env.OBS_BUCKET_URL;
    if (bucketUrl && bucketUrl !== "error") {
      try {
        await axios.put(`${bucketUrl}/${key}`, sourceFile, {
          headers: { "Content-Type": contentType },
        });
        return {
          success: true,
          url: `${bucketUrl}/${key}`,
        };
      } catch (axiosError: any) {
        console.error("Direct Upload Error:", axiosError.message);
        throw new Error(
          axiosError.response?.data || axiosError.message || "Upload failed",
        );
      }
    }

    throw new Error(
      "Missing OBS Keys and no valid Bucket URL for direct upload.",
    );
  },

  /**
   * Delete file from OBS
   */
  async deleteFile(bucket: string, key: string) {
    let targetBucket = bucket || process.env.OBS_BUCKET_NAME || "";
    if (!targetBucket && process.env.OBS_DOMAIN) {
      targetBucket = process.env.OBS_DOMAIN.split(".")[0];
    }

    if (!targetBucket) return;

    try {
      await obsClient.deleteObject({
        Bucket: targetBucket,
        Key: key,
      });
    } catch (error) {
      console.warn("OBS Delete Error:", error);
    }
  },
};
