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

        ReadNALUnit : function() {
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
        findNextAnnexBNALUnit : function findNextAnnexBNALUnit(ptr) {
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
                /* see 2 consecutive zero bytes */
                while ((j + 1 < size) && (ptr[j] != 0 || ptr[j + 1] != 0)) { 
                    j += 1;
                }
                end = j; /* stop and check for start code */
                /* keep reading for zero byte */
                while (j + 2 < size && ptr[j + 2] == 0) {
                    j += 1;
                }
                if (j + 2 >= size) {
                    size -= start;
                    return {
                        nal : ptr.subarray(start, start + size),
                        next : null
                    };
                }
                if (ptr[j + 2] == 0x1) {
                    foundStartCode = 1;
                } else {
                    /* could be emulation code 0x3 */
                    j += 2; /* continue the search */
                }
            }
            size = end - start;
            return {
                nal : ptr.subarray(start, start + size),
                next : ptr.subarray(end)
            };
        }
    };

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
        toString : function toString() {
            return getProperties(this);
        },
        decode : function() {
            switch (this.type) {
            case NALU_TYPE.SPS:
                return new SPS(this.rbsp);
            case NALU_TYPE.PPS:
                return new PPS(this.rbsp);
            case NALU_TYPE.SLICE:
            case NALU_TYPE.IDR:
                return new SliceHeader(this.rbsp);
            default:
                return null;
                // unexpected();
            }
        }
    };
	
	return constructor;
})();

var Video = (function() {
    function constructor() {
    }
    return constructor;
})();


/**
 * Represents a video decoder capturing all of its internal state. 
 */
var Decoder = (function() {
    function constructor() {
        this.SequenceParameterSets = [];
        this.PictureParameterSets = [];
        this.Video = new Video();
    }
    return constructor;
})();

var decoder = new Decoder();

/**
 * Represents a Sequence Parameter Set (SPS)
 * 
 * Clause 7.4.2.2
 */
var SPS = (function() {
    function constructor(ptr) {
        var stream = new Bitstream(ptr);

        this.profile_idc = stream.readBits(8);
        this.constrained_set0_flag = stream.readBit();
        this.constrained_set1_flag = stream.readBit();
        this.constrained_set2_flag = stream.readBit();
        assert(stream.readBits(5) == 0);
        this.level_idc = stream.readBits(8);
        assertRange(this.level_idc, 0, 51);
        assert(mapLev2Idx[this.level_idc] != 255);
        this.seq_parameter_set_id = stream.uev();
        assertRange(this.seq_parameter_set_id, 0, 31);
        this.log2_max_frame_num_minus4 = stream.uev();
        assertRange(this.log2_max_frame_num_minus4, 0, 12);
        this.pic_order_cnt_type = stream.uev();
        if (this.pic_order_cnt_type == 0) {
            this.log2_max_pic_order_cnt_lsb_minus4 = stream.uev();
        } else if (this.pic_order_cnt_type == 1) {
            this.delta_pic_order_always_zero_flag = stream.readBit();
            this.offset_for_non_ref_pic = stream.sev32();
            this.offset_for_top_to_bottom_field = stream.sev32();
            this.num_ref_frames_in_pic_order_cnt_cycle = stream.uev();
            this.offset_for_ref_frame = [];
            for ( var i = 0; i < this.num_ref_frames_in_pic_order_cnt_cycle; i++) {
                offset_for_ref_frame[i] = stream.sev32();
            }
        }
        this.num_ref_frames = stream.uev();
        assertRange(this.num_ref_frames, 0, 16);
        this.gaps_in_frame_num_value_allowed_flag = stream.readBit();
        this.pic_width_in_mbs_minus1 = stream.uev();

        this.pic_height_in_map_units_minus1 = stream.uev();
        this.frame_mbs_only_flag = stream.readBit();
        this.mb_adaptive_frame_field_flag = 0;
        if (!this.frame_mbs_only_flag) {
            this.mb_adaptive_frame_field_flag = stream.readBit();
        }
        this.direct_8x8_inference_flag = stream.readBit();
        this.frame_cropping_flag = stream.readBit();
        this.frame_crop_left_offset = 0;
        this.frame_crop_right_offset = 0;
        this.frame_crop_top_offset = 0;
        this.frame_crop_bottom_offset = 0;
        if (this.frame_cropping_flag) {
            this.frame_crop_left_offset = stream.uev();
            this.frame_crop_right_offset = stream.uev();
            this.frame_crop_top_offset = stream.uev();
            this.frame_crop_bottom_offset = stream.uev();
        }
        this.vui_parameters_present_flag = stream.readBit();
        if (this.vui_parameters_present_flag) {
            unexpected();
        }
        decoder.SequenceParameterSets[this.seq_parameter_set_id] = this;
    }
    
    constructor.prototype.toString = function () {
        return "SPS: " + getProperties(this, true);
    };
    
    return constructor;
})();

/**
 * Represents a Slice Header
 * 
 * Clause 7.4.3
 */
var SliceHeader = (function() {
    function constructor(ptr) {
        var stream = new Bitstream(ptr);
        
        this.first_mb_in_slice = stream.uev();
        this.slice_type = stream.uev();
        if (this.first_mb_in_slice != 0) {
            notImplemented();
        }
        this.pic_parameter_set_id = stream.uev();
        assertRange(this.pic_parameter_set_id, 0, 255);
        
        var currentPPS = decoder.Video.CurrentPPS = decoder.PictureParameterSets[this.pic_parameter_set_id];
        if (currentPPS == null) {
            unexpected();
        }
        
        var currentSPS = decoder.Video.CurrentSPS = decoder.PictureParameterSets[currentPPS.seq_parameter_set_id];
        if (currentSPS == null) {
            unexpected();
        }
        
        if (currentPPS.seq_parameter_set_id != video.seq_parameter_set_id) {
            notImplemented();
        }
        
        /* derived variables from SPS */
        video.MaxFrameNum = 1 << (currentSPS.log2_max_frame_num_minus4 + 4);
        // MC_OPTIMIZE
        video.PicWidthInMbs = currentSPS.pic_width_in_mbs_minus1 + 1;
        video.PicWidthInSamplesL = video.PicWidthInMbs * 16;
        video.PicWidthInSamplesC = video.PicWidthInMbs * 8;
        video.PicHeightInMapUnits = currentSPS.pic_height_in_map_units_minus1 + 1;
        video.PicSizeInMapUnits = video.PicWidthInMbs * video.PicHeightInMapUnits;
        video.FrameHeightInMbs = (2 - currentSPS.frame_mbs_only_flag) * video.PicHeightInMapUnits;

        /* derived from PPS */
        video.SliceGroupChangeRate = currentPPS.slice_group_change_rate_minus1 + 1;

        this.frame_num = stream.readBits(currentSPS.log2_max_frame_num_minus4 + 4);
        
        if (!currentSPS.frame_mbs_only_flag) {
            this.field_pic_flag = stream.readBit();
            assert (this.field_pic_flag == false);
            if (this.field_pic_flag) {
                unexpected();
            }
        }
        
        /* derived variables from slice header*/
        video.PicHeightInMbs = video.FrameHeightInMbs;
        video.PicHeightInSamplesL = video.PicHeightInMbs * 16;
        video.PicHeightInSamplesC = video.PicHeightInMbs * 8;
        video.PicSizeInMbs = video.PicWidthInMbs * video.PicHeightInMbs;
        
        if (this.first_mb_in_slice >= video.PicSizeInMbs) {
            unexpected();
        }
        video.MaxPicNum = video.MaxFrameNum;
        video.CurrPicNum = this.frame_num;

        if (video.nal_unit_type == NALTYPE.IDR) {
            if (this.frame_num != 0) {
                unexpected();
            }
            this.idr_pic_id = stream.ue_v();
        }
        
        this.delta_pic_order_cnt_bottom = 0; /* default value */
        this.delta_pic_order_cnt[0] = 0; /* default value */
        this.delta_pic_order_cnt[1] = 0; /* default value */
        
        if (currentSPS.pic_order_cnt_type == 0) {
            this.pic_order_cnt_lsb = stream.readBits(currentSPS.log2_max_pic_order_cnt_lsb_minus4 + 4);
            video.MaxPicOrderCntLsb = 1 << (currentSPS.log2_max_pic_order_cnt_lsb_minus4 + 4);
            if (this.pic_order_cnt_lsb > video.MaxPicOrderCntLsb - 1) {
                unexpected();
            }

            if (currentPPS.pic_order_present_flag) {
                notImplemented();
                this.delta_pic_order_cnt_bottom = stream.sev32();
            }
        }
        
        if (currentSPS.pic_order_cnt_type == 1 && !currentSPS.delta_pic_order_always_zero_flag) {
            this.delta_pic_order_cnt[0] = stream.sev32(); 
            if (currentPPS.pic_order_present_flag) {
                this.delta_pic_order_cnt[1] = stream.sev32(); 
            }
        }

        this.redundant_pic_cnt = 0; /* default value */
        if (currentPPS.redundant_pic_cnt_present_flag) {
            // MC_CHECK
            this.redundant_pic_cnt = stream.uev();
            if (this.redundant_pic_cnt > 127) /* out of range */
                unexpected();

            if (this.redundant_pic_cnt > 0) /* redundant picture */
                unexpected(); /* not supported */
        }
        
        this.num_ref_idx_l0_active_minus1 = currentPPS.num_ref_idx_l0_active_minus1;
        this.num_ref_idx_l1_active_minus1 = currentPPS.num_ref_idx_l1_active_minus1;

        if (slice_type == P_SLICE) {
            this.num_ref_idx_active_override_flag = stream.readBit();
            if (this.num_ref_idx_active_override_flag) {
                this.num_ref_idx_l0_active_minus1 = stream.uev();
            } else   {
                /* the following condition is not allowed if the flag is zero */
                if ((slice_type == P_SLICE) && currentPPS.num_ref_idx_l0_active_minus1 > 15) {
                    unexpected(); /* not allowed */
                }
            }
        }

        if (this.num_ref_idx_l0_active_minus1 > 15 || this.num_ref_idx_l1_active_minus1 > 15) {
            unexpected(); /* not allowed */
        }
        
        /* if MbaffFrameFlag =1,
        max value of index is num_ref_idx_l0_active_minus1 for frame MBs and
        2*this.num_ref_idx_l0_active_minus1 + 1 for field MBs */

        /* ref_pic_list_reordering() */
        status = ref_pic_list_reordering(video, stream, this, slice_type);
        if (status != AVCDEC_SUCCESS) {
            return status;
        }


        if (video.nal_ref_idc != 0) {
            dec_ref_pic_marking(video, stream, this);
        }
        this.slice_qp_delta = stream.sev();

        video.QPy = 26 + currentPPS.pic_init_qp_minus26 + this.slice_qp_delta;
        if (video.QPy > 51 || video.QPy < 0) {
            video.QPy = AVC_CLIP3(0, 51, video.QPy);
        }
        video.QPc = mapQPi2QPc[AVC_CLIP3(0, 51, video.QPy + video.currPicParams.chroma_qp_index_offset)];

        video.QPy_div_6 = (video.QPy * 43) >> 8;
        video.QPy_mod_6 = video.QPy - 6 * video.QPy_div_6;

        video.QPc_div_6 = (video.QPc * 43) >> 8;
        video.QPc_mod_6 = video.QPc - 6 * video.QPc_div_6;

        this.slice_alpha_c0_offset_div2 = 0;
        this.slice_beta_offset_div_2 = 0;
        this.disable_deblocking_filter_idc = 0;
        video.FilterOffsetA = video.FilterOffsetB = 0;

        if (currentPPS.deblocking_filter_control_present_flag) {
            this.disable_deblocking_filter_idc = stream.uev();
            if (this.disable_deblocking_filter_idc > 2) {
                unexpected(); /* out of range */
            }
            if (this.disable_deblocking_filter_idc != 1) {
                this.slice_alpha_c0_offset_div2 = stream.sev();
                if (this.slice_alpha_c0_offset_div2 < -6 || this.slice_alpha_c0_offset_div2 > 6) {
                    unexpected();
                }
                video.FilterOffsetA = this.slice_alpha_c0_offset_div2 << 1;
                this.slice_beta_offset_div_2 = stream.sev(); 
                if (this.slice_beta_offset_div_2 < -6 || this.slice_beta_offset_div_2 > 6) {
                    unexpected();
                }
                video.FilterOffsetB = this.slice_beta_offset_div_2 << 1;
            }
        }

        if (currentPPS.num_slice_groups_minus1 > 0 && 
            currentPPS.slice_group_map_type >= 3 &&
            currentPPS.slice_group_map_type <= 5) {
            /* Ceil(Log2(PicSizeInMapUnits/(float)SliceGroupChangeRate + 1)) */
            temp = video.PicSizeInMapUnits / video.SliceGroupChangeRate;
            if (video.PicSizeInMapUnits % video.SliceGroupChangeRate) {
                temp++;
            }
            i = 0;
            temp++;
            while (temp)
            {
                temp >>= 1;
                i++;
            }
            this.slice_group_change_cycle = stream.readBits(i); 
            video.MapUnitsInSliceGroup0 = AVC_MIN(this.slice_group_change_cycle * video.SliceGroupChangeRate, video.PicSizeInMapUnits);
        }
    }
    
    constructor.prototype.toString = function () {
        return "SliceHeader: " + getProperties(this, true);
    };
    
    return constructor;
})();

/**
 * Represents a Picture Parameter Set (PPS)
 * 
 * Clause 7.4.2.2
 */
var PPS = (function() {
    function constructor(ptr) {
        var stream = new Bitstream(ptr);
        this.pic_parameter_set_id = stream.uev();
        assertRange(this.pic_parameter_set_id, 0, 255);
        this.seq_parameter_set_id = stream.uev();
        assertRange(this.seq_parameter_set_id, 0, 31);
        this.entropy_coding_mode_flag = stream.readBit();
        if (this.entropy_coding_mode_flag) {
            unexpected();
        }
        this.pic_order_present_flag = stream.readBit();
        this.num_slice_groups_minus1 = stream.uev();
        if (this.num_slice_groups_minus1 > MAX_NUM_SLICE_GROUP - 1) {
            unexpected();
        }
        this.slice_group_change_rate_minus1 = 0;
        if (this.num_slice_groups_minus1 > 0) {
            this.slice_group_map_type = stream.uev();
            if (this.slice_group_map_type == 0) {
                this.run_length_minus1 = [];
                for ( var i = 0; i <= this.num_slice_groups_minus1; i++) {
                    this.run_length_minus1[i] = stream.uev();
                }
            } else if (this.slice_group_map_type == 2) {
                this.top_left = [];
                this.bottom_right = [];
                for ( var i = 0; i < this.num_slice_groups_minus1; i++) {
                    this.top_left[i] = stream.uev();
                    this.bottom_right[i] = stream.uev();
                }
            } else if (this.slice_group_map_type == 3
                    || this.slice_group_map_type == 4
                    || this.slice_group_map_type == 5) {

                this.slice_group_change_direction_flag = stream.readBit();
                this.slice_group_change_rate_minus1 = stream.uev();
            } else if (this.slice_group_map_type == 6) {
                this.pic_size_in_map_units_minus1 = stream.uev();

                /* ceil(log2(num_slice_groups_minus1+1)) bits */
                var numBits = 0; 
                var i = this.num_slice_groups_minus1;
                while (i > 0) {
                    numBits++;
                    i >>>= 1;
                }

                var sps = decoder.SequenceParameterSets[this.seq_parameter_set_id];
                if (sps == null) {
                    unexpected();
                }

                var picWidthInMbs = sps.pic_width_in_mbs_minus1 + 1;
                var picHeightInMapUnits = sps.pic_height_in_map_units_minus1 + 1;
                var picSizeInMapUnits = picWidthInMbs * picHeightInMapUnits;

                /* information has to be consistent with the seq_param */
                if (this.pic_size_in_map_units_minus1 != picSizeInMapUnits - 1) {
                    unexpected();
                }

                this.slice_group_id = [];
                for (i = 0; i < picSizeInMapUnits; i++) {
                    this.slice_group_id[i] = stream.readBits(numBits);
                }
            }
        }

        this.num_ref_idx_l0_active_minus1 = stream.uev();
        assertRange(this.num_ref_idx_l0_active_minus1, 0, 31);

        this.num_ref_idx_l1_active_minus1 = stream.uev();
        assertRange(this.num_ref_idx_l1_active_minus1, 0, 31);

        this.weighted_pred_flag = stream.readBit();
        this.weighted_bipred_idc = stream.readBits(2);
        assertRange(this.weighted_bipred_idc, 0, 3);
        this.pic_init_qp_minus26 = stream.sev();
        assertRange(this.pic_init_qp_minus26, -26, 25);
        this.pic_init_qs_minus26 = stream.sev();
        assertRange(this.pic_init_qs_minus26, -26, 25);
        this.chroma_qp_index_offset = stream.sev();
        assertRange(this.chroma_qp_index_offset, -12, 12);
        this.pic_parameter_set_id = stream.readBits(3);
        this.deblocking_filter_control_present_flag = this.pic_parameter_set_id >> 2;
        this.constrained_intra_pred_flag = (this.pic_parameter_set_id >> 1) & 1;
        this.redundant_pic_cnt_present_flag = this.pic_parameter_set_id & 1;
    }
    
    constructor.prototype.toString = function () {
        return "PPS: " + getProperties(this, true);
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
        if (nal != null) {
            println("NAL: " + (i++) + " " + nal.toString());
            var pay = nal.decode();
            if (pay != null) {
                println(pay.toString());
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

//time = new Date();
//
//var sum = 0;
//for (var i = 0; i < 100000000; i++) {
//    sum += countLeadingZeros(i);
//}
//println ("Sum: " + sum);
//
//println("Elapsed: " + (new Date().getTime() - time.getTime()) + " ms");