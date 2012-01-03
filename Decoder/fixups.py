#!/usr/bin/python
import os
import re
import sys
import argparse

parser = argparse.ArgumentParser(description='JS Fixups')
parser.add_argument('file', help="file to process")
args = parser.parse_args()

file = open(args.file)

text = file.read()

pat = 'HEAP32\[(?P<base>.*)+?P<offset>.*)>>?P<shift>.*)\]'
pat = 'HEAP32\[(\w*?)\+(\d*?)>>2\]'
# print pat

rex = re.compile(pat, re.MULTILINE)

def replace(match):
	# print match.group(0)
	base = match.group(1)
	offset = match.group(2)
	return "HEAP32[(" + base + ">>2)+(" + offset + ">>2)]"

text = rex.sub(replace, text)

print text