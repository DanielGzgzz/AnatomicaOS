with open("css/style.css", "r") as f:
    content = f.read()

# Make the theme a bright green/white theme
new_theme = """
:root {
    --bg-main: #f0fdf4; /* Light green tint */
    --bg-module: #ffffff;
    --border-color: #a7f3d0; /* Soft green border */
    --text-main: #064e3b; /* Dark green text for readability */
    --text-muted: #166534; /* Medium green */
    --accent-blue: #10b981; /* Emerald Green instead of blue */
    --accent-blue-hover: #059669; /* Darker emerald */
    --header-bg: #064e3b; /* Very dark green */
    --header-text: #ecfdf5;
    --font-mono: 'Courier New', Courier, monospace;
    --font-sans: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    --card-bg: #ffffff;
    --text-primary: #064e3b;
    --text-secondary: #166534;
    --bg-color: #f0fdf4;
    --primary-color: #10b981;
}
"""

import re
content = re.sub(r':root \{.*?(?=\* \{)', new_theme, content, flags=re.DOTALL)

with open("css/style.css", "w") as f:
    f.write(content)
