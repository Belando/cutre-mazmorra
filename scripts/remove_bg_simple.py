from PIL import Image
import sys
import os

def remove_green(input_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()

        new_data = []
        for item in datas:
            # Target is #00FF00 (0, 255, 0)
            # High tolerance for bright green
            r, g, b, a = item
            
            # Distance from pure green
            # (0, 255, 0)
            
            # Simple heuristic: High Green, Low Red/Blue
            if g > 200 and r < 100 and b < 100:
                new_data.append((0, 0, 0, 0))
            # Also catch slightly darker/varied green bg
            elif g > r + 50 and g > b + 50:
                 new_data.append((0, 0, 0, 0))
            # Checkerboard Grey/White (approx > 220 or uniform grey)
            # Inspect typical checkerboard colors: often #e0e0e0 (224) or #f0f0f0 (240) or pure white
            elif r == g and g == b and r > 200:
                 new_data.append((0, 0, 0, 0))
            # Also catch the dark grey squares of checkerboard (e.g. #cccccc)
            elif r == g and g == b and r > 180:
                 new_data.append((0, 0, 0, 0))
            
            # Magenta Check (R > 200, B > 200, G < 100)
            elif r > 200 and b > 200 and g < 150:
                 new_data.append((0, 0, 0, 0))
            else:
                new_data.append(item)

        # 2. Erosion Pass: Remove 1px border to kill halos
        # Convert processed data to a grid for neighborhood checks
        width, height = img.size
        eroded_data = list(new_data) # Copy

        # Helper to get index
        def idx(x, y):
             return y * width + x

        for y in range(height):
            for x in range(width):
                i = idx(x, y)
                if new_data[i][3] == 0:
                    continue # Already transparent

                # Check neighbors (Up, Down, Left, Right)
                is_border = False
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        ni = idx(nx, ny)
                        if new_data[ni][3] == 0:
                            is_border = True
                            break
                    else:
                        is_border = True # Image edge is border
                        break
                
                if is_border:
                    eroded_data[i] = (0, 0, 0, 0)

        img.putdata(eroded_data)
        img.save(input_path, "PNG")
        print(f"Done: {input_path}")
    except Exception as e:
        print(f"Failed to process {input_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        for f in sys.argv[1:]:
            remove_green(f)
    else:
        print("Usage: python remove_bg_simple.py <file1> <file2> ...")
