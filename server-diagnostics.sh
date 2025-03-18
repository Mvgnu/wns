#!/bin/bash

# WNS Community - Server Diagnostics Script
# This script helps diagnose common deployment issues
# Run with: bash server-diagnostics.sh

# Make the output a bit nicer
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== WNS Community Site - Server Diagnostics ===${NC}"
echo "This script will help diagnose common deployment issues."
echo

# Check if port 3001 is in use and by which process
echo -e "${BLUE}Checking port 3001 usage:${NC}"
if command -v lsof &>/dev/null; then
  PORT_PROCESS=$(sudo lsof -i :3001 | grep LISTEN)
  if [ -z "$PORT_PROCESS" ]; then
    echo -e "${RED}Nothing is listening on port 3001!${NC}"
    echo "This suggests your application is not running on port 3001."
  else
    echo -e "${GREEN}Port 3001 is in use by:${NC}"
    echo "$PORT_PROCESS"
  fi
else
  echo -e "${YELLOW}lsof not found. Using netstat instead:${NC}"
  sudo netstat -tulpn | grep :3001
fi
echo

# Check if PM2 is running the application
echo -e "${BLUE}Checking PM2 processes:${NC}"
if command -v pm2 &>/dev/null; then
  pm2 list
else
  echo -e "${RED}PM2 is not installed or not in PATH${NC}"
fi
echo

# Check Nginx configuration
echo -e "${BLUE}Checking Nginx configuration:${NC}"
if command -v nginx &>/dev/null; then
  echo -e "${YELLOW}Nginx installed. Checking enabled sites:${NC}"
  ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No sites-enabled directory found"
  
  echo -e "\n${YELLOW}Checking if Nginx is listening on port 80:${NC}"
  sudo netstat -tulpn | grep :80
  
  echo -e "\n${YELLOW}Testing Nginx configuration:${NC}"
  sudo nginx -t 2>/dev/null
else
  echo -e "${RED}Nginx is not installed or not in PATH${NC}"
fi
echo

# Check firewall status
echo -e "${BLUE}Checking firewall status:${NC}"
if command -v ufw &>/dev/null; then
  echo -e "${YELLOW}UFW status:${NC}"
  sudo ufw status
elif command -v firewall-cmd &>/dev/null; then
  echo -e "${YELLOW}firewalld status:${NC}"
  sudo firewall-cmd --list-all
else
  echo -e "${RED}No recognized firewall tool found (ufw/firewalld)${NC}"
fi
echo

# Check application logs
echo -e "${BLUE}Checking application logs:${NC}"
if command -v pm2 &>/dev/null; then
  echo -e "${YELLOW}Last 20 lines of PM2 logs for community-site:${NC}"
  pm2 logs community-site --lines 20 --nostream
else
  echo -e "${RED}PM2 not found, cannot check application logs${NC}"
fi
echo

# Provide recommendations based on findings
echo -e "${BLUE}=== Recommendations ===${NC}"
echo -e "1. ${GREEN}Make sure your application is running:${NC}"
echo "   - Check if PM2 is properly running your community-site app on port 3001"
echo "   - Run: PORT=3001 pm2 start npm --name \"community-site\" -- start"
echo
echo -e "2. ${GREEN}Configure Nginx properly:${NC}"
echo "   - Create a configuration file in /etc/nginx/sites-available/wns-community"
echo "   - Use the nginx-config.conf file provided in your project as a template"
echo "   - Link it to sites-enabled: sudo ln -s /etc/nginx/sites-available/wns-community /etc/nginx/sites-enabled/"
echo "   - Test config: sudo nginx -t"
echo "   - Reload Nginx: sudo systemctl reload nginx"
echo
echo -e "3. ${GREEN}Configure your domain:${NC}"
echo "   - Make sure your domain points to your server's IP address"
echo "   - Update the server_name directive in your Nginx config"
echo
echo -e "4. ${GREEN}Check firewall settings:${NC}"
echo "   - Ensure port 80 (and 443 for HTTPS) are open"
echo "   - If using UFW: sudo ufw allow 80/tcp"
echo
echo -e "${BLUE}=== Complete! ===${NC}"
echo "If you're still having issues, please check the Next.js logs for more details." 