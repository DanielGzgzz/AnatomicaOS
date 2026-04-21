window.app = window.app || {};
Object.assign(window.app, {
    initWebGL() {
        if (this.state.webglInitialized) return;

        const container = document.getElementById('webgl-container');
        if (!container) return;

        let height = window.innerHeight - 250;
        if (height < 500) height = 500;
        container.style.minHeight = height + "px";
        container.style.height = height + "px";

        const width = container.clientWidth;

        this.scene = new THREE.Scene();
        this.gridHelper = new THREE.GridHelper(50, 50, 0xa7f3d0, 0xd1d5db);
        this.gridHelper.position.y = -8.5;
        this.gridHelper.material.depthWrite = false;
        this.gridHelper.material.transparent = true;
        this.gridHelper.material.opacity = 0.5;
        this.scene.add(this.gridHelper);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 2, 22);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setClearColor(0xffffff, 1);
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 25;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.5;

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

        this.bodyParts = {};
        this.bodyGroup = new THREE.Group();
        this.scene.add(this.bodyGroup);

        const createMuscle = (geo, name, x, y, z, sx, sy, sz, rx=0, ry=0, rz=0) => {
            const material = new THREE.MeshPhongMaterial({
                color: 0xd2b48c, emissive: 0x000000, specular: 0x222222, shininess: 10, flatShading: true
            });

            const mesh = new THREE.Mesh(geo, material);
            mesh.scale.set(sx, sy, sz);
            mesh.position.set(x, y, z);
            mesh.rotation.set(rx, ry, rz);
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            mesh.userData = { name: name, baseScale: new THREE.Vector3(sx, sy, sz) };

            const trailGeo = new THREE.BufferGeometry();
            const trailMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.5 });
            const trailLine = new THREE.Line(trailGeo, trailMat);
            this.bodyGroup.add(trailLine);

            this.bodyGroup.add(mesh);
            this.bodyParts[name] = { mesh: mesh, trailLine: trailLine, trailPositions: [], maxTrailPoints: 15 };
        };

        const polyGeo = new THREE.IcosahedronGeometry(1, 3);
        const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16, 4);

        createMuscle(polyGeo, 'head', 0, 7.5, 0, 1.2, 1.5, 1.3);
        createMuscle(cylGeo, 'neck', 0, 6.2, 0, 1.0, 1.5, 1.0);
        createMuscle(polyGeo, 'traps_l', -1.2, 5.8, -0.2, 1.5, 0.8, 0.8, 0, 0, 0.5);
        createMuscle(polyGeo, 'traps_r', 1.2, 5.8, -0.2, 1.5, 0.8, 0.8, 0, 0, -0.5);
        createMuscle(polyGeo, 'pec_l', -1.0, 4.5, 0.7, 1.2, 1.1, 0.4, 0.2, -0.2, 0);
        createMuscle(polyGeo, 'pec_r', 1.0, 4.5, 0.7, 1.2, 1.1, 0.4, 0.2, 0.2, 0);
        createMuscle(polyGeo, 'abs_1l', -0.4, 3.5, 0.8, 0.5, 0.6, 0.25);
        createMuscle(polyGeo, 'abs_1r', 0.4, 3.5, 0.8, 0.5, 0.6, 0.25);
        createMuscle(polyGeo, 'abs_2l', -0.4, 2.7, 0.8, 0.5, 0.6, 0.25);
        createMuscle(polyGeo, 'abs_2r', 0.4, 2.7, 0.8, 0.5, 0.6, 0.25);
        createMuscle(polyGeo, 'abs_3l', -0.4, 1.9, 0.7, 0.5, 0.6, 0.25);
        createMuscle(polyGeo, 'abs_3r', 0.4, 1.9, 0.7, 0.5, 0.6, 0.25);
        createMuscle(polyGeo, 'oblique_l', -1.3, 2.7, 0.4, 0.6, 1.5, 0.5, 0, 0, -0.15);
        createMuscle(polyGeo, 'oblique_r', 1.3, 2.7, 0.4, 0.6, 1.5, 0.5, 0, 0, 0.15);
        createMuscle(polyGeo, 'lat_l', -1.5, 3.5, -0.5, 1.0, 2.3, 0.5, 0.2, 0, 0.15);
        createMuscle(polyGeo, 'lat_r', 1.5, 3.5, -0.5, 1.0, 2.3, 0.5, 0.2, 0, -0.15);
        createMuscle(polyGeo, 'lower_back', 0, 2.0, -0.7, 1.3, 1.5, 0.4);
        createMuscle(polyGeo, 'delt_l', -2.5, 5.0, 0, 1.0, 1.2, 1.0, 0, 0, 0.5);
        createMuscle(polyGeo, 'delt_r', 2.5, 5.0, 0, 1.0, 1.2, 1.0, 0, 0, -0.5);
        createMuscle(cylGeo, 'bicep_l', -3.2, 3.8, 0.2, 0.8, 1.8, 0.7, 0, 0, -0.4);
        createMuscle(cylGeo, 'bicep_r', 3.2, 3.8, 0.2, 0.8, 1.8, 0.7, 0, 0, 0.4);
        createMuscle(cylGeo, 'tricep_l', -3.2, 3.8, -0.3, 0.7, 1.8, 0.6, 0, 0, -0.4);
        createMuscle(cylGeo, 'tricep_r', 3.2, 3.8, -0.3, 0.7, 1.8, 0.6, 0, 0, 0.4);
        createMuscle(polyGeo, 'elbow_l', -3.8, 2.8, -0.1, 0.6, 0.6, 0.6, 0, 0, -0.4);
        createMuscle(polyGeo, 'elbow_r', 3.8, 2.8, -0.1, 0.6, 0.6, 0.6, 0, 0, 0.4);
        createMuscle(cylGeo, 'forearm_l', -4.2, 1.8, 0.3, 0.6, 1.8, 0.6, -0.2, 0, -0.3);
        createMuscle(cylGeo, 'forearm_r', 4.2, 1.8, 0.3, 0.6, 1.8, 0.6, -0.2, 0, 0.3);
        createMuscle(polyGeo, 'hand_l', -4.3, 0.8, 0.4, 0.4, 0.7, 0.3, -0.2, 0, -0.3);
        createMuscle(polyGeo, 'hand_r', 4.3, 0.8, 0.4, 0.4, 0.7, 0.3, -0.2, 0, 0.3);
        createMuscle(polyGeo, 'glute_l', -0.9, 0.5, -0.7, 1.2, 1.3, 0.8, 0.2, 0, 0);
        createMuscle(polyGeo, 'glute_r', 0.9, 0.5, -0.7, 1.2, 1.3, 0.8, 0.2, 0, 0);
        createMuscle(polyGeo, 'pelvis', 0, 0.5, 0.3, 1.6, 1.1, 0.7);
        createMuscle(cylGeo, 'quad_l', -1.1, -1.8, 0.4, 1.1, 3.5, 1.0, -0.1, 0, 0.05);
        createMuscle(cylGeo, 'quad_r', 1.1, -1.8, 0.4, 1.1, 3.5, 1.0, -0.1, 0, -0.05);
        createMuscle(cylGeo, 'ham_l', -1.1, -1.8, -0.3, 0.9, 3.5, 0.9, 0.1, 0, 0.05);
        createMuscle(cylGeo, 'ham_r', 1.1, -1.8, -0.3, 0.9, 3.5, 0.9, 0.1, 0, -0.05);
        createMuscle(polyGeo, 'knee_l', -1.1, -3.8, 0.5, 0.6, 0.6, 0.5);
        createMuscle(polyGeo, 'knee_r', 1.1, -3.8, 0.5, 0.6, 0.6, 0.5);
        createMuscle(cylGeo, 'calf_l', -1.1, -5.5, -0.2, 0.9, 2.8, 0.9);
        createMuscle(cylGeo, 'calf_r', 1.1, -5.5, -0.2, 0.9, 2.8, 0.9);
        createMuscle(cylGeo, 'shin_l', -1.1, -5.5, 0.3, 0.5, 2.8, 0.5);
        createMuscle(cylGeo, 'shin_r', 1.1, -5.5, 0.3, 0.5, 2.8, 0.5);
        createMuscle(polyGeo, 'foot_l', -1.1, -7.2, 0.5, 0.7, 0.4, 1.3);
        createMuscle(polyGeo, 'foot_r', 1.1, -7.2, 0.5, 0.7, 0.4, 1.3);

        const ironMat = new THREE.MeshPhongMaterial({ color: 0x111111, emissive: 0x050505, shininess: 80, specular: 0x888888 });

        const barGeo = new THREE.CylinderGeometry(0.1, 0.1, 14, 8);
        const plateGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.4, 16);
        this.barbell = new THREE.Group();
        const barMesh = new THREE.Mesh(barGeo, ironMat);
        barMesh.rotation.z = Math.PI / 2;
        this.barbell.add(barMesh);
        const plateL = new THREE.Mesh(plateGeo, ironMat);
        plateL.rotation.z = Math.PI / 2;
        plateL.position.x = -6.0;
        this.barbell.add(plateL);
        const plateR = new THREE.Mesh(plateGeo, ironMat);
        plateR.rotation.z = Math.PI / 2;
        plateR.position.x = 6.0;
        this.barbell.add(plateR);
        this.scene.add(this.barbell);

        const dbBarGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
        const dbPlateGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
        const createDumbbell = () => {
            const db = new THREE.Group();
            const bar = new THREE.Mesh(dbBarGeo, ironMat);
            bar.rotation.x = Math.PI / 2;
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

        const pullupBarGeo = new THREE.CylinderGeometry(0.15, 0.15, 16, 8);
        this.pullupBar = new THREE.Mesh(pullupBarGeo, ironMat);
        this.pullupBar.rotation.z = Math.PI / 2;
        this.pullupBar.position.y = 11.5;
        this.scene.add(this.pullupBar);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.tooltip = document.createElement('div');
        this.tooltip.style.position = 'absolute';
        this.tooltip.style.backgroundColor = 'rgba(17, 24, 39, 0.9)';
        this.tooltip.style.color = '#10b981';
        this.tooltip.style.padding = '8px 12px';
        this.tooltip.style.borderRadius = '4px';
        this.tooltip.style.pointerEvents = 'none';
        this.tooltip.style.display = 'none';
        this.tooltip.style.zIndex = '1000';
        container.appendChild(this.tooltip);

        this.activeLabel = document.createElement('div');
        this.activeLabel.style.position = 'absolute';
        this.activeLabel.style.color = '#ef4444';
        this.activeLabel.style.padding = '4px 8px';
        this.activeLabel.style.pointerEvents = 'none';
        this.activeLabel.style.display = 'none';
        this.activeLabel.style.zIndex = '900';
        container.appendChild(this.activeLabel);

        const onMouseMove = (event) => {
            const rect = container.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const meshes = Object.values(this.bodyParts).map(part => part.mesh);
            const intersects = this.raycaster.intersectObjects(meshes);

            if (intersects.length > 0) {
                const object = intersects[0].object;
                const internalName = object.userData.name;
                this.tooltip.style.display = 'block';
                this.tooltip.innerHTML = `> ${internalName}`;
                this.tooltip.style.left = (event.clientX - rect.left + 15) + 'px';
                this.tooltip.style.top = (event.clientY - rect.top + 15) + 'px';
            } else {
                this.tooltip.style.display = 'none';
            }
        };

        container.addEventListener('mousemove', onMouseMove);

        this.clock = new THREE.Clock();
        this.time = 0;

        this.jointStates = {
            torsoDrop: 0, torsoHinge: 0, shoulderFlexion: 0, elbowFlexion: 0,
            hipFlexionL: 0, kneeFlexionL: 0, hipFlexionR: 0, kneeFlexionR: 0,
            groupRotX: 0, groupPosY: 0, groupPosZ: 0, pelvisZ: 0
        };

        this.basePositions = {};
        Object.keys(this.bodyParts).forEach(key => {
            this.basePositions[key] = {
                pos: this.bodyParts[key].mesh.position.clone(),
                rot: this.bodyParts[key].mesh.rotation.clone(),
                scale: this.bodyParts[key].mesh.scale.clone()
            };
        });

        this.MovementMap = {
            "squat": { primary: ['quad_l', 'quad_r', 'glute_l', 'glute_r'], synergists: ['ham_l', 'ham_r', 'lower_back', 'calf_l', 'calf_r'] },
            "bench": { primary: ['pec_l', 'pec_r', 'delt_l', 'delt_r'], synergists: ['tricep_l', 'tricep_r'] },
            "press": { primary: ['pec_l', 'pec_r', 'delt_l', 'delt_r'], synergists: ['tricep_l', 'tricep_r'] },
            "fullbody": { primary: ['quad_l', 'quad_r', 'glute_l', 'glute_r', 'delt_l', 'delt_r'], synergists: [] },
            "deadlift": { primary: ['glute_l', 'glute_r', 'ham_l', 'ham_r', 'lower_back'], synergists: ['quad_l', 'quad_r', 'traps_l', 'traps_r', 'lat_l', 'lat_r'] },
            "pullup": { primary: ['lat_l', 'lat_r', 'bicep_l', 'bicep_r'], synergists: ['forearm_l', 'forearm_r', 'traps_l', 'traps_r'] },
            "lunge": { primary: ['quad_l', 'quad_r', 'glute_l', 'glute_r'], synergists: ['ham_l', 'ham_r', 'calf_l', 'calf_r'] },
            "plank": { primary: ['abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'abs_3l', 'abs_3r', 'oblique_l', 'oblique_r'], synergists: ['pec_l', 'pec_r', 'delt_l', 'delt_r'] },
            "overhead_press": { primary: ['delt_l', 'delt_r', 'tricep_l', 'tricep_r'], synergists: ['traps_l', 'traps_r', 'abs_1l', 'abs_1r'] },
            "row": { primary: ['lat_l', 'lat_r'], synergists: ['bicep_l', 'bicep_r', 'traps_l', 'traps_r', 'lower_back'] },
            "curl": { primary: ['bicep_l', 'bicep_r'], synergists: ['forearm_l', 'forearm_r'] },
            "crunch": { primary: ['abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'abs_3l', 'abs_3r'], synergists: ['oblique_l', 'oblique_r'] },
            "calf_raise": { primary: ['calf_l', 'calf_r'], synergists: ['shin_l', 'shin_r'] },
            "leg_extension": { primary: ['quad_l', 'quad_r'], synergists: [] },
            "idle": { primary: [], synergists: [] }
        };

        this.animState = 'idle';

        const animate = () => {
            requestAnimationFrame(animate);
            const delta = this.clock.getDelta();
            this.time += delta;
            this.controls.update();

            const breath = Math.sin(this.time * 2) * 0.05;
            this.updateProceduralMotion(delta, breath);

            if (this.animState !== 'idle') {
                const map = this.MovementMap[this.animState] || this.MovementMap['idle'];
                const pulse = (Math.sin(this.time * 4) + 1) / 2;

                Object.values(this.bodyParts).forEach(part => {
                    part.mesh.material.emissive.setHex(0x000000);
                    part.mesh.material.color.setHex(0xd2b48c);
                    part.mesh.material.emissiveIntensity = 0;
                });

                map.primary.forEach(p => {
                    if(this.bodyParts[p]) {
                        this.bodyParts[p].mesh.material.color.setHex(0xff3333);
                        this.bodyParts[p].mesh.material.emissive.setHex(0xff0000);
                        this.bodyParts[p].mesh.material.emissiveIntensity = 0.5 + pulse * 0.5;
                    }
                });

                map.synergists.forEach(p => {
                    if(this.bodyParts[p]) {
                        this.bodyParts[p].mesh.material.color.setHex(0x00ffff);
                        this.bodyParts[p].mesh.material.emissive.setHex(0x0088ff);
                        this.bodyParts[p].mesh.material.emissiveIntensity = 0.3 + pulse * 0.3;
                    }
                });
            } else {
                Object.values(this.bodyParts).forEach(part => {
                    part.mesh.material.emissive.setHex(0x000000);
                    part.mesh.material.color.setHex(0xd2b48c);
                    part.mesh.material.emissiveIntensity = 0;
                });
            }

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

    updateProceduralMotion(delta, breath) {
        if (!this.bodyParts['head']) return;

        Object.keys(this.bodyParts).forEach(key => {
            const part = this.bodyParts[key];
            part.mesh.scale.copy(this.basePositions[key].scale);
            part.mesh.position.copy(this.basePositions[key].pos);
            part.mesh.rotation.copy(this.basePositions[key].rot);
        });

        const breathScale = 1.0 + breath;
        ['pec_l', 'pec_r', 'abs_1l', 'abs_1r'].forEach(p => {
            if(this.bodyParts[p]) {
                const base = this.bodyParts[p].mesh.userData.baseScale;
                this.bodyParts[p].mesh.scale.set(base.x, base.y * breathScale, base.z * breathScale);
            }
        });

        let phase = 0;
        let t = {
            torsoDrop: 0, torsoHinge: 0, shoulderFlexion: 0, elbowFlexion: 0,
            hipFlexionL: 0, kneeFlexionL: 0, hipFlexionR: 0, kneeFlexionR: 0,
            groupRotX: 0, groupPosY: 0, groupPosZ: 0, pelvisZ: 0
        };

        if (this.animState === 'squat') {
            phase = (Math.sin(this.time * 2.5) + 1) / 2;
            t.torsoDrop = phase * 2.8;
            t.torsoHinge = phase * 0.5;
            t.pelvisZ = phase * -1.2;
            t.hipFlexionL = t.hipFlexionR = phase * 1.9;
            t.kneeFlexionL = t.kneeFlexionR = phase * 2.5;
            t.shoulderFlexion = phase * 0.2;
        } else if (this.animState === 'press' || this.animState === 'bench') {
            phase = (Math.sin(this.time * 3) + 1) / 2;
            t.groupRotX = -Math.PI / 2;
            t.groupPosY = -3.5;
            t.groupPosZ = 1.0;
            t.shoulderFlexion = -1.2 + (phase * 0.2);
            t.elbowFlexion = 2.0 - (phase * 2.0);
        } else if (this.animState === 'fullbody') {
            phase = (Math.sin(this.time * 2.0) + 1) / 2;
            t.torsoDrop = phase * 2.6;
            t.torsoHinge = phase * 0.4;
            t.pelvisZ = phase * -1.0;
            t.hipFlexionL = t.hipFlexionR = phase * 1.7;
            t.kneeFlexionL = t.kneeFlexionR = phase * 2.2;
            t.shoulderFlexion = phase * 1.0 + (1 - phase) * -2.8;
            t.elbowFlexion = phase * 2.0;
        } else if (this.animState === 'deadlift') {
            phase = (Math.sin(this.time * 2.5) + 1) / 2;
            t.torsoDrop = phase * 2.0;
            t.torsoHinge = phase * 0.9;
            t.pelvisZ = phase * -1.8;
            t.hipFlexionL = t.hipFlexionR = phase * 1.7;
            t.kneeFlexionL = t.kneeFlexionR = phase * 0.6;
            t.shoulderFlexion = -t.torsoHinge;
        } else if (this.animState === 'pullup') {
            phase = (Math.sin(this.time * 2.5) + 1) / 2;
            t.groupPosY = 2.0;
            t.torsoDrop = phase * -3.0;
            t.shoulderFlexion = -2.8 + (phase * 1.5);
            t.elbowFlexion = phase * 2.0;
        } else if (this.animState === 'lunge') {
            phase = (Math.sin(this.time * 2.5) + 1) / 2;
            t.torsoDrop = phase * 2.2;
            t.torsoHinge = phase * 0.15;
            t.hipFlexionL = phase * 1.5;
            t.kneeFlexionL = phase * 2.0;
            t.hipFlexionR = phase * -0.6;
            t.kneeFlexionR = phase * 2.0;
        } else if (this.animState === 'plank') {
            t.groupRotX = Math.PI / 2.2;
            t.groupPosY = -6.0;
            t.groupPosZ = -4.0;
            t.shoulderFlexion = -Math.PI / 2.2;
            t.elbowFlexion = 1.0;
        } else if (this.animState === 'overhead_press') {
            phase = (Math.sin(this.time * 3) + 1) / 2;
            t.torsoHinge = -0.1;
            t.shoulderFlexion = phase * -2.8;
            t.elbowFlexion = phase * -0.5;
        } else if (this.animState === 'row') {
            phase = (Math.sin(this.time * 3) + 1) / 2;
            t.torsoHinge = 1.0;
            t.torsoDrop = 1.0;
            t.pelvisZ = -1.5;
            t.hipFlexionL = t.hipFlexionR = 1.0;
            t.kneeFlexionL = t.kneeFlexionR = 1.0;
            t.shoulderFlexion = -1.0 + phase * 1.8;
            t.elbowFlexion = phase * 2.2;
        } else if (this.animState === 'curl') {
            phase = (Math.sin(this.time * 3) + 1) / 2;
            t.shoulderFlexion = phase * -0.2;
            t.elbowFlexion = phase * 1.8;
        } else if (this.animState === 'crunch') {
            phase = (Math.sin(this.time * 3) + 1) / 2;
            t.groupRotX = -Math.PI / 2;
            t.groupPosY = -3.5;
            t.groupPosZ = 1.0;
            t.torsoHinge = phase * 0.5;
            t.shoulderFlexion = 1.5;
            t.hipFlexionL = t.hipFlexionR = 1.5;
            t.kneeFlexionL = t.kneeFlexionR = 2.0;
        } else if (this.animState === 'calf_raise') {
            phase = (Math.sin(this.time * 3) + 1) / 2;
            t.groupPosY = phase * 0.5;
            t.kneeFlexionL = t.kneeFlexionR = phase * -0.2;
        } else if (this.animState === 'leg_extension') {
            phase = (Math.sin(this.time * 3) + 1) / 2;
            t.groupPosY = 1.0;
            t.hipFlexionL = t.hipFlexionR = 1.5;
            t.kneeFlexionL = t.kneeFlexionR = 1.5 - phase * 1.5;
            t.shoulderFlexion = 0.5;
        }

        const lerp = (a, b, t) => a + (b - a) * t;
        const lerpSpeed = 5.0 * delta;

        this.jointStates.torsoDrop = t.torsoDrop;
        this.jointStates.torsoHinge = t.torsoHinge;
        this.jointStates.shoulderFlexion = t.shoulderFlexion;
        this.jointStates.elbowFlexion = t.elbowFlexion;
        this.jointStates.hipFlexionL = t.hipFlexionL;
        this.jointStates.kneeFlexionL = t.kneeFlexionL;
        this.jointStates.hipFlexionR = t.hipFlexionR;
        this.jointStates.kneeFlexionR = t.kneeFlexionR;
        this.jointStates.groupRotX = lerp(this.jointStates.groupRotX, t.groupRotX, lerpSpeed);
        this.jointStates.groupPosY = lerp(this.jointStates.groupPosY, t.groupPosY, lerpSpeed);
        this.jointStates.groupPosZ = lerp(this.jointStates.groupPosZ, t.groupPosZ, lerpSpeed);
        this.jointStates.pelvisZ = t.pelvisZ;

        this.bodyGroup.rotation.x = this.jointStates.groupRotX;
        this.bodyGroup.position.y = this.jointStates.groupPosY;
        this.bodyGroup.position.z = this.jointStates.groupPosZ;

        const torsoDrop = this.jointStates.torsoDrop;
        const torsoHinge = this.jointStates.torsoHinge;
        const shoulderFlexion = this.jointStates.shoulderFlexion;
        const elbowFlexion = this.jointStates.elbowFlexion;
        const hipFlexionL = this.jointStates.hipFlexionL;
        const kneeFlexionL = this.jointStates.kneeFlexionL;
        const hipFlexionR = this.jointStates.hipFlexionR;
        const kneeFlexionR = this.jointStates.kneeFlexionR;
        const pZ = this.jointStates.pelvisZ;

        // A) Torso
        const torsoParts = ['head','neck','traps_l','traps_r','pec_l','pec_r','abs_1l','abs_1r','abs_2l','abs_2r','abs_3l','abs_3r','oblique_l','oblique_r','lat_l','lat_r','lower_back', 'pelvis'];

        const pivotY = this.basePositions['pelvis'].pos.y;
        const currentPivotZ = this.basePositions['pelvis'].pos.z + pZ;

        torsoParts.forEach(p => {
            if(this.bodyParts[p]) {
                this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - torsoDrop;
                this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + pZ;

                if (torsoHinge !== 0 && p !== 'pelvis') {
                    const dy = this.basePositions[p].pos.y - pivotY;
                    const dz = this.basePositions[p].pos.z - this.basePositions['pelvis'].pos.z;

                    this.bodyParts[p].mesh.position.y = pivotY - torsoDrop + (dy * Math.cos(torsoHinge) - dz * Math.sin(torsoHinge));
                    this.bodyParts[p].mesh.position.z = currentPivotZ + (dy * Math.sin(torsoHinge) + dz * Math.cos(torsoHinge));
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x + torsoHinge;
                }
            }
        });

        // B) Arms
        const processArm = (side) => {
            const delt = `delt_${side}`;
            const bicep = `bicep_${side}`;
            const elbow = `elbow_${side}`;
            const forearm = `forearm_${side}`;
            const hand = `hand_${side}`;

            if(this.bodyParts[delt]) {
                const dy = this.basePositions[delt].pos.y - pivotY;
                const dz = this.basePositions[delt].pos.z - this.basePositions['pelvis'].pos.z;
                this.bodyParts[delt].mesh.position.y = pivotY - torsoDrop + (dy * Math.cos(torsoHinge) - dz * Math.sin(torsoHinge));
                this.bodyParts[delt].mesh.position.z = currentPivotZ + (dy * Math.sin(torsoHinge) + dz * Math.cos(torsoHinge));
                this.bodyParts[delt].mesh.rotation.x = this.basePositions[delt].rot.x + torsoHinge;
            }

            const shoulderPivotY = this.bodyParts[delt] ? this.bodyParts[delt].mesh.position.y : this.basePositions[bicep].pos.y - torsoDrop;
            const shoulderPivotZ = this.bodyParts[delt] ? this.bodyParts[delt].mesh.position.z : this.basePositions[bicep].pos.z + pZ;

            let armPitch = torsoHinge + shoulderFlexion;

            ['bicep', 'tricep'].forEach(m => {
                const part = `${m}_${side}`;
                if(this.bodyParts[part]) {
                    this.bodyParts[part].mesh.rotation.x = this.basePositions[part].rot.x + armPitch;
                    const bicepRadius = 0.9;
                    this.bodyParts[part].mesh.position.y = shoulderPivotY - bicepRadius * Math.cos(armPitch);
                    this.bodyParts[part].mesh.position.z = shoulderPivotZ - bicepRadius * Math.sin(armPitch);
                }
            });

            const armLength = 1.8;
            const elbowY = shoulderPivotY - armLength * Math.cos(armPitch);
            const elbowZ = shoulderPivotZ - armLength * Math.sin(armPitch);

            if(this.bodyParts[elbow]) {
                this.bodyParts[elbow].mesh.position.y = elbowY;
                this.bodyParts[elbow].mesh.position.z = elbowZ;
                this.bodyParts[elbow].mesh.rotation.x = armPitch;
            }

            let forearmPitch = armPitch - elbowFlexion;

            if(this.bodyParts[forearm]) {
                this.bodyParts[forearm].mesh.rotation.x = this.basePositions[forearm].rot.x + forearmPitch;
                const forearmRadius = 0.9;
                this.bodyParts[forearm].mesh.position.y = elbowY - forearmRadius * Math.cos(forearmPitch);
                this.bodyParts[forearm].mesh.position.z = elbowZ - forearmRadius * Math.sin(forearmPitch);
            }

            if(this.bodyParts[hand]) {
                const forearmLength = 1.8;
                this.bodyParts[hand].mesh.position.y = elbowY - forearmLength * Math.cos(forearmPitch);
                this.bodyParts[hand].mesh.position.z = elbowZ - forearmLength * Math.sin(forearmPitch);
                this.bodyParts[hand].mesh.rotation.x = this.basePositions[hand].rot.x + forearmPitch;
            }
        };

        processArm('l');
        processArm('r');

        // C) Legs
        const processLeg = (side, specificHipFlex, specificKneeFlex, strideZ) => {
            const quad = `quad_${side}`;
            const ham = `ham_${side}`;
            const knee = `knee_${side}`;
            const calf = `calf_${side}`;
            const shin = `shin_${side}`;
            const foot = `foot_${side}`;

            const hipPivotY = this.basePositions['pelvis'].pos.y - torsoDrop;

            const thighLength = 4.3;
            ['quad', 'ham'].forEach(m => {
                const part = `${m}_${side}`;
                if(this.bodyParts[part]) {
                    this.bodyParts[part].mesh.rotation.x = this.basePositions[part].rot.x - specificHipFlex;
                    const localY = this.basePositions[part].pos.y - this.basePositions['pelvis'].pos.y;
                    const localZ = this.basePositions[part].pos.z - this.basePositions['pelvis'].pos.z;
                    this.bodyParts[part].mesh.position.y = hipPivotY + (localY * Math.cos(specificHipFlex) + localZ * Math.sin(specificHipFlex));
                    this.bodyParts[part].mesh.position.z = currentPivotZ + strideZ + (-localY * Math.sin(specificHipFlex) + localZ * Math.cos(specificHipFlex));
                }
            });

            let kneeY = hipPivotY - thighLength * Math.cos(specificHipFlex);
            let kneeZ = currentPivotZ + strideZ + thighLength * Math.sin(specificHipFlex);

            if(this.bodyParts[knee]) {
                this.bodyParts[knee].mesh.position.y = kneeY;
                this.bodyParts[knee].mesh.position.z = kneeZ;
                this.bodyParts[knee].mesh.rotation.x = this.basePositions[knee].rot.x - specificHipFlex;
            }

            let lowerLegPitch = -specificHipFlex + specificKneeFlex;

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

            if(this.bodyParts[foot]) {
                const localY = this.basePositions[foot].pos.y - this.basePositions[knee].pos.y;
                const localZ = this.basePositions[foot].pos.z - this.basePositions[knee].pos.z;
                this.bodyParts[foot].mesh.position.y = kneeY + (localY * Math.cos(lowerLegPitch) - localZ * Math.sin(lowerLegPitch));
                this.bodyParts[foot].mesh.position.z = kneeZ + (localY * Math.sin(lowerLegPitch) + localZ * Math.cos(lowerLegPitch));
                this.bodyParts[foot].mesh.rotation.x = this.basePositions[foot].rot.x + (lowerLegPitch * 0.2);
            }
        };

        let strideZL = 0;
        let strideZR = 0;
        if (this.animState === 'lunge') {
            strideZL = 1.2;
            strideZR = -1.5;
        }

        processLeg('l', hipFlexionL, kneeFlexionL, strideZL);
        processLeg('r', hipFlexionR, kneeFlexionR, strideZR);

        if (['idle', 'plank'].includes(this.animState)) {
             if (this.barbell) this.barbell.visible = false;
             if (this.pullupBar) this.pullupBar.visible = false;
             if (this.dbL) this.dbL.visible = false;
             if (this.dbR) this.dbR.visible = false;
        } else {
             if (['squat', 'deadlift', 'bench', 'press', 'row', 'overhead_press', 'fullbody'].includes(this.animState)) {
                  if (this.barbell) {
                      this.barbell.visible = true;
                      if (this.bodyParts['hand_l'] && this.bodyParts['hand_r']) {
                          const hl = new THREE.Vector3();
                          this.bodyParts['hand_l'].mesh.getWorldPosition(hl);
                          const hr = new THREE.Vector3();
                          this.bodyParts['hand_r'].mesh.getWorldPosition(hr);
                          this.barbell.position.set( (hl.x + hr.x) / 2, (hl.y + hr.y) / 2, (hl.z + hr.z) / 2 );
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

        document.getElementById('vis-day-select').value = "";
        this.animState = exType;
    },

    updateWebGLVisualizer() {
        if (!this.state.schedule || !this.state.webglInitialized) return;
        const select = document.getElementById('vis-day-select');
        const dayIndex = select.value;
        document.getElementById('vis-dict-select').value = '';
        if (dayIndex === '') return;

        const day = this.state.schedule[dayIndex];

        if (day.focus.includes('Lower Body')) this.animState = 'squat';
        else if (day.focus.includes('Upper Body')) this.animState = 'press';
        else if (day.focus.includes('Full Body Strength')) this.animState = 'fullbody';
        else if (day.focus.includes('Maximal Output')) this.animState = 'squat';
        else this.animState = 'idle';
    }
});