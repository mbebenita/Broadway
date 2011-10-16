NALU_TYPE = {
	NALU_TYPE_SLICE : 1,
	NALU_TYPE_DPA : 2,
	NALU_TYPE_DPB : 3,
	NALU_TYPE_DPC : 4,
	NALU_TYPE_IDR : 5,
	NALU_TYPE_SEI : 6,
	NALU_TYPE_SPS : 7,
	NALU_TYPE_PPS : 8,
	NALU_TYPE_AUD : 9,
	NALU_TYPE_EOSEQ : 10,
	NALU_TYPE_EOSTREAM : 11,
	NALU_TYPE_FILL : 12,
	NALU_TYPE_PREFIX : 14,
	NALU_TYPE_SUB_SPS : 15,
	NALU_TYPE_SLC_EXT : 20,
	NALU_TYPE_VDRD : 24
};

NALU_REF_IDC = {
	NALU_PRIORITY_HIGHEST : 3,
	NALU_PRIORITY_HIGH : 2,
	NALU_PRIORITY_LOW : 1,
	NALU_PRIORITY_DISPOSABLE : 0
};

var AnnexBNALUnitReader = (function () {
	var ptr = null;
	function constructor(ptr) {
		this.ptr = ptr;
	}

	constructor.prototype = {
	
	ReadNALUnit: function() {
		var res = this.findNextAnnexBNALUnit(this.ptr);
		this.ptr = res.next;
		return new NALUnit(res.nal);
	},
	
    /*
	 * Finds the next NAL unit from an AnnexB byte stream.
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

var NALUnit = (function () {
	function constructor(ptr) {
		var forbidden_zero_bit;
		if (ptr.length == 0) {
			error ("forbidden_zero_bit");
		} else {
	        forbidden_zero_bit = ptr[0] >> 7;
	        if (forbidden_zero_bit != 0) {
	        	unexpected();
	        }
	        this.nal_ref_idc = (ptr[0] & 0x60) >> 5;
	        this.nal_type = ptr[0] & 0x1F;
	        return;
	    }
	}

	constructor.prototype = {
		toString: function toString() {
			return getProperties(this);
		}
	};
	
	return constructor;
})();

function printNALUnit(nalu) {
	
}

function getAllAnnexBNALUnits(ptr) {
	var reader = new AnnexBNALUnitReader(ptr);
	
	var i = 0;
	do {
		var nal = reader.ReadNALUnit();
		println ("NAL: " + (i++) + " " + nal.toString());
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

// var stream = new Stream(read("../Media/test_cat2.h264"));
var stream = new Stream(read("../Media/admiral.264"))

getAllAnnexBNALUnits(stream.ptr);

println("\n============================ \n");