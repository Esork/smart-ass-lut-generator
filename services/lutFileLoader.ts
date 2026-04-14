/**
 * LUT File Loader - Loads and parses 3D LUT files (PNG and .cube formats)
 *
 * Supports:
 * - PNG-based LUTs (32x32 grid flattened as 1024x32 image)
 * - .cube text format (future)
 */

export interface LutData {
  name: string;
  size: number;
  data: Uint8ClampedArray; // Flattened RGB data indexed as [b * size * size + g * size + r]
}

/**
 * Load an image-based LUT (PNG).
 * Expects a 1024x32 image representing a 32³ LUT flattened.
 * The LUT is stored as sequential blocks in the X direction (B plane slices).
 *
 * Format: Each block is 32x32, and there are 32 blocks (for B=0..31)
 * Block layout: (B, Y) → pixel (B*32 + X, Y)
 *   where X is the red index (0-31) and Y is the green index (0-31)
 *   The blue value at each pixel is the block index B.
 */
export const loadPngLut = (imageData: ImageData, name: string): LutData => {
  const { width, height, data } = imageData;

  // Expect 1024x32 (32 blocks of 32x32)
  if (width !== 1024 || height !== 32) {
    throw new Error(`Invalid LUT dimensions: expected 1024x32, got ${width}x${height}`);
  }

  const LUT_SIZE = 32;
  const lutData = new Uint8ClampedArray(LUT_SIZE * LUT_SIZE * LUT_SIZE * 3);

  // Parse flattened image into 3D LUT
  // data is RGBA, but we only need RGB
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = (y * width + x) * 4;
      const r = data[pixelIdx];
      const g = data[pixelIdx + 1];
      const b = data[pixelIdx + 2];

      // Map image coordinates to LUT indices
      // x=0-31 is Red for block 0 (B=0)
      // x=32-63 is Red for block 1 (B=1)
      // etc.
      const blockIdx = Math.floor(x / 32); // Which B plane (0-31)
      const xInTile = x % 32;              // Red index (0-31)
      const yInTile = y;                   // Green index (0-31)

      // Store in LUT
      const lutIdx = (blockIdx * LUT_SIZE * LUT_SIZE + yInTile * LUT_SIZE + xInTile) * 3;
      lutData[lutIdx]     = r;   // Output R
      lutData[lutIdx + 1] = g;   // Output G
      lutData[lutIdx + 2] = b;   // Output B
    }
  }

  return { name, size: LUT_SIZE, data: lutData };
};

/**
 * Load LUT from a URL (file path)
 */
export const loadLutFromUrl = async (url: string, name: string): Promise<LutData> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      try {
        const lut = loadPngLut(imageData, name);
        resolve(lut);
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

/**
 * Load LUT from a File object (drag-drop or file picker)
 */
export const loadLutFromFile = (file: File): Promise<LutData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
          const lut = loadPngLut(imageData, file.name.replace(/\.[^/.]+$/, ''));
          resolve(lut);
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image data'));
      img.src = e.target.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Preload default LUTs from the luts folder
 */
export const preloadDefaultLuts = async (): Promise<Map<string, LutData>> => {
  const luts = new Map<string, LutData>();

  try {
    // Load AgX default LUT
    const agxLut = await loadLutFromUrl('/luts/AgX-default_contrast.lut.png', 'AgX');
    luts.set('agx', agxLut);
  } catch (e) {
    console.warn('Failed to preload default LUTs:', e);
  }

  return luts;
};
