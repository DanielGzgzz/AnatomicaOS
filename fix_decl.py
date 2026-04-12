with open("js/visualizer.js", "r") as f:
    text = f.read()

target = """            let finalElbowFlex = elbowFlexion;
            let forearmPitch = armPitch - finalElbowFlex; // Negative elbow flexion curls it UP (forward in Z!)"""

replacement = """            let forearmPitch = armPitch - finalElbowFlex; // Negative elbow flexion curls it UP (forward in Z!)"""

text = text.replace(target, replacement)
with open("js/visualizer.js", "w") as f:
    f.write(text)
