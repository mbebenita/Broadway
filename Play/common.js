mapLev2Idx = new Uint8Array([ 255, 255, 255, 255, 255, 255, 255, 255, 255, 1,
        0, 1, 2, 3, 255, 255, 255, 255, 255, 255, 4, 5, 6, 255, 255, 255, 255,
        255, 255, 255, 7, 8, 9, 255, 255, 255, 255, 255, 255, 255, 10, 11, 12,
        255, 255, 255, 255, 255, 255, 255, 13, 14, 255, 255, 255, 255, 255,
        255, 255, 255 ]);

const MAX_NUM_SLICE_GROUP = 8;

function countLeadingZeros32(x) {
    if (!x) {
        return 32;
    }
    var e = 31;
    if (x & 0xFFFF0000) {
        e -= 16;
        x >>= 16;
    }
    if (x & 0x0000FF00) {
        e -= 8;
        x >>= 8;
    }
    if (x & 0x000000F0) {
        e -= 4;
        x >>= 4;
    }
    if (x & 0x0000000C) {
        e -= 2;
        x >>= 2;
    }
    if (x & 0x00000002) {
        e -= 1;
    }
    return e;
}

function countLeadingZeros32Ex(x) {
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

function clz(x) {
    var z = 0;
    while ((x & 0x8000) == 0) {
        x <<= 1;
        z++;
    }
    return z;
}
