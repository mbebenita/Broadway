var mapLev2Idx = new Uint8Array([
    255, 255, 255, 255, 255, 255, 255, 255, 255, 1, 0, 1, 2, 3, 255, 255, 255, 255, 255,
    255, 4, 5, 6, 255, 255, 255, 255, 255, 255, 255, 7, 8, 9, 255, 255, 255, 255, 255, 255, 255, 10, 11, 12, 255, 255,
    255, 255, 255, 255, 255, 13, 14, 255, 255, 255, 255, 255, 255, 255, 255
]);

/**
 * Zigzag scan from 1-D to 2-D.
 */
var ZZ_SCAN = new Uint8Array([
    0, 1, 4, 8, 5, 2, 3, 6, 9, 12, 13, 10, 7, 11, 14, 15
]);

/* Zigzag scan from 1-D to 2-D output to block[24][16]. */
var ZZ_SCAN_BLOCK = new Uint8Array([
    0, 1, 16, 32, 17, 2, 3, 18, 33, 48, 49, 34, 19, 35, 50, 51
]);

/**
 * From zigzag to raster for luma DC value
 */
var ZIGZAG2RASTERDC = new Uint8Array([
    0, 4, 64, 128, 68, 8, 12, 72, 132, 192, 196, 136, 76, 140, 200, 204
]);

/**
 * Mapping from coding scan block indx to raster scan block index
 */
var blkIdx2blkX = new Int32Array([
    0, 1, 0, 1, 2, 3, 2, 3, 0, 1, 0, 1, 2, 3, 2, 3
]);

var blkIdx2blkY = new Int32Array([
    0, 0, 1, 1, 0, 0, 1, 1, 2, 2, 3, 3, 2, 2, 3, 3
]);

function convertTo2DUint8Array(array) {
    for (var i = 0; i < array.length; i++) {
        array[i] = new Uint8Array(array[i]);
    }
}

function convertTo2DInt32Array(array) {
    for (var i = 0; i < array.length; i++) {
        array[i] = new Int32Array(array[i]);
    }
}

/**
 * from [blk8indx][blk4indx] to raster scan index
 */
var blkIdx2blkXY = convertTo2DInt32Array([
    [0, 1, 4, 5], [2, 3, 6, 7], [8, 9, 12, 13], [10, 11, 14, 15]
]);

/*
 * Availability of the neighboring top-right block relative to the current block.
 */
var BlkTopRight = new Int32Array([
    2, 2, 2, 3, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0
]);

/**
 * Table 8-13 Specification of QPc as a function of qPI.
 */
var mapQPi2QPc = new Uint8Array([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    24, 25, 26, 27, 28, 29, 29, 30, 31, 32, 32, 33, 34, 34, 35, 35, 36, 36, 37, 37, 37, 38, 38, 38, 39, 39, 39, 39
]);

/**
 * See 8.5.5 equation (8-252 and 8-253) the definition of v matrix.
 * in zigzag scan
 */
var dequant_coefres = convertTo2DInt32Array([
    [10, 13, 13, 10, 16, 10, 13, 13, 13, 13, 16, 10, 16, 13, 13, 16],
    [11, 14, 14, 11, 18, 11, 14, 14, 14, 14, 18, 11, 18, 14, 14, 18],
    [13, 16, 16, 13, 20, 13, 16, 16, 16, 16, 20, 13, 20, 16, 16, 20],
    [14, 18, 18, 14, 23, 14, 18, 18, 18, 18, 23, 14, 23, 18, 18, 23],
    [16, 20, 20, 16, 25, 16, 20, 20, 20, 20, 25, 16, 25, 20, 20, 25],
    [18, 23, 23, 18, 29, 18, 23, 23, 23, 23, 29, 18, 29, 23, 23, 29]
]);

/**
 * From jm7.6 block.c. (in zigzag scan)
 */
var quant_coef = convertTo2DInt32Array([
    [13107, 8066, 8066, 13107, 5243, 13107, 8066, 8066, 8066, 8066, 5243, 13107, 5243, 8066, 8066, 5243],
    [11916, 7490, 7490, 11916, 4660, 11916, 7490, 7490, 7490, 7490, 4660, 11916, 4660, 7490, 7490, 4660],
    [10082, 6554, 6554, 10082, 4194, 10082, 6554, 6554, 6554, 6554, 4194, 10082, 4194, 6554, 6554, 4194],
    [9362, 5825, 5825, 9362, 3647, 9362, 5825, 5825, 5825, 5825, 3647, 9362, 3647, 5825, 5825, 3647],
    [8192, 5243, 5243, 8192, 3355, 8192, 5243, 5243, 5243, 5243, 3355, 8192, 3355, 5243, 5243, 3355],
    [7282, 4559, 4559, 7282, 2893, 7282, 4559, 4559, 4559, 4559, 2893, 7282, 2893, 4559, 4559, 2893]
]);

/**
 * Convert scan from raster scan order to block decoding order and from block decoding order to raster scan order. Same
 * table!!!
 */
var ras2dec = new Uint8Array([
    0, 1, 4, 5, 2, 3, 6, 7, 8, 9, 12, 13, 10, 11, 14, 15
]);

/**
 * mapping from level_idc to index map
 */
var mapLev2Idx = new Uint8Array([
    255, 255, 255, 255, 255, 255, 255, 255, 255, 1, 0, 1, 2, 3, 255, 255, 255, 255, 255,
    255, 4, 5, 6, 255, 255, 255, 255, 255, 255, 255, 7, 8, 9, 255, 255, 255, 255, 255, 255, 255, 10, 11, 12, 255, 255,
    255, 255, 255, 255, 255, 13, 14, 255, 255, 255, 255, 255, 255, 255, 255
]);

/**
 * map back from index to Level IDC
 */
var mapIdx2Lev = new Uint8Array([
    10, 11, 12, 13, 20, 21, 22, 30, 31, 32, 40, 41, 42, 50, 51
]);

/**
 * from the index map to the MaxDPB value times 2
 */
var MaxDPBX2 = new Int32Array([
    297, 675, 1782, 1782, 1782, 3564, 6075, 6075, 13500, 15360, 24576, 24576, 24576, 82620, 138240
]);

/**
 * map index to the max frame size
 */
var MaxFS = new Int32Array([
    99, 396, 396, 396, 396, 792, 1620, 1620, 3600, 5120, 8192, 8192, 8192, 22080, 36864
]);

/**
 * map index to max MB processing rate
 */
var MaxMBPS = new Int32Array([
    1485, 3000, 6000, 11880, 11880, 19800, 20250, 40500, 108000, 216000, 245760, 245760, 491520, 589824, 983040
]);

/**
 * map index to max video bit rate
 */
var MaxBR = new Int32Array([
    64, 192, 384, 768, 2000, 4000, 4000, 10000, 14000, 20000, 20000, 50000, 50000, 135000, 240000
]);

/**
 * map index to max CPB size
 */
var MaxCPB = new Int32Array([
    175, 500, 1000, 2000, 2000, 4000, 4000, 10000, 14000, 20000, 25000, 62500, 62500, 135000, 240000
]);

/**
 * map index to max vertical MV range
 */
var MaxVmvR = new Int32Array([
    64, 128, 128, 128, 128, 256, 256, 256, 512, 512, 512, 512, 512, 512, 512
]);

const MAX_NUM_SLICE_GROUP = 8;

const MAX_DEC_REF_PIC_MARKING = 64;

/**
 * Counts the number of leading zeros in a 32 bit number. This using a kind of
 * binary search. At each level, if the upper half is zero then we count the
 * number of bits in the upper half and shift the lower half of the bits in the
 * upper half, otherwise we just split the upper half again and so on.
 * 
 * @param {Number} x A 32 bit number.
 */
function countLeadingZeros32(x) {
    if (x == 0) {
        return 32;
    }
    var n = 1;
    if (x >>> 16 == 0) {
        n += 16;
        x <<= 16;
    }
    if (x >>> 24 == 0) {
        n += 8;
        x <<= 8;
    }
    if (x >>> 28 == 0) {
        n += 4;
        x <<= 4;
    }
    if (x >>> 30 == 0) {
        n += 2;
        x <<= 2;
    }
    n -= x >>> 31;
    return n;
}

/**
 * Counts the number of leading zeros in a 16 bit number.
 * @see countLeadingZeros32
 * @param {Number} x A 32 bit number.
 */
function countLeadingZeros16(x) {
    if (x == 0) {
        return 16;
    }
    var n = 1;
    if (x >>> 8 == 0) {
        n += 8;
        x <<= 8;
    }
    if (x >>> 12 == 0) {
        n += 4;
        x <<= 4;
    }
    if (x >>> 14 == 0) {
        n += 2;
        x <<= 2;
    }
    n -= x >>> 15;
    return n;
}

function max(x, y) {
    return x > y ? x : y;
}

function min(x, y) {
    return x < y ? x : y;
}

/**
 * Clips x between a and b.
 */
function clip(a, b, x) {
    return max(a, min(x, b));
}
