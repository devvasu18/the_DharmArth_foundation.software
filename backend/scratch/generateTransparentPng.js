const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
function makeCRCTable() {
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

const crcTable = makeCRCTable();

function crc32(buffer) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buffer.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ buffer[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

// Function to create a PNG chunk
function createChunk(type, data) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    
    // CRC is calculated over chunk type + chunk data
    const crcData = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(crcData), 0);

    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generateWhiteCrossPng() {
    console.log("Generating 96x96 true transparent PNG with a white medical cross...");
    const width = 96;
    const height = 96;

    // PNG signature
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // IHDR Chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);       // Width
    ihdrData.writeUInt32BE(height, 4);      // Height
    ihdrData.writeUInt8(8, 8);              // Bit depth (8 bits per channel)
    ihdrData.writeUInt8(6, 9);              // Color type (6 = RGBA)
    ihdrData.writeUInt8(0, 10);             // Compression method (0 = deflate)
    ihdrData.writeUInt8(0, 11);             // Filter method (0 = standard)
    ihdrData.writeUInt8(0, 12);             // Interlace method (0 = no interlace)
    const ihdrChunk = createChunk('IHDR', ihdrData);

    // Create pixel data buffer
    // For RGBA color type, each pixel is 4 bytes: R, G, B, A
    // Each scanline is prefixed with a 1-byte filter type (0 = None)
    const scanlineSize = 1 + width * 4;
    const uncompressedData = Buffer.alloc(height * scanlineSize);

    for (let y = 0; y < height; y++) {
        const rowStart = y * scanlineSize;
        uncompressedData.writeUInt8(0, rowStart); // Filter type: None

        for (let x = 0; x < width; x++) {
            const pixelIndex = rowStart + 1 + x * 4;

            // Determine if coordinates are inside the medical cross
            // Vertical bar: x from 38 to 57 inclusive (width 20), y from 18 to 77 inclusive (height 60)
            const inVertical = (x >= 38 && x <= 57) && (y >= 18 && y <= 77);
            
            // Horizontal bar: x from 18 to 77 inclusive (width 60), y from 38 to 57 inclusive (height 20)
            const inHorizontal = (x >= 18 && x <= 77) && (y >= 38 && y <= 57);

            if (inVertical || inHorizontal) {
                // White color with full opacity
                uncompressedData.writeUInt8(255, pixelIndex);     // R
                uncompressedData.writeUInt8(255, pixelIndex + 1); // G
                uncompressedData.writeUInt8(255, pixelIndex + 2); // B
                uncompressedData.writeUInt8(255, pixelIndex + 3); // A
            } else {
                // Transparent background
                uncompressedData.writeUInt8(0, pixelIndex);       // R
                uncompressedData.writeUInt8(0, pixelIndex + 1);   // G
                uncompressedData.writeUInt8(0, pixelIndex + 2);   // B
                uncompressedData.writeUInt8(0, pixelIndex + 3);   // A
            }
        }
    }

    // Compress pixel data using zlib deflate
    const compressedData = zlib.deflateSync(uncompressedData);
    const idatChunk = createChunk('IDAT', compressedData);

    // IEND Chunk
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    // Combine all chunks
    const pngBuffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);

    // Save to the mobile assets folder
    const targetPath = path.join(__dirname, '../../mobile/assets/notification-icon.png');
    fs.writeFileSync(targetPath, pngBuffer);
    
    console.log(`✅ Success! Generated PNG saved to: ${targetPath}`);
    console.log(`File size is: ${pngBuffer.length} bytes (ideal for small icons!)`);
}

generateWhiteCrossPng();
