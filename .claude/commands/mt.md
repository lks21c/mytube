# MyTube Server Control

Control the MyTube Next.js development server (port 3434).

**Usage**: `/mt [start|stop|status|restart]`

**Argument**: $ARGUMENTS

## Instructions

Based on the argument provided, perform the appropriate action:

### If argument is "start" or empty:
1. First check if Next.js server is already running:
   ```bash
   lsof -ti:3434 || pgrep -f "next dev.*3434"
   ```
2. If already running, report "MyTube server is already running on port 3434"
3. If not running, start it in background:
   ```bash
   cd /Users/hydra01/repo/mytube && npm run dev
   ```
   (Run this command in background using `run_in_background: true`)
4. Wait 3 seconds and verify it started:
   ```bash
   curl -s http://localhost:3434/ > /dev/null && echo "Server started successfully" || echo "Starting..."
   ```

### If argument is "stop":
1. Find and kill the Next.js server process:
   ```bash
   lsof -ti:3434 | xargs kill -9 2>/dev/null && echo "MyTube server stopped" || echo "Server was not running"
   ```

### If argument is "status":
1. Check if running:
   ```bash
   lsof -ti:3434 || pgrep -f "next dev.*3434"
   ```
2. If running, also check endpoint:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3434/
   ```
3. Report status clearly (Running/Stopped, PID, port)

### If argument is "restart":
1. Stop the server first (using stop logic above)
2. Wait 2 seconds
3. Start the server (using start logic above)

## Output Format

Always report clearly:
- **Status**: Running / Stopped
- **Port**: 3434
- **PID**: (if running)
- **URL**: http://localhost:3434 (if running)
