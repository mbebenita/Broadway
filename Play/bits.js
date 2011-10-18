/*
 * Represents a bit stream view over a RBSP buffer. 
 */
var Bitstream = (function () {
    function constructor(ptr) {
        this.incnt = 0;
        this.incnt_next = 0;
        this.bitcnt = 0;
        this.curr_word = this.next_word = 0;
        this.read_pos = 0;
        this.buffer = ptr;
        
        printArray(ptr);
    }
    
    constructor.prototype.flushBits = function (n) {
        this.bitcnt += n;
        this.incnt -= n;
        this.curr_word <<= n;
    };
    
    constructor.prototype.fillCache = function () {
        var buffer = this.buffer;
        var num_bits;

        this.curr_word |= (this.next_word >>> this.incnt);   // this.incnt cannot be 32
        this.next_word <<= (31 - this.incnt);
        this.next_word <<= 1;
        num_bits = this.incnt_next + this.incnt;
        if (num_bits >= 32) {
            this.incnt_next -= (32 - this.incnt);
            this.incnt = 32;
        }

        var pos = this.read_pos;
        
        if (this.read_pos > buffer.length - 4) {
            if (this.data_end_pos <= this.read_pos) {
                this.incnt = num_bits;
                this.incnt_next = 0;
            }
            this.next_word = 0;
            for (var i = 0; i < this.data_end_pos - this.read_pos; i++) {
                this.next_word |= (v[pos + i] << ((3 - i) << 3));
            }
            this.read_pos = this.data_end_pos;
            this.curr_word |= (this.next_word >> num_bits);
            this.next_word <<= (31 - num_bits);
            this.next_word <<= 1;
            num_bits = i << 3;
            this.incnt += this.incnt_next;
            this.incnt_next = num_bits - (32 - this.incnt);
            if (this.incnt_next < 0) {
                this.incnt +=  num_bits;
                this.incnt_next = 0;
            } else {
                this.incnt = 32;
            }
            return;
        }
        
        this.next_word = (buffer[pos] << 24 | (buffer[pos + 1] << 16) | (buffer[pos + 2] << 8) | buffer[pos + 3]);
        this.read_pos += 4;

        this.curr_word |= (this.next_word >>> num_bits); // this is safe
        this.next_word <<= (31 - num_bits);
        this.next_word <<= 1;
        this.incnt_next += this.incnt;
        this.incnt = 32;
    };
    
    /*
     * Reads up to one machine word.
     */
    constructor.prototype.readBits = function (n) {
        if (this.incnt < n) {
            this.fillCache();
        }
        var bits = this.curr_word >>> (32 - n);
        this.flushBits(n);
        return bits;
    };
    
    /*
     * Reads up to one machine word but does not advance.
     */
    constructor.prototype.peekBits = function (n) {
        if (this.incnt < n) {
            this.fillCache();
        }
        return this.curr_word >>> (32 - n);
    };
    
    /*
     * Reads a single bit.
     */
    constructor.prototype.readBit = function () {
        if (this.incnt < 1) {
            this.fillCache();
        }
        var bit = this.curr_word >>> 31;
        this.flushBits(1);
        return bit;
    };
    
    /*
     * Exponential-Golomb Coding:
     * See algorithm in Section 9.1, Table 9-1, Table 9-2.
     * 
     *  Pattern    Code
     *  
     *     1          0
     *    01X       1,2
     *   001XX      3,6
     *  0001XXX    7,14
     * 00001XXXX  15,30
     * .........  .....
     * 
     * Code = 2 ^ (z) - 1 + readBits(z), where n is the number of leading zeros up until the first 1 bit, and
     * readBits(z) are the z bits following the first bit 1.
     * 
     */
    
    /* Unsigned Exponential-Golomb Coding for 16 bit values. */ 
    constructor.prototype.uev = function () {
        var temp = this.peekBits(16);
        var leading_zeros = countLeadingZeros16(temp | 0x1);
        if (leading_zeros < 8) {
            var code = (temp >>> (15 - (leading_zeros << 1))) - 1;
            this.flushBits((leading_zeros << 1) + 1);
            return code;
        }
        return this.readBits((leading_zeros << 1) + 1) - 1;
    };
    
    /* Signed Exponential-Golomb Coding for 16 bit values. */
    constructor.prototype.sev = function () {
        var temp = this.peekBits(16);
        var leading_zeros = countLeadingZeros16(temp | 0x1);
        if (leading_zeros < 8) {
            temp >>>= (15 - (leading_zeros << 1));
            this.flush((leading_zeros << 1) + 1);
        } else {
            temp = this.readBits((leading_zeros << 1) + 1);
        }
        var ret = temp >>> 1;
        if (temp & 0x01) {
            ret = -ret;
        }
        return ret;
    };
    
    /* Read Exponential-Golomb 32 bit values with range from -2^31 to 2^31-1. */
    constructor.prototype.readEBBits32 = function () {
        var bit = this.readBit();
        var leading_zeros = 0;
        while(!bit) {
            leading_zeros += 1;
            bit = this.readBit();
        }
        
        if (leading_zeros > 0) {
            return this.readBits(leading_zeros);
        }
        return 0;
    };

    /* Signed Exponential-Golomb Coding for 32 bit values. */
    constructor.prototype.sev32 = function () {
        var bit = this.readBit();
        var leading_zeros = 0;
        while(!bit) {
            leading_zeros += 1;
            bit = this.readBit();
        }
        
        var bits = 0;
        if (leading_zeros > 0) {
            bits = this.readBits(leading_zeros);
        }
        
        var code = (1 << leading_zeros) - 1 + bits;
        var value = (code + 1) / 2;

        if ((code & 0x01) == 0) {
            value = -value;
        }
        return value;
    };

    return constructor;
})();