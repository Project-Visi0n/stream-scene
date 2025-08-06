#!/bin/bash

# Memory and System Monitoring Script for EC2
# Run this on your EC2 instance to monitor resource usage

echo "System Resource Monitor for EC2 Instance"
echo "=========================================="
echo ""

echo "Memory Usage:"
echo "-------------"
free -h

echo ""
echo "Disk Usage:"
echo "-----------"
df -h

echo ""
echo "CPU Usage (top 10 processes):"
echo "------------------------------"
ps aux --sort=-%cpu | head -11

echo ""
echo "Memory Usage (top 10 processes):"
echo "---------------------------------"
ps aux --sort=-%mem | head -11

echo ""
echo "System Load Average:"
echo "--------------------"
uptime

echo ""
echo "System Temperature (if available):"
echo "----------------------------------"
if command -v sensors &> /dev/null; then
    sensors
else
    echo "sensors command not available (install with: sudo apt install lm-sensors)"
fi

echo ""
echo "PM2 Process Status:"
echo "-------------------"
if command -v pm2 &> /dev/null; then
    pm2 status
    echo ""
    echo "PM2 Memory Usage:"
    pm2 monit --no-colors | head -20
else
    echo "PM2 not installed or not in PATH"
fi

echo ""
echo "Node.js Processes:"
echo "------------------"
ps aux | grep node | grep -v grep

echo ""
echo "Network Connections (ports 8000, 3000, 80, 443):"
echo "-------------------------------------------------"
netstat -tlnp | grep -E ':(8000|3000|80|443)'

echo ""
echo "Recent System Messages (last 10):"
echo "----------------------------------"
sudo journalctl --no-pager -n 10

echo ""
echo "To continuously monitor memory, run:"
echo "watch -n 2 'free -h && echo && ps aux --sort=-%mem | head -6'"
