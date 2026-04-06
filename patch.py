with open('js/app.js', 'r') as f:
    content = f.read()

search = """            ['bicep_l', 'tricep_l', 'bicep_r', 'tricep_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y - drop + push * 1.0;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x - push * 0.5;
                }
            });"""

replace = """            ['bicep_l', 'tricep_l', 'bicep_r', 'tricep_r'].forEach(p => {
                if(this.bodyParts[p]) {
                    this.bodyParts[p].mesh.position.y = this.basePositions[p].pos.y + push * 1.0;
                    this.bodyParts[p].mesh.rotation.x = this.basePositions[p].rot.x - push * 0.5;
                }
            });"""

if search in content:
    content = content.replace(search, replace)
    with open('js/app.js', 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Could not find search string")
