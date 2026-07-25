import subprocess
import sys
import time
import urllib.request
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def run_command(cmd, cwd=None):
    print(f"\nRunning: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd, text=True)
    if result.returncode != 0:
        print(f"Command failed with return code {result.returncode}")
        sys.exit(result.returncode)

def main():
    print("==================================================")
    print("   AetherBio AI - Docker Launcher & Runner")
    print("==================================================")

    # 1. Build and Start Docker Containers
    run_command(["docker", "compose", "up", "--build", "-d"])

    print("\nWaiting 5 seconds for services to initialize...")
    time.sleep(5)

    # 2. Check Docker Container Status
    run_command(["docker", "ps"])

    # 3. Perform Backend Healthcheck
    print("\nTesting Backend API Health Check (http://localhost:8000/api/v1/health)...")
    try:
        req = urllib.request.urlopen("http://localhost:8000/api/v1/health", timeout=5)
        status_code = req.getcode()
        body = json.loads(req.read().decode('utf-8'))
        print(f"Backend Health Status ({status_code}): {json.dumps(body, indent=2)}")
    except Exception as e:
        print(f"Health check warning: {e}")

    print("\n==================================================")
    print("AetherBio AI Docker Setup is Live!")
    print("Frontend UI:  http://localhost:3000")
    print("Backend API:   http://localhost:8000")
    print("==================================================")

if __name__ == "__main__":
    main()
