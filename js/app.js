/**
 * Anatomica OS Core Application Logic
 */

const app = {
    // Current application state
    state: {
        activeModule: 'biometrics',
        biometrics: null,
        performance: null,
        schedule: null
    },

    // Initialize the application
    init() {
        console.log("Anatomica OS Initialized");
    },

    // Navigation Logic
    showModule(moduleId) {
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if(btn.dataset.target === moduleId) {
                btn.classList.add('active');
            }
        });

        // Show/Hide modules
        document.querySelectorAll('.module').forEach(mod => {
            mod.style.display = 'none';
            mod.classList.remove('active');
        });

        const targetModule = document.getElementById(moduleId);
        if (targetModule) {
            targetModule.style.display = 'block';
            targetModule.classList.add('active');
            this.state.activeModule = moduleId;

            // Trigger specific module renders if data exists
            if(moduleId === 'visualizer' && this.state.schedule) {
                // this.renderVisualizer(); // Will implement later
            }
        }
    },

    // Biometric & Performance Engine Logic
    captureData() {
        const gender = document.getElementById('gender').value;
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const age = parseInt(document.getElementById('age').value);

        const strength = parseFloat(document.getElementById('strength-load').value) || 0;
        const aerobic = parseFloat(document.getElementById('aerobic-pace').value) || 0;
        const anaerobic = parseInt(document.getElementById('anaerobic-intervals').value) || 0;

        if (!gender || isNaN(weight) || isNaN(height) || isNaN(age)) {
            alert("Please fill out all required Baseline Profile fields.");
            return false;
        }

        this.state.biometrics = { gender, weight, height, age };
        this.state.performance = { strength, aerobic, anaerobic };

        return true;
    },

    generateSchedule() {
        if (!this.captureData()) return;

        const perf = this.state.performance;

        // Simple logic to identify weaknesses based on arbitrary benchmarks
        let weakness = "Balanced";
        if (perf.strength < this.state.biometrics.weight * 1.2) {
            weakness = "Strength";
        } else if (perf.aerobic > 6.0 || perf.aerobic === 0) {
            weakness = "Aerobic";
        } else if (perf.anaerobic < 5) {
            weakness = "Anaerobic";
        }

        // Weekly Schedule Template (Array of Objects)
        // Adjusts focus based on weakness to prevent overtraining and bridge gaps
        let schedule = [];

        if (weakness === "Strength") {
            schedule = [
                { day: "Day 1", phase: "Strength", focus: "Lower Body (Squat/Deadlift)", intensity: "High" },
                { day: "Day 2", phase: "Aerobic", focus: "Zone 2 Cardio", intensity: "Low" },
                { day: "Day 3", phase: "Strength", focus: "Upper Body Push/Pull", intensity: "Moderate" },
                { day: "Day 4", phase: "Recovery", focus: "Active Recovery / Mobility", intensity: "Rest" },
                { day: "Day 5", phase: "Strength", focus: "Full Body Structural", intensity: "High" },
                { day: "Day 6", phase: "Anaerobic", focus: "Sprint Intervals", intensity: "High" },
                { day: "Day 7", phase: "Recovery", focus: "Complete Rest", intensity: "Rest" }
            ];
        } else if (weakness === "Aerobic") {
            schedule = [
                { day: "Day 1", phase: "Aerobic", focus: "Long Slow Distance (LSD)", intensity: "Moderate" },
                { day: "Day 2", phase: "Strength", focus: "Full Body Structural", intensity: "Moderate" },
                { day: "Day 3", phase: "Aerobic", focus: "Tempo Run", intensity: "High" },
                { day: "Day 4", phase: "Recovery", focus: "Active Recovery / Mobility", intensity: "Rest" },
                { day: "Day 5", phase: "Anaerobic", focus: "Sprint Intervals", intensity: "High" },
                { day: "Day 6", phase: "Strength", focus: "Upper/Lower Split", intensity: "Moderate" },
                { day: "Day 7", phase: "Recovery", focus: "Complete Rest", intensity: "Rest" }
            ];
        } else { // Anaerobic or Balanced
            schedule = [
                { day: "Day 1", phase: "Anaerobic", focus: "High Intensity Intervals", intensity: "High" },
                { day: "Day 2", phase: "Strength", focus: "Upper Body Push/Pull", intensity: "Moderate" },
                { day: "Day 3", phase: "Aerobic", focus: "Zone 2 Cardio", intensity: "Low" },
                { day: "Day 4", phase: "Recovery", focus: "Active Recovery / Mobility", intensity: "Rest" },
                { day: "Day 5", phase: "Strength", focus: "Lower Body", intensity: "High" },
                { day: "Day 6", phase: "Anaerobic", focus: "Jump Rope Intervals", intensity: "High" },
                { day: "Day 7", phase: "Recovery", focus: "Complete Rest", intensity: "Rest" }
            ];
        }

        this.state.schedule = schedule;

        // Update other modules based on new schedule
        this.updateKinesiologyProtocol();
        this.updateVisualizerSelect();
        this.updateNutritionModule();

        // Render Schedule UI
        const tbody = document.getElementById('schedule-tbody');
        tbody.innerHTML = '';

        schedule.forEach(day => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${day.day}</strong></td>
                <td><span class="status-badge ${day.phase === 'Recovery' ? 'status-ok' : (day.intensity==='High'?'status-alert':'status-warn')}">${day.phase}</span></td>
                <td>${day.focus}</td>
                <td>${day.intensity}</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('schedule-summary').innerText = `Identified Primary Focus: ${weakness}. Schedule generated to bridge gaps and calculate precise rest periods.`;
        document.getElementById('schedule-output').style.display = 'block';
    },

    // Tri-Phasic Kinesiology Protocol
    updateKinesiologyProtocol() {
        if (!this.state.schedule) return;

        document.getElementById('kinesiology-warning').style.display = 'none';
        document.getElementById('kinesiology-data').style.display = 'block';

        // 1. Calculate Breakdown percentages
        const counts = { Strength: 0, Aerobic: 0, Anaerobic: 0, Recovery: 0 };
        this.state.schedule.forEach(day => {
            if (counts[day.phase] !== undefined) counts[day.phase]++;
        });

        const totalDays = this.state.schedule.length;
        let breakdownHTML = `<ul style="list-style: none; font-family: var(--font-mono); margin-top: 1rem;">`;
        for (const [phase, count] of Object.entries(counts)) {
            const percentage = Math.round((count / totalDays) * 100);
            let barColor = phase === 'Recovery' ? '#22c55e' : (phase === 'Strength' ? '#ef4444' : '#3b82f6');
            if (phase === 'Anaerobic') barColor = '#eab308';

            breakdownHTML += `
                <li style="margin-bottom: 0.5rem;">
                    <strong>${phase}:</strong> ${percentage}% (${count} days)
                    <div style="width: 100%; background: #e5e7eb; height: 10px; border-radius: 5px; margin-top: 4px;">
                        <div style="width: ${percentage}%; background: ${barColor}; height: 100%; border-radius: 5px;"></div>
                    </div>
                </li>
            `;
        }
        breakdownHTML += `</ul>`;
        document.getElementById('kinesiology-breakdown').innerHTML = breakdownHTML;

        // 2. Calculate Isolated Rest Periods based on highest intensity
        let highestIntensity = "Low";
        this.state.schedule.forEach(day => {
            if (day.intensity === 'High') highestIntensity = "High";
            else if (day.intensity === 'Moderate' && highestIntensity !== 'High') highestIntensity = "Moderate";
        });

        // Simplified academic rest model
        const restTable = [
            { system: "Central Nervous System (CNS)", base: 48, intensityMultiplier: { High: 1.5, Moderate: 1.0, Low: 0.8, Rest: 0.5 } },
            { system: "Major Muscle Groups (Legs/Back)", base: 48, intensityMultiplier: { High: 1.2, Moderate: 1.0, Low: 0.8, Rest: 0.5 } },
            { system: "Minor Muscle Groups (Arms/Calves)", base: 24, intensityMultiplier: { High: 1.2, Moderate: 1.0, Low: 0.8, Rest: 0.5 } },
            { system: "Cardiovascular System", base: 24, intensityMultiplier: { High: 1.5, Moderate: 1.0, Low: 0.8, Rest: 0.5 } },
            { system: "Bone & Structural Support", base: 72, intensityMultiplier: { High: 1.0, Moderate: 0.9, Low: 0.8, Rest: 0.5 } }
        ];

        const tbody = document.getElementById('kinesiology-rest-table');
        tbody.innerHTML = '';

        restTable.forEach(item => {
            const requiredRest = Math.round(item.base * item.intensityMultiplier[highestIntensity]);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-family: var(--font-mono);">${item.system}</td>
                <td><strong>${requiredRest}</strong> hours</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Procedural Anatomy & Biomechanics Visualizer
    updateVisualizerSelect() {
        const select = document.getElementById('vis-day-select');
        select.innerHTML = '';
        if (!this.state.schedule) {
            select.innerHTML = '<option value="">-- Generate Protocol First --</option>';
            return;
        }

        this.state.schedule.forEach((day, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.text = `${day.day} - ${day.phase} (${day.focus})`;
            select.appendChild(option);
        });

        // Initial render
        if(this.state.activeModule === 'visualizer') {
            this.renderVisualizer();
        }
    },

    renderVisualizer() {
        if (!this.state.schedule) return;

        const select = document.getElementById('vis-day-select');
        const dayIndex = select.value;
        if (dayIndex === '') return;

        const day = this.state.schedule[dayIndex];
        document.getElementById('vis-details').style.display = 'block';
        document.getElementById('vis-desc').innerText = `Visualizing: ${day.focus} at ${day.intensity} Intensity`;

        const canvas = document.getElementById('anatomy-canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Define colors based on phase/intensity
        const colorActiveHigh = '#ef4444'; // Red
        const colorActiveMod = '#3b82f6';  // Blue
        const colorRecovering = '#22c55e'; // Green
        const colorNeutral = '#e5e7eb';    // Gray

        // Map focus to muscle groups
        let headColor = colorNeutral;
        let chestColor = colorNeutral;
        let armsColor = colorNeutral;
        let legsColor = colorNeutral;

        if (day.phase === 'Recovery') {
            headColor = chestColor = armsColor = legsColor = colorRecovering;
        } else if (day.focus.includes('Lower Body')) {
            legsColor = day.intensity === 'High' ? colorActiveHigh : colorActiveMod;
            chestColor = armsColor = colorRecovering;
        } else if (day.focus.includes('Upper Body')) {
            chestColor = armsColor = day.intensity === 'High' ? colorActiveHigh : colorActiveMod;
            legsColor = colorRecovering;
        } else if (day.phase === 'Aerobic' || day.phase === 'Anaerobic' || day.focus.includes('Full Body')) {
            chestColor = armsColor = legsColor = day.intensity === 'High' ? colorActiveHigh : colorActiveMod;
        }

        // Helper to draw ellipses
        function drawEllipse(cx, cy, rx, ry, color) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Procedurally draw anatomical model using basic shapes
        const cx = canvas.width / 2;

        // Head
        drawEllipse(cx, 50, 20, 25, headColor);
        // Torso/Chest
        drawEllipse(cx, 150, 45, 70, chestColor);
        // Pelvis
        drawEllipse(cx, 240, 40, 30, chestColor);

        // Left Arm
        drawEllipse(cx - 65, 130, 15, 40, armsColor); // Upper arm
        drawEllipse(cx - 75, 200, 12, 35, armsColor); // Forearm

        // Right Arm
        drawEllipse(cx + 65, 130, 15, 40, armsColor);
        drawEllipse(cx + 75, 200, 12, 35, armsColor);

        // Left Leg
        drawEllipse(cx - 25, 310, 20, 50, legsColor); // Thigh
        drawEllipse(cx - 25, 410, 15, 45, legsColor); // Calf

        // Right Leg
        drawEllipse(cx + 25, 310, 20, 50, legsColor);
        drawEllipse(cx + 25, 410, 15, 45, legsColor);

        // Connections / Joints (black dots)
        ctx.fillStyle = '#000';
        [
            [cx, 80], // Neck
            [cx - 50, 100], [cx + 50, 100], // Shoulders
            [cx - 70, 170], [cx + 70, 170], // Elbows
            [cx - 25, 270], [cx + 25, 270], // Hips
            [cx - 25, 360], [cx + 25, 360]  // Knees
        ].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    },

    updateNutritionModule() {
        if (!this.state.biometrics) return;

        document.getElementById('nutrition-warning').style.display = 'none';
        document.getElementById('nutrition-data').style.display = 'block';

        const bio = this.state.biometrics;

        // Mifflin-St Jeor Equation for BMR
        let bmr = (10 * bio.weight) + (6.25 * bio.height) - (5 * bio.age);
        bmr += bio.gender === 'male' ? 5 : -161;

        // TDEE (Total Daily Energy Expenditure) - Assuming active due to program
        const tdee = Math.round(bmr * 1.55);

        document.getElementById('nutrition-tdee').innerHTML = `<strong>TDEE:</strong> ${tdee} kcal/day`;

        // Macros (Standard Academic Split: 30% P, 45% C, 25% F)
        const proteinCal = tdee * 0.30;
        const carbsCal = tdee * 0.45;
        const fatsCal = tdee * 0.25;

        const proteinG = Math.round(proteinCal / 4);
        const carbsG = Math.round(carbsCal / 4);
        const fatsG = Math.round(fatsCal / 9);

        const macrosHTML = `
            <tr><td>Protein</td><td>${proteinG}g</td><td>30%</td></tr>
            <tr><td>Carbohydrates</td><td>${carbsG}g</td><td>45%</td></tr>
            <tr><td>Fats</td><td>${fatsG}g</td><td>25%</td></tr>
        `;
        document.getElementById('nutrition-macros').innerHTML = macrosHTML;

        // Chrono-Timing Matrix (Satiety & Performance)
        const timingPlan = [
            { time: "08:00", meal: "Breakfast (Break-fast)", desc: "Focus: Fats & Protein. Prevents early insulin spike.", macros: "0% C, 40% P, 50% F" },
            { time: "12:30", meal: "Lunch (Satiety)", desc: "Focus: Fibrous Carbs & Protein. Maintains energy.", macros: "20% C, 30% P, 30% F" },
            { time: "15:30", meal: "Pre-Workout (Fuel)", desc: "Focus: Simple Carbs. Rapid absorption.", macros: "30% C, 0% P, 0% F" },
            { time: "17:00", meal: "Training Window", desc: "Hydration & Electrolytes only.", macros: "-" },
            { time: "18:30", meal: "Post-Workout (Recovery)", desc: "Focus: Protein & Simple Carbs.", macros: "40% C, 30% P, 0% F" },
            { time: "20:30", meal: "Dinner (Slow Digestion)", desc: "Focus: Complex Carbs & Remaining Fats.", macros: "10% C, 0% P, 20% F" }
        ];

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
    translateJuice() {
        const missing = {
            citrus: document.getElementById('miss-citrus').checked,
            leafy: document.getElementById('miss-leafy').checked,
            dairy: document.getElementById('miss-dairy').checked,
            meat: document.getElementById('miss-meat').checked,
            sun: document.getElementById('miss-sun').checked
        };

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
        if (missing.dairy) {
            deficits.push("Calcium, Vitamin D (Fortified)");
            ingredients.push("1 Cup Fortified Almond Milk or Oat Milk");
            supplements.push("Calcium Citrate (if diet strictly lacks alternative sources)");
        } else {
            ingredients.push("1 Cup Whole Milk or Greek Yogurt (Base)");
        }
        if (missing.meat) {
            deficits.push("Vitamin B12, Heme Iron, Zinc");
            ingredients.push("1 Scoop Plant-based Iron-fortified Protein Powder");
            supplements.push("Vitamin B12 (Cyanocobalamin) 1000mcg");
        }
        if (missing.sun) {
            deficits.push("Vitamin D3 (Cholecalciferol)");
            supplements.push("Vitamin D3 2000-5000 IU (taken with a fat source)");
        }

        const outContainer = document.getElementById('juicer-output');
        const deficitsList = document.getElementById('juicer-deficits');
        const recipeBox = document.getElementById('juicer-recipe');

        outContainer.style.display = 'block';

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

        // Render Recipe
        // Always add a sweetener/base if it's too hardcore
        if (!ingredients.join('').includes('Orange') && !ingredients.join('').includes('Milk')) {
            ingredients.push("1 Apple (for palatability and pectin)");
        }

        let recipeHTML = `
            <strong style="color: #166534; font-family: var(--font-mono);">Targeted Restorative Juicer Translation</strong>
            <p style="font-size: 0.85rem; margin-top: 0.5rem; color: #166534;">Blend the following components until entirely homogenized. Consume immediately to prevent oxidation of water-soluble vitamins.</p>
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
};

// Start app on load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
