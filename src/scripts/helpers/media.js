import path from "path";
import fs from "fs";

/**
 * Upload media file if it exists
 * Returns the media ID if successful, null otherwise
 */
export async function uploadMediaIfNeeded(
  payload,
  filePath,
  tenantId,
  alt = "Media file",
  tenantCode
) {
  if (!filePath || typeof filePath !== "string") {
    return null;
  }

  const projectRoot = process.cwd();
  let fullPath;

  // If filePath starts with "/", treat as local file in public directory
  if (filePath.startsWith("/")) {
    const relativePath = filePath.replace(/^\//, "");
    
    if (tenantCode) {
      // Try tenant-specific path first: /public/sync-assets/<tenant>/image.jpg
      const tenantAssetPath = path.join(
        projectRoot,
        "public",
        "sync-assets",
        tenantCode,
        relativePath
      );

      if (fs.existsSync(tenantAssetPath)) {
        fullPath = tenantAssetPath;
        console.log(`   📍 Found tenant asset: ${tenantAssetPath}`);
      } else {
        // Fallback to root public: /public/image.jpg
        const rootPublicPath = path.join(projectRoot, "public", relativePath);
        if (fs.existsSync(rootPublicPath)) {
          fullPath = rootPublicPath;
          console.log(`   📍 Found root public asset: ${rootPublicPath}`);
        } else {
          fullPath = tenantAssetPath; // Use tenant path for error message
        }
      }
    } else {
      // No tenant code, try root public
      fullPath = path.join(projectRoot, "public", relativePath);
    }
  } else {
    // Absolute or relative path
    fullPath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
  }

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Media file not found: ${fullPath}`);
    return null;
  }

  try {
    const fileName = path.basename(fullPath);
    console.log(`   📤 Processing media: ${fileName}`);

    // Check if media already exists
    const existingMedia = await payload.find({
      collection: "media",
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { filename: { equals: fileName } },
        ],
      },
      limit: 1,
      depth: 0,
    });

    if (existingMedia.docs.length > 0) {
      console.log(
        `   ✓ Media already exists: ${fileName} (ID: ${existingMedia.docs[0].id})`
      );
      return existingMedia.docs[0].id;
    }

    // Upload media
    console.log(`   📤 Uploading media: ${fileName}...`);
    const fileStream = fs.createReadStream(fullPath);
    
    const uploadedMedia = await payload.create({
      collection: "media",
      data: {
        tenant: tenantId,
        alt: alt || fileName,
      },
      file: fileStream,
    });

    console.log(
      `   ✓ Uploaded media: ${fileName} (ID: ${uploadedMedia.id})`
    );
    return uploadedMedia.id;
  } catch (err) {
    console.error(`   ✗ Failed to upload media ${fullPath}:`, err.message);
    if (err.stack) console.error(`   Stack: ${err.stack}`);
    return null;
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension) {
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
}
