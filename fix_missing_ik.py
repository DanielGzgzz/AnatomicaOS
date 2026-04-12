with open("js/visualizer.js", "r") as f:
    text = f.read()

target = """            // Apply special overrides for animations that don't follow generic chain
            if (this.animState === 'press') armPitch = torsoHinge - phase * 1.5;
            if (this.animState === 'pullup') armPitch = torsoHinge - phase * 0.5 + 1.5;

            let armYaw = side === 'l' ? shoulderAbduction : -shoulderAbduction; // Flare elbows!
            let armLength = 1.8;
            let faTotalLength = 2.0; // Forearm + wrist extension distance"""

replacement = """            // Apply special overrides for animations that don't follow generic chain
            if (this.animState === 'press') armPitch = torsoHinge - phase * 1.5;

            let finalElbowFlex = elbowFlexion;
            let armYaw = side === 'l' ? shoulderAbduction : -shoulderAbduction; // Flare elbows!
            let armLength = 1.8;
            let faTotalLength = 2.0; // Forearm + wrist extension distance

            // --- ARM IK SYSTEM ---
            // If the exercise requires hands to be strictly locked to a target (like a pullup bar or barbell),
            // calculate the necessary armPitch and elbowFlexion to reach it from the shoulder pivot!
            if (['squat', 'pullup', 'deadlift', 'row'].includes(this.animState)) {
                let targetY = 0, targetZ = 0;
                let activeIK = false;

                if (this.animState === 'squat') {
                    // Hands locked to barbell on neck
                    targetY = (this.bodyParts['neck'] ? this.bodyParts['neck'].mesh.position.y : 4.0) + 0.8;
                    targetZ = (this.bodyParts['neck'] ? this.bodyParts['neck'].mesh.position.z : 0) - 0.5;
                    activeIK = true;
                } else if (this.animState === 'pullup') {
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
                } else if (this.animState === 'row') {
                    targetY = -1.5 - phase * 3.0; // Pulling up to belly
                    targetZ = 3.0 - phase * 1.0;
                    activeIK = true;
                    armYaw = side === 'l' ? 0.8 : -0.8;
                }

                if (activeIK) {
                    const effArmLength = armLength * Math.cos(armYaw);
                    const effFaLength = faTotalLength * Math.cos(armYaw);

                    const dy = targetY - shoulderPivotY;
                    const dz = targetZ - shoulderPivotZ;
                    const d = Math.sqrt(dy*dy + dz*dz);

                    const maxReach = effArmLength + effFaLength;
                    const clampedD = Math.max(0.1, Math.min(d, maxReach - 0.01));

                    const cosElbow = (effArmLength*effArmLength + effFaLength*effFaLength - clampedD*clampedD) / (2 * effArmLength * effFaLength);
                    finalElbowFlex = Math.PI - Math.acos(Math.max(-1, Math.min(1, cosElbow)));

                    const alpha = Math.acos(Math.max(-1, Math.min(1, (effArmLength*effArmLength + clampedD*clampedD - effFaLength*effFaLength) / (2 * effArmLength * clampedD))));
                    const targetAngle = Math.atan2(dz, -dy);

                    armPitch = targetAngle - alpha;
                    if (this.animState === 'squat' || this.animState === 'pullup') armPitch = targetAngle + alpha;

                    armPitch -= torsoHinge;
                }
            }"""

text = text.replace(target, replacement)
with open("js/visualizer.js", "w") as f:
    f.write(text)
