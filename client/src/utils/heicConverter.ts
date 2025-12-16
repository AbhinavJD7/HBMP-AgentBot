// Lazy load heic-to to reduce initial bundle size (2.18 MB)
// Only load when HEIC files are actually detected

/**
 * Check if a file is in HEIC format
 * @param file - The file to check
 * @returns Promise<boolean> - True if the file is HEIC
 */
export const isHEICFile = async (file: File): Promise<boolean> => {
  // Fast path: check mime type first (no library needed)
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    return true;
  }
  
  // Check file extension as fallback
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
    return true;
  }
  
  // Only load heic-to library if we suspect it might be HEIC
  // This avoids loading 2.18 MB unless actually needed
  try {
    const { isHeic } = await import('heic-to');
    return await isHeic(file);
  } catch (error) {
    console.warn('Error checking if file is HEIC:', error);
    return false;
  }
};

/**
 * Convert HEIC file to JPEG
 * @param file - The HEIC file to convert
 * @param quality - JPEG quality (0-1), default is 0.9
 * @param onProgress - Optional callback to track conversion progress
 * @returns Promise<File> - The converted JPEG file
 */
export const convertHEICToJPEG = async (
  file: File,
  quality: number = 0.9,
  onProgress?: (progress: number) => void,
): Promise<File> => {
  try {
    // Report conversion start
    onProgress?.(0.3);

    // Lazy load heic-to only when conversion is actually needed
    const { heicTo } = await import('heic-to');
    
    const convertedBlob = await heicTo({
      blob: file,
      type: 'image/jpeg',
      quality,
    });

    // Report conversion completion
    onProgress?.(0.8);

    // Create a new File object with the converted blob
    const convertedFile = new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });

    // Report file creation completion
    onProgress?.(1.0);

    return convertedFile;
  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    throw new Error('Failed to convert HEIC image to JPEG');
  }
};

/**
 * Process a file, converting it from HEIC to JPEG if necessary
 * @param file - The file to process
 * @param quality - JPEG quality for conversion (0-1), default is 0.9
 * @param onProgress - Optional callback to track conversion progress
 * @returns Promise<File> - The processed file (converted if it was HEIC, original otherwise)
 */
export const processFileForUpload = async (
  file: File,
  quality: number = 0.9,
  onProgress?: (progress: number) => void,
): Promise<File> => {
  const isHEIC = await isHEICFile(file);

  if (isHEIC) {
    console.log('HEIC file detected, converting to JPEG...');
    return convertHEICToJPEG(file, quality, onProgress);
  }

  return file;
};
