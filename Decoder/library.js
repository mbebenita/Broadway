var LibraryBroadway = {
  broadwayOnHeadersDecoded: function () {
    _broadwayOnHeadersDecoded();
  },
  broadwayOnPictureDecoded: function ($buffer, width, height) {
    _broadwayOnPictureDecoded($buffer, width, height);
  }
};

mergeInto(LibraryManager.library, LibraryBroadway);
