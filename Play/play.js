function getRGB(r, g, b) {
	return r << 24 | g << 16 | b;
}

function drawLine(screen, x0, y0, x1, y1) {
	var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
	var dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
	var err = (dx > dy ? dx : -dy) / 2;

	while (true) {
		screen.setPixel(x0, y0, 200, 200, 200);
		if (x0 === x1 && y0 === y1)
			break;
		var e2 = err;
		if (e2 > -dx) {
			err -= dy;
			x0 += sx;
		}
		if (e2 < dy) {
			err += dx;
			y0 += sy;
		}
	}
}

var lastTime = new Date()

var frame = 0;

function paint(buffer, width, height, pitch, bpp) {
	var uint32View = new Uint32Array(buffer);
	
	var screen = {
		setPixel: function(x, y, r, g, b) {
			uint32View[(y * pitch / bpp) + x] = getRGB(r, g, b); 
		}
	}
	
	frame += 10;
	
	for (y = 0; y < height; y++) {
		start = y * pitch / bpp;
		for (x = 0; x < width; x++) {
			uint32View[start + x] = 
				getRGB((x * x) / 256 + 3 * y + frame,
					   (y * y) / 256 + x + frame,
					   frame); 
		}
	}

	if (false) {
		x0 = Math.round((Math.random() * width));
		x1 = Math.round((Math.random() * width));
		y0 = Math.round((Math.random() * height));
		y1 = Math.round((Math.random() * height));
		drawLine(screen, x0, x1, y0, y1);
	}

	newTime = new Date()
	if (frame % 100 == 0) {
		print ("Frame Rate (fps): " + (1000 / (newTime.getTime() - lastTime.getTime()) + "\n"))
	}
	lastTime = newTime;
}