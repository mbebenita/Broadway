#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <js/jsapi.h>
#include <SDL/SDL.h>
#include "Stage.h"
#include "Avc.h"

/* The class of the global object. */
static JSClass global_class = {
    "global", JSCLASS_GLOBAL_FLAGS,
    JS_PropertyStub, JS_PropertyStub, JS_PropertyStub, JS_StrictPropertyStub,
    JS_EnumerateStub, JS_ResolveStub, JS_ConvertStub, JS_FinalizeStub,
    JSCLASS_NO_OPTIONAL_MEMBERS
};

/* The error reporter callback. */
void reportError(JSContext *cx, const char *message, JSErrorReport *report) {
	fprintf(stderr, "%s:%u:%s\n",
			report->filename ? report->filename : "<no filename>",
			(unsigned int) report->lineno, message);
}

JSBool print(JSContext *cx, uintN argc, jsval *vp) {
	char *str;
	JSString *msg;

	if (!JS_ConvertArguments(cx, argc, JS_ARGV(cx, vp), "/S", &msg))
		return JS_FALSE;

	/* If called with no arguments, use the current time as the seed. */
	if (argc == 0)
		str = "";
	else
		str = JS_EncodeString(cx, msg);

	printf("%s", str);

	JS_SET_RVAL(cx, vp, JSVAL_VOID);
	/* return undefined */
	return JS_TRUE;
}

JSBool println(JSContext *cx, uintN argc, jsval *vp) {
	char *str;
	JSString *msg;

	if (!JS_ConvertArguments(cx, argc, JS_ARGV(cx, vp), "/S", &msg))
		return JS_FALSE;

	/* If called with no arguments, use the current time as the seed. */
	if (argc == 0)
		str = "";
	else
		str = JS_EncodeString(cx, msg);

	printf("%s\n", str);

	JS_SET_RVAL(cx, vp, JSVAL_VOID);
	/* return undefined */
	return JS_TRUE;
}

/**
 * Reads a binary file and returns its content as a JS ArrayBuffer.
 */
JSObject *readFile(JSContext *cx, char *name) {
	FILE *file = fopen(name, "rb");
	if (!file) {
		fprintf(stderr, "Unable to open file %s\n", name);
		return NULL;
	}

	fseek(file, 0, SEEK_END);
	unsigned long bufferSize = ftell(file) + 1;
	fseek(file, 0, SEEK_SET);

	char *buffer = (char *) JS_malloc(cx, bufferSize + sizeof(uint64));
	if (!buffer) {
		fprintf(stderr, "Memory error!\n");
		fclose(file);
		return NULL;
	}

	fread((char *)buffer + sizeof(uint64), bufferSize, 1, file);
	((uint64 *)buffer)[0] = bufferSize;

	fclose(file);
	return JS_CreateArrayBuffer(cx, buffer, bufferSize);
}

JSBool read(JSContext *cx, uintN argc, jsval *vp) {
	char *str;
	JSString *msg;

	if (!JS_ConvertArguments(cx, argc, JS_ARGV(cx, vp), "S", &msg))
		return JS_FALSE;
	str = JS_EncodeString(cx, msg);

	JSObject *buffer = buffer = readFile(cx, str);

	if (buffer != NULL) {
		JS_SET_RVAL(cx, vp, OBJECT_TO_JSVAL(buffer));
	} else {
		JS_SET_RVAL(cx, vp, JSVAL_VOID);
		return JS_FALSE;
	}
	return JS_TRUE;
}

static JSFunctionSpec globalFunctions[] = {
    JS_FS("print",   print,   0, 0),
    JS_FS("println",   println,   0, 0),
    JS_FS("read",   read,   1, 0),
    JS_FS_END
};

int SDL_main(int argc, char **argv) {
	if (argc < 2) {
		printf("Usage %s scripts\n", argv[0]);
		return 1;
	}

	if (strcmp(argv[1], "-ref") == 0) {
	    Avc avc;
	    avc.Play();
	    return 1;
	}

	/* JS variables. */
	JSRuntime *rt;
	JSContext *cx;
	JSObject *global;

	/* Create a JS runtime. */
	rt = JS_NewRuntime(8L * 1024L * 1024L);
	if (rt == NULL)
		return 1;

	/* Create a context. */
	cx = JS_NewContext(rt, 8192);
	if (cx == NULL)
		return 1;
	JS_SetOptions(cx, JSOPTION_VAROBJFIX | JSOPTION_JIT | JSOPTION_METHODJIT);
	JS_SetVersion(cx, JSVERSION_LATEST);
	JS_SetErrorReporter(cx, reportError);

	/* Create the global object in a new compartment. */
	global = JS_NewCompartmentAndGlobalObject(cx, &global_class, NULL);
	if (global == NULL)
		return 1;

	/* Populate the global object with the standard globals,
	 like Object and Array. */
	if (!JS_InitStandardClasses(cx, global))
		return 1;

	if (!JS_DefineFunctions(cx, global, globalFunctions))
		return JS_FALSE;

	for (int i = 1; i < argc; i++) {
		JSScript *script = JS_CompileFile(cx, global, argv[i]);
		if (script == NULL)
			return 1;

		jsval rval;
		JSBool result = JS_ExecuteScript(cx, global, script, &rval);
		if (!result) {
			printf("Cannot execute script %s", argv[i]);
		}
	}

	// Stage stage(rt, cx, global);
	// stage.Play();



	/* Cleanup. */
	JS_DestroyContext(cx);
	JS_DestroyRuntime(rt);
	JS_ShutDown();

	return 0;
}

