import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:3000")

        print("Checking Biometrics module...")
        await page.evaluate("app.loadDemoData()")
        await page.evaluate("app.generateSchedule()")

        print("Checking Kinesiology module...")
        kinesiology_data = await page.evaluate("document.getElementById('kinesiology-data').style.display")
        if kinesiology_data != 'none':
            print("Kinesiology module works (schedule generated).")
        else:
            print("ERROR: Kinesiology module failed to generate schedule.")

        print("Checking Nutrition module...")
        await page.evaluate("app.showModule('nutrition')")
        nutrition_tdee = await page.evaluate("document.getElementById('nutrition-tdee').innerHTML")
        if "Target Intake" in nutrition_tdee or "kcal/day" in nutrition_tdee:
            print("Nutrition module works.")
        else:
            print("ERROR: Nutrition module missing data.")
            print(f"Content: {nutrition_tdee[:100]}")

        print("Checking Juicer module...")
        await page.evaluate("app.showModule('juicer')")
        juicer_html = await page.evaluate("document.getElementById('juicer-content').innerHTML")
        if "juicer" in juicer_html.lower() or "smoothie" in juicer_html.lower() or "blend" in juicer_html.lower():
            print("Juicer module works.")
        else:
            print("ERROR: Juicer module missing data.")
            print(f"Content: {juicer_html[:100]}")

        print("Checking Visualizer module...")
        await page.evaluate("app.showModule('visualizer')")
        await page.wait_for_timeout(1000) # Give WebGL time to init
        has_canvas = await page.evaluate("!!document.querySelector('#webgl-container canvas')")
        if has_canvas:
            print("Visualizer canvas rendered.")
        else:
            print("ERROR: Visualizer canvas missing.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
