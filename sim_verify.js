const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Log errors from page
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    await page.goto('http://localhost:3000', {waitUntil: 'networkidle0'});
    await page.evaluate(() => {
        window.app.loadDemoData();
        window.app.showModule('visualizer');

        window.testPose = function(exercise, phaseValue) {
            document.getElementById('vis-dict-select').value = exercise;
            window.app.playDictionaryExercise();

            // Calculate time parameter to yield exact phase.
            // phase = (Math.sin(this.time * speed) + 1) / 2
            // If phase = 0 => sin(...) = -1 => this.time * speed = -PI/2 => this.time = -PI / (2*speed)
            // If phase = 1 => sin(...) = 1 => this.time * speed = PI/2 => this.time = PI / (2*speed)

            const speed = ['press', 'row', 'curl', 'overhead_press'].includes(exercise) ? 3.0 : 2.5;
            let t = phaseValue === 1 ? Math.PI / 2 : -Math.PI / 2;
            window.app.time = t / speed;

            // Force massive delta to insta-complete LERP
            for(let i=0; i<10; i++) window.app.updateProceduralMotion(10.0);

            const hl = new THREE.Vector3();
            if(window.app.bodyParts['hand_l']) window.app.bodyParts['hand_l'].mesh.getWorldPosition(hl);

            const hr = new THREE.Vector3();
            if(window.app.bodyParts['hand_r']) window.app.bodyParts['hand_r'].mesh.getWorldPosition(hr);

            const fl = new THREE.Vector3();
            if(window.app.bodyParts['foot_l']) window.app.bodyParts['foot_l'].mesh.getWorldPosition(fl);

            const p = new THREE.Vector3();
            if(window.app.bodyParts['pelvis']) window.app.bodyParts['pelvis'].mesh.getWorldPosition(p);

            return {
                exercise: exercise,
                phase: phaseValue,
                hand_l: {x: hl.x.toFixed(2), y: hl.y.toFixed(2), z: hl.z.toFixed(2)},
                hand_r: {x: hr.x.toFixed(2), y: hr.y.toFixed(2), z: hr.z.toFixed(2)},
                foot_l: {x: fl.x.toFixed(2), y: fl.y.toFixed(2), z: fl.z.toFixed(2)},
                pelvis: {x: p.x.toFixed(2), y: p.y.toFixed(2), z: p.z.toFixed(2)}
            };
        };
    });

    // Wait a sec for WebGL to init
    await new Promise(r => setTimeout(r, 1000));

    const exercises = ['squat', 'deadlift', 'pullup', 'press', 'plank'];
    for (let ex of exercises) {
        const p0 = await page.evaluate((e) => window.testPose(e, 0), ex);
        const p1 = await page.evaluate((e) => window.testPose(e, 1), ex);

        console.log(`\n=== EXERCISE: ${ex.toUpperCase()} ===`);
        console.log(`PHASE 0 (Bottom/Start): Hand Y=${p0.hand_l.y}, Z=${p0.hand_l.z} | Foot Y=${p0.foot_l.y} | Pelvis Y=${p0.pelvis.y}`);
        console.log(`PHASE 1 (Top/End):      Hand Y=${p1.hand_l.y}, Z=${p1.hand_l.z} | Foot Y=${p1.foot_l.y} | Pelvis Y=${p1.pelvis.y}`);
    }

    await browser.close();
})();
