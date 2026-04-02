import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:3000")

        print("Checking Biometrics module...")
        await page.click("text=Demo Data")
        await page.wait_for_timeout(500)
        await page.click("text=Generate Microcycle Protocol")
        await page.wait_for_timeout(1000)

        schedule = await page.query_selector("#schedule-container")
        schedule_text = await schedule.inner_text() if schedule else ""
        if "Day 1" in schedule_text:
            print("Kinesiology module works (schedule generated).")
        else:
            print("ERROR: Kinesiology module failed to generate schedule.")

        print("Checking Nutrition module...")
        await page.click("text=Nutrition")
        await page.wait_for_timeout(500)
        nutrition_content = await page.query_selector("#nutrition-plan")
        nutrition_text = await nutrition_content.inner_text() if nutrition_content else ""
        if "Calories" in nutrition_text or "Protein" in nutrition_text:
            print("Nutrition module works.")
        else:
            print("ERROR: Nutrition module missing data.")

        print("Checking Juicer module...")
        await page.click("text=Juicer")
        await page.wait_for_timeout(500)
        juicer_content = await page.query_selector("#juicer-content")
        juicer_text = await juicer_content.inner_text() if juicer_content else ""
        if "Recipe" in juicer_text or "Vitamin" in juicer_text:
            print("Juicer module works.")
        else:
            print("ERROR: Juicer module missing data.")

        print("Checking Visualizer module...")
        await page.click("text=Visualizer")
        await page.wait_for_timeout(1000)
        canvas = await page.query_selector("#webgl-container canvas")
        if canvas:
            print("Visualizer canvas rendered.")
        else:
            print("ERROR: Visualizer canvas missing.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
