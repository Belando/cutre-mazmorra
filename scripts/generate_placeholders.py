from PIL import Image, ImageDraw
import os

def create_placeholder(filename, size, color, text=None):
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw simple shape
    draw.rectangle([0, 0, size[0]-1, size[1]-1], fill=color, outline=(0,0,0,255))
    
    if text:
        # Simple text representation (optional, might need font, skipping for simplicity)
        pass
        
    # Ensure directory exists
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    img.save(filename)
    print(f"Created {filename}")

# Define assets
assets = [
    {'name': 'public/sprites/tree.png', 'size': (32, 48), 'color': (34, 139, 34, 255)}, # Green Tree
    {'name': 'public/sprites/rock.png', 'size': (32, 32), 'color': (128, 128, 128, 255)}, # Grey Rock
    {'name': 'public/sprites/dungeon_gate.png', 'size': (32, 32), 'color': (20, 20, 20, 255)}, # Dark Gate
    {'name': 'public/sprites/floor_grass.png', 'size': (32, 32), 'color': (100, 200, 100, 255)}, # Light Green Grass
    {'name': 'public/sprites/floor_dirt.png', 'size': (32, 32), 'color': (139, 69, 19, 255)}, # Brown Dirt
    {'name': 'public/sprites/workbench.png', 'size': (32, 32), 'color': (160, 82, 45, 255)}, # Sienna Workbench
]

for asset in assets:
    create_placeholder(asset['name'], asset['size'], asset['color'])
