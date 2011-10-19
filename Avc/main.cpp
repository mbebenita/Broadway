#include <stdio.h>
#include <stdlib.h>
#include <SDL/SDL.h>

#include "avcdec_int.h"
#include "avcdec_api.h"

#include "SDL/SDL.h"

#define DEBUG_LOGGING 0
#if DEBUG_LOGGING
  #define DLOG printf
#else
  #define DLOG(...)
#endif

SDL_Surface* screen = NULL;

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
    fread((char *) buffer, bufferSize, 1, file);
    fclose(file);
    *size = (int) bufferSize;
    return buffer;
}

typedef uintptr_t (*FunctionType_Malloc)(void *userData, int32 size,
        int attribute);

uintptr_t my_malloc(void *userData, int32 size, int attribute) {
    return (uintptr_t) malloc(size);
}

void my_free(void *userData, int mem) {
    free((void *) mem);
}

#ifdef LINUX
int main(int argc, char **argv) {
#else
int SDL_main(int argc, char **argv) {
#endif
    AVCHandle decoder;
    decoder.AVCObject = NULL;

    decoder.CBAVC_Malloc = my_malloc;
    decoder.debugEnable = true;

    int size = 0;
#if LINUX
    uint8* buffer = (uint8*) readFile("../Media/admiral.264", &size);
#else
    uint8* buffer = (uint8*) readFile("../Media/tomb.mpg", &size);
#endif
    uint8* stream = buffer;

    uint8 *nal_unit = NULL;
    int remaining = size;
    int nal_size = remaining;

    SDL_Init(SDL_INIT_VIDEO);

    int nal = 0;
    while (PVAVCAnnexBGetNALUnit(stream, &nal_unit, &nal_size) == AVCDEC_SUCCESS) {
        DLOG("Decoded NAL Unit %d Size: %d\n", nal++, nal_size);
        int nal_type = 0;
        int nal_ref_idc = 0;

        PVAVCDecGetNALType(nal_unit, nal_size, &nal_type, &nal_ref_idc);
        DLOG("  nal_type: %d\n", nal_type);
        DLOG("  nal_ref_idc: %d\n", nal_ref_idc);

        if (nal_type == AVC_NALTYPE_SPS) {
            DLOG("  SPS\n");
            PVAVCDecSeqParamSet(&decoder, nal_unit, nal_size);
        } else if (nal_type == AVC_NALTYPE_PPS) {
            DLOG("  PPS\n");
            PVAVCDecPicParamSet(&decoder, nal_unit, nal_size);
        } else if (nal_type == AVC_NALTYPE_SLICE) {
            DLOG("  SLICE\n");
            int ret = PVAVCDecodeSlice(&decoder, nal_unit, nal_size);
            DLOG("  SLICE %d\n", ret);

            int indx;
            int release;
            AVCFrameIO output;
            PVAVCDecGetOutput(&decoder, &indx, &release, &output);

            if (!screen) {
                screen = SDL_SetVideoMode(output.pitch, output.height, 32, SDL_HWSURFACE | SDL_RESIZABLE);
            }

            SDL_LockSurface(screen);

            uint8 *luma = output.YCbCr[0];
            uint8 *cb = output.YCbCr[1];
            uint8 *cr = output.YCbCr[2];
            uint32 *dst = (uint32*) screen->pixels;
            int stride = output.pitch;
            int strideChroma = output.pitch >> 1;
            for (int y = 0; y < output.height; y++) {
                int lineOffLuma = y * stride;
                int lineOffChroma = (y >> 1) * strideChroma;
                for (int x = 0; x < output.pitch; x++) {
                    int c = luma[lineOffLuma + x] - 16;
                    int d = cb[lineOffChroma + (x >> 1)] - 128;
                    int e = cr[lineOffChroma + (x >> 1)] - 128;

                    int red = (298 * c + 409 * e + 128) >> 8;
                    red = red < 0 ? 0 : (red > 255 ? 255 : red);
                    int green = (298 * c - 100 * d - 208 * e + 128) >> 8;
                    green = green < 0 ? 0 : (green > 255 ? 255 : green);
                    int blue = (298 * c + 516 * d + 128) >> 8;
                    blue = blue < 0 ? 0 : (blue > 255 ? 255 : blue);
                    int alpha = 255;
                    dst[lineOffLuma + x] = SDL_MapRGB(screen->format, red & 0xff, green & 0xff, blue & 0xff);
                }
            }

            SDL_UnlockSurface(screen);
            SDL_Flip(screen);
            SDL_Delay(1000 / 50);

            DLOG("  DECODED %d\n", indx);

            SDL_Event event;
            while (SDL_PollEvent(&event)) {
                switch (event.type) {
                case SDL_QUIT:
                    exit(0);
                    break;
                case SDL_KEYDOWN:
                    exit(0);
                    break;
                }
            }
        }

        stream = nal_unit + nal_size;
        nal_size = size - (stream - buffer);
    }

    // PVAVCAnnexBGetNALUnit(b)

    SDL_Quit();

    PVAVCCleanUpDecoder(&decoder);

    return 0;
}
