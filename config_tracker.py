"""
MPP eLearning Suite - Config Mode Tracker

Opens Chromium and tracks all Config Mode actions through console logs.
Monitors position changes as you drag modals and highlight boxes.
"""

from playwright.sync_api import sync_playwright
import time
import json
import sys
from datetime import datetime

positions_log = []
current_step = None

def main():
    with sync_playwright() as p:
        print("Launching Chromium browser...")
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        # Track all console messages for Config Mode activity
        def on_console(msg):
            text = msg.text
            print(f"[{msg.type.upper()}] {text}")
            sys.stdout.flush()

            # Track step changes
            if "Step changed" in text or "current step" in text.lower():
                positions_log.append({"event": "step_change", "message": text, "time": datetime.now().isoformat()})

            # Track position saves
            if "position" in text.lower() or "saved" in text.lower() or "highlight" in text.lower():
                positions_log.append({"event": "position", "message": text, "time": datetime.now().isoformat()})

            # Track exports
            if "export" in text.lower() or "download" in text.lower():
                positions_log.append({"event": "export", "message": text, "time": datetime.now().isoformat()})

        page.on("console", on_console)

        # Track downloads (for the JSON export)
        def on_download(download):
            print(f"\n*** DOWNLOAD: {download.suggested_filename} ***")
            # Save to known location
            save_path = f"C:/Users/MarieLexisDad/repos/mpp-elearning-suite/training/{download.suggested_filename}"
            download.save_as(save_path)
            print(f"*** Saved to: {save_path} ***\n")
            sys.stdout.flush()

        page.on("download", on_download)

        # Load the training page
        print("Loading training page...")
        page.goto("file:///C:/Users/MarieLexisDad/repos/mpp-elearning-suite/training/index.html")
        page.wait_for_load_state("networkidle")

        print("\n" + "="*70)
        print("  MPP eLearning Suite - Config Mode Tracker")
        print("="*70)
        print("""
  INSTRUCTIONS:

  1. Click "Start Training" to begin the tour

  2. Press Ctrl+Shift+P to activate CONFIG MODE
     - You'll see a gold highlight box appear
     - Status indicator shows "CONFIG MODE ACTIVE"

  3. For EACH of the 7 steps:
     a) DRAG THE MODAL to position it where you want
     b) DRAG THE HIGHLIGHT BOX to spotlight the target area
     c) RESIZE highlight by dragging its corners
     d) SCROLL page if needed
     e) Click "Next" to advance

  4. After all 7 steps, press Ctrl+Shift+S to EXPORT
     - JSON file will be saved automatically

  5. Close browser when done (I'll capture the final positions)

  STEPS: homepage > welcome-message > mentor-benefits >
         protege-benefits > summit > footer > complete
""")
        print("="*70)
        print("Browser is ready. Console output will appear below.\n")
        sys.stdout.flush()

        try:
            # Keep browser open until user closes it
            while page.url:
                time.sleep(0.5)
        except Exception as e:
            print(f"\nBrowser closed. ({e})")

        # Save tracking log
        log_file = f"C:/Users/MarieLexisDad/repos/mpp-elearning-suite/training/config_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_file, "w") as f:
            json.dump(positions_log, f, indent=2)
        print(f"\nTracking log saved to: {log_file}")

        browser.close()
        print("Done!")

if __name__ == "__main__":
    main()
