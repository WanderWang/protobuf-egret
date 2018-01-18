#! /usr/bin/env node


const command = process.argv[2];
const egretProject = process.argv[3];
require('./').run(command, egretProject);