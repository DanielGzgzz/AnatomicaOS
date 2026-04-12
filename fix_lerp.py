with open("js/visualizer.js", "r") as f:
    text = f.read()

target = "const lerpSpeed = 5.0 * delta;"
replacement = "const lerpSpeed = Math.min(1.0, 5.0 * delta);"
text = text.replace(target, replacement)

with open("js/visualizer.js", "w") as f:
    f.write(text)
