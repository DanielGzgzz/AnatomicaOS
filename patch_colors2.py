with open("js/app.js", "r") as f:
    content = f.read()

# Fix the animation loop color reset issue
content = content.replace("part.mesh.material.color.setHex(0x222222);", "part.mesh.material.color.setHex(0xd2b48c); // Reset to fleshy color")

with open("js/app.js", "w") as f:
    f.write(content)
