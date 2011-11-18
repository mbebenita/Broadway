function getSurface() {
  var surface = SDL.surfaces[SDL.screen];
  if (!surface.image) {
    surface.image = surface.ctx.getImageData(0, 0, surface.width, surface.height);
    var data = surface.image.data;
    var num = data.length;
    for (var i = 0; i < num/4; i++) {
      data[i*4+3] = 255; // opacity, as canvases blend alpha
    }
  }
  return surface;
}

Module['paint'] = function ($luma, $cb, $cr, w, h) {
  for (var y1,y2,u,v,ruv,guv,buv,j,w_2=w>>1,W=w*4, surface = getSurface(), d=surface.image.data, r=0; h-=2;) {
    for (j=w_2; j--;) {
      u = IHEAP[$cr++];
      v = IHEAP[$cb++];
      ruv = 409*u-56992;
      guv = 34784-208*u-100*v;
      buv = 516*v-70688;

      y2 = IHEAP[$luma+w]*298;
      y1 = IHEAP[$luma++]*298;
      d[r+W] = y2+ruv>>8;
      d[r++] = y1+ruv>>8;
      d[r+W] = y2+guv>>8;
      d[r++] = y1+guv>>8;
      d[r+W] = y2+buv>>8;
      d[r++] = y1+buv>>8;
      r++;

      y2 = IHEAP[$luma+w]*298;
      y1 = IHEAP[$luma++]*298;
      d[r+W] = y2+ruv>>8;
      d[r++] = y1+ruv>>8;
      d[r+W] = y2+guv>>8;
      d[r++] = y1+guv>>8;
      d[r+W] = y2+buv>>8;
      d[r++] = y1+buv>>8;
      r++;
    }
    r+=W;
    $luma+=w;
  }
  surface.ctx.putImageData(surface.image, 0, 0 );
}

_paint = function ($luma, $cb, $cr, w, h) {
  Module['paint'] ($luma, $cb, $cr, w, h);
}
