with open("js/visualizer.js", "r") as f:
    text = f.read()

target = "let forearmPitch = armPitch - finalElbowFlex; // Negative elbow flexion curls it UP (forward in Z!)"
replacement = "let finalElbowFlex = elbowFlexion;\n            let forearmPitch = armPitch - finalElbowFlex; // Negative elbow flexion curls it UP (forward in Z!)"
text = text.replace(target, replacement)

# Clean up duplicate declarations
target2 = "let finalElbowFlex = elbowFlexion;\n            let armYaw"
replacement2 = "let armYaw"
text = text.replace(target2, replacement2)

with open("js/visualizer.js", "w") as f:
    f.write(text)
