println("\n============================ \n");

var decoder = new Decoder();

var ptr = new Uint8Array(read("Media/admiral.264"));

time = new Date();
decoder.decode(ptr);
println("Elapsed: " + (new Date().getTime() - time.getTime()) + " ms");

println("\n============================ \n");