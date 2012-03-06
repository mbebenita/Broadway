
import os, sys

src = open(sys.argv[1], 'a')
src.write(open('hooks.js').read())
# src.write(open('paint_2.js', 'r').read())
src.close()