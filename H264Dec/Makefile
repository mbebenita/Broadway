OPTS = -m32 -O0 -g # -DH264DEC_TRACE -D_ERROR_PRINT -D_DEBUG_PRINT -D_ASSERT_USED	
ifeq ($(LINUX),1)
OPTS += -DLINUX
endif

LDFLAGS = -m32

# Project name
PROJECT = avc

# Directories
OBJDIR = obj
SRCDIR = source
INCDIR = inc

# Libraries
ifeq ($(LINUX),1)
LIBS = -lSDL
else
LIBS =  -framework Cocoa -framework SDL
endif

# Files and folders
# SRCS    = $(shell find $(SRCDIR) -name '*.c')
SRCS := \
    source/h264bsd_transform.c \
    source/h264bsd_util.c \
    source/h264bsd_byte_stream.c \
    source/h264bsd_seq_param_set.c \
    source/h264bsd_pic_param_set.c \
    source/h264bsd_slice_header.c \
    source/h264bsd_slice_data.c \
    source/h264bsd_macroblock_layer.c \
    source/h264bsd_stream.c \
    source/h264bsd_vlc.c \
    source/h264bsd_cavlc.c \
    source/h264bsd_nal_unit.c \
    source/h264bsd_neighbour.c \
    source/h264bsd_storage.c \
    source/h264bsd_slice_group_map.c \
    source/h264bsd_intra_prediction.c \
    source/h264bsd_inter_prediction.c \
    source/h264bsd_reconstruct.c \
    source/h264bsd_dpb.c \
    source/h264bsd_image.c \
    source/h264bsd_deblocking.c \
    source/h264bsd_conceal.c \
    source/h264bsd_vui.c \
    source/h264bsd_pic_order_cnt.c \
    source/h264bsd_decoder.c \
    source/H264SwDecApi.c \
    source/Broadway.c
    
OBJS    = $(patsubst $(SRCDIR)/%.c,$(OBJDIR)/%.o,$(SRCS))

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

$(OBJDIR)/%.o: $(SRCDIR)/%.c
	$(CC) $(OPTS) -c -I$(INCDIR) $< -o $@

build-dirs:
	@$(call make-dirs)

clean:
	rm -Rf $(OBJDIR)
	rm $(PROJECT)
	rm -Rf js

define make-dirs
	mkdir -p $(OBJDIR)
endef