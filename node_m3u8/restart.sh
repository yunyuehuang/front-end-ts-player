#!/bin/bash


proc = "m3u8_main"

all_pid=`ps aux | grep -w "$proc" | grep -v grep |awk -F " " '{print $2}'`
if [ "${all_pid}" = "" ]; then
    echo "stop: no $proc process"
    exit 1
fi

echo "stop: kill all $proc process"
kill -TERM ${all_pid}


node ./m3u8_main.js