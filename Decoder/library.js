var LibraryBroadway = {
  broadwayOnHeadersDecoded: function () {
    window["_broadwayOnHeadersDecoded"]();
  },
  broadwayOnPictureDecoded: function ($buffer, width, height) {
    window["_broadwayOnPictureDecoded"]($buffer, width, height);
  }
};

mergeInto(LibraryManager.library, LibraryBroadway);
