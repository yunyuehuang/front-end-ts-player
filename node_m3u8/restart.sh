#!/bin/bash


proc="m3u8_main"

all_pid=`ps aux | grep -w "$proc" | grep -v grep |awk -F " " '{print $2}'`
if [ "${all_pid}" = "" ]; then
    echo "stop: no $proc process"
    
else
    echo "stop: kill all $proc process"
    kill -9 ${all_pid}

fi




nohup node ./m3u8_main.js &