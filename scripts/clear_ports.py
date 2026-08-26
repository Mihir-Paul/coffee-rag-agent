import sys
import os
import subprocess

def clear_port(port: int):
    """Find and kill any stale process listening on the given port on Windows/Unix."""
    if sys.platform == "win32":
        try:
            output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, text=True)
            for line in output.strip().split("\n"):
                if "LISTENING" in line:
                    parts = line.strip().split()
                    pid = parts[-1]
                    if pid and pid.isdigit() and int(pid) != 0 and int(pid) != os.getpid():
                        print(f"Stopping stale process PID {pid} on port {port}...")
                        os.system(f"taskkill /PID {pid} /F >nul 2>&1")
        except Exception:
            pass

if __name__ == "__main__":
    clear_port(8000)
    clear_port(5173)
