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

    // Wizard Logic
    nextWizardStep(step) {
        document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');
        document.getElementById(`wizard-step-${step}`).style.display = 'block';
    },

    prevWizardStep(step) {
        document.querySelectorAll('.wizard-step').forEach(el => el.style.display = 'none');
        document.getElementById(`wizard-step-${step}`).style.display = 'block';
    },

    loadDemoData() {
        // Populate standard inputs
        document.getElementById('gender').value = 'male';
        document.getElementById('weight').value = '85';
        document.getElementById('height').value = '180';
        document.getElementById('age').value = '30';
        document.getElementById('injury').value = 'none';

        document.getElementById('strength-load').value = '120';
        document.getElementById('aerobic-pace').value = '5.0';
        document.getElementById('anaerobic-intervals').value = '8';

        // Automatically show the second step and generate schedule
        this.nextWizardStep(2);
        this.generateSchedule();

        // Show visualizer immediately
        this.showModule('visualizer');
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
                const strengthFull = { phase: "Strength", focus: "Full Body Strength", intensity: "High" };
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

        let microcycles = [];

        // 1. Determine Goal-Based Base Sequence Alternatives (Breaking 7-day construct)
        if (bio.goal === 'weight_loss') {
            // Aggressive weight loss
            microcycles.push([strengthFull, aerobicLiss, anaerobicJump, strengthUpper, recoveryActive]);
            microcycles.push([aerobicTempo, strengthFull, aerobicLiss, recoveryActive, anaerobicSprints]);
            microcycles.push([strengthLower, anaerobicJump, strengthUpper, aerobicLiss, recoveryPassive]);
        } else if (bio.goal === 'hypertrophy') {
            // Hypertrophy
            microcycles.push([strengthLower, recoveryActive, strengthUpper, recoveryActive, strengthFull, aerobicLiss, anaerobicSprints, recoveryPassive]);
            microcycles.push([strengthUpper, strengthLower, recoveryActive, strengthFull, anaerobicSprints, recoveryActive, recoveryPassive]);
            microcycles.push([strengthFull, recoveryActive, strengthUpper, strengthLower, aerobicTempo, recoveryActive, recoveryPassive]);
        } else if (bio.goal === 'calisthenics') {
            // Calisthenics
            microcycles.push([caliUpper, caliCore, strengthLower, aerobicLiss, caliUpper, recoveryActive]);
            microcycles.push([caliCore, caliUpper, aerobicTempo, strengthLower, caliCore, recoveryActive]);
            microcycles.push([strengthLower, caliUpper, aerobicLiss, caliCore, caliUpper, recoveryPassive]);
        } else if (bio.goal === 'powerlifting') {
            // Powerlifting
            microcycles.push([powerMax, recoveryActive, powerAccessory, recoveryPassive, powerMax, powerAccessory, recoveryPassive]);
            microcycles.push([powerMax, powerAccessory, recoveryPassive, powerMax, recoveryActive, powerAccessory, recoveryPassive]);
            microcycles.push([powerAccessory, powerMax, recoveryActive, powerAccessory, powerMax, recoveryPassive, recoveryPassive]);
        } else {
            // Conditioning / Athletic
            microcycles.push([anaerobicSprints, strengthFull, aerobicLiss, anaerobicJump, strengthUpper, recoveryActive]);
            microcycles.push([aerobicTempo, anaerobicJump, strengthLower, anaerobicSprints, strengthUpper, recoveryActive]);
            microcycles.push([strengthFull, anaerobicSprints, aerobicLiss, strengthFull, anaerobicJump, recoveryPassive]);
        }

        // 2. Injury Adjustments & Rest Protocols (apply to all alternatives)
        if (bio.injury !== 'none') {
            microcycles = microcycles.map(microcycle => {
                let adjusted = microcycle.map(day => {
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
                adjusted.push(recoveryPassive);
                return adjusted;
            });
        }

        // Add day labels based on array length
        let schedules = microcycles.map(microcycle => {
            return microcycle.map((day, idx) => ({
                day: `Day ${idx + 1}`,
                ...day
            }));
        });

        // Use Alternative 1 for primary logic/visualizer
        this.state.schedule = schedules[0];

        // Update other modules based on new schedule
        this.updateKinesiologyProtocol();
        this.updateVisualizerSelect();
        this.updateNutritionModule();

        // Render Schedule UI

        // Keep track of index for linking to visualizer
        schedules[0].forEach((day, i) => day.originalIndex = i);

        const tbody = document.getElementById('schedule-tbody');
        tbody.innerHTML = '';

        schedules.forEach((schedule, index) => {
            const separator = document.createElement('tr');
            separator.innerHTML = `<td colspan="4" style="background-color: #1f2937; color: #60a5fa; text-align: center; font-weight: bold; border-top: 1px solid #374151;">Alternative Plan ${index + 1}</td>`;
            tbody.appendChild(separator);

            schedule.forEach(day => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.title = 'Click to view mechanics in 3D Visualizer';

                tr.onclick = () => this.viewExerciseInVisualizer(day.originalIndex);
                tr.innerHTML = `
                    <td><strong>${day.day}</strong></td>
                    <td><span class="status-badge ${day.phase === 'Recovery' ? 'status-ok' : (day.intensity==='High'?'status-alert':'status-warn')}">${day.phase}</span></td>
                    <td>${day.focus}</td>
                    <td>${day.intensity}</td>
                `;
                tbody.appendChild(tr);
            });
        });

        document.getElementById('schedule-summary').innerText = `Generated 3 alternative repeating microcycles tailored to macrocycle goals, factoring in joint integrity and performance benchmarks.`;
        document.getElementById('schedule-output').style.display = 'block';
    },

    viewExerciseInVisualizer(dayIndex) {

        this.showModule('visualizer');
        const day = this.state.schedule[dayIndex];
        const dictSelect = document.getElementById('vis-dict-select');

        // Map protocol phase to dictionary exercise
        if (day.phase === 'Strength') {
            if (day.focus.toLowerCase().includes('lower')) {
                dictSelect.value = 'squat';
            } else if (day.focus.toLowerCase().includes('upper')) {
                dictSelect.value = 'press';
            } else {
                dictSelect.value = 'fullbody';
            }
        } else {
            // Default to fullbody for aerobic/anaerobic generic movement for now
            dictSelect.value = 'fullbody';
        }

        dictSelect.dispatchEvent(new Event('change'));
    },


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
                tr.style.cursor = 'pointer';
                tr.title = 'Click to view mechanics in 3D Visualizer';
                tr.onclick = () => this.viewExerciseInVisualizer(day.originalIndex);
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
            if(moduleId === 'visualizer') {
                setTimeout(() => {
                    this.initWebGL();
                    if(this.state.schedule) {
                        this.updateWebGLVisualizer();
                    }
                }, 100); // Small delay to allow container to size properly after display:block
            }
        }
    },

    startTour() {
        const tour = introJs();
        tour.setOptions({
            showProgress: true,
            showBullets: false,
            exitOnOverlayClick: false,
            exitOnEsc: false,
            tooltipClass: 'custom-intro-tooltip'
        });

        tour.onbeforechange(function(targetElement) {
            const step = this._currentStep;

            // Step 1: Nav (0), Step 2: Biometrics (1), Step 3: Demo (2)
            if (step === 0 || step === 1 || step === 2) {
                app.showModule('biometrics');
            }

            // Step 3 (index 2) triggers load demo data so subsequent steps have data
            if (step === 2 && !app.state.schedule) {
                app.loadDemoData();
            }

            // Step 4 (Kinesiology) (index 3)
            if (step === 3) {
                app.showModule('kinesiology');
            }

            // Step 5 (Visualizer) (index 4)
            if (step === 4) {
                app.showModule('visualizer');
            }

            // Step 6 (Nutrition) (index 5)
            if (step === 5) {
                app.showModule('nutrition');
            }

            // Step 7 (Juicer) (index 6)
            if (step === 6) {
                app.showModule('juicer');
            }
        });

        tour.start();
    },

    resetCamera() {
        if (this.camera && this.controls) {
            // Reset to initial position
            this.camera.position.set(0, 2, 22);
            this.camera.lookAt(0, 0, 0);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    },


    initWebGL() {
        if (this.state.webglInitialized) return;

        const container = document.getElementById('webgl-container');
        if (!container) return;

        // More responsive canvas sizing fitting within viewport minus header/padding
        let height = window.innerHeight - 250;
        if (height < 500) height = 500;
        container.style.minHeight = height + "px";
        container.style.height = height + "px";

        const width = container.clientWidth;


        // Scene Setup
        this.scene = new THREE.Scene();
        // Add dynamic grid to floor
        this.gridHelper = new THREE.GridHelper(50, 50, 0xa7f3d0, 0xd1d5db);
        this.gridHelper.position.y = -8.5;
        // Disable depth write for grid to prevent z-fighting with trails or contact shadow
        this.gridHelper.material.depthWrite = false;
        this.gridHelper.material.transparent = true;
        this.gridHelper.material.opacity = 0.5;
        this.scene.add(this.gridHelper);

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 2, 22); // Zoomed out and slightly raised to show full body

        // Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setClearColor(0xffffff, 1);
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        // Controls
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 25;
        // Limit polar angle to prevent looking from below the floor
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
        // Enable auto-rotation for a "showroom" effect
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.5;

        // Lights
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        const spotLight = new THREE.SpotLight(0xffffff, 1);
        spotLight.position.set(0, 20, 10);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.5;
        spotLight.decay = 2;
        spotLight.distance = 50;
        spotLight.castShadow = true;
        this.scene.add(spotLight);

        // Build Procedural Geometry (Faceted Star Trac Style)
        this.bodyParts = {};

        // Root group for Micro-Sway
        this.bodyGroup = new THREE.Group();
        this.scene.add(this.bodyGroup);

        // Material factory for X-Ray Diagnostic Shaders
        const createCyberMaterial = () => {
            return new THREE.ShaderMaterial({
                uniforms: {
                    glowColor: { value: new THREE.Color(0x374151) }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vViewPosition;
                    void main() {
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        vNormal = normalize(normalMatrix * normal);
                        vViewPosition = -mvPosition.xyz;
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vNormal;
                    varying vec3 vViewPosition;
                    uniform vec3 glowColor;
                    void main() {
                        vec3 normal = normalize(vNormal);
                        vec3 viewDir = normalize(vViewPosition);
                        float rim = 1.0 - max(dot(viewDir, normal), 0.0);
                        rim = smoothstep(0.4, 1.0, rim);
                        vec4 baseColor = vec4(glowColor, 0.2);
                        vec4 rimColor = vec4(glowColor, 1.0) * pow(rim, 2.0) * 1.5;
                        gl_FragColor = baseColor + rimColor;
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
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

        // Helper to create detailed positioned muscles
        const createMuscle = (geo, name, x, y, z, sx, sy, sz, rx=0, ry=0, rz=0) => {
            // Using Phong material instead of Standard for a starker contrast and solid non-metallic look
            const material = new THREE.MeshPhongMaterial({
                color: 0xd2b48c, // meatish/fleshy base
                emissive: 0x000000,
                specular: 0x222222,
                shininess: 10,
                flatShading: true
            });

            const mesh = new THREE.Mesh(geo, material);
            mesh.scale.set(sx, sy, sz);
            mesh.position.set(x, y, z);
            mesh.rotation.set(rx, ry, rz);
            // No shadows
            mesh.castShadow = false;
            mesh.receiveShadow = false;

            mesh.userData = {
                name: name,
                baseScale: new THREE.Vector3(sx, sy, sz)
            }; // Store internal name and base properties for raycasting and inflation

            // Add motion trail capability
            const trailGeo = new THREE.BufferGeometry();
            const trailMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.5 });
            const trailLine = new THREE.Line(trailGeo, trailMat);
            this.bodyGroup.add(trailLine);

            this.bodyGroup.add(mesh);
            this.bodyParts[name] = {
                mesh: mesh,
                trailLine: trailLine,
                trailPositions: [],
                maxTrailPoints: 15
            };
        };

        // Geometries for solid component look
        const polyGeo = new THREE.IcosahedronGeometry(1, 3);
        const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16, 4);

        // 1. Head & Neck
        createMuscle(polyGeo, 'head', 0, 7.5, 0, 1.2, 1.5, 1.3);
        createMuscle(cylGeo, 'neck', 0, 6.2, 0, 1.0, 1.5, 1.0);
        createMuscle(polyGeo, 'traps_l', -1.2, 5.8, -0.2, 1.5, 0.8, 0.8, 0, 0, 0.5);
        createMuscle(polyGeo, 'traps_r', 1.2, 5.8, -0.2, 1.5, 0.8, 0.8, 0, 0, -0.5);

        // 2. Torso (Front - Slimmer)
        createMuscle(polyGeo, 'pec_l', -1.0, 4.5, 0.7, 1.2, 1.1, 0.4, 0.2, -0.2, 0);
        createMuscle(polyGeo, 'pec_r', 1.0, 4.5, 0.7, 1.2, 1.1, 0.4, 0.2, 0.2, 0);

        // Abs (6-pack - Slimmer)
        createMuscle(polyGeo, 'abs_1l', -0.4, 3.5, 0.8, 0.5, 0.6, 0.25);
        createMuscle(polyGeo, 'abs_1r', 0.4, 3.5, 0.8, 0.5, 0.6, 0.25);
        createMuscle(polyGeo, 'abs_2l', -0.4, 2.7, 0.8, 0.5, 0.6, 0.25);
        createMuscle(polyGeo, 'abs_2r', 0.4, 2.7, 0.8, 0.5, 0.6, 0.25);
        createMuscle(polyGeo, 'abs_3l', -0.4, 1.9, 0.7, 0.5, 0.6, 0.25);
        createMuscle(polyGeo, 'abs_3r', 0.4, 1.9, 0.7, 0.5, 0.6, 0.25);

        // Obliques (Slimmer)
        createMuscle(polyGeo, 'oblique_l', -1.3, 2.7, 0.4, 0.6, 1.5, 0.5, 0, 0, -0.15);
        createMuscle(polyGeo, 'oblique_r', 1.3, 2.7, 0.4, 0.6, 1.5, 0.5, 0, 0, 0.15);

        // 3. Torso (Back - Slimmer)
        createMuscle(polyGeo, 'lat_l', -1.5, 3.5, -0.5, 1.0, 2.3, 0.5, 0.2, 0, 0.15);
        createMuscle(polyGeo, 'lat_r', 1.5, 3.5, -0.5, 1.0, 2.3, 0.5, 0.2, 0, -0.15);
        createMuscle(polyGeo, 'lower_back', 0, 2.0, -0.7, 1.3, 1.5, 0.4);

        // 4. Arms (Slimmer, spread out slightly)
        // Shoulders (Deltoids)
        createMuscle(polyGeo, 'delt_l', -2.5, 5.0, 0, 1.0, 1.2, 1.0, 0, 0, 0.5);
        createMuscle(polyGeo, 'delt_r', 2.5, 5.0, 0, 1.0, 1.2, 1.0, 0, 0, -0.5);

        // Upper Arm (Bicep/Tricep)
        createMuscle(cylGeo, 'bicep_l', -3.2, 3.8, 0.2, 0.8, 1.8, 0.7, 0, 0, -0.4);
        createMuscle(cylGeo, 'bicep_r', 3.2, 3.8, 0.2, 0.8, 1.8, 0.7, 0, 0, 0.4);
        createMuscle(cylGeo, 'tricep_l', -3.2, 3.8, -0.3, 0.7, 1.8, 0.6, 0, 0, -0.4);
        createMuscle(cylGeo, 'tricep_r', 3.2, 3.8, -0.3, 0.7, 1.8, 0.6, 0, 0, 0.4);

        // Elbow Joints
        createMuscle(polyGeo, 'elbow_l', -3.8, 2.8, -0.1, 0.6, 0.6, 0.6, 0, 0, -0.4);
        createMuscle(polyGeo, 'elbow_r', 3.8, 2.8, -0.1, 0.6, 0.6, 0.6, 0, 0, 0.4);

        // Forearms
        createMuscle(cylGeo, 'forearm_l', -4.2, 1.8, 0.3, 0.6, 1.8, 0.6, -0.2, 0, -0.3);
        createMuscle(cylGeo, 'forearm_r', 4.2, 1.8, 0.3, 0.6, 1.8, 0.6, -0.2, 0, 0.3);

        // Hands
        createMuscle(polyGeo, 'hand_l', -4.3, 0.8, 0.4, 0.4, 0.7, 0.3, -0.2, 0, -0.3);
        createMuscle(polyGeo, 'hand_r', 4.3, 0.8, 0.4, 0.4, 0.7, 0.3, -0.2, 0, 0.3);

        // 5. Lower Body (Slimmer)
        // Glutes / Pelvis
        createMuscle(polyGeo, 'glute_l', -0.9, 0.5, -0.7, 1.2, 1.3, 0.8, 0.2, 0, 0);
        createMuscle(polyGeo, 'glute_r', 0.9, 0.5, -0.7, 1.2, 1.3, 0.8, 0.2, 0, 0);
        createMuscle(polyGeo, 'pelvis', 0, 0.5, 0.3, 1.6, 1.1, 0.7);

        // Thighs (Quads & Hamstrings)
        createMuscle(cylGeo, 'quad_l', -1.1, -1.8, 0.4, 1.1, 3.5, 1.0, -0.1, 0, 0.05);
        createMuscle(cylGeo, 'quad_r', 1.1, -1.8, 0.4, 1.1, 3.5, 1.0, -0.1, 0, -0.05);
        createMuscle(cylGeo, 'ham_l', -1.1, -1.8, -0.3, 0.9, 3.5, 0.9, 0.1, 0, 0.05);
        createMuscle(cylGeo, 'ham_r', 1.1, -1.8, -0.3, 0.9, 3.5, 0.9, 0.1, 0, -0.05);

        // Knees
        createMuscle(polyGeo, 'knee_l', -1.1, -3.8, 0.5, 0.6, 0.6, 0.5);
        createMuscle(polyGeo, 'knee_r', 1.1, -3.8, 0.5, 0.6, 0.6, 0.5);

        // Calves
        createMuscle(cylGeo, 'calf_l', -1.1, -5.5, -0.2, 0.9, 2.8, 0.9);
        createMuscle(cylGeo, 'calf_r', 1.1, -5.5, -0.2, 0.9, 2.8, 0.9);

        // Shins (Tibialis)
        createMuscle(cylGeo, 'shin_l', -1.1, -5.5, 0.3, 0.5, 2.8, 0.5);
        createMuscle(cylGeo, 'shin_r', 1.1, -5.5, 0.3, 0.5, 2.8, 0.5);

        // Feet
        createMuscle(polyGeo, 'foot_l', -1.1, -7.2, 0.5, 0.7, 0.4, 1.3);
        createMuscle(polyGeo, 'foot_r', 1.1, -7.2, 0.5, 0.7, 0.4, 1.3);

        // Raycasting for Tooltips
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Tooltip element creation
        this.tooltip = document.createElement('div');
        this.tooltip.style.position = 'absolute';
        this.tooltip.style.backgroundColor = 'rgba(17, 24, 39, 0.9)'; // Tailwind gray-900
        this.tooltip.style.color = '#10b981'; // Cyber green
        this.tooltip.style.padding = '8px 12px';
        this.tooltip.style.borderRadius = '4px';
        this.tooltip.style.border = '1px solid #374151'; // Tailwind gray-700
        this.tooltip.style.pointerEvents = 'none';
        this.tooltip.style.display = 'none';
        this.tooltip.style.zIndex = '1000';
        this.tooltip.style.fontFamily = 'monospace';
        this.tooltip.style.fontSize = '12px';
        container.style.position = 'relative'; // Ensure relative positioning for absolute tooltip
        container.appendChild(this.tooltip);

        // Floating UI Label for active group
        this.activeLabel = document.createElement('div');
        this.activeLabel.style.position = 'absolute';
        this.activeLabel.style.color = '#ef4444'; // Red for active
        this.activeLabel.style.padding = '4px 8px';
        this.activeLabel.style.borderLeft = '2px solid #ef4444';
        this.activeLabel.style.pointerEvents = 'none';
        this.activeLabel.style.display = 'none';
        this.activeLabel.style.zIndex = '900';
        this.activeLabel.style.fontFamily = 'monospace';
        this.activeLabel.style.fontSize = '10px';
        this.activeLabel.style.textShadow = '0 0 5px rgba(0,0,0,1)';
        this.activeLabel.innerText = "ACTIVE_MOVER";
        container.appendChild(this.activeLabel);

        // Muscle name dictionary map
        const muscleNames = {
            'head': 'Cranium / Facial Muscles',
            'neck': 'Sternocleidomastoid',
            'traps_l': 'Trapezius (Left)',
            'traps_r': 'Trapezius (Right)',
            'pec_l': 'Pectoralis Major (Left)',
            'pec_r': 'Pectoralis Major (Right)',
            'abs_1l': 'Rectus Abdominis (Upper Left)',
            'abs_1r': 'Rectus Abdominis (Upper Right)',
            'abs_2l': 'Rectus Abdominis (Mid Left)',
            'abs_2r': 'Rectus Abdominis (Mid Right)',
            'abs_3l': 'Rectus Abdominis (Lower Left)',
            'abs_3r': 'Rectus Abdominis (Lower Right)',
            'oblique_l': 'External Oblique (Left)',
            'oblique_r': 'External Oblique (Right)',
            'lat_l': 'Latissimus Dorsi (Left)',
            'lat_r': 'Latissimus Dorsi (Right)',
            'lower_back': 'Erector Spinae / Lumbar',
            'delt_l': 'Deltoid (Left)',
            'delt_r': 'Deltoid (Right)',
            'bicep_l': 'Biceps Brachii (Left)',
            'bicep_r': 'Biceps Brachii (Right)',
            'tricep_l': 'Triceps Brachii (Left)',
            'tricep_r': 'Triceps Brachii (Right)',
            'elbow_l': 'Olecranon / Epicondyle (Left)',
            'elbow_r': 'Olecranon / Epicondyle (Right)',
            'forearm_l': 'Brachioradialis / Flexors (Left)',
            'forearm_r': 'Brachioradialis / Flexors (Right)',
            'hand_l': 'Manus (Left)',
            'hand_r': 'Manus (Right)',
            'glute_l': 'Gluteus Maximus (Left)',
            'glute_r': 'Gluteus Maximus (Right)',
            'pelvis': 'Pelvic Girdle',
            'quad_l': 'Quadriceps Femoris (Left)',
            'quad_r': 'Quadriceps Femoris (Right)',
            'ham_l': 'Biceps Femoris / Hamstrings (Left)',
            'ham_r': 'Biceps Femoris / Hamstrings (Right)',
            'knee_l': 'Patella (Left)',
            'knee_r': 'Patella (Right)',
            'calf_l': 'Gastrocnemius / Soleus (Left)',
            'calf_r': 'Gastrocnemius / Soleus (Right)',
            'shin_l': 'Tibialis Anterior (Left)',
            'shin_r': 'Tibialis Anterior (Right)',
            'foot_l': 'Pes (Left)',
            'foot_r': 'Pes (Right)'
        };

        const onMouseMove = (event) => {
            const rect = container.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Collect all meshes
            const meshes = Object.values(this.bodyParts).map(part => part.mesh);
            const intersects = this.raycaster.intersectObjects(meshes);

            if (intersects.length > 0) {
                const object = intersects[0].object;
                const internalName = object.userData.name;
                const displayName = muscleNames[internalName] || internalName;

                let roleInfo = "";
                let map = this.MovementMap ? (this.MovementMap[this.animState] || this.MovementMap["idle"]) : null;
                if (map) {
                    if (map.primary.includes(internalName)) {
                        roleInfo = "<br><span style='color: #ef4444'>[Primary Mover]</span>";
                    } else if (map.synergists.includes(internalName)) {
                        roleInfo = "<br><span style='color: #06b6d4'>[Synergist/Stabilizer]</span>";
                    }
                }

                this.tooltip.style.display = 'block';
                this.tooltip.innerHTML = `> ${displayName} ${roleInfo}`;

                // Position tooltip near cursor, relative to container
                this.tooltip.style.left = (event.clientX - rect.left + 15) + 'px';
                this.tooltip.style.top = (event.clientY - rect.top + 15) + 'px';
            } else {
                this.tooltip.style.display = 'none';
            }
        };

        container.addEventListener('mousemove', onMouseMove);

        // Animation & Procedural Motion Setup
        this.clock = new THREE.Clock();
        this.time = 0;

        // Setup initial default positions to allow interpolation
        this.basePositions = {};
        Object.keys(this.bodyParts).forEach(key => {
            this.basePositions[key] = {
                pos: this.bodyParts[key].mesh.position.clone(),
                rot: this.bodyParts[key].mesh.rotation.clone(),
                scale: this.bodyParts[key].mesh.scale.clone()
            };
        });

        // Movement-Muscle Map (Biomechanical Dictionary)
        this.MovementMap = {
            "squat": {
                primary: ['quad_l', 'quad_r', 'glute_l', 'glute_r'],
                synergists: ['ham_l', 'ham_r', 'lower_back', 'abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'abs_3l', 'abs_3r'],
                animation: "procedural_squat"
            },
            "press": {
                primary: ['pec_l', 'pec_r', 'tricep_l', 'tricep_r'],
                synergists: ['delt_l', 'delt_r', 'abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'abs_3l', 'abs_3r'],
                animation: "procedural_press"
            },
            "idle": {
                primary: [],
                synergists: [],
                animation: "idle"
            }
        };

        // JSON-based Exercise Recipes for Animation (Relative Offsets)
                this.exerciseRecipes = {
            squat: {
                start: { yDrop: 0.0, bend: 0.0, kneeOut: 0.0 },
                mid:   { yDrop: 2.0, bend: 0.5, kneeOut: 0.4 },
                end:   { yDrop: 0.0, bend: 0.0, kneeOut: 0.0 }
            },
            press: {
                start: { push: 0.0 },
                mid:   { push: 1.0 },
                end:   { push: 0.0 }
            },
            fullbody: {
                start: { yDrop: 0.0, bend: 0.0, push: 0.0 },
                mid:   { yDrop: 1.5, bend: 0.4, push: 0.8 },
                end:   { yDrop: 0.0, bend: 0.0, push: 0.0 }
            }
        };

        // Setup Contact Shadow
        const canvasShadow = document.createElement('canvas');
        canvasShadow.width = 128;
        canvasShadow.height = 128;
        const contextShadow = canvasShadow.getContext('2d');
        const gradient = contextShadow.createRadialGradient(canvasShadow.width / 2, canvasShadow.height / 2, 0, canvasShadow.width / 2, canvasShadow.height / 2, canvasShadow.width / 2);
        gradient.addColorStop(0.1, 'rgba(16,185,129,0.3)'); // Cyber green shadow
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        contextShadow.fillStyle = gradient;
        contextShadow.fillRect(0, 0, canvasShadow.width, canvasShadow.height);

        const shadowTexture = new THREE.CanvasTexture(canvasShadow);
        const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
        const shadowGeo = new THREE.PlaneGeometry(15, 15);
        this.contactShadow = new THREE.Mesh(shadowGeo, shadowMaterial);
        this.contactShadow.rotation.x = -Math.PI / 2;
        this.contactShadow.position.y = -7.9; // Just above grid
        this.scene.add(this.contactShadow);

        // Setup Kinematic Chain (Vector Overlays)
        this.kinematicChainGeo = new THREE.BufferGeometry();
        this.kinematicChainMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2, transparent: true, opacity: 0.8 });
        this.kinematicChainLine = new THREE.Line(this.kinematicChainGeo, this.kinematicChainMat);
        this.scene.add(this.kinematicChainLine);

        // Current and target states for animations
        this.animState = 'idle';
        this.animProgress = 0;

        const animate = () => {
            requestAnimationFrame(animate);
            const delta = this.clock.getDelta();
            this.time += delta;
            this.controls.update();

            // Simple procedural motion (breathing/idle) applied to everything
            const breath = Math.sin(this.time * 2) * 0.05;

            // Procedural IK & Exercise Animation Logic
            this.updateProceduralMotion(delta, breath);

            // Update Floating UI Label
                        if (this.animState !== 'idle' && this.state.schedule) {
                let targetPart = null;
                if (this.animState === 'squat' && this.bodyParts['quad_l']) {
                    targetPart = this.bodyParts['quad_l'].mesh;
                    this.activeLabel.innerText = "QUADRICEPS_FEMORIS [ACTIVE]";
                } else if (this.animState === 'press' && this.bodyParts['pec_l']) {
                    targetPart = this.bodyParts['pec_l'].mesh;
                    this.activeLabel.innerText = "PECTORALIS_MAJOR [ACTIVE]";
                } else if (this.animState === 'fullbody' && this.bodyParts['delt_l']) {
                    targetPart = this.bodyParts['delt_l'].mesh;
                    this.activeLabel.innerText = "FULL_KINETIC_CHAIN [ACTIVE]";
                }

                if (targetPart) {
                    const vector = new THREE.Vector3();
                    // Get world position of the target part
                    targetPart.getWorldPosition(vector);
                    // Project to 2D screen space
                    vector.project(this.camera);

                    const x = (vector.x * .5 + .5) * container.clientWidth;
                    const y = (vector.y * -.5 + .5) * container.clientHeight;

                    this.activeLabel.style.left = `${x + 20}px`;
                    this.activeLabel.style.top = `${y - 20}px`;
                    this.activeLabel.style.display = 'block';
                }
            } else {
                this.activeLabel.style.display = 'none';
            }

            // Update Dynamic Grid and Contact Shadow
            if (this.gridHelper) {
                this.gridHelper.position.z = (this.time * 2) % 1;
            }

            // Update Kinematic Chain Overlay
            if (this.bodyParts['head']) {
                // Draw line through center spine
                const chainPoints = [
                    this.bodyParts['head'].mesh.position.clone(),
                    this.bodyParts['neck'].mesh.position.clone(),
                    this.bodyParts['pec_l'].mesh.position.clone().lerp(this.bodyParts['pec_r'].mesh.position, 0.5), // sternum
                    this.bodyParts['abs_2l'].mesh.position.clone().lerp(this.bodyParts['abs_2r'].mesh.position, 0.5), // navel
                    this.bodyParts['pelvis'].mesh.position.clone()
                ];

                // Add arms to chain if pressing
                if (this.animState === 'press') {
                    chainPoints.push(
                        this.bodyParts['elbow_l'].mesh.position.clone(),
                        this.bodyParts['hand_l'].mesh.position.clone()
                    );
                }
                                // Add legs to chain if squatting
                if (this.animState === 'squat' || this.animState === 'fullbody') {
                    chainPoints.push(
                        this.bodyParts['knee_l'].mesh.position.clone(),
                        this.bodyParts['foot_l'].mesh.position.clone()
                    );
                }

                // Transform local points to world points considering bodyGroup sway
                chainPoints.forEach(p => p.applyMatrix4(this.bodyGroup.matrixWorld));

                this.kinematicChainLine.geometry.setFromPoints(chainPoints);
            }

            // Update Motion Trails (specifically for hands/feet during movement)
            if (this.animState !== 'idle') {
                ['hand_l', 'hand_r', 'foot_l', 'foot_r', 'head'].forEach(p => {
                    if(this.bodyParts[p]) {
                        const part = this.bodyParts[p];
                        part.trailPositions.push(part.mesh.position.clone());
                        if(part.trailPositions.length > part.maxTrailPoints) {
                            part.trailPositions.shift();
                        }
                        if(part.trailPositions.length > 1) {
                            part.trailLine.geometry.setFromPoints(part.trailPositions);
                            part.trailLine.geometry.attributes.position.needsUpdate = true;
                            // Match color to glow color
                            part.trailLine.material.color.copy(part.mesh.material.color);
                            part.trailLine.visible = true;
                        }
                    }
                });
            } else {
                ['hand_l', 'hand_r', 'foot_l', 'foot_r', 'head'].forEach(p => {
                    if(this.bodyParts[p]) {
                        this.bodyParts[p].trailLine.visible = false;
                        this.bodyParts[p].trailPositions = [];
                    }
                });
            }

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

    updateProceduralMotion(delta, breath) {
        // Simple state machine for procedural exercises using interpolated keyframes
        if (!this.bodyParts['head']) return;

        // Apply breathing as base
        this.bodyParts['pec_l'].mesh.position.z = this.basePositions['pec_l'].pos.z + breath;
        this.bodyParts['pec_r'].mesh.position.z = this.basePositions['pec_r'].pos.z + breath;
        this.bodyParts['abs_1l'].mesh.position.z = this.basePositions['abs_1l'].pos.z + breath * 0.5;
        this.bodyParts['abs_1r'].mesh.position.z = this.basePositions['abs_1r'].pos.z + breath * 0.5;

        // Procedural Life: Micro-Sway
        // Apply very slow, low-amplitude noise/rotation to the entire body group
        this.bodyGroup.rotation.y = Math.sin(this.time * 0.5) * 0.05;
        this.bodyGroup.rotation.z = Math.cos(this.time * 0.3) * 0.02;

        // Procedural Life: Breathing Scale
        const breathScale = 1.0 + Math.sin(this.time * 2) * 0.02; // 1.0 to 1.02
        ['pec_l', 'pec_r', 'abs_1l', 'abs_1r'].forEach(p => {
            if(this.bodyParts[p]) {
                this.bodyParts[p].mesh.scale.set(
                    this.basePositions[p].scale.x, // keep orig (actually it's scaled in create, but we're modifying absolute here, wait)
                    // It's safer to read from initial scale. Let's add initial scale to basePositions
                    this.basePositions[p].scale.y * breathScale,
                    this.basePositions[p].scale.z * breathScale
                );
            }
        });

        // Interpolation helper
        const lerp = (start, end, alpha) => start + (end - start) * alpha;

        // Reset all muscles to neutral before applying active state
        Object.keys(this.bodyParts).forEach(key => {
            const part = this.bodyParts[key];
            if (!['pec_l', 'pec_r', 'abs_1l', 'abs_1r'].includes(key)) {
                part.mesh.scale.copy(this.basePositions[key].scale);
            }
            part.mesh.material.color.setHex(0xd2b48c); // Reset to fleshy color
            part.mesh.material.emissive.setHex(0x000000);
        });

        let map = this.MovementMap[this.animState] || this.MovementMap["idle"];
        const pulse = (Math.sin(this.time * 4) + 1) / 2; // 0 to 1 fast pulse

        if (this.animState !== 'idle') {
            // Apply Inflation & Color to Primary Movers
            map.primary.forEach(p => {
                if(this.bodyParts[p]) {
                    const base = this.basePositions[p].scale;
                    // Inflate by 15% + pulse effect
                    const inflate = 1.15 + (pulse * 0.05);
                    this.bodyParts[p].mesh.scale.set(base.x * inflate, base.y * inflate, base.z * inflate);

                    // Fluorescent Red with emissive pulse
                    this.bodyParts[p].mesh.material.color.setHex(0xff3333);
                    this.bodyParts[p].mesh.material.emissive.setHex(0xff0000);
                    this.bodyParts[p].mesh.material.emissiveIntensity = 0.5 + pulse * 0.5;
                }
            });

            // Apply minor inflation & Color to Synergists
            map.synergists.forEach(p => {
                if(this.bodyParts[p]) {
                    const base = this.basePositions[p].scale;
                    const inflate = 1.05 + (pulse * 0.02);
                    this.bodyParts[p].mesh.scale.set(base.x * inflate, base.y * inflate, base.z * inflate);

                    // Fluorescent Cyan for synergists
                    this.bodyParts[p].mesh.material.color.setHex(0x00ffff);
                    this.bodyParts[p].mesh.material.emissive.setHex(0x0088ff);
                    this.bodyParts[p].mesh.material.emissiveIntensity = 0.3 + pulse * 0.3;
                }
            });
        }

        if (this.animState === 'squat') {
            const phase = (Math.sin(this.time * 2.5) + 1) / 2; // 0 to 1 smooth
            const recipe = this.exerciseRecipes.squat;

            // Interpolate values
            const drop = lerp(recipe.start.yDrop, recipe.mid.yDrop, phase);
            const hinge = lerp(recipe.start.bend, recipe.mid.bend, phase);
            const kneeRot = lerp(recipe.start.kneeOut, recipe.mid.kneeOut, phase);

            const torsoParts = ['head','neck','traps_l','traps_r','pec_l','pec_r','abs_1l','abs_1r','abs_2l','abs_2r','abs_3l','abs_3r','oblique_l','oblique_r','lat_l','lat_r','lower_back','pelvis','glute_l','glute_r', 'delt_l', 'delt_r', 'bicep_l', 'bicep_r', 'tricep_l', 'tricep_r', 'elbow_l', 'elbow_r', 'forearm_l', 'forearm_r', 'hand_l', 'hand_r'];

            torsoParts.forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - drop;
                }
            });

            // Bend knees outward and quads down
            ['quad_l', 'ham_l', 'quad_r', 'ham_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - drop * 0.5;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + drop * 0.5;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x - kneeRot;
                }
            });

            ['calf_l', 'shin_l', 'calf_r', 'shin_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + drop * 0.2;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x + drop * 0.2;
                }
            });
            ['knee_l', 'knee_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - drop + 1.0;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + drop;
                }
            });

                } else if (this.animState === 'press') {
            const phase = (Math.sin(this.time * 3) + 1) / 2; // 0 to 1 smooth
            const push = lerp(this.exerciseRecipes.press.start.push, this.exerciseRecipes.press.mid.push, phase);

            // Rotate Deltoids
            ['delt_l', 'delt_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x - push * 0.5;
                }
            });

            // Move Upper Arms (biceps/triceps)
            ['bicep_l', 'tricep_l', 'bicep_r', 'tricep_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x - push * 0.8;
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y + push * 0.5;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + push * 1.5;
                }
            });

            // Move elbows to track upper arm
            ['elbow_l', 'elbow_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y + push * 1.2;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + push * 2.0;
                }
            });

            // Move forearms
            ['forearm_l', 'forearm_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y + push * 2.0;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + push * 2.8;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x + push * 0.5;
                }
            });

            // Move hands (palms keep connectivity to forearms via additive math)
            ['hand_l', 'hand_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y + push * 2.8;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + push * 3.4;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x + push * 0.8;
                }
            });
        } else if (this.animState === 'fullbody') {
            // Thruster = Squat + Overhead Press
            const phase = (Math.sin(this.time * 2.0) + 1) / 2; // 0 to 1 smooth
            const recipe = this.exerciseRecipes.fullbody;
            const drop = lerp(recipe.start.yDrop, recipe.mid.yDrop, phase);
            const push = lerp(recipe.start.push, recipe.mid.push, phase); // Overhead push is inverse of drop usually, but let's do continuous

            // Torso drops for the squat part
            const torsoParts = ['head','neck','traps_l','traps_r','pec_l','pec_r','abs_1l','abs_1r','abs_2l','abs_2r','abs_3l','abs_3r','oblique_l','oblique_r','lat_l','lat_r','lower_back','pelvis','glute_l','glute_r', 'delt_l', 'delt_r'];
            torsoParts.forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - drop;
                }
            });

            // Legs squatting
            ['quad_l', 'ham_l', 'quad_r', 'ham_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - drop * 0.5;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + drop * 0.5;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x - drop * 0.4;
                }
            });
            ['calf_l', 'shin_l', 'calf_r', 'shin_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + drop * 0.2;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x + drop * 0.2;
                }
            });
            ['knee_l', 'knee_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - drop + 1.0;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + drop;
                }
            });

            // Arms: If drop is 0 (standing), push is high. If drop is high (squatting), push is 0.
            // Let's use the phase directly to drive arms up when standing
            // phase 0 = top of rep (arms up). phase 1 = bottom of rep (arms racked on shoulders).
            const overheadPush = (1 - phase) * 2.5;

            ['bicep_l', 'tricep_l', 'bicep_r', 'tricep_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - drop + overheadPush;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x + overheadPush * 0.4;
                }
            });
            ['elbow_l', 'elbow_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - drop + overheadPush * 1.5;
                }
            });
            ['forearm_l', 'forearm_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - drop + overheadPush * 1.8;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x + overheadPush * 0.5;
                }
            });
            ['hand_l', 'hand_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - drop + overheadPush * 2.2;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x - overheadPush * 0.2; // Point palms up
                }
            });

        } else if (this.animState === 'deadlift') {
            const phase = (Math.sin(this.time * 2.0) + 1) / 2; // 0 to 1 smooth

            // Hinge at the hips
            const hinge = phase * 1.5; // Max hinge
            const kneeBend = phase * 0.5; // Slight knee bend

            // Torso hinges forward
            const torsoParts = ['head','neck','traps_l','traps_r','pec_l','pec_r','abs_1l','abs_1r','abs_2l','abs_2r','abs_3l','abs_3r','oblique_l','oblique_r','lat_l','lat_r','lower_back','delt_l', 'delt_r'];
            torsoParts.forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - hinge * 0.8;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + hinge * 1.2;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x + hinge * 0.5;
                }
            });

            // Pelvis and glutes hinge but stay anchored relatively
            ['pelvis','glute_l','glute_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z - hinge * 0.5; // push hips back
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x + hinge * 0.2;
                }
            });

            // Arms hang straight down from the hinged shoulders
            ['bicep_l', 'tricep_l', 'bicep_r', 'tricep_r', 'elbow_l', 'elbow_r', 'forearm_l', 'forearm_r', 'hand_l', 'hand_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - hinge * 1.5;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + hinge * 1.0;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x; // Hang straight down, no rotation
                }
            });

            // Legs slight bend
            ['quad_l', 'ham_l', 'quad_r', 'ham_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - kneeBend * 0.5;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + kneeBend * 0.2;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x - kneeBend * 0.2;
                }
            });
            ['knee_l', 'knee_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - kneeBend;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + kneeBend * 0.5;
                }
            });

        } else {
            // Reset to base positions
            Object.keys(this.bodyParts).forEach(p => {
                if(!['pec_l','pec_r','abs_1l','abs_1r'].includes(p)) {
                    this.bodyParts[p].mesh.position.copy(this.basePositions[p].pos);
                }
                this.bodyParts[p].mesh.rotation.copy(this.basePositions[p].rot);
            });
        }
    },


    playDictionaryExercise() {
        if (!this.state.webglInitialized) this.initWebGL();

        const dictSelect = document.getElementById('vis-dict-select');
        const exType = dictSelect.value;
        if (!exType) return;

        // Reset the phase selector so they don't visually conflict
        document.getElementById('vis-day-select').value = "";

        // Reset all colors
        Object.keys(this.bodyParts).forEach(p => {
             this.bodyParts[p].mesh.material.color.setHex(0xd2b48c);
             this.bodyParts[p].mesh.material.emissive.setHex(0x000000);
        });

        // Set the animation state
        this.animState = exType;

        // Set up the details panel manually
        document.getElementById('vis-details').style.display = 'block';

        let desc = "";
        let equipment = "";

        if (exType === 'squat') {
            desc = "ISOLATING: Lower Body Mechanics | INTENSITY: High";
            equipment = "<li><strong>Primary:</strong> Barbell Back Squat (Targets Quads/Glutes)</li>";

            // Highlight
            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['quad_l', 'quad_r', 'glute_l', 'glute_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
            ['ham_l', 'ham_r', 'calf_l', 'calf_r', 'lower_back', 'abs_1l', 'abs_1r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.mod));

        } else if (exType === 'press') {
            desc = "ISOLATING: Upper Body Push | INTENSITY: Moderate";
            equipment = "<li><strong>Primary:</strong> Bench Press / Push-ups (Targets Pecs/Triceps/Front Delts)</li>";

            // Highlight
            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['pec_l', 'pec_r', 'tricep_l', 'tricep_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
            ['delt_l', 'delt_r', 'abs_1l', 'abs_1r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.mod));

        } else if (exType === 'fullbody') {
            desc = "ISOLATING: Full Kinetic Chain | INTENSITY: High";
            equipment = "<li><strong>Primary:</strong> Barbell Thrusters / Clean and Press (Full Chain Engagement)</li>";

            // Highlight
            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['quad_l', 'quad_r', 'glute_l', 'glute_r', 'delt_l', 'delt_r', 'pec_l', 'pec_r', 'tricep_l', 'tricep_r', 'lower_back', 'abs_1l', 'abs_1r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
        } else if (exType === 'deadlift') {
            desc = "ISOLATING: Posterior Chain | INTENSITY: High";
            equipment = "<li><strong>Primary:</strong> Barbell Deadlift (Glutes, Hamstrings, Erector Spinae)</li>";

            // Highlight
            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['glute_l', 'glute_r', 'ham_l', 'ham_r', 'lower_back', 'traps_l', 'traps_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
            ['quad_l', 'quad_r', 'lat_l', 'lat_r', 'abs_1l', 'abs_1r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.mod));
        }

        document.getElementById('vis-desc').innerText = desc;
        document.getElementById('vis-equipment').innerHTML = equipment;
    },

    updateWebGLVisualizer() {

        if (!this.state.schedule || !this.state.webglInitialized) return;

        const select = document.getElementById('vis-day-select');
        const dayIndex = select.value;
        document.getElementById('vis-dict-select').value = '';
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
                if (stateName === 'base') {
                     this.bodyParts[part].mesh.material.color.setHex(0xd2b48c);
                     this.bodyParts[part].mesh.material.emissive.setHex(0x000000);
                } else {
                     this.bodyParts[part].mesh.material.color.setHex(c.fill);
                     this.bodyParts[part].mesh.material.emissive.setHex(c.fill);
                     this.bodyParts[part].mesh.material.emissiveIntensity = 0.5;
                }
            }
        };

        // Muscle Groupings for Highlighting
        const upperFront = ['pec_l', 'pec_r', 'abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'abs_3l', 'abs_3r', 'oblique_l', 'oblique_r'];
        const upperBack = ['traps_l', 'traps_r', 'lat_l', 'lat_r', 'lower_back'];
        const shoulders = ['delt_l', 'delt_r'];
        const arms = ['bicep_l', 'bicep_r', 'tricep_l', 'tricep_r', 'forearm_l', 'forearm_r'];
        const lowerFront = ['quad_l', 'quad_r', 'shin_l', 'shin_r'];
        const lowerBack = ['glute_l', 'glute_r', 'ham_l', 'ham_r', 'calf_l', 'calf_r'];
        const joints = ['knee_l', 'knee_r', 'pelvis'];

        const allMuscles = Object.keys(this.bodyParts).filter(k => k !== 'head' && k !== 'neck' && k !== 'hand_l' && k !== 'hand_r' && k !== 'foot_l' && k !== 'foot_r');

        // Reset all to base
        Object.keys(this.bodyParts).forEach(p => setPartColor(p, 'base'));

        // Highlight compromises if requested (Interactive Integration)
        if (this.state.biometrics && this.state.biometrics.injury) {
            const comp = this.state.biometrics.injury;
            if (comp === 'knee') {
                setPartColor('knee_l', 'high');
                setPartColor('knee_r', 'high');
            } else if (comp === 'shoulder') {
                setPartColor('delt_l', 'high');
                setPartColor('delt_r', 'high');
            } else if (comp === 'lower_back') {
                setPartColor('lower_back', 'high');
            }
        }

        let equipmentHTML = "";

        // Setup state variables based on exercise to trigger procedural motion in animate loop
        this.animState = 'idle';

        // Apply specific highlighting logic mapped to detailed muscle groups
        if (day.phase === 'Recovery') {
            this.animState = 'idle';
            allMuscles.forEach(p => setPartColor(p, 'rec'));
            equipmentHTML = `
                <li><strong>Modality:</strong> Foam Roller / Massage Gun</li>
                <li><strong>Protocol:</strong> Static stretching, parasympathetic breathing (CNS Downregulation).</li>
            `;
        } else if (day.focus.includes('Lower Body')) {
            this.animState = 'squat';
            const state = day.intensity === 'High' ? 'high' : 'mod';
            lowerFront.forEach(p => setPartColor(p, state));
            lowerBack.forEach(p => setPartColor(p, state));
            joints.forEach(p => setPartColor(p, 'mod')); // Joints take moderate load
            upperFront.forEach(p => setPartColor(p, 'rec'));
            upperBack.forEach(p => setPartColor(p, 'rec'));
            equipmentHTML = `
                <li><strong>Primary:</strong> STAR TRAC™ Inspiration Leg Press / Hack Squat (Targets Quads/Glutes)</li>
                <li><strong>Secondary:</strong> STAR TRAC™ Instinct Leg Extension / Curl (Isolates Quads/Hamstrings)</li>
                <li><strong>Alternative:</strong> Dumbbell Bulgarian Split Squats</li>
            `;
                } else if (day.focus.includes('Upper Body')) {
            this.animState = 'press';
            const state = day.intensity === 'High' ? 'high' : 'mod';
            upperFront.forEach(p => setPartColor(p, state));
            upperBack.forEach(p => setPartColor(p, state));
            shoulders.forEach(p => setPartColor(p, state));
            arms.forEach(p => setPartColor(p, state));
            lowerFront.forEach(p => setPartColor(p, 'rec'));
            lowerBack.forEach(p => setPartColor(p, 'rec'));
            equipmentHTML = `
                <li><strong>Primary:</strong> STAR TRAC™ Inspiration Chest Press (Pecs/Delts) / Lat Pulldown (Lats/Biceps)</li>
                <li><strong>Secondary:</strong> Dual Adjustable Pulley Cable Crossovers</li>
            `;
        } else if (day.focus.includes('Full Body Strength')) {
            this.animState = 'fullbody';
            const state = day.intensity === 'High' ? 'high' : 'mod';
            upperFront.forEach(p => setPartColor(p, state));
            upperBack.forEach(p => setPartColor(p, state));
            shoulders.forEach(p => setPartColor(p, state));
            arms.forEach(p => setPartColor(p, state));
            lowerFront.forEach(p => setPartColor(p, state));
            lowerBack.forEach(p => setPartColor(p, state));
            joints.forEach(p => setPartColor(p, 'mod'));
            equipmentHTML = `
                <li><strong>Primary:</strong> Barbell Thrusters / Clean and Press (Full Chain Engagement)</li>
                <li><strong>Secondary:</strong> Hex Bar Deadlifts (Glutes/Hamstrings/Core/Traps)</li>
                <li><strong>Alternative:</strong> STAR TRAC™ Max Rack Multi-Joint Compound Movements</li>
            `;
        } else if (day.focus.includes('Jump Rope')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            lowerBack.forEach(p => setPartColor(p, state)); // Calves highly active
            lowerFront.forEach(p => setPartColor(p, 'mod')); // Quads synergists
            shoulders.forEach(p => setPartColor(p, 'mod')); // Delts stabilize
            arms.forEach(p => setPartColor(p, 'mod')); // Forearms twirl
            equipmentHTML = `
                <li><strong>Primary:</strong> Speed Rope / Jump Rope Intervals</li>
                <li><strong>Metabolic Engine:</strong> Anaerobic / Aerobic Hybrid System</li>
                <li><strong>Muscle Focus:</strong> High recruitment of Gastrocnemius (Calves) and Soleus.</li>
            `;
        } else if (day.focus.includes('Boxing')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            upperFront.forEach(p => setPartColor(p, 'mod')); // Core twist
            shoulders.forEach(p => setPartColor(p, state)); // Delts fatigue fast
            arms.forEach(p => setPartColor(p, state)); // Triceps for extension
            lowerFront.forEach(p => setPartColor(p, 'mod')); // Leg drive
            equipmentHTML = `
                <li><strong>Primary:</strong> Heavy Bag (Boxing Flow / Sprints)</li>
                <li><strong>Metabolic Engine:</strong> Anaerobic Glycolysis System</li>
                <li><strong>Muscle Focus:</strong> Anterior Deltoids, Triceps Brachii, Obliques for rotational power.</li>
            `;
        } else if (day.focus.includes('Calisthenics')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            upperBack.forEach(p => setPartColor(p, state)); // Lats for pullups
            arms.forEach(p => setPartColor(p, state)); // Biceps and Triceps for dips/pullups
            upperFront.forEach(p => setPartColor(p, 'mod')); // Pecs for dips, abs for stability
            equipmentHTML = `
                <li><strong>Primary:</strong> Gymnastic Rings / Pull-up Bar</li>
                <li><strong>Focus:</strong> Relative bodyweight mastery, scapular control, and structural leverage.</li>
                <li><strong>Muscle Focus:</strong> Latissimus Dorsi, Biceps Brachii, Pectoralis Major, Core.</li>
            `;
        } else if (day.focus.includes('Core / Gymnastic Rings')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            ['abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'abs_3l', 'abs_3r', 'oblique_l', 'oblique_r'].forEach(p => setPartColor(p, state)); // Intense core
            upperBack.forEach(p => setPartColor(p, 'mod')); // Stabilization
            shoulders.forEach(p => setPartColor(p, 'mod')); // Stabilization
            equipmentHTML = `
                <li><strong>Primary:</strong> Gymnastic Rings / Floor Mat</li>
                <li><strong>Focus:</strong> Anti-extension, anti-rotation, and isometric holds (L-Sits, Planks).</li>
                <li><strong>Muscle Focus:</strong> Rectus Abdominis, Transverse Abdominis, Obliques.</li>
            `;
        } else if (day.focus.includes('Maximal Output')) {
            this.animState = 'squat'; // Represent heavy lifts with squat for now
            const state = day.intensity === 'High' ? 'high' : 'mod';
            lowerBack.forEach(p => setPartColor(p, state)); // Glutes/Hams for Deadlift
            lowerFront.forEach(p => setPartColor(p, state)); // Quads for Squat
            upperBack.forEach(p => setPartColor(p, state)); // Back for Deadlift
            upperFront.forEach(p => setPartColor(p, 'mod')); // Pecs for Bench
            arms.forEach(p => setPartColor(p, 'mod')); // Arms for support
            shoulders.forEach(p => setPartColor(p, 'mod')); // Shoulders for Bench
            equipmentHTML = `
                <li><strong>Primary:</strong> Olympic Barbell, Squat Rack, Platform</li>
                <li><strong>Focus:</strong> Maximal central nervous system (CNS) recruitment. 1RM-3RM loads.</li>
                <li><strong>Muscle Focus:</strong> Entire kinetic chain (Glutes, Quads, Erector Spinae, Pectoralis).</li>
            `;
        } else if (day.focus.includes('Powerlifting Accessory')) {
            const state = day.intensity === 'High' ? 'high' : 'mod';
            upperBack.forEach(p => setPartColor(p, state));
            arms.forEach(p => setPartColor(p, state));
            shoulders.forEach(p => setPartColor(p, state));
            lowerBack.forEach(p => setPartColor(p, 'mod')); // Hamstrings
            equipmentHTML = `
                <li><strong>Primary:</strong> Dumbbells / Cable Machines</li>
                <li><strong>Focus:</strong> Isolating weak links in the main lifts (e.g., triceps for bench, hamstrings for deadlift).</li>
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
};

// Start app on load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
