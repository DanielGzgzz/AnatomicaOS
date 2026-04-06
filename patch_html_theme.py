with open("index.html", "r") as f:
    content = f.read()

# Fix inline dark theme colors across the HTML elements
content = content.replace("background: #111827;", "background: #f9fafb; border: 1px solid #d1d5db;")
content = content.replace("color: #e5e7eb;", "color: #1f2937;")
content = content.replace("color: #f9fafb;", "color: #111827;")
content = content.replace("color: #60a5fa;", "color: #059669;") # Blue to Green
content = content.replace("color: #34d399;", "color: #047857;") # Light green to Darker green text
content = content.replace("border-bottom: 1px solid #374151;", "border-bottom: 1px solid #d1d5db;")
content = content.replace("border-top: 1px solid #374151;", "border-top: 1px solid #d1d5db;")
content = content.replace("background-color: #1f2937;", "background-color: #e5e7eb;")

# Update the visualizer background container inline style
content = content.replace("background-color: #0a0a0c; border: 2px solid #1f2937;", "background-color: #ffffff; border: 2px solid #a7f3d0;")

with open("index.html", "w") as f:
    f.write(content)
