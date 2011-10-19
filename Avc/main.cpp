#include <stdio.h>
#include <stdlib.h>
#include <SDL/SDL.h>

#include "avcdec_int.h"
#include "avcdec_api.h"

char *readFile(const char* filename, int *size) {
	FILE *file = fopen(filename, "rb");
	if (!file) {
		fprintf(stderr, "Unable to open file %s\n", filename);
		return NULL;
	}
	fseek(file, 0, SEEK_END);
	unsigned long bufferSize = ftell(file) + 1;
	fseek(file, 0, SEEK_SET);
	char *buffer = (char *) malloc(bufferSize);
	if (!buffer) {
		fprintf(stderr, "Memory error!\n");
		fclose(file);
		return NULL;
	}
	fread((char *)buffer, bufferSize, 1, file);
	fclose(file);
	*size = (int)bufferSize;
	return buffer;
}

typedef uintptr_t (*FunctionType_Malloc)(void *userData, int32 size, int attribute);


uintptr_t my_malloc(void *userData, int32 size, int attribute) {
	return (uintptr_t) malloc(size);
}

void my_free(void *userData, int mem) {
	free((void *)mem);
}

int SDL_main(int argc, char **argv) {
	AVCHandle decoder;

	decoder.CBAVC_Malloc = my_malloc;
	decoder.debugEnable = true;

	int size = 0;
	uint8* buffer = (uint8*) readFile("/Users/mbebenita/Workspaces/Broadway/Media/admiral.264", &size);
	uint8* stream = buffer;

	uint8 *nal_unit = NULL;
	int remaining = size;
	int nal_size = remaining;

	int nal = 0;
	while (PVAVCAnnexBGetNALUnit(stream, &nal_unit, &nal_size) == AVCDEC_SUCCESS) {
		printf("Decoded NAL Unit %d Size: %d\n", nal++, nal_size);
		int nal_type = 0;
		int nal_ref_idc = 0;

		PVAVCDecGetNALType(nal_unit, nal_size, &nal_type, &nal_ref_idc);
		printf("  nal_type: %d\n", nal_type);
		printf("  nal_ref_idc: %d\n", nal_ref_idc);

		if (nal_type == AVC_NALTYPE_SPS) {
			printf("  SPS\n");
			PVAVCDecSeqParamSet(&decoder, nal_unit, nal_size);
		} else if (nal_type == AVC_NALTYPE_PPS) {
			printf("  PPS\n");
			PVAVCDecPicParamSet(&decoder, nal_unit, nal_size);
		} else if (nal_type == AVC_NALTYPE_SLICE) {
			printf("  SLICE\n");
			int ret = PVAVCDecodeSlice(&decoder, nal_unit, nal_size);
			printf("  SLICE %d\n", ret);

			int indx;
			int release;
			AVCFrameIO output;
			PVAVCDecGetOutput(&decoder, &indx, &release, &output);

			printf("  DECODED %d\n", indx);
		}

		stream = nal_unit + nal_size;
		nal_size = size - (stream - buffer);
	}
	
	// PVAVCAnnexBGetNALUnit(b)


	PVAVCCleanUpDecoder(&decoder);

	return 0;
}

// typedef enum
// {
//     AVC_NALTYPE_SLICE = 1,  /* non-IDR non-data partition */
//     AVC_NALTYPE_DPA = 2,    /* data partition A */
//     AVC_NALTYPE_DPB = 3,    /* data partition B */
//     AVC_NALTYPE_DPC = 4,    /* data partition C */
//     AVC_NALTYPE_IDR = 5,    /* IDR NAL */
//     AVC_NALTYPE_SEI = 6,    /* supplemental enhancement info */
//     AVC_NALTYPE_SPS = 7,    /* sequence parameter set */
//     AVC_NALTYPE_PPS = 8,    /* picture parameter set */
//     AVC_NALTYPE_AUD = 9,    /* access unit delimiter */
//     AVC_NALTYPE_EOSEQ = 10, /* end of sequence */
//     AVC_NALTYPE_EOSTREAM = 11, /* end of stream */
//     AVC_NALTYPE_FILL = 12   /* filler data */
// } AVCNalUnitType;
