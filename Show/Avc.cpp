#include <stdio.h>
#include <stdlib.h>
#include <SDL/SDL.h>

#include "Avc.h"

#define WIDTH 640
#define HEIGHT 480
#define BPP 4
#define DEPTH 32

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

uintptr_t my_malloc(void *userData, int32 size, int attribute) {
    return (uintptr_t) malloc(size);
}

void my_free(void *userData, uintptr_t mem) {
    free((void *) mem);
}

Avc::Avc(const char *filename) {
    decoder.AVCObject = NULL;
    decoder.CBAVC_Malloc = my_malloc;
    decoder.CBAVC_Free = my_free;
    decoder.debugEnable = true;
    buffer = (uint8*) readFile(filename, &buffer_size);
    screen = NULL;
}

int
Avc::pollKeyPress() {
    SDL_Event event;
    int keypress = 0;
    while (SDL_PollEvent(&event)) {
        switch (event.type) {
        case SDL_QUIT:
            keypress = 1;
            break;
        case SDL_KEYDOWN:
            keypress = 1;
            break;
        }
    }
    return keypress;
}

int Avc::Play() {
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        return 1;
    }

//    if (!(screen = SDL_SetVideoMode(WIDTH, HEIGHT, DEPTH, SDL_HWSURFACE))) {
//        SDL_Quit();
//        return 1;
//    }

    uint8 *nal_unit = NULL;
    stream = buffer;
    int nal_size = buffer_size;
    int nal_number = 0;
    while (true) {
        if (PVAVCAnnexBGetNALUnit(stream, &nal_unit, &nal_size) != AVCDEC_SUCCESS) {
            printf("PVAVCAnnexBGetNALUnit Failed\n");
            PVAVCCleanUpDecoder(&decoder);
            break;
        }

        trace("+ NAL Unit %d\n", nal_number++);
        trace("| nal_size: %d\n", nal_size);

        if (decodeNALUnit(nal_unit, nal_size) == 0) {
            break;
        }

        // SDL_Delay(1000 / 50);

        stream = nal_unit + nal_size;
        nal_size = buffer_size - (stream - buffer);

        if (pollKeyPress()) {
            break;
        }

        // SDL_Delay(1000 / 50);
    }

    SDL_Quit();
    return 0;
}

int
Avc::decodeNALUnit(uint8 *nal_unit, int nal_size) {
    int nal_type = 0;
    int nal_ref_idc = 0;

    PVAVCDecGetNALType(nal_unit, nal_size, &nal_type, &nal_ref_idc);

    trace("| nal_type: %d\n", nal_type);
    trace("| nal_ref_idc: %d\n", nal_ref_idc);

    if (nal_type == AVC_NALTYPE_SPS) {
        PVAVCDecSeqParamSet(&decoder, nal_unit, nal_size);
    } else if (nal_type == AVC_NALTYPE_PPS) {
        PVAVCDecPicParamSet(&decoder, nal_unit, nal_size);
    } else if (nal_type == AVC_NALTYPE_SLICE || nal_type == AVC_NALTYPE_IDR) {
        if (1) {
            int ret = PVAVCDecodeSlice(&decoder, nal_unit, nal_size);

            int indx;
            int release;

            AVCFrameIO output;
            PVAVCDecGetOutput(&decoder, &indx, &release, &output);

            if (!screen) {
                screen = SDL_SetVideoMode(output.pitch, output.height, 32, SDL_HWSURFACE | SDL_RESIZABLE);
            }

            if (0) {
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
            }
        }
    } else {
        printf("Missed %d\n", nal_type);
    }
    return 1;
}
