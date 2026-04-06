with open("js/app.js", "r") as f:
    content = f.read()

import re

# The previous regex deleted the rest of the schedule rendering block up to the viewExercise method!
fixed_render = """
                tr.onclick = () => this.viewExerciseInVisualizer(day.originalIndex);
                tr.innerHTML = `
                    <td><strong>${day.day}</strong></td>
                    <td><span class="status-badge ${day.phase === 'Recovery' ? 'status-ok' : (day.intensity==='High'?'status-alert':'status-warn')}">${day.phase}</span></td>
                    <td>${day.focus}</td>
                    <td>${day.intensity}</td>
                `;
                tbody.appendChild(tr);
            });
        });

        document.getElementById('schedule-summary').innerText = `Generated 3 alternative repeating microcycles tailored to macrocycle goals, factoring in joint integrity and performance benchmarks.`;
        document.getElementById('schedule-output').style.display = 'block';
    },

    viewExerciseInVisualizer(dayIndex) {
"""

content = re.sub(r'tr\.onclick = \(\) => this\.\s*viewExerciseInVisualizer\(dayIndex\) \{', fixed_render, content, flags=re.DOTALL)

with open("js/app.js", "w") as f:
    f.write(content)
