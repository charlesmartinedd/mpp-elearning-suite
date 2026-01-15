from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(viewport={"width": 1920, "height": 1080})
    page = context.new_page()

    page.on("console", lambda msg: print(f"[CONSOLE] {msg.type}: {msg.text}"))

    page.goto("file:///C:/Users/MarieLexisDad/repos/mpp-elearning-suite/training/index.html")
    page.wait_for_load_state("networkidle")

    print("Browser opened. All 7 steps now have highlight data.")
    print("Click Start Training and go through tour - spotlight should show on ALL steps.")

    while True:
        time.sleep(60)
