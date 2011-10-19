CXXFLAGS =	-m32 -O2 -g -Wall -fmessage-length=0

OBJS =		Show.o SDLMain.o Stage.o

LIBS =      -L/usr/local/lib -lmozjs -framework Cocoa -framework SDL

TARGET =	Show

$(TARGET):	$(OBJS)
	$(CXX) -o $(TARGET) $(OBJS) $(LIBS)

all:	$(TARGET)

clean:
	rm -f $(OBJS) $(TARGET)
