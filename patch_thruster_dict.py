with open('js/app.js', 'r') as f:
    content = f.read()

search_playDict = """        } else if (exType === 'fullbody') {
            desc = "ISOLATING: Full Kinetic Chain | INTENSITY: High";
            equipment = "<li><strong>Primary:</strong> Barbell Thrusters / Clean and Press (Full Chain Engagement)</li>";

            // Highlight
            const colors = { high: 0xef4444, mod: 0x3b82f6 };
            ['quad_l', 'quad_r', 'glute_l', 'glute_r', 'delt_l', 'delt_r', 'pec_l', 'pec_r', 'tricep_l', 'tricep_r', 'lower_back', 'abs_1l', 'abs_1r'].forEach(p => this.bodyParts[p].mesh.material.color.setHex(colors.high));
        }"""

replace_playDict = """        } else if (exType === 'fullbody') {
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
        }"""

if search_playDict in content:
    content = content.replace(search_playDict, replace_playDict)
    with open('js/app.js', 'w') as f:
        f.write(content)
    print("Patched playDict successfully")
else:
    print("Could not find search string for playDict")
