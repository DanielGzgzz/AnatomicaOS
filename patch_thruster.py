import re

with open('js/app.js', 'r') as f:
    content = f.read()

search_dict = """                                    <option value="press">Bench Press (Upper Body Push)</option>
                                    <option value="fullbody">Thruster (Full Kinetic Chain)</option>
                                </select>"""

replace_dict = """                                    <option value="press">Bench Press (Upper Body Push)</option>
                                    <option value="fullbody">Thruster (Full Kinetic Chain)</option>
                                    <option value="deadlift">Deadlift (Posterior Chain)</option>
                                </select>"""

# We need to insert the deadlift dict html
with open('index.html', 'r') as f:
    index_content = f.read()
if search_dict in index_content:
    index_content = index_content.replace(search_dict, replace_dict)
    with open('index.html', 'w') as f:
        f.write(index_content)
    print("Patched index.html dictionary")


search_kinematic = """            // Move hands (palms keep connectivity to forearms via additive math)
            ['hand_l', 'hand_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y + push * 2.8;
                    this.bodyParts[p].mesh.position.z = this.basePositions[p].pos.z + push * 3.4;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x + push * 0.8;
                }
            });
        } else {"""

replace_kinematic = """            // Move hands (palms keep connectivity to forearms via additive math)
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

        } else {"""

if search_kinematic in content:
    content = content.replace(search_kinematic, replace_kinematic)
    with open('js/app.js', 'w') as f:
        f.write(content)
    print("Patched kinematics successfully")
else:
    print("Could not find search string for kinematics")


search_playDict = """        } else if (exType === 'fullbody') {
            desc = "ISOLATING: Full Kinetic Chain | INTENSITY: High";
            equipment = "<li><strong>Primary:</strong> Barbell Thrusters / Clean and Press (Full Chain Engagement)</li>";

            // Highlight
            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['quad_l', 'quad_r', 'glute_l', 'glute_r', 'delt_l', 'delt_r', 'tricep_l', 'tricep_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
            ['abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'lower_back', 'calf_l', 'calf_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.mod));
        }"""

replace_playDict = """        } else if (exType === 'fullbody') {
            desc = "ISOLATING: Full Kinetic Chain | INTENSITY: High";
            equipment = "<li><strong>Primary:</strong> Barbell Thrusters / Clean and Press (Full Chain Engagement)</li>";

            // Highlight
            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['quad_l', 'quad_r', 'glute_l', 'glute_r', 'delt_l', 'delt_r', 'tricep_l', 'tricep_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
            ['abs_1l', 'abs_1r', 'abs_2l', 'abs_2r', 'lower_back', 'calf_l', 'calf_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.mod));
        } else if (exType === 'deadlift') {
            desc = "ISOLATING: Posterior Chain | INTENSITY: High";
            equipment = "<li><strong>Primary:</strong> Barbell Deadlift (Glutes, Hamstrings, Erector Spinae)</li>";

            // Highlight
            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['glute_l', 'glute_r', 'ham_l', 'ham_r', 'lower_back', 'traps_l', 'traps_r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
            ['quad_l', 'quad_r', 'lat_l', 'lat_r', 'abs_1l', 'abs_1r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.mod));
        }"""

if search_playDict in content:
    content = content.replace(search_playDict, replace_playDict)
    with open('js/app.js', 'w') as f:
        f.write(content)
    print("Patched playDict successfully")
else:
    print("Could not find search string for playDict")
