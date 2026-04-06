with open("js/app.js", "r") as f:
    content = f.read()

# Update the 3D grid line colors for the white background
content = content.replace("this.gridHelper = new THREE.GridHelper(50, 50, 0x10b981, 0x111827);", "this.gridHelper = new THREE.GridHelper(50, 50, 0xa7f3d0, 0xd1d5db);")

with open("js/app.js", "w") as f:
    f.write(content)
