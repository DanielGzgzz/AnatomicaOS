import re

with open('index.html', 'r') as f:
    content = f.read()

# I want to insert the webgl-container after the form-group of vis-day-select
search = """                        <div class="form-group mb-1" style="display: none;">
                            <select id="vis-day-select" onchange="app.updateWebGLVisualizer()"></select>
                        </div>"""

replace = """                        <div class="form-group mb-1" style="display: none;">
                            <select id="vis-day-select" onchange="app.updateWebGLVisualizer()"></select>
                        </div>
                    </div>
                    <div id="webgl-container" style="background-color: var(--bg-card); border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); min-height: 500px; position: relative; overflow: hidden; display: flex; justify-content: center; align-items: center; cursor: grab;">
                        <!-- WebGL Canvas Injected Here -->
                        <div id="webgl-overlay" style="position: absolute; top: 10px; left: 10px; color: var(--text-muted); font-family: 'Courier New', monospace; font-size: 12px; pointer-events: none;">
                            SYS.OPT: ONLINE<br>
                            RENDER: WebGL_PolyMesh_v2<br>
                            ORBIT: Active
                        </div>
                        <div id="muscle-tooltip" style="position: absolute; display: none; background: rgba(255, 255, 255, 0.95); color: var(--text-main); padding: 8px 12px; border: 1px solid var(--accent-blue); border-radius: 4px; pointer-events: none; font-size: 12px; font-weight: bold; font-family: var(--font-mono); box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 10;">
                        </div>
                    </div>"""

if search in content:
    content = content.replace(search, replace)
    with open('index.html', 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Could not find search string")
