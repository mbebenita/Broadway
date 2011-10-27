#!/usr/bin/python
import os;
import sys;
import argparse;

commands = ["build", "run", "ref"]
parser = argparse.ArgumentParser(description='Broadway Command Center')
parser.add_argument('command', help="Possible commands: [%s]" % ", ".join(commands));

args = parser.parse_args()

if args.command not in commands:
    print args.command + " is not a valid command."

if args.command == "build":
    os.chdir("Show")
    os.system("scons");
    os.chdir("..")

if args.command == "run":
    os.system("Show/bin/player Play/play.js Play/util.js Play/bits.js Play/common.js Play/ps.js Play/nal.js Play/shell.js")

if args.command == "gdb":
    os.system("gdb --args Show/bin/player Play/play.js Play/util.js Play/bits.js Play/common.js Play/ps.js Play/nal.js Play/shell.js")

if args.command == "ref":
    os.system("Show/bin/player -ref")

sys.exit(0);
