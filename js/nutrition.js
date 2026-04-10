window.app = window.app || {};
Object.assign(window.app, {
    updateNutritionModule() {
        if (!this.state.biometrics) return;

        document.getElementById('nutrition-warning').style.display = 'none';
        document.getElementById('nutrition-data').style.display = 'block';

        const bio = this.state.biometrics;

        // Mifflin-St Jeor Equation for BMR
        let bmr = (10 * bio.weight) + (6.25 * bio.height) - (5 * bio.age);
        bmr += bio.gender === 'male' ? 5 : -161;

        // TDEE (Total Daily Energy Expenditure)
        let tdee = Math.round(bmr * 1.55); // Assuming active

        let pPct = 0.30, cPct = 0.45, fPct = 0.25;
        let goalText = "Maintenance";
        let deficitKcal = 0;

        if (bio.goal === 'weight_loss') {
            deficitKcal = Math.round(tdee * 0.25);
            tdee = Math.round(tdee * 0.75); // Aggressive 25% deficit
            pPct = 0.45; // High protein for satiety and lean mass leverage
            cPct = 0.30;
            fPct = 0.25;
            goalText = "Aggressive Deficit (Weight Loss)";
        } else if (bio.goal === 'hypertrophy') {
            tdee = Math.round(tdee * 1.10); // 10% surplus
            pPct = 0.30; cPct = 0.50; fPct = 0.20;
            goalText = "Hypertrophic Surplus";
        }

        // Calculate BMI and Weight Goals
        const heightMeters = bio.height / 100;
        const bmi = (bio.weight / (heightMeters * heightMeters)).toFixed(1);
        let targetBMI = 22; // Healthy target BMI
        if (bio.gender === 'male') targetBMI = 23;
        const targetWeight = (targetBMI * (heightMeters * heightMeters)).toFixed(1);

        let bmiText = `<strong>BMI:</strong> ${bmi} <span style="font-size: 0.85rem; color: var(--text-muted);">(Target Healthy Weight: ~${targetWeight}kg)</span>`;
        let fatLossText = "";

        if (deficitKcal > 0) {
            // Approx 7700 kcal per kg of body fat
            const weeklyDeficit = deficitKcal * 7;
            const fatLossWeekly = (weeklyDeficit / 7700).toFixed(2);
            fatLossText = `<br><span style="font-size: 0.85rem; color: #166534; font-weight: bold;">Expected Fat Loss: ~${fatLossWeekly} kg / week</span>`;
        }

        document.getElementById('nutrition-tdee').innerHTML = `
            ${bmiText}<br>
            <strong>Target Intake:</strong> ${tdee} kcal/day <br>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Protocol: ${goalText}</span>
            ${fatLossText}
        `;

        // Macros
        const proteinCal = tdee * pPct;
        const carbsCal = tdee * cPct;
        const fatsCal = tdee * fPct;

        const proteinG = Math.round(proteinCal / 4);
        const carbsG = Math.round(carbsCal / 4);
        const fatsG = Math.round(fatsCal / 9);

        const macrosHTML = `
            <tr><td>Protein</td><td>${proteinG}g</td><td>${pPct*100}%</td></tr>
            <tr><td>Carbohydrates</td><td>${carbsG}g</td><td>${cPct*100}%</td></tr>
            <tr><td>Fats</td><td>${fatsG}g</td><td>${fPct*100}%</td></tr>
        `;
        document.getElementById('nutrition-macros').innerHTML = macrosHTML;

        // Chrono-Timing Matrix (Satiety & Performance)
        let timingPlan = [];
        if (bio.goal === 'weight_loss') {
            timingPlan = [
                { time: "08:00", meal: "Breakfast (Satiety Anchor)", desc: "Focus: High Protein (Egg whites, lean turkey), Healthy Fats. Suppresses ghrelin.", macros: "0% C, 40% P, 50% F" },
                { time: "12:30", meal: "Lunch (Volume)", desc: "Focus: High Volume Fibrous Carbs (Spinach, Broccoli) & Lean Chicken. Promotes gastric distention.", macros: "20% C, 30% P, 30% F" },
                { time: "15:30", meal: "Pre-Workout", desc: "Focus: Minimal Carbs (Apple).", macros: "30% C, 0% P, 0% F" },
                { time: "17:00", meal: "Training Window", desc: "BCAAs & Electrolytes.", macros: "-" },
                { time: "18:30", meal: "Post-Workout", desc: "Focus: Fast digesting Whey Protein isolate.", macros: "40% C, 30% P, 0% F" },
                { time: "20:30", meal: "Dinner (Slow Digestion)", desc: "Focus: Casein protein (Cottage cheese) to prevent nocturnal catabolism.", macros: "10% C, 0% P, 20% F" }
            ];
        } else {
            timingPlan = [
                { time: "08:00", meal: "Breakfast (Break-fast)", desc: "Focus: Fats & Protein. Prevents early insulin spike.", macros: "0% C, 40% P, 50% F" },
                { time: "12:30", meal: "Lunch (Satiety)", desc: "Focus: Fibrous Carbs & Protein. Maintains energy.", macros: "20% C, 30% P, 30% F" },
                { time: "15:30", meal: "Pre-Workout (Fuel)", desc: "Focus: Simple Carbs. Rapid absorption.", macros: "30% C, 0% P, 0% F" },
                { time: "17:00", meal: "Training Window", desc: "Hydration & Electrolytes only.", macros: "-" },
                { time: "18:30", meal: "Post-Workout (Recovery)", desc: "Focus: Protein & Simple Carbs.", macros: "40% C, 30% P, 0% F" },
                { time: "20:30", meal: "Dinner (Slow Digestion)", desc: "Focus: Complex Carbs & Remaining Fats.", macros: "10% C, 0% P, 20% F" }
            ];
        }

        let timingHTML = '<ul style="list-style:none; padding-left:0; font-size:0.9rem;">';
        timingPlan.forEach(slot => {
            timingHTML += `
                <li style="border-left: 3px solid var(--accent-blue); padding-left: 10px; margin-bottom: 15px;">
                    <div style="font-family: var(--font-mono); font-weight: bold;">${slot.time} - ${slot.meal}</div>
                    <div style="color: var(--text-muted); margin: 3px 0;">${slot.desc}</div>
                    <div style="font-size: 0.8rem; background: #e5e7eb; display: inline-block; padding: 2px 6px; border-radius: 2px;">Distribution: ${slot.macros}</div>
                </li>
            `;
        });
        timingHTML += '</ul>';

        document.getElementById('nutrition-timing').innerHTML = timingHTML;
    },

    // The Juicer Translator (Micronutrient Module)

    toggleJuicerTable() {
        const toggle = document.getElementById('juicer-mode-toggle').checked;
        const container = document.getElementById('juicer-nutrient-table-container');
        if (toggle) {
            container.style.display = 'block';
            if(this.state.biometrics) {
                this.translateJuice(); // re-run to populate table if visible
            }
        } else {
            container.style.display = 'none';
        }
    },


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

    translateJuice() {
        if (!this.state.biometrics) {
            alert("Please generate a protocol first to calculate specific thresholds.");
            return;
        }

        const missing = {
            citrus: document.getElementById('miss-citrus').checked,
            leafy: document.getElementById('miss-leafy').checked,
            nuts: document.getElementById('miss-nuts').checked,
            tubers: document.getElementById('miss-tubers').checked,
            dairy: document.getElementById('miss-dairy').checked,
            meat: document.getElementById('miss-meat').checked,
            sun: document.getElementById('miss-sun').checked,
            beets: document.getElementById('miss-beets').checked,
            berries: document.getElementById('miss-berries').checked,
            spices: document.getElementById('miss-spices').checked,
            high_acidity: document.getElementById('high-acidity').checked,
            sugar_limit: document.getElementById('sugar-limit').checked
        };

        // Calculate Daily Intake Requirements based on biometrics & schedule intensity
        const bio = this.state.biometrics;
        let intensityFactor = 1.0;

        if (this.state.schedule) {
            const highDays = this.state.schedule.filter(d => d.intensity === 'High').length;
            if (highDays > 3) intensityFactor = 1.3; // High sweat/CNS tax
            else if (highDays > 1) intensityFactor = 1.15;
        }


        // Populate the Detailed Nutrient Table if toggle is on
        if (document.getElementById('juicer-mode-toggle').checked) {
            const tableBody = document.getElementById('juicer-nutrient-table-body');
            let tableHTML = "";
            let fruitVeggieCount = 0;

            if (missing.citrus) { tableHTML += "<tr><td>Citrus</td><td>1</td><td>Vitamin C (150mg)</td><td>166%</td></tr>"; fruitVeggieCount++; }
            if (missing.leafy) { tableHTML += "<tr><td>Leafy Greens</td><td>1</td><td>Vitamin K / Folate (80mcg)</td><td>100%</td></tr>"; fruitVeggieCount++; }
            if (missing.nuts) { tableHTML += "<tr><td>Nuts/Seeds</td><td>1</td><td>Magnesium / Zinc (100mg)</td><td>25%</td></tr>"; }
            if (missing.tubers) { tableHTML += "<tr><td>Tubers</td><td>1</td><td>Potassium (600mg)</td><td>17%</td></tr>"; fruitVeggieCount++; }
            if (missing.dairy) { tableHTML += "<tr><td>Dairy</td><td>1</td><td>Calcium (300mg)</td><td>30%</td></tr>"; }
            if (missing.meat) { tableHTML += "<tr><td>Red Meat</td><td>1</td><td>Iron / B12 (3mg)</td><td>15-30%</td></tr>"; }
            if (missing.sun) { tableHTML += "<tr><td>Sun Exposure</td><td>0</td><td>Vitamin D3 (0 IU)</td><td>0%</td></tr>"; }
            if (missing.beets) { tableHTML += "<tr><td>Roots/Beets</td><td>1</td><td>Nitrates / Folate (100mcg)</td><td>25%</td></tr>"; fruitVeggieCount++; }
            if (missing.berries) { tableHTML += "<tr><td>Berries</td><td>1</td><td>Antioxidants / Vit C (50mg)</td><td>55%</td></tr>"; fruitVeggieCount++; }
            if (missing.spices) { tableHTML += "<tr><td>Spices</td><td>1</td><td>Curcumin / Gingerol</td><td>N/A</td></tr>"; }

            if (tableHTML === "") {
                tableHTML = "<tr><td colspan='4' style='text-align: center;'>No major deficits selected.</td></tr>";
            } else {
                tableHTML += `<tr style="font-weight: bold; color: #60a5fa;"><td colspan="3">Total Fruit/Veggie Categories Missing:</td><td>${fruitVeggieCount}</td></tr>`;
            }

            tableBody.innerHTML = tableHTML;
        }

        // Base values (RDA) multiplied by intensity/sweat loss

        const reqs = {
            magnesium: Math.round((bio.gender === 'male' ? 420 : 320) * intensityFactor),
            potassium: Math.round(3400 * intensityFactor),
            calcium: 1000, // Relatively static, but crucial for bone support under load
            iron: bio.gender === 'female' && bio.age < 50 ? Math.round(18 * intensityFactor) : Math.round(8 * intensityFactor),
            zinc: Math.round((bio.gender === 'male' ? 11 : 8) * intensityFactor)
        };

        const reqList = document.getElementById('juicer-daily-reqs');
        reqList.innerHTML = `
            <li style="margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between;"><span>Magnesium:</span> <span>${reqs.magnesium} mg</span></div>
                <progress value="45" max="100" style="width: 100%; height: 6px;"></progress>
            </li>
            <li style="margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between;"><span>Potassium:</span> <span>${reqs.potassium} mg</span></div>
                <progress value="60" max="100" style="width: 100%; height: 6px;"></progress>
            </li>
            <li style="margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between;"><span>Calcium:</span> <span>${reqs.calcium} mg</span></div>
                <progress value="90" max="100" style="width: 100%; height: 6px;"></progress>
            </li>
            <li style="margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between;"><span>Iron:</span> <span>${reqs.iron} mg</span></div>
                <progress value="75" max="100" style="width: 100%; height: 6px;"></progress>
            </li>
            <li style="margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between;"><span>Zinc:</span> <span>${reqs.zinc} mg</span></div>
                <progress value="85" max="100" style="width: 100%; height: 6px;"></progress>
            </li>
        `;
        document.getElementById('juicer-baseline-req').style.display = 'block';

        let deficits = [];
        let ingredients = [];
        let supplements = [];

        if (missing.citrus) {
            deficits.push("Vitamin C (Ascorbic Acid)");
            ingredients.push("1 Whole Orange (peeled)");
            ingredients.push("1/2 Lemon (squeezed)");
        }
        if (missing.leafy) {
            deficits.push("Vitamin K, Folate, Iron");
            ingredients.push("2 Cups Raw Spinach or Kale");
            ingredients.push("1/2 Cucumber (hydration & base)");
        }
        if (missing.nuts) {
            deficits.push(`Magnesium (Deficit Risk: Muscle cramps, poor ATP synthesis. Target: ${reqs.magnesium}mg)`);
            ingredients.push("2 tbsp Pumpkin Seeds or Almond Butter");
            supplements.push("Magnesium Glycinate 200-400mg (Mechanism: Binds to GABA receptors, prevents nocturnal cramping, essential for ATP production).");
        }
        if (missing.tubers) {
            deficits.push(`Potassium (Deficit Risk: Impaired cellular hydration, cardiac arrhythmias. Target: ${reqs.potassium}mg)`);
            ingredients.push("1 Whole Banana");
            ingredients.push("1/2 Cup Coconut Water");
        }
        if (missing.dairy) {
            deficits.push(`Calcium (Deficit Risk: Bone demineralization under heavy loads. Target: ${reqs.calcium}mg)`);
            ingredients.push("1 Cup Fortified Almond Milk or Oat Milk");
            supplements.push("Calcium Citrate (Mechanism: Structural bone density recovery. Avoid binding with Iron).");
        } else {
            ingredients.push("1 Cup Whole Milk or Greek Yogurt (Base)");
        }
        if (missing.meat) {
            deficits.push("Vitamin B12, Heme Iron, Zinc");
            ingredients.push("1 Scoop Plant-based Iron-fortified Protein Powder");
            supplements.push("Vitamin B12 (Cyanocobalamin) 1000mcg (Mechanism: Myelin sheath integrity & CNS firing).");
            supplements.push("Zinc Picolinate (Mechanism: Testosterone synthesis & immune recovery).");
        }
        if (missing.sun) {
            deficits.push("Vitamin D3 (Cholecalciferol)");
            supplements.push("Vitamin D3 2000-5000 IU (Mechanism: Regulates calcium absorption & endocrine function. MUST take with fat source).");
        }
        if (missing.beets) {
            deficits.push("Nitrates & Betaine (Deficit Risk: Reduced vasodilation, poor blood flow during heavy lifts).");
            ingredients.push("1/2 Small Beetroot (peeled)");
            ingredients.push("1 Medium Carrot (Beta-carotene)");
        }
        if (missing.berries) {
            deficits.push("Anthocyanins & Antioxidants (Deficit Risk: Increased oxidative stress post-training).");
            ingredients.push("1/2 Cup Mixed Berries (Blueberries/Blackberries)");
        }
        if (missing.spices) {
            deficits.push("Gingerol & Curcumin (Deficit Risk: Chronic systemic inflammation, poor gastric emptying).");
            ingredients.push("1/2 inch Fresh Ginger Root");
            ingredients.push("1/4 tsp Turmeric + pinch of Black Pepper (Piperine)");
        }

        const outContainer = document.getElementById('juicer-output');
        const deficitsList = document.getElementById('juicer-deficits');
        const recipeBox = document.getElementById('juicer-recipe');

        outContainer.style.display = 'block';

        // Calculate Top 3 Staples based on deficits
        let staples = [];
        if (missing.leafy) staples.push("Fresh Spinach/Kale (Folate, Iron)");
        if (missing.meat) staples.push("Lean Meats / Fortified B12 sources (Zinc, B12)");
        if (missing.tubers) staples.push("Potatoes / Bananas (Potassium)");
        if (missing.dairy) staples.push("Greek Yogurt / Fortified Milk (Calcium)");
        if (missing.sun) staples.push("Vitamin D3 Supplements");
        if (staples.length > 3) staples = staples.slice(0, 3);

        // Populate Top 3 Staples UI
        const staplesList = document.getElementById('juicer-staples-list');
        if(staplesList) {
            staplesList.innerHTML = '';
            if (staples.length === 0) {
                staplesList.innerHTML = '<li>You are covered on basic staples.</li>';
            } else {
                staples.forEach(s => {
                    const li = document.createElement('li');
                    li.innerText = s;
                    staplesList.appendChild(li);
                });
            }
        }

        if (deficits.length === 0) {
            deficitsList.innerHTML = '<li>No major clinical deficits identified based on inputs.</li>';
            recipeBox.innerHTML = `
                <strong style="color: #166534; font-family: var(--font-mono);">Maintenance Protocol: Baseline Smoothie</strong>
                <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.9rem;">
                    <li>1 Cup Liquid Base (Water/Milk)</li>
                    <li>1 Banana (Potassium)</li>
                    <li>1 Scoop Whey/Plant Protein</li>
                    <li>1 tbsp Chia Seeds (Omega-3)</li>
                </ul>
            `;
            return;
        }

        // Render Deficits
        deficitsList.innerHTML = deficits.map(d => `<li>${d} deficit detected.</li>`).join('');

        // Check for modifications based on limitations (Sugar & Acidity)
        let fruitCount = ingredients.filter(i => i.includes('Orange') || i.includes('Apple') || i.includes('Banana') || i.includes('Berries')).length;

        if (missing.sugar_limit) {
            // Remove high sugar items if possible, or warn
            ingredients = ingredients.filter(i => !i.includes('Banana') && !i.includes('Apple'));
            if (missing.citrus) {
                ingredients = ingredients.filter(i => !i.includes('Orange'));
                ingredients.push("1/2 Lemon (Low sugar Vitamin C substitute)");
            }
            ingredients.push("Limit added fruits. Prioritize green vegetables.");
        }

        // Render Recipe
        // Always add a sweetener/base if it's too hardcore and no sugar limits
        if (!ingredients.join('').includes('Orange') && !ingredients.join('').includes('Milk') && !missing.sugar_limit && fruitCount === 0) {
            ingredients.push("1 Apple (for palatability and pectin)");
        }

        let warnings = [];
        if (missing.sugar_limit) {
             warnings.push("<span style='color: #b91c1c;'>Sugar Limit Active: Fruits have been minimized or removed. Ensure you do not add sweeteners.</span>");
        }
        if (missing.high_acidity) {
             warnings.push("<span style='color: #b91c1c;'>Acidity Alert: Dilute recipe with 1-2 cups of water. Consider adding Cucumber or Celery to increase alkalinity. Avoid adding excess citrus if it triggers discomfort.</span>");
        }

        let recipeHTML = `
            <strong style="color: #166534; font-family: var(--font-mono);">Targeted Restorative Juicer Translation</strong>
            <p style="font-size: 0.85rem; margin-top: 0.5rem; color: #166534;">Blend the following components until entirely homogenized. Consume immediately to prevent oxidation of water-soluble vitamins.</p>
            ${warnings.length > 0 ? `<div style="margin-top: 0.5rem; font-size: 0.85rem; font-weight: bold;">${warnings.join('<br>')}</div>` : ''}
            <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.9rem; color: #1f2937;">
                ${ingredients.map(i => `<li>${i}</li>`).join('')}
            </ul>
        `;

        if (supplements.length > 0) {
            recipeHTML += `
                <strong style="color: #854d0e; font-family: var(--font-mono); display: block; margin-top: 1rem;">Supplemental Adjuvants Required:</strong>
                <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.9rem; color: #854d0e;">
                    ${supplements.map(s => `<li>${s}</li>`).join('')}
                </ul>
            `;
        }

        recipeBox.innerHTML = recipeHTML;
    }
});

// Start app on load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
