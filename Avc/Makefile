# Compiler 
# -DMB_BASED_DEBLOCK -DUSE_PRED_BLOCK
OPTS = -m32 -g -O3 -Wall -DOSCL_IMPORT_REF= -DOSCL_UNUSED_ARG= -DOSCL_EXPORT_REF=
ifeq ($(LINUX),1)
OPTS += -DLINUX
endif

LDFLAGS = -m32 
# Project name
PROJECT = avc

# Directories
OBJDIR = obj
SRCDIR = .

# Libraries
ifeq ($(LINUX),1)
LIBS = -lSDL
else
LIBS =  -framework Cocoa -framework SDL
endif

# Files and folders
SRCS    = $(shell find $(SRCDIR) -name '*.cpp')
OBJS    = $(patsubst $(SRCDIR)/%.cpp,$(OBJDIR)/%.o,$(SRCS))

# Targets
ifeq ($(LINUX),1)
$(PROJECT): build-dirs $(OBJS)
	$(CC) $(LDFLAGS) $(OBJS) $(LIBS) -o $@

$(OBJDIR)/SDLMain.o: SDLMain.m
	$(CC) $(OPTS) -c $< -o $@
else
$(PROJECT): build-dirs $(OBJS) $(OBJDIR)/SDLMain.o
	$(CC) $(LDFLAGS) $(OBJS) $(OBJDIR)/SDLMain.o $(LIBS) -o $@

$(OBJDIR)/SDLMain.o: SDLMain.m
	$(CC) $(OPTS) -c $< -o $@
endif
	
$(OBJDIR)/%.o: $(SRCDIR)/%.cpp
	$(CC) $(OPTS) -c $< -o $@

clean:
	rm -Rf $(OBJDIR)
	rm *.js
	rm *.ll
	rm *.bc

build-dirs:
	@$(call make-dirs)

define make-dirs
	mkdir -p $(OBJDIR)
endef
