/*
 * Represents an Annex B (B) byte stream that encodes NAL Units. In the Annex B byte stream NAL Units are prefixed by
 * a 3 byte start code prefix. The actual NAL Unit payload data is interleaved with 'emulation prevention' bytes.
 */
var AnnexBNALUnitReader = (function () {
	var ptr = null;
	function constructor(ptr) {
		this.ptr = ptr;
	}

	constructor.prototype = {
	
	ReadNALUnit: function() {
	    if (this.ptr == null) {
	        return null;
	    }
		var res = this.findNextAnnexBNALUnit(this.ptr);
		this.ptr = res.next;
		return new NALUnit(res.nal);
	},
	
    /*
	 * Finds the next NAL unit from an Annex B byte stream.
	 */
    findNextAnnexBNALUnit: function findNextAnnexBNALUnit (ptr) {
		var i = 0, size = ptr.length;

	    /* look for start_code_prefix */
	    while (ptr[i] == 0 && i < size) {
	        i += 1;
	    }
	    if (i >= size) {
	    	error("cannot find any start_code_prefix");
	    } else if (ptr[i] != 0x1) {
	    	/* start_code_prefix is not at the beginning, continue */
	    	i = -1; 
	    }
	    i++;
	    var j = i, start = i, end = start, foundStartCode = 0;
	    while (!foundStartCode) {
	        while ((j + 1 < size) && (ptr[j] != 0 || ptr[j + 1] != 0)) { /* see 2 consecutive zero bytes */
	            j += 1;
	        }
	        end = j; /* stop and check for start code */
	        while (j + 2 < size && ptr[j + 2] == 0) { /* keep reading for zero byte */
	            j += 1;
	        }
	        if (j + 2 >= size) {
	            size -= start;
	            return {nal: ptr.subarray(start, start + size), next: null};
	        }
	        if (ptr[j + 2] == 0x1) {
	            foundStartCode = 1;
	        } else {
	            /* could be emulation code 0x3 */
	            j += 2; /* continue the search */
	        }
	    }
	    size = end - start;
	    return {nal: ptr.subarray(start, start + size), next: ptr.subarray(end)};
	}};
	
	return constructor;
})();

/*
 * Indicates the type of the NAL Unit. The decoder needs to know how slices are coded. Some information can change from
 * slice to slice and can be encoded in each slice. Other information such as coding parameters, picture format, size,
 * type of entropy coder, bit rate, etc. does not change as often and does not need to be retransmitted as often.
 * 
 * Combinations of coding parameters are stored on both the encoder and decoder side in various tables.
 * 
 * There are two parameter sets:
 *   Picture Parameter Set (PPS) contains information about the slices of one or more pictures.
 *   Sequence Parameter Set (SPS) contains information about the sequence.
 *   
 * Instantaneous Decoding Refresh (IDR) picture contains only slices with I and SI slice types. IDR pictures invalidate
 * all reference pictures in the buffer prior to itself and can thus confine drifting errors. IDR pictures are always
 * the first in a sequence of pictures.
 * 
 * Baseline Profile and Main Profile does not include NAL Unit Types: 2, 3, 4.
 */
NALU_TYPE = {
    SLICE : 1,
    DPA : 2,
    DPB : 3,
    DPC : 4,
    IDR : 5,
    SEI : 6,
    SPS : 7,
    PPS : 8,
    AUD : 9,
    EOSEQ : 10,
    EOSTREAM : 11,
    FILL : 12,
    PREFIX : 14,
    SUB_SPS : 15,
    SLC_EXT : 20,
    VDRD : 24
};

/*
 * Indicates the importance of the NAL Unit for the reconstruction process. The higher the value the more important
 * the NAL Unit. For instance, a value of 0 indicates that the NAL Unit is not used as a reference by any other units
 * can be safely discarded.
 */
NALU_REF_IDC = {
    NALU_PRIORITY_HIGHEST : 3,
    NALU_PRIORITY_HIGH : 2,
    NALU_PRIORITY_LOW : 1,
    NALU_PRIORITY_DISPOSABLE : 0
};
    
/*
 * Represents a NAL (Network Abstraction Layer) Unit
 * 
 * NAL Unit Header Format:
 * 
 * forbidden_zero_bit (F):
 *   Usually set to 0 at source, set to 1 to indicate errors in the NAL Unit.
 * 
 * nal_ref_idc (NRI):
 *   Indicates the importance of the NAL Unit, from 0 (low) to 3 (high).
 * 
 * nal_unit_type (TYPE):
 *   Indicates the type of the NAL Unit. Although this field encodes 32 possible values, only 12 are used by H.264.
 * 
 * Payload:
 *   A buffer that contains an encapsulated byte sequence payload (EBSP) which needs to be decoded to a 
 *   raw byte sequence payload (RBSP) before further processing.
 * 
 *  <1> <-2-> <-----5-----> <--------- ? --------->
 * +---+-----+-------------+-----------------------+
 * | F | NRI | TYPE        | Payload               |
 * +---+-----+-------------+-----------------------+
 *  
 */
var NALUnit = (function () {
	function constructor(ptr) {
		var forbidden_zero_bit;
		if (ptr.length == 0) {
			unexpected();
		} else {
	        forbidden_zero_bit = ptr[0] >> 7;
	        if (forbidden_zero_bit != 0) {
	        	unexpected();
	        }
	        this.ref_idc = (ptr[0] & 0x60) >> 5;
	        this.type = ptr[0] & 0x1F;
	        this.rbsp = ptr.subarray(1, 1 + convertEBSPToRBSP(ptr.subarray(1)));
	        return;
	    }
	}
	
	/*
	 * Converts an encapsulated byte sequence payload (EBSP) to a raw byte sequence payload (RBSP).
	 */
    function convertEBSPToRBSP(ptr) {
        var j = 0;
        var count = 0;
        var size = ptr.length;
        for (var i = 0; i < size; i++) {
            var x = ptr[i];
            if (count == 2 && x == 0x03) {
                i += 1;
                count = 0;
            }
            ptr[j++] = x;
            if (x == 0x00) {
                count += 1;
            } else {
                count = 0;
            }
        }
        return j;
    }

	constructor.prototype = {
		toString: function toString() {
			return getProperties(this);
		},
		decode: function() {
		    switch (this.type) {
		        case NALU_TYPE.SPS:
		            return new SPS(this.rbsp);
		        default:
		            return null;
		            // unexpected();
		    }
		}
	};
	
	return constructor;
})();


/*
 * Represents a Sequence Parameter Set (SPS)
 *
 */
var SPS = (function () {
    function constructor(ptr) {
        
    }
    return constructor;
})();

function printNALUnit(nalu) {
	
}

function getAllAnnexBNALUnits(ptr) {
	var reader = new AnnexBNALUnitReader(ptr);
	
	var i = 0;
	do {
		var nal = reader.ReadNALUnit();
		if (nal != null) {
		    println ("NAL: " + (i++) + " " + nal.toString());
		    var pay = nal.decode();
		    if (pay != null) {
		        println ("PAY: " + pay.toString());
		    }
		}
	} while (nal != null);
}


function Stream(buf) {
	this.buf = buf;
	this.ptr = new Uint8Array(buf);
	this.pos = 0;
}

Stream.prototype = {
	getBits: function() {
		return this.buf[this.pos ++];
	}	
};

println("\n============================ \n");

// var stream = new Stream(read("Media/test_cat2.h264"));
var stream = new Stream(read("Media/admiral.264"))

time = new Date();
getAllAnnexBNALUnits(stream.ptr);
println("Elapsed: " + (new Date().getTime() - time.getTime()) + " ms");

println("\n============================ \n");