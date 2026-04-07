with open('js/app.js', 'r') as f:
    content = f.read()

search = """        } else if (this.animState === 'press') {
            const phase = (Math.sin(this.time * 3) + 1) / 2; // 0 to 1 smooth
            const recipe = this.exerciseRecipes.press;

            // Interpolate values
            const push = lerp(recipe.start.push, recipe.mid.push, phase);


            // Move arms forward
            ['forearm_l', 'forearm_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + push * 2;
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y + push * 1;
                }
            });
            ['hand_l', 'hand_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + push * 2.2;
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y + push * 1.1;
                    // Rotate palm to face forward during press (like pushing a barbell)
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x - push * Math.PI/2;
                }
            });

            ['bicep_l', 'tricep_l', 'bicep_r', 'tricep_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y + push * 1.0;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x - push * 0.5;
                }
            });"""

replace = """        } else if (this.animState === 'press') {
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
            });"""

if search in content:
    content = content.replace(search, replace)
    with open('js/app.js', 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Could not find search string")
