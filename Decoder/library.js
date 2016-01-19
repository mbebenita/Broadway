var LibraryBroadway = {
  broadwayOnHeadersDecoded: function () {
    par_broadwayOnHeadersDecoded();
  },
  broadwayOnPictureDecoded: function ($buffer, width, height) {
    par_broadwayOnPictureDecoded($buffer, width, height);
  },
  extern_emit_image: function($buffer, width, height, $otherBuffer){
    par_broadwayOnPictureDecoded($buffer, width, height, $otherBuffer);
  }
};

mergeInto(LibraryManager.library, LibraryBroadway);
