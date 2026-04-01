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
                setTimeout(() => {
                    this.initWebGL();
                    this.updateWebGLVisualizer();
                }, 100); // Small delay to allow container to size properly after display:block
            }
        }
    },

    // Biometric & Performance Engine Logic
    captureData() {
        const gender = document.getElementById('gender').value;
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const age = parseInt(document.getElementById('age').value);
        const goal = document.getElementById('goal').value;
        const injury = document.getElementById('injury').value;

        const strength = parseFloat(document.getElementById('strength-load').value) || 0;
        const aerobic = parseFloat(document.getElementById('aerobic-pace').value) || 0;
        const anaerobic = parseInt(document.getElementById('anaerobic-intervals').value) || 0;

        if (!gender || isNaN(weight) || isNaN(height) || isNaN(age)) {
            alert("Please fill out all required Baseline Profile fields.");
            return false;
        }

        this.state.biometrics = { gender, weight, height, age, goal, injury };
        this.state.performance = { strength, aerobic, anaerobic };

        return true;
    },

    generateSchedule() {
        if (!this.captureData()) return;

        const bio = this.state.biometrics;
        const perf = this.state.performance;

        // Base scheduling blocks
        const strengthLower = { phase: "Strength", focus: "Lower Body (Squat/Deadlift)", intensity: "High" };
        const strengthUpper = { phase: "Strength", focus: "Upper Body Push/Pull", intensity: "Moderate" };
        const strengthFull = { phase: "Strength", focus: "Full Body Structural", intensity: "High" };
        const aerobicLiss = { phase: "Aerobic", focus: "Zone 2 Cardio (Jump Rope / Jog)", intensity: "Low" };
        const aerobicTempo = { phase: "Aerobic", focus: "Tempo Run / Boxing Flow", intensity: "Moderate" };
        const anaerobicSprints = { phase: "Anaerobic", focus: "Heavy Bag Boxing / Sprints", intensity: "High" };
        const anaerobicJump = { phase: "Anaerobic", focus: "Jump Rope Intervals", intensity: "High" };
        const recoveryActive = { phase: "Recovery", focus: "Active Recovery / Mobility", intensity: "Rest" };
        const recoveryPassive = { phase: "Recovery", focus: "Complete Rest / Downregulation", intensity: "Rest" };

        let microcycle = [];

        // 1. Determine Goal-Based Base Sequence (Breaking 7-day construct)
        if (bio.goal === 'weight_loss') {
            // Aggressive weight loss: 5-day repeating high frequency, lower intensity
            microcycle = [
                strengthFull, aerobicLiss, anaerobicJump, strengthUpper, recoveryActive
            ];
        } else if (bio.goal === 'hypertrophy') {
            // Hypertrophy: 8-day repeating volume cycle
            microcycle = [
                strengthLower, recoveryActive, strengthUpper, recoveryActive,
                strengthFull, aerobicLiss, anaerobicSprints, recoveryPassive
            ];
        } else {
            // Conditioning / Athletic: 6-day repeating
            microcycle = [
                anaerobicSprints, strengthFull, aerobicLiss, anaerobicJump, strengthUpper, recoveryActive
            ];
        }

        // 2. Injury Adjustments & Rest Protocols
        if (bio.injury !== 'none') {
            microcycle = microcycle.map(day => {
                if (bio.injury === 'knee' && day.focus.includes('Lower Body')) {
                    return { ...day, focus: "Upper Body Isolation / Core", intensity: "Moderate" };
                }
                if (bio.injury === 'knee' && day.focus.includes('Jump Rope')) {
                    return { ...day, focus: "Rowing / Swimming (Low Impact)", intensity: "Moderate" };
                }
                if (bio.injury === 'shoulder' && day.focus.includes('Upper Body')) {
                    return { ...day, focus: "Lower Body Machine Isolation", intensity: "Moderate" };
                }
                if (bio.injury === 'shoulder' && day.focus.includes('Boxing')) {
                    return { ...day, focus: "Stationary Bike Intervals", intensity: "High" };
                }
                if (bio.injury === 'lower_back' && day.focus.includes('Structural')) {
                    return { ...day, focus: "Machine Isolation / Support", intensity: "Low" };
                }
                return day;
            });
            // Force extra recovery day at the end of microcycle for injuries
            microcycle.push(recoveryPassive);
        }

        // Add day labels based on array length
        let schedule = microcycle.map((day, idx) => ({
            day: `Day ${idx + 1}`,
            ...day
        }));

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

        document.getElementById('schedule-summary').innerText = `Generated ${schedule.length}-day repeating microcycle tailored to macrocycle goals, factoring in joint integrity and performance benchmarks.`;
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

    // Procedural Anatomy & Biomechanics Visualizer (WebGL)
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
            this.initWebGL();
            this.updateWebGLVisualizer();
        }
    },

    initWebGL() {
        if (this.state.webglInitialized) return;

        const container = document.getElementById('webgl-container');
        if (!container) return;

        const width = container.clientWidth || 400;
        const height = container.clientHeight || 500;

        // Scene Setup
        this.scene = new THREE.Scene();
        // Add subtle grid to floor
        const gridHelper = new THREE.GridHelper(20, 20, 0x111827, 0x111827);
        gridHelper.position.y = -5;
        this.scene.add(gridHelper);

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 15);

        // Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 25;

        // Lights
        const ambientLight = new THREE.AmbientLight(0x222222);
        this.scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight1.position.set(5, 5, 10);
        this.scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0x3b82f6, 0.5); // Cyber blue backlight
        dirLight2.position.set(-5, 0, -10);
        this.scene.add(dirLight2);

        // Build Procedural Geometry (Faceted Star Trac Style)
        this.bodyParts = {};

        // Material factory for glowing wireframe edges and solid faces
        const createCyberMaterial = () => {
            return new THREE.MeshPhongMaterial({
                color: 0x374151, // Cyber gray base
                emissive: 0x000000,
                specular: 0x111111,
                shininess: 30,
                flatShading: true,
                transparent: true,
                opacity: 0.8
            });
        };

        const createBodyPart = (geometry, name, yPos, scaleX, scaleY, scaleZ) => {
            const material = createCyberMaterial();
            const mesh = new THREE.Mesh(geometry, material);
            mesh.scale.set(scaleX, scaleY, scaleZ);
            mesh.position.y = yPos;

            // Add wireframe outline
            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x9ca3af, linewidth: 2 }));
            mesh.add(line);

            this.scene.add(mesh);
            this.bodyParts[name] = { mesh: mesh, line: line };
        };

        // Standard geometries
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const cylGeo = new THREE.CylinderGeometry(0.5, 0.4, 1, 8); // Octagonal for faceted look

        // Head
        createBodyPart(boxGeo, 'head', 4, 1.2, 1.5, 1.2);
        // Torso
        createBodyPart(boxGeo, 'torso', 1.5, 3.5, 3.5, 1.5);
        // Arms
        createBodyPart(cylGeo, 'armL', 1.5, 1, 3.5, 1);
        this.bodyParts.armL.mesh.position.x = -2.5;
        createBodyPart(cylGeo, 'armR', 1.5, 1, 3.5, 1);
        this.bodyParts.armR.mesh.position.x = 2.5;
        // Legs
        createBodyPart(cylGeo, 'legL', -2.5, 1.2, 4, 1.2);
        this.bodyParts.legL.mesh.position.x = -1;
        createBodyPart(cylGeo, 'legR', -2.5, 1.2, 4, 1.2);
        this.bodyParts.legR.mesh.position.x = 1;

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        animate();

        // Handle resize
        window.addEventListener('resize', () => {
            if(!container) return;
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        });

        this.state.webglInitialized = true;
    },

    updateWebGLVisualizer() {
        if (!this.state.schedule || !this.state.webglInitialized) return;

        const select = document.getElementById('vis-day-select');
        const dayIndex = select.value;
        if (dayIndex === '') return;

        const day = this.state.schedule[dayIndex];

        document.getElementById('vis-details').style.display = 'block';
        document.getElementById('vis-desc').innerText = `ISOLATING: ${day.focus} | INTENSITY: ${day.intensity}`;

        // Cyber Colors
        const colors = {
            high: { fill: 0xef4444, line: 0xfca5a5, emit: 0x450a0a },
            mod: { fill: 0x3b82f6, line: 0x93c5fd, emit: 0x0f172a },
            rec: { fill: 0x10b981, line: 0x6ee7b7, emit: 0x022c22 },
            base: { fill: 0x1f2937, line: 0x4b5563, emit: 0x000000 }
        };

        const setPartColor = (part, stateName) => {
            const c = colors[stateName];
            if(this.bodyParts[part]) {
                this.bodyParts[part].mesh.material.color.setHex(c.fill);
                this.bodyParts[part].mesh.material.emissive.setHex(c.emit);
                this.bodyParts[part].line.material.color.setHex(c.line);
            }
        };

        // Reset all to base
        ['head', 'torso', 'armL', 'armR', 'legL', 'legR'].forEach(p => setPartColor(p, 'base'));

        let equipmentHTML = "";

        // Apply specific highlighting & equipment logic
        if (day.phase === 'Recovery') {
            ['torso', 'armL', 'armR', 'legL', 'legR'].forEach(p => setPartColor(p, 'rec'));
            equipmentHTML = `
                <li><strong>Modality:</strong> Foam Roller / Massage Gun</li>
                <li><strong>Protocol:</strong> Static stretching, parasympathetic breathing (CNS Downregulation).</li>
            `;
        } else if (day.focus.includes('Lower Body')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            setPartColor('legL', state);
            setPartColor('legR', state);
            setPartColor('torso', 'rec');
            equipmentHTML = `
                <li><strong>Primary:</strong> STAR TRAC™ Inspiration Leg Press / Hack Squat</li>
                <li><strong>Secondary:</strong> STAR TRAC™ Instinct Leg Extension / Curl</li>
                <li><strong>Alternative:</strong> Dumbbell Bulgarian Split Squats</li>
            `;
        } else if (day.focus.includes('Upper Body')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            setPartColor('torso', state);
            setPartColor('armL', state);
            setPartColor('armR', state);
            setPartColor('legL', 'rec');
            setPartColor('legR', 'rec');
            equipmentHTML = `
                <li><strong>Primary:</strong> STAR TRAC™ Inspiration Chest Press / Lat Pulldown</li>
                <li><strong>Secondary:</strong> Dual Adjustable Pulley Cable Crossovers</li>
            `;
        } else if (day.focus.includes('Jump Rope') || day.focus.includes('Boxing') || day.focus.includes('Sprints')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            setPartColor('torso', state);
            setPartColor('armL', state);
            setPartColor('armR', state);
            setPartColor('legL', state);
            setPartColor('legR', state);
            equipmentHTML = `
                <li><strong>Primary:</strong> Heavy Bag (Boxing) / Speed Rope</li>
                <li><strong>Metabolic Engine:</strong> Anaerobic Glycolysis System</li>
                <li><strong>Machine Alt:</strong> STAR TRAC™ HIIT Bike / Treadmill Intervals</li>
            `;
        } else {
            // Full body default
            const state = day.intensity === 'High' ? 'high' : 'mod';
            ['torso', 'armL', 'armR', 'legL', 'legR'].forEach(p => setPartColor(p, state));
            equipmentHTML = `
                <li><strong>Primary:</strong> STAR TRAC™ Multi-Station / Free Weights</li>
                <li><strong>Focus:</strong> Compound structural movements</li>
            `;
        }

        document.getElementById('vis-equipment').innerHTML = equipmentHTML;
    },

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

        if (bio.goal === 'weight_loss') {
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

        document.getElementById('nutrition-tdee').innerHTML = `
            <strong>Target:</strong> ${tdee} kcal/day <br>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Protocol: ${goalText}</span>
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
            sun: document.getElementById('miss-sun').checked
        };

        // Calculate Daily Intake Requirements based on biometrics & schedule intensity
        const bio = this.state.biometrics;
        let intensityFactor = 1.0;

        if (this.state.schedule) {
            const highDays = this.state.schedule.filter(d => d.intensity === 'High').length;
            if (highDays > 3) intensityFactor = 1.3; // High sweat/CNS tax
            else if (highDays > 1) intensityFactor = 1.15;
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
            <li>Magnesium: ${reqs.magnesium} mg</li>
            <li>Potassium: ${reqs.potassium} mg</li>
            <li>Calcium: ${reqs.calcium} mg</li>
            <li>Iron: ${reqs.iron} mg</li>
            <li>Zinc: ${reqs.zinc} mg</li>
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
