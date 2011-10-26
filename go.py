#!/usr/bin/python
import os;
import sys;
import argparse;

commands = ["build", "run"]
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
    os.system("Show/bin/player Play/play.js Play/util.js Play/bits.js Play/common.js Play/nal.js Play/shell.js")

sys.exit(0);
