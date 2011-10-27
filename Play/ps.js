'use strict';

/**
 * Represents a Sequence Parameter Set (SPS)
 * 
 * Clause 7.4.2.2
 */
var SPS = (function() {
    function constructor() {};
    
    constructor.prototype.decode = function (stream) {
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
            for (var i = 0; i < this.num_ref_frames_in_pic_order_cnt_cycle; i++) {
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
    };
    
    constructor.prototype.toString = function () {
        return "SPS: " + getProperties(this, true);
    };
    
    return constructor;
})();


/**
 * Represents a Picture Parameter Set (PPS)
 * 
 * Clause 7.4.2.2
 * 
 * Book 5.5, Parameter sets remain inactive, until they are activated when referenced in slice headers. Slice
 * headers activate PPSs which in turn activate SPSs.
 */
var PPS = (function() {
    function constructor() { }
    
    constructor.prototype.decode = function (stream) {
        this.pic_parameter_set_id = stream.uev();
        assertRange(this.pic_parameter_set_id, 0, 255);
        
        /* Register Picture Parameter Set */ 
        decoder.PictureParameterSets[this.pic_parameter_set_id] = this;
        
        this.seq_parameter_set_id = stream.uev();
        assertRange(this.seq_parameter_set_id, 0, 31);
        this.entropy_coding_mode_flag = stream.readBit();
        /* Only CAVLC (entropy_coding_mode_flag == false) is supported. */
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

        /* Number of reference pictures in listX. */
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
    };
    
    constructor.prototype.toString = function () {
        return "PPS: " + getProperties(this, true);
    };
    
    return constructor;
})();