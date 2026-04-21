/**
 * Anatomica OS Core Application Logic
 */

window.app = {
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
    }
};
