import re

with open("js/visualizer.js", "r") as f:
    text = f.read()

# I want to add shoulderAbduction and neckExtension values to exercises
replacements = [
    (
        "t.shoulderFlexion = -t.torsoHinge; // Arms hang straight down (counter-rotate)",
        "t.shoulderFlexion = -t.torsoHinge; // Arms hang straight down\n            t.neckExtension = -t.torsoHinge; // Look forward while hinging"
    ),
    (
        "t.shoulderFlexion = phase * 1.2; // Push forward",
        "t.shoulderFlexion = phase * 1.2; // Push forward\n            t.shoulderAbduction = 0.5 - phase * 0.5; // Flare elbows at bottom"
    ),
    (
        "t.shoulderFlexion = phase * -1.5; // Pull elbows down relative to torso",
        "t.shoulderFlexion = phase * -1.0;\n            t.shoulderAbduction = 1.0; // Wide grip pullup flare"
    ),
    (
        "t.shoulderFlexion = -1.0 + phase * 1.5; // Pull elbows back",
        "t.shoulderFlexion = -1.0 + phase * 1.5; // Pull elbows back\n            t.shoulderAbduction = 0.8; // Flare for row\n            t.neckExtension = -t.torsoHinge; // Look forward"
    ),
    (
        "t.shoulderFlexion = phase * -2.8; // Press straight up",
        "t.shoulderFlexion = phase * -2.8; // Press straight up\n            t.shoulderAbduction = 1.0 - phase; // Flare elbows at bottom"
    )
]

for old, new in replacements:
    text = text.replace(old, new)

with open("js/visualizer.js", "w") as f:
    f.write(text)
