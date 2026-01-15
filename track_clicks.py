"""
MPP eLearning Suite - Click Tracking Browser

Opens Chromium and tracks all clicks/interactions.
Use Config Mode (Ctrl+Shift+P) to position elements.
Export with Ctrl+Shift+S when done.

Press Ctrl+C in terminal to close and save log.
"""

from playwright.sync_api import sync_playwright
import time
import json
from datetime import datetime

clicks = []
console_logs = []

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        # Track console messages
        def on_console(msg):
            log_entry = f"[{msg.type}] {msg.text}"
            console_logs.append(log_entry)
            print(f"CONSOLE: {log_entry}")

        page.on("console", on_console)

        # Load the training page
        page.goto("file:///C:/Users/MarieLexisDad/repos/mpp-elearning-suite/training/index.html")
        page.wait_for_load_state("networkidle")

        print("\n" + "="*60)
        print("MPP eLearning Suite - Click Tracking Active")
        print("="*60)
        print("\nConfig Mode Controls:")
        print("  Ctrl+Shift+P  - Toggle Config Mode ON/OFF")
        print("  Ctrl+Shift+S  - Export positions to JSON")
        print("\nWhen Config Mode is ON:")
        print("  - Drag modals to reposition")
        print("  - Drag/resize the gold highlight box")
        print("  - Scroll to adjust page position")
        print("  - Click 'Next' to move to next step")
        print("\nBrowser is ready. Start configuring positions.")
        print("Press Ctrl+C here when done to close browser.")
        print("="*60 + "\n")

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\nClosing browser...")

            # Save console logs
            log_file = f"C:/Users/MarieLexisDad/repos/mpp-elearning-suite/training/click_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(log_file, "w") as f:
                json.dump({
                    "timestamp": datetime.now().isoformat(),
                    "console_logs": console_logs
                }, f, indent=2)
            print(f"Console logs saved to: {log_file}")

        finally:
            browser.close()

if __name__ == "__main__":
    main()
