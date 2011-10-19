# Compiler
OPTS = -m32 -g -Wall -DOSCL_IMPORT_REF= -DOSCL_UNUSED_ARG= -DOSCL_EXPORT_REF=
LDFLAGS = -m32 
# Project name
PROJECT = avc

# Directories
OBJDIR = obj
SRCDIR = .

# Libraries
LIBS =  -framework Cocoa -framework SDL

# Files and folders
SRCS    = $(shell find $(SRCDIR) -name '*.cpp')
OBJS    = $(patsubst $(SRCDIR)/%.cpp,$(OBJDIR)/%.o,$(SRCS))

# Targets
$(PROJECT): build-dirs $(OBJS) $(OBJDIR)/SDLMain.o
	$(CC) $(LDFLAGS) $(OBJS) $(OBJDIR)/SDLMain.o $(LIBS) -o $@

$(OBJDIR)/SDLMain.o: SDLMain.m
	$(CC) $(OPTS) -c $< -o $@
	
$(OBJDIR)/%.o: $(SRCDIR)/%.cpp
	$(CC) $(OPTS) -c $< -o $@

clean:
	rm -Rf $(OBJDIR)

build-dirs:
	@$(call make-dirs)

define make-dirs
	mkdir -p $(OBJDIR)
endef
