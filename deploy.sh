#!/bin/bash

#############################################################################
# NutriScan Offline Deployment Script
# Purpose: Deploy and run the server locally without external dependencies
#############################################################################

set -e  # Exit on error

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PORT=3002
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_DIR/.server.pid"
LOG_FILE="$PROJECT_DIR/server.log"

#############################################################################
# FUNCTIONS
#############################################################################

print_banner() {
  echo -e "${BLUE}"
  cat << "EOF"
╔══════════════════════════════════════╗
║   NutriScan Offline Deployment       ║
║   Bash Deployment Script             ║
╚══════════════════════════════════════╝
EOF
  echo -e "${NC}"
}

check_node() {
  if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Install from: https://nodejs.org/"
    exit 1
  fi
  NODE_VERSION=$(node -v)
  echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
}

check_port() {
  if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port $PORT is already in use${NC}"
    PID=$(lsof -t -i :$PORT | head -1)
    echo -e "${YELLOW}  Process ID: $PID${NC}"
    read -p "Kill existing process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      kill -9 $PID
      echo -e "${GREEN}✓ Process killed${NC}"
      sleep 1
    else
      echo -e "${RED}✗ Deployment cancelled${NC}"
      exit 1
    fi
  fi
}

verify_server_files() {
  echo -e "${BLUE}Verifying project files...${NC}"
  
  files=("server.js" "index.html" "app.js" "style.css")
  
  for file in "${files[@]}"; do
    if [ ! -f "$PROJECT_DIR/$file" ]; then
      echo -e "${RED}✗ Missing: $file${NC}"
      exit 1
    fi
    echo -e "${GREEN}✓ Found: $file${NC}"
  done
}

start_server() {
  echo -e "${BLUE}Starting server on port $PORT...${NC}"
  
  # Start server in background
  cd "$PROJECT_DIR"
  node server.js > "$LOG_FILE" 2>&1 &
  SERVER_PID=$!
  
  # Save PID
  echo $SERVER_PID > "$PID_FILE"
  
  # Wait for server to start
  sleep 2
  
  # Check if process is still running
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}✗ Server failed to start${NC}"
    echo -e "${RED}Error log:${NC}"
    cat "$LOG_FILE"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Server started (PID: $SERVER_PID)${NC}"
}

show_access_info() {
  echo -e "${GREEN}"
  cat << EOF

╔════════════════════════════════════════╗
║   🚀 SERVER DEPLOYED SUCCESSFULLY      ║
╚════════════════════════════════════════╝

📍 Access URL:
   http://localhost:$PORT

📋 Features:
   • Barcode Scanner
   • Label OCR (AI)
   • Health Analysis
   • Food Database Lookup

🔧 Server Details:
   • Port: $PORT
   • Process ID: $SERVER_PID
   • Log File: $LOG_FILE
   • Working Dir: $PROJECT_DIR

💡 Tips:
   • Open http://localhost:$PORT in your browser
   • To stop server: kill $SERVER_PID
   • View logs: tail -f $LOG_FILE
   • Restart: ./deploy.sh restart

EOF
  echo -e "${NC}"
}

stop_server() {
  if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 $OLD_PID 2>/dev/null; then
      kill -9 $OLD_PID
      echo -e "${GREEN}✓ Server stopped (PID: $OLD_PID)${NC}"
      rm -f "$PID_FILE"
    fi
  fi
}

view_logs() {
  if [ -f "$LOG_FILE" ]; then
    echo -e "${BLUE}Server logs (last 20 lines):${NC}"
    tail -20 "$LOG_FILE"
  else
    echo -e "${YELLOW}No log file found${NC}"
  fi
}

status_server() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 $PID 2>/dev/null; then
      echo -e "${GREEN}✓ Server is running (PID: $PID)${NC}"
      return 0
    else
      echo -e "${RED}✗ Server is not running (stale PID file)${NC}"
      rm -f "$PID_FILE"
      return 1
    fi
  else
    echo -e "${RED}✗ Server is not running${NC}"
    return 1
  fi
}

#############################################################################
# MAIN
#############################################################################

print_banner

# Parse command
COMMAND="${1:-start}"

case "$COMMAND" in
  start)
    check_node
    verify_server_files
    check_port
    start_server
    show_access_info
    ;;
  
  stop)
    echo -e "${BLUE}Stopping server...${NC}"
    stop_server
    ;;
  
  restart)
    echo -e "${BLUE}Restarting server...${NC}"
    stop_server
    sleep 1
    check_port
    start_server
    show_access_info
    ;;
  
  status)
    status_server
    ;;
  
  logs)
    view_logs
    ;;
  
  *)
    echo -e "${YELLOW}Usage: $0 {start|stop|restart|status|logs}${NC}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the server (default)"
    echo "  stop    - Stop the running server"
    echo "  restart - Restart the server"
    echo "  status  - Show server status"
    echo "  logs    - View server logs"
    exit 1
    ;;
esac

exit 0
