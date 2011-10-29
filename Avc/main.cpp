#include <stdio.h>
#include <stdlib.h>
#include <SDL/SDL.h>

#include "avcdec_int.h"
#include "avcdec_api.h"

#include "yuv2rgb.h"

#include "SDL/SDL.h"

#define DEBUG_LOGGING 0
#if DEBUG_LOGGING
  #define DLOG printf
#else
  #define DLOG(...)
#endif

#define RENDER 1

#define FASTYUV2RGB 0

// Globals

SDL_Surface* screen = NULL;
AVCHandle decoder;
int size = 0;
uint8* stream = NULL;
uint8* buffer = NULL;
uint8 *nal_unit = NULL;
int remaining;
int nal_size;

// Main loop handling

enum mainLoopStatus {
  MLS_STOP = 0,
  MLS_CONTINUE = 1,
  MLS_FRAMERENDERED = 2
};

// Runs the main loop. This is replaced in JavaScript with an asynchronous loop
// that calls mainLoopIteration
void runMainLoop();
mainLoopStatus mainLoopIteration();

// Utilities

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

void my_free(void *userData, uintptr_t mem) {
    free((void *) mem);
}

#ifdef LINUX
int main(int argc, char **argv) {
#else
int SDL_main(int argc, char **argv) {
#endif

    decoder.AVCObject = NULL;

    decoder.CBAVC_Malloc = my_malloc;
    decoder.CBAVC_Free = my_free;
    decoder.debugEnable = true;

    size = 0;

#if LINUX
    buffer = (uint8*) readFile(argc == 2 ? argv[1] : "../Media/mozilla.264", &size);
#else
    // buffer = (uint8*) readFile(argc == 2 ? argv[1] : "/Users/mbebenita/Workspaces/Broadway/Media/mozilla.264", &size);
    buffer = (uint8*) readFile(argc == 2 ? argv[1] : "../Media/mozilla.264", &size);

#endif
    stream = buffer;

    nal_unit = NULL;
    remaining = size;
    nal_size = remaining;

#if RENDER
    SDL_Init(SDL_INIT_VIDEO);
#endif

    runMainLoop();

    return 0;
}

void runMainLoop() {
    mainLoopStatus status;
    while ((status = mainLoopIteration()) != MLS_STOP) {
        if (status == MLS_FRAMERENDERED) {
#if RENDER
            SDL_Delay(1000/50);
#endif
        }
    }
}

extern "C" void paint(uint8 *luma, uint8 *cb, uint8 *cr, int height, int width) {
    int chromaWidth = width >> 1;
#if FASTYUV2RGB
    uint8 *dst = (uint8 *)screen->pixels;
    yuv420_2_rgb8888( (uint8*) dst, luma, cb, cr, width, height, width, chromaWidth, width << 2, yuv2rgb565_table, 0);
#else
    uint32 *dst = (uint32 *)screen->pixels;
    for (int y = 0; y < height; y++) {
        int lineOffLuma = y * width;
        int lineOffChroma = (y >> 1) * chromaWidth;
        for (int x = 0; x < width; x++) {
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
#endif
}

mainLoopStatus mainLoopIteration() {
    int nal = 0;
    if (PVAVCAnnexBGetNALUnit(stream, &nal_unit, &nal_size) != AVCDEC_SUCCESS) {
        // PVAVCAnnexBGetNALUnit(b)

#if RENDER
        SDL_Quit();
#endif

        PVAVCCleanUpDecoder(&decoder);

        return MLS_STOP;
    }

    mainLoopStatus status = MLS_CONTINUE;

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
    } else if (nal_type == AVC_NALTYPE_SLICE || nal_type == AVC_NALTYPE_IDR) {
        DLOG("  SLICE\n");
        int ret = PVAVCDecodeSlice(&decoder, nal_unit, nal_size);
        DLOG("  SLICE %d\n", ret);

        int indx;
        int release;
        AVCFrameIO output;
        PVAVCDecGetOutput(&decoder, &indx, &release, &output);

#if RENDER
        if (!screen) {
            screen = SDL_SetVideoMode(output.pitch, output.height, 32, SDL_HWSURFACE | SDL_RESIZABLE);
        }

        SDL_LockSurface(screen);
#else
        if (!screen) {
            screen = (SDL_Surface*)malloc(sizeof(SDL_Surface));
            screen->pixels = malloc(output.pitch * output.height * 32);
        }
#endif


#if !RENDER
        int mean = 0;
#endif
        if (1) {
            paint(output.YCbCr[0], output.YCbCr[1], output.YCbCr[2], output.height, output.pitch);
        }
#if !RENDER
        printf("C mean: %d\n", mean/(output.height*output.pitch));
#endif

#if RENDER
        SDL_UnlockSurface(screen);
        SDL_Flip(screen);
#else
        static int frame = 0;
        printf("\n=== dumping frame %d ===\n\n", frame++);
        int min = output.height < output.pitch ? output.height : output.pitch;
        for (int y = 0; y < min; y++) {
//            printf("%d: %d\n", y, ((char*)screen->pixels)[y*output.pitch + y*4]);
        }
        // if (frame == 100) exit(0);
#endif
        status = MLS_FRAMERENDERED;

        DLOG("  DECODED %d\n", indx);

#if RENDER
        SDL_Event event;
        while (SDL_PollEvent(&event)) {
            switch (event.type) {
            case SDL_QUIT:
                exit(0);
                break;
#if !LINUX
            case SDL_KEYDOWN:
                exit(0);
                break;
#endif
            }
        }
#endif
    } else {
        printf("Missed %d\n", nal_type);
    }

    stream = nal_unit + nal_size;
    nal_size = size - (stream - buffer);

    return status;
}
