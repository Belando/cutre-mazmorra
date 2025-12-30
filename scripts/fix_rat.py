from PIL import Image
import os

def fix_rat(path):
    print(f"Fixing {path}...")
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    
    count = 0
    # Scan for yellow/green halo pixels
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a < 10: continue
            
            # Detect Yellowish Halo
            # Yellow is High Red + High Green, Low Blue
            if r > 100 and g > 100 and b < 100:
                # If it's a fringe pixel (semi-transparent or low saturation but clearly yellow/green)
                # Or just check if specific "bad yellow"
                
                # Check for "Green Screen" leftovers: G > R and G > B
                if g > r + 20 and g > b + 20: 
                    pixels[x, y] = (0, 0, 0, 0)
                    count += 1
                    continue

                # Check for "Yellow" border (artifact from previous processing?): R~G >> B
                # Broader Yellow detection: Red and Green are dominant over Blue
                if r > b + 30 and g > b + 30:
                     # Check if it's actually yellow-ish (R and G similar)
                     if abs(r - g) < 50:
                         # It is yellow-ish. If it's not very dark (shadow), kill it.
                         if r > 50:
                            pixels[x, y] = (0, 0, 0, 0)
                            count += 1

                         
    img.save(path)
    print(f"Fixed {path}, removed {count} pixels.")

if __name__ == "__main__":
    fix_rat("public/sprites/rat_v3.png")
