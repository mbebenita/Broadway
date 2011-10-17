#include <js/jsapi.h>
#include <SDL/SDL.h>
#include "Stage.h"

#define WIDTH 640
#define HEIGHT 480
#define BPP 4
#define DEPTH 32

Stage::Stage(JSRuntime *rt, JSContext *cx, JSObject *global) : rt(rt), cx(cx), global(global) {
	Initialize();
}

int
Stage::Play() {
	SDL_Event event;

	int keypress = 0;
	int h = 0;

	if (SDL_Init(SDL_INIT_VIDEO) < 0) {
		return 1;
	}

	if (!(screen = SDL_SetVideoMode(WIDTH, HEIGHT, DEPTH, SDL_HWSURFACE))) {
		SDL_Quit();
		return 1;
	}

	screenBufferSize = HEIGHT * screen->pitch;
	screenBuffer = (char *)JS_malloc(cx, screenBufferSize + sizeof(uint64));
	((uint64 *)screenBuffer)[0] = screenBufferSize;
	printf("Allocated: %d %d \n", screenBufferSize, screenBufferSize + sizeof(uint64));

	screenArrayBuffer = JS_CreateArrayBuffer(cx, screenBuffer, screenBufferSize);

	while (!keypress) {
		DrawScreen(h++);
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
	}

	SDL_Quit();
	return 0;
}

JSBool JS_SetPixel(JSContext *cx, uintN argc, jsval *vp) {
	uint32 x, y, r, g, b;
	if (!JS_ConvertArguments(cx, argc, JS_ARGV(cx, vp), "uuuuu", &x, &y, &r, &g, &b))
		return JS_FALSE;
	JS_SET_RVAL(cx, vp, JSVAL_VOID);
	return JS_TRUE;
}

static JSFunctionSpec stageFunctions[] = {
    JS_FS("setPixel",   JS_SetPixel,   5, 0),
    JS_FS_END
};

int
Stage::Initialize() {
	if (!JS_DefineFunctions(cx, global, stageFunctions)) {
		return JS_FALSE;
	}
	return JS_TRUE;
}

void
Stage::Blit(char *dst, const char *src, size_t size) {
	for (int y = 0; y < size / screen->pitch; y++) {
		int start = y * screen->pitch;
		for (int x = 0; x < screen->pitch / BPP; x++) {
			int offset = start + x * sizeof(Uint32);
			Uint32 srcPixel = *(Uint32 *)(src + offset);
			Uint8 r = srcPixel >> 24 & 0xFF;
			Uint8 g = srcPixel >> 16 & 0xFF;
			Uint8 b = srcPixel >> 8 & 0xFF;
			Uint32 *dstPixelAddress = (Uint32 *)(dst + offset);
			*dstPixelAddress = SDL_MapRGB(screen->format, r, g, b);
		}
	}
}

int
Stage::DrawScreen(int h) {
	jsval rval;
	int x, y, ytimesw;

	if (SDL_MUSTLOCK(screen)) {
		if (SDL_LockSurface(screen) < 0) {
			return 0;
		}
	}

	jsval argv[5];
	argv[0] = OBJECT_TO_JSVAL(screenArrayBuffer);
	argv[1] = INT_TO_JSVAL(WIDTH);
	argv[2] = INT_TO_JSVAL(HEIGHT);
	argv[3] = INT_TO_JSVAL(screen->pitch);
	argv[4] = INT_TO_JSVAL(BPP);
	JSBool ok = JS_CallFunctionName(cx, global, "paint", 5, argv, &rval);


	Blit((char *)screen->pixels, screenBuffer, screenBufferSize);

	if (SDL_MUSTLOCK(screen))
		SDL_UnlockSurface(screen);

	SDL_Flip(screen);
}
