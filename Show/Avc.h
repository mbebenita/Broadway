#ifndef AVC_H_
#define AVC_H_

#include "avc/avcdec_int.h"
#include "avc/avcdec_api.h"

class Avc {
public:
	Avc(const char *filename);
	int Play();
private:
	int decodeNALUnit(uint8 *nal_uint, int nal_size);
    int pollKeyPress();
	uint8* buffer;
	uint8* stream;
	int buffer_size;
	AVCHandle decoder;
	SDL_Surface *screen;
};

#endif /* STAGE_H_ */
