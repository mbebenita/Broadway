var mapLev2Idx = new Uint8Array([ 255, 255, 255, 255, 255, 255, 255, 255, 255,
        1, 0, 1, 2, 3, 255, 255, 255, 255, 255, 255, 4, 5, 6, 255, 255, 255,
        255, 255, 255, 255, 7, 8, 9, 255, 255, 255, 255, 255, 255, 255, 10, 11,
        12, 255, 255, 255, 255, 255, 255, 255, 13, 14, 255, 255, 255, 255, 255,
        255, 255, 255 ]);

const MAX_NUM_SLICE_GROUP = 8;


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
