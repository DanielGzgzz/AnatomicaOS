with open('js/app.js', 'r') as f:
    content = f.read()

# We need to add the juicer database and methods
juicer_code = """
    // --- JUICER MODULE ---

    juicerDB: {
        beetroot: { name: 'Beetroot', unitName: '1 Medium Beet', gPerUnit: 136, cals: 58, sugar: 9, ph: 5.5, vitA_mcg: 2, vitC_mg: 6.7, calc_mg: 22, iron_mg: 1.1, mag_mg: 31, pot_mg: 442, color: [138, 15, 61], benefits: ["Nitrates improve blood flow", "Liver support (Betaine)"], hazards: ["High in oxalates", "Beeturia (red urine)"] },
        carrot: { name: 'Carrot', unitName: '1 Medium Carrot', gPerUnit: 61, cals: 25, sugar: 2.9, ph: 6.0, vitA_mcg: 509, vitC_mg: 3.6, calc_mg: 20, iron_mg: 0.18, mag_mg: 7, pot_mg: 195, color: [237, 145, 33], benefits: ["High Beta-Carotene (Vision)", "Antioxidant rich"], hazards: ["Carotenemia (orange skin) in extreme excess"] },
        celery: { name: 'Celery', unitName: '1 Stalk', gPerUnit: 40, cals: 6, sugar: 0.5, ph: 5.8, vitA_mcg: 18, vitC_mg: 1.2, calc_mg: 16, iron_mg: 0.08, mag_mg: 4, pot_mg: 104, color: [168, 228, 160], benefits: ["Hydration", "Apigenin (Anti-inflammatory)"], hazards: ["High sodium relative to other veg"] },
        spinach: { name: 'Spinach', unitName: '1 Cup Raw', gPerUnit: 30, cals: 7, sugar: 0.1, ph: 6.5, vitA_mcg: 141, vitC_mg: 8.4, calc_mg: 30, iron_mg: 0.81, mag_mg: 24, pot_mg: 167, color: [50, 100, 30], benefits: ["Folate", "Vitamin K"], hazards: ["High oxalates (binds calcium)"] },
        kale: { name: 'Kale', unitName: '1 Cup Raw', gPerUnit: 21, cals: 8, sugar: 0.2, ph: 6.6, vitA_mcg: 53, vitC_mg: 19.6, calc_mg: 53, iron_mg: 0.3, mag_mg: 7, pot_mg: 73, color: [40, 80, 40], benefits: ["Lutein/Zeaxanthin", "High Vitamin K/C"], hazards: ["Goitrogens (thyroid interference raw)"] },
        cucumber: { name: 'Cucumber', unitName: '1/2 Medium', gPerUnit: 100, cals: 15, sugar: 1.7, ph: 5.5, vitA_mcg: 5, vitC_mg: 2.8, calc_mg: 16, iron_mg: 0.28, mag_mg: 13, pot_mg: 147, color: [152, 251, 152], benefits: ["Hydration", "Silica (skin health)"], hazards: [] },
        potato: { name: 'Sweet Potato', unitName: '1 Medium', gPerUnit: 130, cals: 112, sugar: 5.4, ph: 5.4, vitA_mcg: 961, vitC_mg: 3.1, calc_mg: 39, iron_mg: 0.8, mag_mg: 33, pot_mg: 438, color: [224, 141, 60], benefits: ["Complex carbs", "Massive Vitamin A"], hazards: ["Must be cooked/steamed if juicing"] },
        apple: { name: 'Apple', unitName: '1 Medium', gPerUnit: 182, cals: 95, sugar: 18.9, ph: 3.5, vitA_mcg: 5, vitC_mg: 8.4, calc_mg: 11, iron_mg: 0.2, mag_mg: 9, pot_mg: 195, color: [230, 230, 180], benefits: ["Quercetin", "Pectin (gut health)"], hazards: ["High fructose"] },
        orange: { name: 'Orange', unitName: '1 Medium', gPerUnit: 131, cals: 62, sugar: 12.2, ph: 3.9, vitA_mcg: 15, vitC_mg: 69.7, calc_mg: 52, iron_mg: 0.13, mag_mg: 13, pot_mg: 237, color: [255, 165, 0], benefits: ["High Vitamin C", "Citric acid (prevents stones)"], hazards: ["High acidity", "Sugar load if skin removed"] },
        pineapple: { name: 'Pineapple', unitName: '1 Cup Chunks', gPerUnit: 165, cals: 82, sugar: 16.3, ph: 3.4, vitA_mcg: 5, vitC_mg: 78.9, calc_mg: 21, iron_mg: 0.48, mag_mg: 20, pot_mg: 180, color: [255, 235, 100], benefits: ["Bromelain (digestion)", "High Vitamin C"], hazards: ["Highly acidic", "Can irritate oral mucosa"] },
        lemon: { name: 'Lemon', unitName: '1/2 Lemon Juice', gPerUnit: 24, cals: 7, sugar: 0.6, ph: 2.2, vitA_mcg: 0, vitC_mg: 9.3, calc_mg: 2, iron_mg: 0.02, mag_mg: 1, pot_mg: 25, color: [255, 255, 150], benefits: ["Liver flushing", "Alkalizing post-digestion"], hazards: ["Enamel erosion (highly acidic)"] },
        ginger: { name: 'Ginger', unitName: '1 Inch Root', gPerUnit: 24, cals: 19, sugar: 0.4, ph: 5.8, vitA_mcg: 0, vitC_mg: 1.2, calc_mg: 4, iron_mg: 0.14, mag_mg: 10, pot_mg: 100, color: [220, 200, 150], benefits: ["Gingerol (anti-nausea/anti-inflammatory)", "Gastric motility"], hazards: ["Spicy/Heartburn in excess"] },
        mint: { name: 'Mint', unitName: '10 Leaves', gPerUnit: 2, cals: 1, sugar: 0, ph: 6.5, vitA_mcg: 4, vitC_mg: 0.6, calc_mg: 5, iron_mg: 0.1, mag_mg: 1, pot_mg: 11, color: [20, 150, 50], benefits: ["Menthol (digestion)", "Flavor enhancer"], hazards: [] }
    },

    syncJuicerInput(item, changed) {
        const db = this.juicerDB[item];
        const elUnit = document.getElementById(`ing-${item}`);
        const elG = document.getElementById(`ing-${item}-g`);

        if (changed === 'unit') {
            const units = parseFloat(elUnit.value) || 0;
            if (units === 0) elG.value = '';
            else elG.value = Math.round(units * db.gPerUnit);
        } else {
            const g = parseFloat(elG.value) || 0;
            if (g === 0) elUnit.value = '';
            else elUnit.value = (g / db.gPerUnit).toFixed(1);
        }
    },

    calculateJuice() {
        let totalStats = {
            cals: 0, sugar: 0, vitA: 0, vitC: 0, calc: 0, iron: 0, mag: 0, pot: 0,
            weight: 0, totalPh: 0, ingredients: []
        };
        let colorSum = [0, 0, 0];
        let benefits = new Set();
        let hazards = new Set();

        for (const [key, db] of Object.entries(this.juicerDB)) {
            const g = parseFloat(document.getElementById(`ing-${key}-g`)?.value) || 0;
            if (g > 0) {
                const ratio = g / 100; // Database values are per 100g? Wait, I made them per unit.
                // Let's normalize DB to per gram for math.
                const perGram = {
                    cals: db.cals / db.gPerUnit,
                    sugar: db.sugar / db.gPerUnit,
                    vitA: db.vitA_mcg / db.gPerUnit,
                    vitC: db.vitC_mg / db.gPerUnit,
                    calc: db.calc_mg / db.gPerUnit,
                    iron: db.iron_mg / db.gPerUnit,
                    mag: db.mag_mg / db.gPerUnit,
                    pot: db.pot_mg / db.gPerUnit
                };

                totalStats.cals += perGram.cals * g;
                totalStats.sugar += perGram.sugar * g;
                totalStats.vitA += perGram.vitA * g;
                totalStats.vitC += perGram.vitC * g;
                totalStats.calc += perGram.calc * g;
                totalStats.iron += perGram.iron * g;
                totalStats.mag += perGram.mag * g;
                totalStats.pot += perGram.pot * g;

                // pH is logarithmic, but we'll do a weighted average by weight for simplicity in this demo.
                totalStats.totalPh += db.ph * g;
                totalStats.weight += g;

                // Color mixing (weighted)
                colorSum[0] += db.color[0] * g;
                colorSum[1] += db.color[1] * g;
                colorSum[2] += db.color[2] * g;

                db.benefits.forEach(b => benefits.add(b));
                db.hazards.forEach(h => hazards.add(h));
            }
        }

        const outCard = document.getElementById('juicer-analysis-card');
        const emptyState = document.getElementById('juicer-empty-state');

        if (totalStats.weight === 0) {
            outCard.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        outCard.style.display = 'block';

        const estPh = (totalStats.totalPh / totalStats.weight).toFixed(1);

        document.getElementById('juice-cals').innerText = Math.round(totalStats.cals);
        document.getElementById('juice-sugar').innerText = totalStats.sugar.toFixed(1) + 'g';
        document.getElementById('juice-ph').innerText = estPh;

        const r = Math.round(colorSum[0] / totalStats.weight);
        const g = Math.round(colorSum[1] / totalStats.weight);
        const b = Math.round(colorSum[2] / totalStats.weight);
        document.getElementById('juice-color-swatch').style.background = `rgb(${r},${g},${b})`;

        // Populate Benefits/Hazards
        const benEl = document.getElementById('juice-benefits');
        benEl.innerHTML = '';
        benefits.forEach(b => benEl.innerHTML += `<li>${b}</li>`);
        if(benefits.size === 0) benEl.innerHTML = "<li>No specific clinical benefits identified.</li>";

        const hazEl = document.getElementById('juice-hazards');
        hazEl.innerHTML = '';
        hazards.forEach(h => hazEl.innerHTML += `<li>${h}</li>`);
        if (estPh < 4.0) hazEl.innerHTML += "<li><strong>High Acidity:</strong> May cause enamel erosion or heartburn. Dilute or consume quickly.</li>";
        if (totalStats.sugar > 40) hazEl.innerHTML += "<li><strong>High Sugar Load:</strong> May spike insulin. Consider adding fiber/greens.</li>";
        if(hazEl.innerHTML === '') hazEl.innerHTML = "<li>No major hazards.</li>";

        // Macros vs RDA (Estimates for standard adult male)
        const table = document.getElementById('juice-nutrient-table');
        table.innerHTML = `
            <tr><td>Vitamin A</td><td>${Math.round(totalStats.vitA)} mcg</td><td>${Math.round((totalStats.vitA / 900) * 100)}%</td></tr>
            <tr><td>Vitamin C</td><td>${Math.round(totalStats.vitC)} mg</td><td>${Math.round((totalStats.vitC / 90) * 100)}%</td></tr>
            <tr><td>Calcium</td><td>${Math.round(totalStats.calc)} mg</td><td>${Math.round((totalStats.calc / 1000) * 100)}%</td></tr>
            <tr><td>Iron</td><td>${totalStats.iron.toFixed(1)} mg</td><td>${Math.round((totalStats.iron / 8) * 100)}%</td></tr>
            <tr><td>Magnesium</td><td>${Math.round(totalStats.mag)} mg</td><td>${Math.round((totalStats.mag / 400) * 100)}%</td></tr>
            <tr><td>Potassium</td><td>${Math.round(totalStats.pot)} mg</td><td>${Math.round((totalStats.pot / 3400) * 100)}%</td></tr>
        `;
    },
"""

import re
# Check if translateJuice exists, then we insert before it
if "translateJuice() {" in content:
    content = content.replace("translateJuice() {", juicer_code + "\n    translateJuice() {")
    with open('js/app.js', 'w') as f:
        f.write(content)
    print("Injected Juicer logic")
else:
    print("Could not find translateJuice")
