#ifndef STAGE_H_
#define STAGE_H_

class Stage {
public:
	Stage(JSRuntime *rt, JSContext *cx, JSObject *global);
	int Play();
private:
	JSRuntime *rt;
	JSContext *cx;
	JSObject  *global;

	SDL_Surface *screen;
	char *screenBuffer;
	size_t screenBufferSize;
	JSObject *screenArrayBuffer;

	int Initialize();
	int DrawScreen(int h);
	void Blit(char *dst, const char *src, size_t size);
};

#endif /* STAGE_H_ */
