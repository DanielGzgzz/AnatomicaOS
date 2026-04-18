window.app = window.app || {};
Object.assign(window.app, {
    initWebGL() {
        this.clock = new THREE.Clock();
        this.time = 0;
        this.MovementMap = {
            idle: { primary: [], synergists: [] },
            squat: { primary: ['quads', 'glutes'], synergists: ['hamstrings', 'calves', 'core'] },
            bench: { primary: ['chest', 'frontDelts'], synergists: ['triceps'] },
            deadlift: { primary: ['hamstrings', 'glutes', 'lowerBack'], synergists: ['quads', 'lats', 'traps'] },
            pullup: { primary: ['lats', 'biceps'], synergists: ['rearDelts', 'forearms'] },
            lunge: { primary: ['quads', 'glutes'], synergists: ['hamstrings', 'calves'] },
            plank: { primary: ['core'], synergists: ['shoulders', 'chest'] },
            press: { primary: ['frontDelts', 'triceps'], synergists: ['upperChest', 'core'] },
            row: { primary: ['lats', 'rhomboids'], synergists: ['biceps', 'rearDelts'] },
            curl: { primary: ['biceps'], synergists: ['forearms'] },
            crunch: { primary: ['core'], synergists: [] },
            calf_raise: { primary: ['calves'], synergists: [] },
            leg_extension: { primary: ['quads'], synergists: [] }
        };
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

        // --- 6. Equipment Geometries ---
        // Distinct dark iron color to stand out as requested
        const ironMat = new THREE.MeshPhongMaterial({ color: 0x111111, emissive: 0x050505, shininess: 80, specular: 0x888888 });

        // Barbell (used in squat, deadlift, press, thruster, row, overhead_press)
        const barGeo = new THREE.CylinderGeometry(0.1, 0.1, 14, 8);
        const plateGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.4, 16);
        this.barbell = new THREE.Group();
        const barMesh = new THREE.Mesh(barGeo, ironMat);
        barMesh.rotation.z = Math.PI / 2; // Horizontal
        this.barbell.add(barMesh);
        const plateL = new THREE.Mesh(plateGeo, ironMat);
        plateL.rotation.z = Math.PI / 2;
        plateL.position.x = -6.0;
        this.barbell.add(plateL);
        const plateR = new THREE.Mesh(plateGeo, ironMat);
        plateR.rotation.z = Math.PI / 2;
        plateR.position.x = 6.0;
        this.barbell.add(plateR);
        this.scene.add(this.barbell); // Add to scene to avoid body rotation issues

        // Dumbbells (used in lunge, curl)
        const dbBarGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
        const dbPlateGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
        const createDumbbell = () => {
            const db = new THREE.Group();
            const bar = new THREE.Mesh(dbBarGeo, ironMat);
            bar.rotation.x = Math.PI / 2; // Point forward/back based on grip
            db.add(bar);
            const p1 = new THREE.Mesh(dbPlateGeo, ironMat);
            p1.rotation.x = Math.PI / 2;
            p1.position.z = -0.8;
            db.add(p1);
            const p2 = new THREE.Mesh(dbPlateGeo, ironMat);
            p2.rotation.x = Math.PI / 2;
            p2.position.z = 0.8;
            db.add(p2);
            return db;
        };
        this.dbL = createDumbbell();
        this.dbR = createDumbbell();
        this.scene.add(this.dbL);
        this.scene.add(this.dbR);

        // Pull-up Bar (Static)
        const pullupBarGeo = new THREE.CylinderGeometry(0.15, 0.15, 16, 8);
        this.pullupBar = new THREE.Mesh(pullupBarGeo, ironMat);
        this.pullupBar.rotation.z = Math.PI / 2;
        this.pullupBar.position.y = 8.0;
        this.pullupBar.position.z = 1.0;
        this.scene.add(this.pullupBar);

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
        // State object to hold smoothed values for interpolated transitions
        this.jointStates = {
            torsoDrop: 0,
            torsoHinge: 0,
            shoulderFlexion: 0,
            elbowFlexion: 0,
            hipFlexionL: 0, kneeFlexionL: 0,
            hipFlexionR: 0, kneeFlexionR: 0,
            groupRotX: 0, groupPosY: 0, groupPosZ: 0,
            wristBend: 0, forearmTwist: 0,
            neckExtension: 0,
            shoulderAbduction: 0 // New joint values for hands
        };

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
                        "fullbody": {
                primary: ['quad_l', 'quad_r', 'glute_l', 'glute_r', 'delt_l', 'delt_r', 'pec_l', 'pec_r', 'tricep_l', 'tricep_r', 'lower_back', 'abs_1l', 'abs_1r'],
                synergists: ['ham_l', 'ham_r', 'calf_l', 'calf_r', 'traps_l', 'traps_r'],
                animation: "fullbody"
            },
            "deadlift": {
                primary: ['glute_l', 'glute_r', 'ham_l', 'ham_r', 'lower_back', 'traps_l', 'traps_r'],
                synergists: ['quad_l', 'quad_r', 'lat_l', 'lat_r', 'abs_1l', 'abs_1r'],
                animation: "deadlift"
            },
            "pullup": {
                primary: ['lat_l', 'lat_r', 'bicep_l', 'bicep_r'],
                synergists: ['traps_l', 'traps_r', 'abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'forearm_l', 'forearm_r'],
                animation: "pullup"
            },
            "lunge": {
                primary: ['quad_l', 'quad_r', 'glute_l', 'glute_r'],
                synergists: ['ham_l', 'ham_r', 'calf_l', 'calf_r', 'abs_1l', 'abs_1r', 'abs_2l', 'abs_2r'],
                animation: "lunge"
            },
            "plank": {
                primary: ['abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'abs_3l', 'abs_3r'],
                synergists: ['delt_l', 'delt_r', 'pec_l', 'pec_r', 'quad_l', 'quad_r', 'glute_l', 'glute_r'],
                animation: "plank"
            },
            "overhead_press": {
                primary: ['delt_l', 'delt_r', 'tricep_l', 'tricep_r'],
                synergists: ['traps_l', 'traps_r', 'pec_l', 'pec_r', 'abs_1l', 'abs_1r', 'abs_2l', 'abs_2r'],
                animation: "overhead_press"
            },
            "row": {
                primary: ['lat_l', 'lat_r', 'traps_l', 'traps_r'],
                synergists: ['bicep_l', 'bicep_r', 'lower_back', 'ham_l', 'ham_r', 'glute_l', 'glute_r'],
                animation: "row"
            },
            "curl": {
                primary: ['bicep_l', 'bicep_r'],
                synergists: ['forearm_l', 'forearm_r', 'delt_l', 'delt_r'],
                animation: "curl"
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
        if (this.animState !== 'idle') {
            let targetPart = null;
            let activeName = "ACTIVE_MOVER";

            if (this.animState === 'squat' && this.bodyParts['quad_l']) {
                targetPart = this.bodyParts['quad_l'].mesh;
                activeName = "QUADRICEPS_FEMORIS [ACTIVE]";
            } else if (this.animState === 'press' && this.bodyParts['pec_l']) {
                targetPart = this.bodyParts['pec_l'].mesh;
                activeName = "PECTORALIS_MAJOR [ACTIVE]";
            } else if (this.animState === 'fullbody' && this.bodyParts['delt_l']) {
                targetPart = this.bodyParts['delt_l'].mesh;
                activeName = "FULL_KINETIC_CHAIN [ACTIVE]";
            } else if (this.animState === 'deadlift' && this.bodyParts['glute_l']) {
                targetPart = this.bodyParts['glute_l'].mesh;
                activeName = "POSTERIOR_CHAIN [ACTIVE]";
            } else if (this.animState === 'pullup' && this.bodyParts['lat_l']) {
                targetPart = this.bodyParts['lat_l'].mesh;
                activeName = "LATISSIMUS_DORSI [ACTIVE]";
            } else if (this.animState === 'lunge' && this.bodyParts['quad_l']) {
                targetPart = this.bodyParts['quad_l'].mesh;
                activeName = "QUADRICEPS_FEMORIS [ACTIVE]";
            } else if (this.animState === 'plank' && this.bodyParts['abs_1l']) {
                targetPart = this.bodyParts['abs_1l'].mesh;
                activeName = "CORE_STABILIZATION [ACTIVE]";
            } else if (this.animState === 'overhead_press' && this.bodyParts['delt_l']) {
                targetPart = this.bodyParts['delt_l'].mesh;
                activeName = "DELTOIDS [ACTIVE]";
            } else if (this.animState === 'row' && this.bodyParts['lat_l']) {
                targetPart = this.bodyParts['lat_l'].mesh;
                activeName = "LATISSIMUS_DORSI [ACTIVE]";
            } else if (this.animState === 'curl' && this.bodyParts['bicep_l']) {
                targetPart = this.bodyParts['bicep_l'].mesh;
                activeName = "BICEPS_BRACHII [ACTIVE]";
            }

            if (targetPart) {
                this.activeLabel.innerText = activeName;
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
                            part.trailLine.material.opacity = 0.8;
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
        if (!this.bodyParts['head']) return;

        // --- 1. Procedural Life & Micro-Sway ---
        // Scale sway by state. Less sway when under tension (active)
        const swayAmp = this.animState === 'idle' ? 0.05 : 0.01;
        this.bodyGroup.rotation.y = Math.sin(this.time * 0.5) * swayAmp;
        this.bodyGroup.rotation.z = Math.cos(this.time * 0.3) * (swayAmp * 0.5);

        const breathScale = 1.0 + Math.sin(this.time * 2) * 0.02;
        ['pec_l', 'pec_r', 'abs_1l', 'abs_1r'].forEach(p => {
            if(this.bodyParts[p]) {
                this.bodyParts[p].mesh.scale.set(
                    this.basePositions[p].scale.x,
                    this.basePositions[p].scale.y * breathScale,
                    this.basePositions[p].scale.z * breathScale
                );
            }
        });

        // --- 2. Neutral Reset ---
        // EVERYTHING must be strictly reset to its base position before applying the IK math,
        // otherwise rotations and translations from a previous exercise (e.g. deadlift hinge) will compound into warped meshes like the abs flying off.
        Object.keys(this.bodyParts).forEach(key => {
            const part = this.bodyParts[key];
            part.mesh.scale.copy(this.basePositions[key].scale);
            part.mesh.position.copy(this.basePositions[key].pos);
            part.mesh.rotation.copy(this.basePositions[key].rot);

            part.mesh.material.color.setHex(0xd2b48c); // Fleshy reset
            part.mesh.material.emissive.setHex(0x000000);
        });

        // Only apply breathing translations *after* the strict reset
        // To preserve breathing safely, we just modify the base Z mathematically without skipping the reset.
        this.bodyParts['pec_l'].mesh.position.z += breath;
        this.bodyParts['pec_r'].mesh.position.z += breath;
        this.bodyParts['abs_1l'].mesh.position.z += breath * 0.5;
        this.bodyParts['abs_1r'].mesh.position.z += breath * 0.5;

        // --- 3. Dynamic Illumination & Pulsing ---
        let map = this.MovementMap[this.animState] || this.MovementMap["idle"];
        const pulse = (Math.sin(this.time * 4) + 1) / 2; // 0 to 1 fast pulse

        if (this.animState !== 'idle') {
            map.primary.forEach(p => {
                if(this.bodyParts[p]) {
                    const base = this.basePositions[p].scale;
                    const inflate = 1.15 + (pulse * 0.05);
                    this.bodyParts[p].mesh.scale.set(base.x * inflate, base.y * inflate, base.z * inflate);
                    this.bodyParts[p].mesh.material.color.setHex(0xff3333);
                    this.bodyParts[p].mesh.material.emissive.setHex(0xff0000);
                    this.bodyParts[p].mesh.material.emissiveIntensity = 0.5 + pulse * 0.5;
                }
            });
            map.synergists.forEach(p => {
                if(this.bodyParts[p]) {
                    const base = this.basePositions[p].scale;
                    const inflate = 1.05 + (pulse * 0.02);
                    this.bodyParts[p].mesh.scale.set(base.x * inflate, base.y * inflate, base.z * inflate);
                    this.bodyParts[p].mesh.material.color.setHex(0x00ffff);
                    this.bodyParts[p].mesh.material.emissive.setHex(0x0088ff);
                    this.bodyParts[p].mesh.material.emissiveIntensity = 0.3 + pulse * 0.3;
                }
            });
        }

        // --- 4. Kinematic Drivers ---
        // We define phase (0 to 1) for the current motion
        const lerp = (start, end, alpha) => start + (end - start) * alpha;
        let phase = (Math.sin(this.time * 2.5) + 1) / 2;

        // Core variables driven by animation state
        let t = {
            torsoDrop: 0,
            torsoHinge: 0,
            shoulderFlexion: 0,
            elbowFlexion: 0,
            hipFlexionL: 0,
            kneeFlexionL: 0,
            hipFlexionR: 0,
            kneeFlexionR: 0,
            groupRotX: 0,
            groupPosY: 0,
            groupPosZ: 0,
            wristBend: 0,
            forearmTwist: 0,
            neckExtension: 0,
            shoulderAbduction: 0
        };

        let orientation = 'vertical'; // vertical (up/down) or horizontal (push/pull) or static

        // Exercise specific overrides
        if (this.animState === 'press') {
             t.groupRotX = -Math.PI / 2;
             t.groupPosY = -3.0;
             t.groupPosZ = 3.0;
        } else if (this.animState === 'plank') {
             t.groupRotX = Math.PI / 2;
             const tremor = Math.sin(this.time * 8) * 0.05;
             t.groupPosY = -2.5 + tremor;
        } else {
             t.groupRotX = 0;
             t.groupPosY = 0;
             t.groupPosZ = 0;
        }

        if (this.animState === 'squat') {
            phase = (Math.sin(this.time * 2.5) + 1) / 2;
            t.torsoDrop = phase * 2.0;
            t.hipFlexionL = t.hipFlexionR = phase * 0.8;
            t.kneeFlexionL = t.kneeFlexionR = phase * 1.0;
            t.shoulderFlexion = -Math.PI/2 - 0.2; // Reach back behind neck
            t.elbowFlexion = Math.PI/2 + 0.2; // Bend tightly to hold bar
            t.shoulderAbduction = 0.5; // Flare elbows
            t.neckExtension = phase * 0.5;

        } else if (this.animState === 'press') {
            orientation = 'horizontal';
            phase = (Math.sin(this.time * 3) + 1) / 2;
            // Since character lies on back (RotX = -90), arms pushing "up" towards ceiling is negative rotation!
            t.shoulderFlexion = -phase * 1.5;
            t.elbowFlexion = phase * 1.5; // Extend arm (negative bends in, positive extends relative to negative shoulder)
            t.shoulderAbduction = 1.0 - (phase * 0.5); // Wide elbows at bottom
        } else if (this.animState === 'fullbody') {
            phase = (Math.sin(this.time * 2.0) + 1) / 2;
            t.torsoDrop = phase * 2.0;
            t.hipFlexionL = t.hipFlexionR = phase * 0.8;
            t.kneeFlexionL = t.kneeFlexionR = phase * 1.0;

            // Thruster: arms up when drop is 0
            t.shoulderFlexion = (1 - phase) * -2.8;
            t.elbowFlexion = phase * 1.5; // Bend elbows at the bottom of the squat!
            t.shoulderAbduction = phase * 0.5;
        } else if (this.animState === 'deadlift') {
            phase = (Math.sin(this.time * 2.5) + 1) / 2;
            t.torsoHinge = phase * 1.2; // Hinge forward
            t.hipFlexionL = t.hipFlexionR = phase * 1.2; // hinge requires massive hip flexion
            t.kneeFlexionL = t.kneeFlexionR = phase * 0.2; // straightish legs
            t.shoulderFlexion = -t.torsoHinge; // Arms hang straight down (counter-rotate)
        } else if (this.animState === 'pullup') {
            phase = (Math.sin(this.time * 2.5) + 1) / 2;
            t.torsoDrop = phase * -4.5; // Massive pull UP range
            t.shoulderFlexion = 2.5 - phase * 2.5; // Arms go from overhead (+2.5) down to sides (0)
            t.shoulderAbduction = 1.5; // Wide lat flare!
            t.elbowFlexion = phase * 2.5; // Huge bend
            t.hipFlexionL = t.hipFlexionR = 0.2; // Legs slightly forward
            t.kneeFlexionL = t.kneeFlexionR = 0.5; // Knees bent
        } else if (this.animState === 'lunge') {
            phase = (Math.sin(this.time * 2.5) + 1) / 2;
            t.torsoDrop = phase * 1.8;
            // Lunge involves asymmetric legs - one bends, the other trails
            t.hipFlexionL = phase * 1.2;
            t.kneeFlexionL = phase * 1.8;
            t.hipFlexionR = phase * -0.2; // Extend back
            t.kneeFlexionR = phase * 1.2;
        } else if (this.animState === 'plank') {
            orientation = 'horizontal';
            t.torsoHinge = 0; // Flat, rely on groupRotX
            t.torsoDrop = 0; // Group Y handles ground drop
            t.shoulderFlexion = -Math.PI / 2; // Arms straight down to support body
            t.elbowFlexion = -Math.PI / 2; // Bend elbows for forearm plank
            t.shoulderAbduction = 0.2; // Slight flare
        } else if (this.animState === 'overhead_press') {
            phase = (Math.sin(this.time * 3) + 1) / 2;
            t.shoulderFlexion = -1.0 - phase * 1.8; // Start at shoulders, press straight UP (-2.8)
            t.shoulderAbduction = 0.8 - phase * 0.4; // Elbows out at bottom
            t.elbowFlexion = 1.8 - phase * 1.8; // Bend elbows deep at bottom, straighten at top
        } else if (this.animState === 'row') {
            orientation = 'horizontal';
            phase = (Math.sin(this.time * 3) + 1) / 2;
            t.torsoHinge = 1.0; // Static hinge
            t.hipFlexionL = t.hipFlexionR = 0.2;
            t.kneeFlexionL = t.kneeFlexionR = 0.2;
            t.neckExtension = -0.5; // Look up slightly
            t.shoulderFlexion = 0.5 - phase * 1.5; // Arms hang down, pull UP (negative)
            t.shoulderAbduction = 0.8; // Flare elbows for rows
            t.elbowFlexion = phase * 1.8; // Bend elbows
        } else if (this.animState === 'curl') {
            phase = (Math.sin(this.time * 3) + 1) / 2;
            t.shoulderFlexion = -0.2; // Slight forward tilt
            t.shoulderAbduction = 0.1;
            t.elbowFlexion = -phase * 2.2; // Curl forearm UP and FORWARD
        }

        // --- 4.2 LERP Engine (Smooth transitions across exercise changes) ---
        // Lerp factor (higher is faster snap, lower is sluggish). Use delta time for framerate independence.
        // We use a high rate so normal motion tracks fast, but changing exercises takes a half second visually.
        const lerpSpeed = Math.min(1.0, 5.0 * delta);

        this.jointStates.torsoDrop = lerp(this.jointStates.torsoDrop, t.torsoDrop, lerpSpeed);
        this.jointStates.torsoHinge = lerp(this.jointStates.torsoHinge, t.torsoHinge, lerpSpeed);
        this.jointStates.shoulderFlexion = lerp(this.jointStates.shoulderFlexion, t.shoulderFlexion, lerpSpeed);
        this.jointStates.elbowFlexion = lerp(this.jointStates.elbowFlexion, t.elbowFlexion, lerpSpeed);
        this.jointStates.hipFlexionL = lerp(this.jointStates.hipFlexionL, t.hipFlexionL, lerpSpeed);
        this.jointStates.kneeFlexionL = lerp(this.jointStates.kneeFlexionL, t.kneeFlexionL, lerpSpeed);
        this.jointStates.hipFlexionR = lerp(this.jointStates.hipFlexionR, t.hipFlexionR, lerpSpeed);
        this.jointStates.kneeFlexionR = lerp(this.jointStates.kneeFlexionR, t.kneeFlexionR, lerpSpeed);
        this.jointStates.groupRotX = lerp(this.jointStates.groupRotX, t.groupRotX, lerpSpeed);
        this.jointStates.groupPosY = lerp(this.jointStates.groupPosY, t.groupPosY, lerpSpeed);
        this.jointStates.groupPosZ = lerp(this.jointStates.groupPosZ, t.groupPosZ, lerpSpeed);
        this.jointStates.wristBend = lerp(this.jointStates.wristBend, t.wristBend, lerpSpeed);
        this.jointStates.forearmTwist = lerp(this.jointStates.forearmTwist, t.forearmTwist, lerpSpeed);
        this.jointStates.neckExtension = lerp(this.jointStates.neckExtension || 0, t.neckExtension, lerpSpeed);
        this.jointStates.shoulderAbduction = lerp(this.jointStates.shoulderAbduction || 0, t.shoulderAbduction, lerpSpeed);

        // Apply interpolated horizontal states
        this.bodyGroup.rotation.x = this.jointStates.groupRotX;
        this.bodyGroup.position.y = this.jointStates.groupPosY;
        this.bodyGroup.position.z = this.jointStates.groupPosZ;

        // Alias for the FK math block to use cleanly
        const torsoDrop = this.jointStates.torsoDrop;
        const torsoHinge = this.jointStates.torsoHinge;
        const shoulderFlexion = this.jointStates.shoulderFlexion;
        const elbowFlexion = this.jointStates.elbowFlexion;
        const hipFlexionL = this.jointStates.hipFlexionL;
        const kneeFlexionL = this.jointStates.kneeFlexionL;
        const hipFlexionR = this.jointStates.hipFlexionR;
        const kneeFlexionR = this.jointStates.kneeFlexionR;
        const wristBend = this.jointStates.wristBend;
        const forearmTwist = this.jointStates.forearmTwist;
        const neckExtension = this.jointStates.neckExtension;
        const shoulderAbduction = this.jointStates.shoulderAbduction;

        // --- 5. Forward Kinematics Application ---

        // A) Torso
        const torsoParts = ['head','neck','traps_l','traps_r','pec_l','pec_r','abs_1l','abs_1r','abs_2l','abs_2r','abs_3l','abs_3r','oblique_l','oblique_r','lat_l','lat_r','lower_back', 'pelvis', 'glute_l', 'glute_r'];

        // Pivot point for hinge is lower back / pelvis
        const pivotY = this.basePositions['pelvis'].pos.y;

        torsoParts.forEach(p => {
            if(this.bodyParts[p]) {
                // 1. Translation
                this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - torsoDrop;

                // 2. Rotation (Hinge)
                if (torsoHinge !== 0 && p !== 'pelvis') {
                    // Rotate around pelvis pivot
                    const dy = this.basePositions[p].pos.y - pivotY;
                    const dz = this.basePositions[p].pos.z;

                    // Simple 2D rotation matrix for X-axis pitch
                    this.bodyParts[p].mesh.position.y = pivotY - torsoDrop + (dy * Math.cos(torsoHinge) - dz * Math.sin(torsoHinge));
                    this.bodyParts[p].mesh.position.z = (dy * Math.sin(torsoHinge) + dz * Math.cos(torsoHinge));

                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x + torsoHinge;
                }
            }
        });

        // B) Arms (Shoulder -> Bicep -> Elbow -> Forearm -> Hand)
        const processArm = (side, shoulderOffset) => {
            const delt = `delt_${side}`;
            const bicep = `bicep_${side}`;
            const elbow = `elbow_${side}`;
            const forearm = `forearm_${side}`;
            const hand = `hand_${side}`;

            // Shoulder follows torso
            if(this.bodyParts[delt]) {
                const dy = this.basePositions[delt].pos.y - pivotY;
                const dz = this.basePositions[delt].pos.z;
                this.bodyParts[delt].mesh.position.y = pivotY - torsoDrop + (dy * Math.cos(torsoHinge) - dz * Math.sin(torsoHinge));
                this.bodyParts[delt].mesh.position.z = (dy * Math.sin(torsoHinge) + dz * Math.cos(torsoHinge));
                this.bodyParts[delt].mesh.rotation.x = this.basePositions[delt].rot.x + torsoHinge;
            }

            // Upper Arm (Bicep/Tricep) Pivot at Shoulder
            const shoulderPivotY = this.bodyParts[delt] ? this.bodyParts[delt].mesh.position.y : this.basePositions[bicep].pos.y - torsoDrop;
            const shoulderPivotZ = this.bodyParts[delt] ? this.bodyParts[delt].mesh.position.z : this.basePositions[bicep].pos.z;

            // Total arm rotation = Torso Hinge + Shoulder Flexion + Specific offsets
            let armPitch = torsoHinge + shoulderFlexion;

            // Apply special overrides for animations that don't follow generic chain
            if (this.animState === 'press') armPitch = torsoHinge - phase * 1.5;

            let finalElbowFlex = elbowFlexion;
            let armYaw = side === 'l' ? shoulderAbduction : -shoulderAbduction; // Flare elbows!
            let armLength = 1.8;
            let faTotalLength = 2.0; // Forearm + wrist extension distance

            // --- ARM IK SYSTEM ---
            // If the exercise requires hands to be strictly locked to a target (like a pullup bar or barbell),
            // calculate the necessary armPitch and elbowFlexion to reach it from the shoulder pivot!
            if (['squat', 'pullup', 'deadlift', 'row'].includes(this.animState)) {
                let targetY = 0, targetZ = 0;
                let activeIK = false;

                if (this.animState === 'squat') {
                    // Hands locked to barbell on neck
                    targetY = (this.bodyParts['neck'] ? this.bodyParts['neck'].mesh.position.y : 4.0) + 0.8;
                    targetZ = (this.bodyParts['neck'] ? this.bodyParts['neck'].mesh.position.z : 0) - 0.5;
                    activeIK = true;
                } else if (this.animState === 'pullup') {
                    // Hands locked to overhead bar
                    targetY = 9.0;
                    targetZ = 0;
                    activeIK = true;
                    armYaw = side === 'l' ? 1.2 : -1.2;
                } else if (this.animState === 'deadlift') {
                    // Hands locked to barbell hanging or on floor
                    // Maximum reach of this model's arms is about Y=-2.0 before the knees must hyper-bend.
                    targetY = 1.0 - phase * 4.0; // From thigh down to mid-shin (-3.0)
                    targetZ = 1.5 + phase * 1.5;
                    activeIK = true;
                    armYaw = side === 'l' ? 0.2 : -0.2; // Slight flare to clear knees
                } else if (this.animState === 'row') {
                    targetY = -1.5 - phase * 3.0; // Pulling up to belly
                    targetZ = 3.0 - phase * 1.0;
                    activeIK = true;
                    armYaw = side === 'l' ? 0.8 : -0.8;
                }

                if (activeIK) {
                    const effArmLength = armLength * Math.cos(armYaw);
                    const effFaLength = faTotalLength * Math.cos(armYaw);

                    const dy = targetY - shoulderPivotY;
                    const dz = targetZ - shoulderPivotZ;
                    const d = Math.sqrt(dy*dy + dz*dz);

                    const maxReach = effArmLength + effFaLength;
                    const clampedD = Math.max(0.1, Math.min(d, maxReach - 0.01));

                    const cosElbow = (effArmLength*effArmLength + effFaLength*effFaLength - clampedD*clampedD) / (2 * effArmLength * effFaLength);
                    finalElbowFlex = Math.PI - Math.acos(Math.max(-1, Math.min(1, cosElbow)));

                    const alpha = Math.acos(Math.max(-1, Math.min(1, (effArmLength*effArmLength + clampedD*clampedD - effFaLength*effFaLength) / (2 * effArmLength * clampedD))));
                    const targetAngle = Math.atan2(dz, -dy);

                    armPitch = targetAngle - alpha;
                    if (this.animState === 'squat' || this.animState === 'pullup') armPitch = targetAngle + alpha;

                    armPitch -= torsoHinge;
                }
            }

            ['bicep', 'tricep'].forEach(m => {
                const part = `${m}_${side}`;
                if(this.bodyParts[part]) {
                    this.bodyParts[part].mesh.rotation.x = this.basePositions[part].rot.x + armPitch;
                    this.bodyParts[part].mesh.rotation.z = this.basePositions[part].rot.z + armYaw;

                    const halfLen = armLength / 2;
                    // X axis: Math.sin(-yaw) moves it outward
                    // Y axis: cos(pitch) * cos(yaw) keeps the cone radius accurate
                    // Z axis: Note: Front is NEGATIVE Z in ThreeJS camera when looking at origin from z=22!
                    this.bodyParts[part].mesh.position.x = this.basePositions[bicep].pos.x + halfLen * Math.sin(-armYaw);
                    this.bodyParts[part].mesh.position.y = shoulderPivotY - halfLen * Math.cos(armPitch) * Math.cos(armYaw);
                    this.bodyParts[part].mesh.position.z = shoulderPivotZ - halfLen * Math.sin(armPitch);
                }
            });

            // Elbow Joint follows EXACT end of bicep (armLength away from shoulder)
            let elbowX = this.basePositions[bicep].pos.x + armLength * Math.sin(-armYaw);
            let elbowY = shoulderPivotY - armLength * Math.cos(armPitch) * Math.cos(armYaw);
            let elbowZ = shoulderPivotZ - armLength * Math.sin(armPitch);

            if(this.bodyParts[elbow]) {
                this.bodyParts[elbow].mesh.position.x = elbowX;
                this.bodyParts[elbow].mesh.position.y = elbowY;
                this.bodyParts[elbow].mesh.position.z = elbowZ;
                this.bodyParts[elbow].mesh.rotation.x = armPitch;
                this.bodyParts[elbow].mesh.rotation.z = armYaw;
            }

            // Forearm Pivot at Elbow.
            // Bending the elbow is essentially pitching the forearm relative to the bicep.
            let forearmPitch = armPitch - finalElbowFlex; // Negative elbow flexion curls it UP (forward in Z!)

            if(this.bodyParts[forearm]) {
                this.bodyParts[forearm].mesh.rotation.x = this.basePositions[forearm].rot.x + forearmPitch;
                this.bodyParts[forearm].mesh.rotation.z = this.basePositions[forearm].rot.z + armYaw; // Inherit yaw from shoulder

                const faHalf = 0.8; // half length of forearm
                this.bodyParts[forearm].mesh.position.x = elbowX + faHalf * Math.sin(-armYaw);
                this.bodyParts[forearm].mesh.position.y = elbowY - faHalf * Math.cos(forearmPitch) * Math.cos(armYaw);
                this.bodyParts[forearm].mesh.position.z = elbowZ - faHalf * Math.sin(forearmPitch);
            }

            // Hand follows EXACT end of forearm
            if(this.bodyParts[hand]) {
                this.bodyParts[hand].mesh.position.x = elbowX + faTotalLength * Math.sin(-armYaw);
                this.bodyParts[hand].mesh.position.y = elbowY - faTotalLength * Math.cos(forearmPitch) * Math.cos(armYaw);
                this.bodyParts[hand].mesh.position.z = elbowZ - faTotalLength * Math.sin(forearmPitch);
                this.bodyParts[hand].mesh.rotation.x = this.basePositions[hand].rot.x + forearmPitch;
                this.bodyParts[hand].mesh.rotation.z = this.basePositions[hand].rot.z + armYaw;
            }
        };

        processArm('l');
        processArm('r');

        // C) Legs (Pelvis -> Quad -> Knee -> Calf -> Foot)
        const processLeg = (side, specificHipFlex, specificKneeFlex, strideZ) => {
            const quad = `quad_${side}`;
            const ham = `ham_${side}`;
            const knee = `knee_${side}`;
            const calf = `calf_${side}`;
            const shin = `shin_${side}`;
            const foot = `foot_${side}`;

            // The pivot for the leg is the pelvis
            // Pelvis: y=0.5. Knee: y=-3.8 -> Thigh length = 4.3
            // Knee: y=-3.8. Foot: y=-7.2 -> Lower leg length = 3.4
            const hipPivotY = this.basePositions['pelvis'].pos.y - torsoDrop;
            const hipPivotZ = this.basePositions['pelvis'].pos.z;

            // --- Thigh (Quad/Ham) ---
            const thighLength = 4.3;
            const lowerLegLength = 3.4;

            let finalHipFlex = specificHipFlex;
            let finalKneeFlex = specificKneeFlex;

            // Apply IK Constraint for Squat, Deadlift, Thruster to keep feet locked to floor
            if (['squat', 'deadlift', 'fullbody'].includes(this.animState)) {
                const distanceToFloor = (hipPivotY - (-7.2));
                const maxReach = thighLength + lowerLegLength;
                const d = Math.max(0.1, Math.min(distanceToFloor, maxReach));

                // Law of Cosines
                const cosKnee = (thighLength*thighLength + lowerLegLength*lowerLegLength - d*d) / (2 * thighLength * lowerLegLength);
                finalKneeFlex = Math.acos(Math.max(-1, Math.min(1, cosKnee)));

                const alpha = Math.acos(Math.max(-1, Math.min(1, (thighLength*thighLength + d*d - lowerLegLength*lowerLegLength) / (2 * thighLength * d))));

                if (this.animState === 'deadlift') {
                    finalHipFlex = (alpha || 0) * 0.5 + torsoHinge * 0.8;
                } else if (this.animState === 'fullbody') {
                    finalHipFlex = (alpha || 0) + 0.3;
                } else {
                    finalHipFlex = (alpha || 0) + 0.5;
                }
            }

            // --- Thigh (Quad/Ham) ---
            ['quad', 'ham'].forEach(m => {
                const part = `${m}_${side}`;
                if(this.bodyParts[part]) {
                    this.bodyParts[part].mesh.rotation.x = this.basePositions[part].rot.x - finalHipFlex;

                    const localY = this.basePositions[part].pos.y - this.basePositions['pelvis'].pos.y;
                    const localZ = this.basePositions[part].pos.z - this.basePositions['pelvis'].pos.z;

                    this.bodyParts[part].mesh.position.y = hipPivotY + (localY * Math.cos(finalHipFlex) + localZ * Math.sin(finalHipFlex));
                    this.bodyParts[part].mesh.position.z = hipPivotZ + strideZ + (-localY * Math.sin(finalHipFlex) + localZ * Math.cos(finalHipFlex));
                }
            });

            // --- Knee ---
            let kneeY = hipPivotY - thighLength * Math.cos(finalHipFlex);
            let kneeZ = hipPivotZ + strideZ + thighLength * Math.sin(finalHipFlex);

            if(this.bodyParts[knee]) {
                this.bodyParts[knee].mesh.position.y = kneeY;
                this.bodyParts[knee].mesh.position.z = kneeZ;
                this.bodyParts[knee].mesh.rotation.x = this.basePositions[knee].rot.x - finalHipFlex;
            }

            // --- Lower Leg (Calf/Shin) ---
            let lowerLegPitch = -finalHipFlex + finalKneeFlex;
            // Distance from knee to ankle

            ['calf', 'shin'].forEach(m => {
                const part = `${m}_${side}`;
                if(this.bodyParts[part]) {
                    this.bodyParts[part].mesh.rotation.x = this.basePositions[part].rot.x + lowerLegPitch;

                    const localY = this.basePositions[part].pos.y - this.basePositions[knee].pos.y;
                    const localZ = this.basePositions[part].pos.z - this.basePositions[knee].pos.z;

                    this.bodyParts[part].mesh.position.y = kneeY + (localY * Math.cos(lowerLegPitch) - localZ * Math.sin(lowerLegPitch));
                    this.bodyParts[part].mesh.position.z = kneeZ + (localY * Math.sin(lowerLegPitch) + localZ * Math.cos(lowerLegPitch));
                }
            });

            // --- Foot ---
            if(this.bodyParts[foot]) {
                const localY = this.basePositions[foot].pos.y - this.basePositions[knee].pos.y;
                const localZ = this.basePositions[foot].pos.z - this.basePositions[knee].pos.z;

                this.bodyParts[foot].mesh.position.y = kneeY + (localY * Math.cos(lowerLegPitch) - localZ * Math.sin(lowerLegPitch));
                this.bodyParts[foot].mesh.position.z = kneeZ + (localY * Math.sin(lowerLegPitch) + localZ * Math.cos(lowerLegPitch));

                // Keep foot flat relative to ground (override pitch)
                if (['squat', 'deadlift', 'fullbody'].includes(this.animState)) {
                    this.bodyParts[foot].mesh.rotation.x = 0;
                    this.bodyParts[foot].mesh.position.y = -7.2; // absolute lock to floor
                } else {
                    this.bodyParts[foot].mesh.rotation.x = this.basePositions[foot].rot.x + (lowerLegPitch * 0.2);
                }
            }
        };

        // Explicitly stride legs for lunge, else static Z
        let strideZL = 0;
        let strideZR = 0;
        if (this.animState === 'lunge') {
            strideZL = 1.2;
            strideZR = -1.2;
        }

        processLeg('l', hipFlexionL, kneeFlexionL, strideZL);
        processLeg('r', hipFlexionR, kneeFlexionR, strideZR);

        // Ensure barbell is hidden when idle or plank
        if (['idle', 'plank'].includes(this.animState)) {
             if (this.barbell) this.barbell.visible = false;
             if (this.pullupBar) this.pullupBar.visible = false;
             if (this.dbL) this.dbL.visible = false;
             if (this.dbR) this.dbR.visible = false;
        } else {
             // Position dynamic equipment attached to hands
             if (['squat', 'deadlift', 'bench', 'press', 'row', 'overhead_press', 'fullbody'].includes(this.animState)) {
                  if (this.barbell) {
                      this.barbell.visible = true;

                      // Bind strictly to hand positions in FK space.
                      // Since barbell is centered, we just use the midpoint of left/right hands.
                      if (this.bodyParts['hand_l'] && this.bodyParts['hand_r']) {
                          const hl = new THREE.Vector3();
                          this.bodyParts['hand_l'].mesh.getWorldPosition(hl);
                          const hr = new THREE.Vector3();
                          this.bodyParts['hand_r'].mesh.getWorldPosition(hr);
                          this.barbell.position.set( (hl.x + hr.x) / 2, (hl.y + hr.y) / 2, (hl.z + hr.z) / 2 );

                          // If squatting, barbell actually sits on neck, not hands
                          if (this.animState === 'squat' && this.bodyParts['neck']) {
                              this.barbell.position.copy(this.bodyParts['neck'].mesh.position);
                              this.barbell.position.y += 0.8;
                              this.barbell.position.z -= 0.5;
                          }
                      }
                  }
                  if (this.pullupBar) this.pullupBar.visible = false;
                  if (this.dbL) this.dbL.visible = false;
                  if (this.dbR) this.dbR.visible = false;
             } else if (['curl', 'lunge'].includes(this.animState)) {
                  if (this.dbL) {
                      this.dbL.visible = true;
                      this.bodyParts['hand_l'].mesh.getWorldPosition(this.dbL.position);
                  }
                  if (this.dbR) {
                      this.dbR.visible = true;
                      this.bodyParts['hand_r'].mesh.getWorldPosition(this.dbR.position);
                  }
                  if (this.barbell) this.barbell.visible = false;
                  if (this.pullupBar) this.pullupBar.visible = false;
             } else if (this.animState === 'pullup') {
                  if (this.pullupBar) {
                      this.pullupBar.visible = true;
                      // Fixed bar in world space
                      this.pullupBar.position.set(0, 9.0, 0);
                  }
                  if (this.barbell) this.barbell.visible = false;
                  if (this.dbL) this.dbL.visible = false;
                  if (this.dbR) this.dbR.visible = false;
             }
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
        const vDet = document.getElementById('vis-details');
        if (vDet) vDet.style.display = 'block';

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
        } else if (exType === 'pullup') {
            desc = "ISOLATING: Upper Body Pull | INTENSITY: High";
            equipment = "<li><strong>Primary:</strong> Pull-up Bar (Targets Lats/Biceps)</li>";

            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['lat_l', 'lat_r', 'bicep_l', 'bicep_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
            ['traps_l', 'traps_r', 'abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'forearm_l', 'forearm_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.mod));

        } else if (exType === 'lunge') {
            desc = "ISOLATING: Unilateral Lower Body | INTENSITY: High";
            equipment = "<li><strong>Primary:</strong> Dumbbell Lunges (Targets Quads/Glutes/Stability)</li>";

            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['quad_l', 'quad_r', 'glute_l', 'glute_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
            ['ham_l', 'ham_r', 'calf_l', 'calf_r', 'abs_1l', 'abs_1r', 'abs_2l', 'abs_2r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.mod));

        } else if (exType === 'plank') {
            desc = "ISOLATING: Core Stabilization | INTENSITY: Moderate";
            equipment = "<li><strong>Primary:</strong> Bodyweight (Targets Rectus Abdominis/Core)</li>";

            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'abs_3l', 'abs_3r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
            ['delt_l', 'delt_r', 'pec_l', 'pec_r', 'quad_l', 'quad_r', 'glute_l', 'glute_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.mod));

        } else if (exType === 'overhead_press') {
            desc = "ISOLATING: Shoulder Push | INTENSITY: High";
            equipment = "<li><strong>Primary:</strong> Barbell Overhead Press (Targets Deltoids/Triceps)</li>";

            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['delt_l', 'delt_r', 'tricep_l', 'tricep_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
            ['traps_l', 'traps_r', 'pec_l', 'pec_r', 'abs_1l', 'abs_1r', 'abs_2l', 'abs_2r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.mod));

        } else if (exType === 'row') {
            desc = "ISOLATING: Horizontal Pull | INTENSITY: High";
            equipment = "<li><strong>Primary:</strong> Barbell Bent Over Row (Targets Lats/Rhomboids)</li>";

            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['lat_l', 'lat_r', 'traps_l', 'traps_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
            ['bicep_l', 'bicep_r', 'lower_back', 'ham_l', 'ham_r', 'glute_l', 'glute_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.mod));

        } else if (exType === 'curl') {
            desc = "ISOLATING: Arm Isolation | INTENSITY: Low/Moderate";
            equipment = "<li><strong>Primary:</strong> Dumbbell Bicep Curl (Targets Biceps Brachii)</li>";

            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['bicep_l', 'bicep_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
            ['forearm_l', 'forearm_r', 'delt_l', 'delt_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.mod));
        }

        const dDesc2 = document.getElementById('vis-desc');
        if (dDesc2) dDesc2.innerText = desc;
        const dEq2 = document.getElementById('vis-equipment');
        if (dEq2) dEq2.innerHTML = equipment;
    },

    updateWebGLVisualizer() {

        if (!this.state.schedule || !this.state.webglInitialized) return;

        const select = document.getElementById('vis-day-select');
        const dayIndex = select.value;
        document.getElementById('vis-dict-select').value = '';
        if (dayIndex === '') return;

        const day = this.state.schedule[dayIndex];

        const dDet = document.getElementById('vis-details');
        if (dDet) dDet.style.display = 'block';
        const dDesc = document.getElementById('vis-desc');
        if (dDesc) dDesc.innerText = `ISOLATING: ${day.focus} | INTENSITY: ${day.intensity}`;

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

        const visEq = document.getElementById('vis-equipment'); if(visEq) visEq.innerHTML = equipmentHTML;
    }

});
