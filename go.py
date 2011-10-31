#!/usr/bin/python
import os
import sys
import argparse

commands = ["build", "run", "ref", "cmp"]
parser = argparse.ArgumentParser(description='Broadway Command Center')
parser.add_argument('command', help="Possible commands: [%s]" % ", ".join(commands))

args = parser.parse_args()

if args.command not in commands:
    print args.command + " is not a valid command."

if args.command == "build":
    os.chdir("Show")
    os.system("scons")
    os.chdir("..")

scripts = ['Play/play.js', 'Play/util.js', 'Play/bits.js', 'Play/common.js', 'Play/ps.js', 'Play/nal.js', 'Play/shell.js']
scriptsCommad = " ".join(["-s %s" % s for s in scripts])

if args.command == "run":
    os.system("Show/bin/player -j " + scriptsCommad + " -a \"Media/admiral.264\"")

# if args.command == "gdb":
#     os.system("gdb --args Show/bin/player Play/play.js Play/util.js Play/bits.js Play/common.js Play/ps.js Play/nal.js Play/shell.js")

if args.command == "ref":
    os.system("Show/bin/player -r -a \"Media/admiral.264\"")

if args.command == "cmp":
    os.system("Show/bin/player -r -a \"Media/admiral.264\" > ref.out")
    os.system("Show/bin/player -j " + scriptsCommad + " -a \"Media/admiral.264\" > jsr -> jsr.out")



sys.exit(0)
