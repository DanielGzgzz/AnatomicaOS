with open("js/visualizer.js", "r") as f:
    text = f.read()

# Fix Pullup target
target_pullup = """                } else if (this.animState === 'pullup') {
                    // Hands locked to overhead bar
                    targetY = 11.5;
                    targetZ = 0;
                    activeIK = true;
                    armYaw = side === 'l' ? 1.5 : -1.5;
                } else if (this.animState === 'deadlift') {
                    // Hands locked to barbell hanging or on floor
                    targetY = -1.5 - phase * 5.7; // From thigh to floor
                    targetZ = 2.0 + phase * 1.0;
                    activeIK = true;
                    armYaw = side === 'l' ? 0.2 : -0.2; // Slight flare to clear knees
                }"""

replacement_pullup = """                } else if (this.animState === 'pullup') {
                    // Hands locked to overhead bar
                    targetY = 9.0;
                    targetZ = 0;
                    activeIK = true;
                    armYaw = side === 'l' ? 1.2 : -1.2;
                } else if (this.animState === 'deadlift') {
                    // Hands locked to barbell hanging or on floor
                    // Maximum reach of this model's arms is about Y=-2.0 before the knees must hyper-bend.
                    targetY = 1.0 - phase * 4.0; // From thigh down to mid-shin (-3.0)
                    targetZ = 1.5 + phase * 1.5;
                    activeIK = true;
                    armYaw = side === 'l' ? 0.2 : -0.2; // Slight flare to clear knees
                }"""

text = text.replace(target_pullup, replacement_pullup)

# Fix Pullup Bar UI Position
target_bar = """                  if (this.pullupBar) {
                      this.pullupBar.visible = true;
                      // Fixed bar in world space
                      this.pullupBar.position.set(0, 11.5, 0);
                  }"""

replacement_bar = """                  if (this.pullupBar) {
                      this.pullupBar.visible = true;
                      // Fixed bar in world space
                      this.pullupBar.position.set(0, 9.0, 0);
                  }"""
text = text.replace(target_bar, replacement_bar)


with open("js/visualizer.js", "w") as f:
    f.write(text)
