import { writeFileSync } from 'fs';

// Simple 1x1 green pixel PNG, scaled
const createIcon = (size) => {
  // Minimal PNG with green color
  const png = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, size, // width
    0x00, 0x00, 0x00, size, // height  
    0x08, 0x02, // bit depth, color type (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
  ]);
  return png;
};

// For now just create empty files as placeholders
writeFileSync('icon16.png', Buffer.alloc(0));
writeFileSync('icon48.png', Buffer.alloc(0));
writeFileSync('icon128.png', Buffer.alloc(0));
console.log('Created placeholder icons');
