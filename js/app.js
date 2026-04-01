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
        const caliUpper = { phase: "Strength", focus: "Upper Body Calisthenics (Pull-ups/Dips)", intensity: "High" };
        const caliCore = { phase: "Strength", focus: "Core / Gymnastic Rings", intensity: "High" };
        const powerMax = { phase: "Strength", focus: "Maximal Output (Bench/Squat/Deadlift 1RM-3RM)", intensity: "High" };
        const powerAccessory = { phase: "Strength", focus: "Powerlifting Accessory Blocks", intensity: "Moderate" };

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
        } else if (bio.goal === 'calisthenics') {
            // Calisthenics: 6-day repeating skill & strength
            microcycle = [
                caliUpper, caliCore, strengthLower, aerobicLiss, caliUpper, recoveryActive
            ];
        } else if (bio.goal === 'powerlifting') {
            // Powerlifting: 7-day CNS focused cycle
            microcycle = [
                powerMax, recoveryActive, powerAccessory, recoveryPassive,
                powerMax, powerAccessory, recoveryPassive
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
        const gridHelper = new THREE.GridHelper(20, 20, 0x111827, 0x111827);
        gridHelper.position.y = -5;
        this.scene.add(gridHelper);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 18);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 25;

        const ambientLight = new THREE.AmbientLight(0x444444);
        this.scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight1.position.set(5, 5, 10);
        this.scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0x3b82f6, 0.5);
        dirLight2.position.set(-5, 0, -10);
        this.scene.add(dirLight2);

        this.bodyParts = {};
        this.bones = {};

        const createCyberMaterial = () => {
            return new THREE.MeshPhongMaterial({
                color: 0x374151,
                emissive: 0x000000,
                specular: 0x111111,
                shininess: 30,
                flatShading: true,
                transparent: true,
                opacity: 0.65 // More transparent to see skeleton
            });
        };

        const createBoneMaterial = () => {
            return new THREE.MeshPhongMaterial({
                color: 0xd1d5db, // Bone white/gray
                emissive: 0x111111,
                specular: 0x222222,
                shininess: 10,
                flatShading: true
            });
        };

        const createMuscle = (geo, name, x, y, z, sx, sy, sz, rx=0, ry=0, rz=0) => {
            const material = createCyberMaterial();
            const mesh = new THREE.Mesh(geo, material);
            mesh.scale.set(sx, sy, sz);
            mesh.position.set(x, y, z);
            mesh.rotation.set(rx, ry, rz);

            const edges = new THREE.EdgesGeometry(geo);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x9ca3af, linewidth: 1 }));
            mesh.add(line);

            this.scene.add(mesh);
            this.bodyParts[name] = { mesh: mesh, line: line };
        };

        const createBone = (geo, name, x, y, z, sx, sy, sz, rx=0, ry=0, rz=0) => {
            const material = createBoneMaterial();
            const mesh = new THREE.Mesh(geo, material);
            mesh.scale.set(sx, sy, sz);
            mesh.position.set(x, y, z);
            mesh.rotation.set(rx, ry, rz);

            const edges = new THREE.EdgesGeometry(geo);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x6b7280, linewidth: 1 }));
            mesh.add(line);

            this.scene.add(mesh);
            this.bones[name] = { mesh: mesh, line: line };
        };

        const polyGeo = new THREE.IcosahedronGeometry(1, 1);
        const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);

        // --- SKELETON (Deep Layer) ---
        // Skull & Jaw
        createBone(polyGeo, 'cranium', 0, 7.6, 0.1, 1.0, 1.2, 1.1);
        createBone(boxGeo, 'mandible', 0, 6.8, 0.3, 0.8, 0.4, 0.8, 0.2, 0, 0);

        // Spine (Cervical, Thoracic, Lumbar)
        createBone(cylGeo, 'cervical_spine', 0, 6.2, -0.2, 0.3, 1.2, 0.3);
        createBone(cylGeo, 'thoracic_spine', 0, 4.0, -0.5, 0.4, 3.5, 0.4);
        createBone(cylGeo, 'lumbar_spine', 0, 1.8, -0.2, 0.5, 1.5, 0.5);

        // Ribcage & Sternum
        createBone(polyGeo, 'ribcage', 0, 4.0, 0.2, 1.4, 2.0, 1.2, 0.1, 0, 0);
        createBone(boxGeo, 'sternum', 0, 4.2, 1.4, 0.3, 1.5, 0.1, 0.1, 0, 0);

        // Clavicle & Scapula
        createBone(cylGeo, 'clavicle_l', -1.0, 5.2, 1.0, 0.2, 1.5, 0.2, 0, 0, 1.5);
        createBone(cylGeo, 'clavicle_r', 1.0, 5.2, 1.0, 0.2, 1.5, 0.2, 0, 0, -1.5);
        createBone(boxGeo, 'scapula_l', -1.2, 4.5, -0.8, 0.8, 1.2, 0.2, 0.2, 0.3, 0.2);
        createBone(boxGeo, 'scapula_r', 1.2, 4.5, -0.8, 0.8, 1.2, 0.2, 0.2, -0.3, -0.2);

        // Arms (Humerus, Radius, Ulna, Carpals)
        createBone(cylGeo, 'humerus_l', -2.8, 3.5, 0, 0.3, 2.5, 0.3, 0, 0, 0.2);
        createBone(cylGeo, 'humerus_r', 2.8, 3.5, 0, 0.3, 2.5, 0.3, 0, 0, -0.2);
        createBone(cylGeo, 'radius_l', -3.5, 1.2, 0.1, 0.2, 2.0, 0.2, 0, 0, 0.1);
        createBone(cylGeo, 'radius_r', 3.5, 1.2, 0.1, 0.2, 2.0, 0.2, 0, 0, -0.1);
        createBone(cylGeo, 'ulna_l', -3.3, 1.2, -0.1, 0.2, 2.0, 0.2, 0, 0, 0.1);
        createBone(cylGeo, 'ulna_r', 3.3, 1.2, -0.1, 0.2, 2.0, 0.2, 0, 0, -0.1);
        createBone(boxGeo, 'carpals_l', -3.7, -0.2, 0, 0.4, 0.5, 0.2);
        createBone(boxGeo, 'carpals_r', 3.7, -0.2, 0, 0.4, 0.5, 0.2);

        // Pelvis
        createBone(polyGeo, 'pelvis_bone', 0, 0.4, 0, 1.6, 1.0, 1.0, 0.2, 0, 0);

        // Legs (Femur, Patella, Tibia, Fibula, Tarsals)
        createBone(cylGeo, 'femur_l', -1.0, -2.0, 0.2, 0.4, 3.5, 0.4, -0.1, 0, 0.1);
        createBone(cylGeo, 'femur_r', 1.0, -2.0, 0.2, 0.4, 3.5, 0.4, -0.1, 0, -0.1);
        createBone(polyGeo, 'patella_l', -1.1, -3.9, 0.6, 0.3, 0.3, 0.3);
        createBone(polyGeo, 'patella_r', 1.1, -3.9, 0.6, 0.3, 0.3, 0.3);
        createBone(cylGeo, 'tibia_l', -1.1, -5.8, 0.2, 0.35, 3.2, 0.35);
        createBone(cylGeo, 'tibia_r', 1.1, -5.8, 0.2, 0.35, 3.2, 0.35);
        createBone(cylGeo, 'fibula_l', -1.4, -5.8, 0.0, 0.2, 3.0, 0.2);
        createBone(cylGeo, 'fibula_r', 1.4, -5.8, 0.0, 0.2, 3.0, 0.2);
        createBone(boxGeo, 'tarsals_l', -1.2, -7.5, 0.4, 0.6, 0.4, 1.2);
        createBone(boxGeo, 'tarsals_r', 1.2, -7.5, 0.4, 0.6, 0.4, 1.2);

        // --- SUPERFICIAL & DEEP MUSCULATURE (Outer Layer) ---
        // Neck & Head
        createMuscle(polyGeo, 'scm_l', -0.5, 6.4, 0.5, 0.3, 0.8, 0.3, 0, 0, 0.3);
        createMuscle(polyGeo, 'scm_r', 0.5, 6.4, 0.5, 0.3, 0.8, 0.3, 0, 0, -0.3);

        // Trapezius (Upper, Middle, Lower)
        createMuscle(polyGeo, 'traps_upper_l', -1.0, 5.8, -0.2, 1.2, 0.6, 0.6, 0, 0, 0.5);
        createMuscle(polyGeo, 'traps_upper_r', 1.0, 5.8, -0.2, 1.2, 0.6, 0.6, 0, 0, -0.5);
        createMuscle(polyGeo, 'traps_mid', 0, 4.8, -0.7, 1.5, 1.0, 0.4);
        createMuscle(polyGeo, 'traps_lower', 0, 3.8, -0.6, 0.8, 1.5, 0.3);

        // Back (Lats, Rhomboids, Teres, Erector Spinae)
        createMuscle(polyGeo, 'lat_l', -1.6, 3.2, -0.5, 1.2, 2.4, 0.5, 0.1, 0, 0.2);
        createMuscle(polyGeo, 'lat_r', 1.6, 3.2, -0.5, 1.2, 2.4, 0.5, 0.1, 0, -0.2);
        createMuscle(polyGeo, 'teres_major_l', -1.8, 4.2, -0.6, 0.6, 0.8, 0.4, 0, 0, 0.3);
        createMuscle(polyGeo, 'teres_major_r', 1.8, 4.2, -0.6, 0.6, 0.8, 0.4, 0, 0, -0.3);
        createMuscle(polyGeo, 'infraspinatus_l', -1.2, 4.5, -0.9, 0.8, 0.8, 0.3, 0, 0, 0.1);
        createMuscle(polyGeo, 'infraspinatus_r', 1.2, 4.5, -0.9, 0.8, 0.8, 0.3, 0, 0, -0.1);
        createMuscle(cylGeo, 'erector_spinae_l', -0.4, 2.5, -0.6, 0.4, 3.0, 0.4);
        createMuscle(cylGeo, 'erector_spinae_r', 0.4, 2.5, -0.6, 0.4, 3.0, 0.4);

        // Chest (Pectoralis Major & Minor, Serratus)
        createMuscle(polyGeo, 'pec_major_l', -1.0, 4.5, 1.0, 1.3, 1.0, 0.4, 0.1, -0.1, 0);
        createMuscle(polyGeo, 'pec_major_r', 1.0, 4.5, 1.0, 1.3, 1.0, 0.4, 0.1, 0.1, 0);
        createMuscle(polyGeo, 'serratus_l', -1.6, 3.5, 0.7, 0.5, 1.2, 0.5, 0, -0.2, 0.1);
        createMuscle(polyGeo, 'serratus_r', 1.6, 3.5, 0.7, 0.5, 1.2, 0.5, 0, 0.2, -0.1);

        // Abdomen (Rectus Abdominis, Obliques, Transversus)
        createMuscle(polyGeo, 'abs_1l', -0.4, 3.5, 1.1, 0.5, 0.5, 0.3);
        createMuscle(polyGeo, 'abs_1r', 0.4, 3.5, 1.1, 0.5, 0.5, 0.3);
        createMuscle(polyGeo, 'abs_2l', -0.4, 2.8, 1.1, 0.5, 0.5, 0.3);
        createMuscle(polyGeo, 'abs_2r', 0.4, 2.8, 1.1, 0.5, 0.5, 0.3);
        createMuscle(polyGeo, 'abs_3l', -0.4, 2.1, 1.0, 0.5, 0.5, 0.3);
        createMuscle(polyGeo, 'abs_3r', 0.4, 2.1, 1.0, 0.5, 0.5, 0.3);
        createMuscle(polyGeo, 'abs_4l', -0.4, 1.4, 0.9, 0.5, 0.5, 0.3);
        createMuscle(polyGeo, 'abs_4r', 0.4, 1.4, 0.9, 0.5, 0.5, 0.3);
        createMuscle(polyGeo, 'oblique_ext_l', -1.2, 2.4, 0.6, 0.8, 1.8, 0.6, 0, -0.1, -0.1);
        createMuscle(polyGeo, 'oblique_ext_r', 1.2, 2.4, 0.6, 0.8, 1.8, 0.6, 0, 0.1, 0.1);

        // Shoulders (Anterior, Lateral, Posterior Deltoids)
        createMuscle(polyGeo, 'delt_ant_l', -2.2, 5.0, 0.5, 0.7, 1.0, 0.6, 0.2, 0, 0.3);
        createMuscle(polyGeo, 'delt_ant_r', 2.2, 5.0, 0.5, 0.7, 1.0, 0.6, 0.2, 0, -0.3);
        createMuscle(polyGeo, 'delt_lat_l', -2.6, 4.9, 0, 0.7, 1.0, 0.7, 0, 0, 0.4);
        createMuscle(polyGeo, 'delt_lat_r', 2.6, 4.9, 0, 0.7, 1.0, 0.7, 0, 0, -0.4);
        createMuscle(polyGeo, 'delt_post_l', -2.3, 4.9, -0.5, 0.7, 0.9, 0.6, -0.2, 0, 0.3);
        createMuscle(polyGeo, 'delt_post_r', 2.3, 4.9, -0.5, 0.7, 0.9, 0.6, -0.2, 0, -0.3);

        // Upper Arms (Biceps short/long, Brachialis, Triceps lateral/long/medial)
        createMuscle(cylGeo, 'bicep_l', -3.0, 3.4, 0.4, 0.7, 1.8, 0.7, 0, 0, 0.2);
        createMuscle(cylGeo, 'bicep_r', 3.0, 3.4, 0.4, 0.7, 1.8, 0.7, 0, 0, -0.2);
        createMuscle(cylGeo, 'brachialis_l', -3.2, 2.6, 0.1, 0.6, 1.0, 0.6, 0, 0, 0.2);
        createMuscle(cylGeo, 'brachialis_r', 3.2, 2.6, 0.1, 0.6, 1.0, 0.6, 0, 0, -0.2);
        createMuscle(cylGeo, 'tricep_long_l', -2.8, 3.4, -0.4, 0.6, 2.0, 0.6, 0, 0, 0.2);
        createMuscle(cylGeo, 'tricep_long_r', 2.8, 3.4, -0.4, 0.6, 2.0, 0.6, 0, 0, -0.2);
        createMuscle(cylGeo, 'tricep_lat_l', -3.4, 3.6, -0.2, 0.6, 1.6, 0.6, 0, 0, 0.2);
        createMuscle(cylGeo, 'tricep_lat_r', 3.4, 3.6, -0.2, 0.6, 1.6, 0.6, 0, 0, -0.2);

        // Forearms (Brachioradialis, Flexors, Extensors)
        createMuscle(cylGeo, 'brachioradialis_l', -3.6, 1.8, 0.3, 0.5, 1.5, 0.5, 0, 0, 0.1);
        createMuscle(cylGeo, 'brachioradialis_r', 3.6, 1.8, 0.3, 0.5, 1.5, 0.5, 0, 0, -0.1);
        createMuscle(cylGeo, 'flexors_l', -3.2, 1.0, 0.2, 0.6, 1.8, 0.5, 0, 0, 0.1);
        createMuscle(cylGeo, 'flexors_r', 3.2, 1.0, 0.2, 0.6, 1.8, 0.5, 0, 0, -0.1);
        createMuscle(cylGeo, 'extensors_l', -3.6, 1.0, -0.2, 0.5, 1.8, 0.5, 0, 0, 0.1);
        createMuscle(cylGeo, 'extensors_r', 3.6, 1.0, -0.2, 0.5, 1.8, 0.5, 0, 0, -0.1);

        // Pelvis & Glutes (Maximus, Medius)
        createMuscle(polyGeo, 'glute_max_l', -0.9, 0.4, -1.0, 1.3, 1.3, 0.8, 0.2, 0, 0);
        createMuscle(polyGeo, 'glute_max_r', 0.9, 0.4, -1.0, 1.3, 1.3, 0.8, 0.2, 0, 0);
        createMuscle(polyGeo, 'glute_med_l', -1.5, 0.8, -0.5, 0.8, 1.0, 0.6, 0.1, 0, 0.2);
        createMuscle(polyGeo, 'glute_med_r', 1.5, 0.8, -0.5, 0.8, 1.0, 0.6, 0.1, 0, -0.2);

        // Thighs (Quads: Rectus Femoris, Vastus Lateralis/Medialis; Adductors, Sartorius)
        createMuscle(cylGeo, 'rectus_femoris_l', -1.0, -1.8, 0.7, 0.8, 3.2, 0.8, -0.05, 0, 0.05);
        createMuscle(cylGeo, 'rectus_femoris_r', 1.0, -1.8, 0.7, 0.8, 3.2, 0.8, -0.05, 0, -0.05);
        createMuscle(cylGeo, 'vastus_lateralis_l', -1.6, -1.8, 0.4, 0.7, 3.3, 0.7, -0.05, 0, 0.1);
        createMuscle(cylGeo, 'vastus_lateralis_r', 1.6, -1.8, 0.4, 0.7, 3.3, 0.7, -0.05, 0, -0.1);
        createMuscle(cylGeo, 'vastus_medialis_l', -0.6, -2.4, 0.5, 0.6, 2.0, 0.6, -0.05, 0, -0.1);
        createMuscle(cylGeo, 'vastus_medialis_r', 0.6, -2.4, 0.5, 0.6, 2.0, 0.6, -0.05, 0, 0.1);
        createMuscle(cylGeo, 'adductor_l', -0.5, -1.2, 0.1, 0.6, 2.5, 0.6, 0, 0, -0.2);
        createMuscle(cylGeo, 'adductor_r', 0.5, -1.2, 0.1, 0.6, 2.5, 0.6, 0, 0, 0.2);
        createMuscle(cylGeo, 'sartorius_l', -0.8, -1.5, 0.6, 0.3, 3.6, 0.3, -0.1, 0.2, 0.15);
        createMuscle(cylGeo, 'sartorius_r', 0.8, -1.5, 0.6, 0.3, 3.6, 0.3, -0.1, -0.2, -0.15);

        // Hamstrings (Biceps Femoris, Semitendinosus)
        createMuscle(cylGeo, 'biceps_femoris_l', -1.3, -1.8, -0.5, 0.7, 3.2, 0.7, 0.05, 0, 0.05);
        createMuscle(cylGeo, 'biceps_femoris_r', 1.3, -1.8, -0.5, 0.7, 3.2, 0.7, 0.05, 0, -0.05);
        createMuscle(cylGeo, 'semitendinosus_l', -0.7, -1.8, -0.5, 0.6, 3.2, 0.6, 0.05, 0, -0.05);
        createMuscle(cylGeo, 'semitendinosus_r', 0.7, -1.8, -0.5, 0.6, 3.2, 0.6, 0.05, 0, 0.05);

        // Lower Leg (Gastrocnemius Medial/Lateral, Soleus, Tibialis Anterior)
        createMuscle(polyGeo, 'gastrocnemius_med_l', -0.8, -5.0, -0.4, 0.6, 1.5, 0.6, 0.1, 0, 0);
        createMuscle(polyGeo, 'gastrocnemius_med_r', 0.8, -5.0, -0.4, 0.6, 1.5, 0.6, 0.1, 0, 0);
        createMuscle(polyGeo, 'gastrocnemius_lat_l', -1.4, -5.0, -0.4, 0.5, 1.4, 0.5, 0.1, 0, 0);
        createMuscle(polyGeo, 'gastrocnemius_lat_r', 1.4, -5.0, -0.4, 0.5, 1.4, 0.5, 0.1, 0, 0);
        createMuscle(cylGeo, 'soleus_l', -1.1, -6.0, -0.3, 0.7, 2.0, 0.6);
        createMuscle(cylGeo, 'soleus_r', 1.1, -6.0, -0.3, 0.7, 2.0, 0.6);
        createMuscle(cylGeo, 'tibialis_ant_l', -1.3, -5.5, 0.4, 0.5, 2.5, 0.4);
        createMuscle(cylGeo, 'tibialis_ant_r', 1.3, -5.5, 0.4, 0.5, 2.5, 0.4);

        const animate = () => {
            requestAnimationFrame(animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        animate();

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

        const colors = {
            high: { fill: 0xef4444, line: 0xfca5a5, emit: 0x450a0a, op: 0.9 },
            mod: { fill: 0x3b82f6, line: 0x93c5fd, emit: 0x0f172a, op: 0.8 },
            rec: { fill: 0x10b981, line: 0x6ee7b7, emit: 0x022c22, op: 0.8 },
            base: { fill: 0x374151, line: 0x9ca3af, emit: 0x000000, op: 0.4 } // Transparent base to see skeleton
        };

        const setPartColor = (part, stateName) => {
            const c = colors[stateName];
            if(this.bodyParts[part]) {
                this.bodyParts[part].mesh.material.color.setHex(c.fill);
                this.bodyParts[part].mesh.material.emissive.setHex(c.emit);
                this.bodyParts[part].mesh.material.opacity = c.op;
                this.bodyParts[part].line.material.color.setHex(c.line);
            }
        };

        // Muscle Groupings
        const core = ['abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'abs_3l', 'abs_3r', 'abs_4l', 'abs_4r', 'oblique_ext_l', 'oblique_ext_r', 'erector_spinae_l', 'erector_spinae_r'];
        const chest = ['pec_major_l', 'pec_major_r', 'serratus_l', 'serratus_r'];
        const back = ['traps_upper_l', 'traps_upper_r', 'traps_mid', 'traps_lower', 'lat_l', 'lat_r', 'teres_major_l', 'teres_major_r', 'infraspinatus_l', 'infraspinatus_r'];
        const shoulders = ['delt_ant_l', 'delt_ant_r', 'delt_lat_l', 'delt_lat_r', 'delt_post_l', 'delt_post_r'];
        const armsFront = ['bicep_l', 'bicep_r', 'brachialis_l', 'brachialis_r', 'brachioradialis_l', 'brachioradialis_r', 'flexors_l', 'flexors_r'];
        const armsBack = ['tricep_long_l', 'tricep_long_r', 'tricep_lat_l', 'tricep_lat_r', 'extensors_l', 'extensors_r'];
        const glutes = ['glute_max_l', 'glute_max_r', 'glute_med_l', 'glute_med_r'];
        const quads = ['rectus_femoris_l', 'rectus_femoris_r', 'vastus_lateralis_l', 'vastus_lateralis_r', 'vastus_medialis_l', 'vastus_medialis_r', 'sartorius_l', 'sartorius_r'];
        const hamstrings = ['biceps_femoris_l', 'biceps_femoris_r', 'semitendinosus_l', 'semitendinosus_r'];
        const adductors = ['adductor_l', 'adductor_r'];
        const calves = ['gastrocnemius_med_l', 'gastrocnemius_med_r', 'gastrocnemius_lat_l', 'gastrocnemius_lat_r', 'soleus_l', 'soleus_r', 'tibialis_ant_l', 'tibialis_ant_r'];

        const allMuscles = Object.keys(this.bodyParts);

        // Reset all to base
        allMuscles.forEach(p => setPartColor(p, 'base'));

        let equipmentHTML = "";

        if (day.phase === 'Recovery') {
            allMuscles.forEach(p => setPartColor(p, 'rec'));
            equipmentHTML = `
                <li><strong>Modality:</strong> Foam Roller / Massage Gun</li>
                <li><strong>Protocol:</strong> Static stretching, parasympathetic breathing (CNS Downregulation).</li>
            `;
        } else if (day.focus.includes('Lower Body')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            quads.forEach(p => setPartColor(p, state));
            glutes.forEach(p => setPartColor(p, state));
            hamstrings.forEach(p => setPartColor(p, state));
            adductors.forEach(p => setPartColor(p, 'mod'));
            calves.forEach(p => setPartColor(p, 'mod'));
            core.forEach(p => setPartColor(p, 'mod')); // Core stabilizes
            equipmentHTML = `
                <li><strong>Primary:</strong> STAR TRAC™ Inspiration Leg Press / Hack Squat (Targets Quads/Glutes)</li>
                <li><strong>Secondary:</strong> STAR TRAC™ Instinct Leg Extension / Curl (Isolates Quads/Hamstrings)</li>
            `;
        } else if (day.focus.includes('Upper Body Push/Pull')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            chest.forEach(p => setPartColor(p, state));
            back.forEach(p => setPartColor(p, state));
            shoulders.forEach(p => setPartColor(p, state));
            armsFront.forEach(p => setPartColor(p, state));
            armsBack.forEach(p => setPartColor(p, state));
            equipmentHTML = `
                <li><strong>Primary:</strong> Chest Press (Pecs/Delts) / Lat Pulldown (Lats/Biceps)</li>
                <li><strong>Secondary:</strong> Dual Adjustable Pulley Cable Crossovers</li>
            `;
        } else if (day.focus.includes('Upper Body Calisthenics')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            back.forEach(p => setPartColor(p, state)); // Pullups
            chest.forEach(p => setPartColor(p, 'mod')); // Dips
            armsFront.forEach(p => setPartColor(p, state)); // Biceps
            armsBack.forEach(p => setPartColor(p, state)); // Triceps
            core.forEach(p => setPartColor(p, 'mod'));
            equipmentHTML = `
                <li><strong>Primary:</strong> Gymnastic Rings / Pull-up Bar</li>
                <li><strong>Muscle Focus:</strong> Latissimus Dorsi, Teres Major, Biceps Brachii, Pectoralis Major.</li>
            `;
        } else if (day.focus.includes('Jump Rope')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            calves.forEach(p => setPartColor(p, state)); // Gastrocnemius/Soleus highly active
            quads.forEach(p => setPartColor(p, 'mod'));
            shoulders.forEach(p => setPartColor(p, 'mod')); // Delts stabilize
            ['brachioradialis_l', 'brachioradialis_r', 'flexors_l', 'flexors_r'].forEach(p => setPartColor(p, 'mod')); // Forearms twirl
            equipmentHTML = `
                <li><strong>Primary:</strong> Speed Rope / Jump Rope Intervals</li>
                <li><strong>Muscle Focus:</strong> High recruitment of Gastrocnemius and Soleus.</li>
            `;
        } else if (day.focus.includes('Boxing')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            core.forEach(p => setPartColor(p, state)); // Core twist
            shoulders.forEach(p => setPartColor(p, state)); // Delts fatigue fast
            armsBack.forEach(p => setPartColor(p, state)); // Triceps for extension
            quads.forEach(p => setPartColor(p, 'mod')); // Leg drive
            calves.forEach(p => setPartColor(p, 'mod'));
            equipmentHTML = `
                <li><strong>Primary:</strong> Heavy Bag (Boxing Flow / Sprints)</li>
                <li><strong>Muscle Focus:</strong> Anterior Deltoids, Triceps Brachii, External Obliques.</li>
            `;
        } else if (day.focus.includes('Core / Gymnastic Rings')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            core.forEach(p => setPartColor(p, state)); // Intense core
            back.forEach(p => setPartColor(p, 'mod')); // Stabilization
            shoulders.forEach(p => setPartColor(p, 'mod'));
            equipmentHTML = `
                <li><strong>Primary:</strong> Gymnastic Rings / Floor Mat</li>
                <li><strong>Muscle Focus:</strong> Rectus Abdominis, Transversus Abdominis, Obliques, Serratus Anterior.</li>
            `;
        } else if (day.focus.includes('Maximal Output')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            glutes.forEach(p => setPartColor(p, state));
            quads.forEach(p => setPartColor(p, state));
            hamstrings.forEach(p => setPartColor(p, state));
            core.forEach(p => setPartColor(p, state)); // Erector spinae for deadlift
            back.forEach(p => setPartColor(p, state));
            chest.forEach(p => setPartColor(p, state));
            shoulders.forEach(p => setPartColor(p, state));
            equipmentHTML = `
                <li><strong>Primary:</strong> Olympic Barbell, Squat Rack, Platform</li>
                <li><strong>Focus:</strong> Maximal CNS recruitment. Entire kinetic chain.</li>
            `;
        } else {
            // Full body default
            const state = day.intensity === 'High' ? 'high' : 'mod';
            allMuscles.forEach(p => setPartColor(p, state));
            equipmentHTML = `
                <li><strong>Primary:</strong> STAR TRAC™ Multi-Station / Free Weights</li>
                <li><strong>Focus:</strong> Compound structural movements recruiting maximum motor units across kinetic chain.</li>
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
            spices: document.getElementById('miss-spices').checked
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
