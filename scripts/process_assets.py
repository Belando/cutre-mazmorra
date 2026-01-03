from PIL import Image
import sys
import os

def is_white(r, g, b):
    # Check if pixel is close to white (Aggressive threshold for shadows)
    return r > 200 and g > 200 and b > 200

def process_single_asset(input_path, output_path, target_size=(128, 128), tolerance=50):
    try:
        print(f"Processing Asset: {input_path} with tolerance {tolerance}")
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        pixels = img.load()
        
        # Create new image
        new_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        new_pixels = new_img.load()
        
        # Detected background color from top-left (usually white)
        bg_color = pixels[0, 0]
        
        # Euclidean distance helper
        def color_dist(c1, c2):
            return ((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2)**0.5

        # Flood Fill to remove background
        # Stack: (x, y)
        stack = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)] 
        visited = set()
        
        # Initialize stack with corners
        # Tolerance for shadows/compression artifacts
        TOLERANCE = tolerance
        
        valid_stack = []
        for sx, sy in stack:
            if color_dist(pixels[sx, sy], bg_color) < TOLERANCE:
                valid_stack.append((sx, sy))
                visited.add((sx, sy))
                
        # Iterative DFS
        while valid_stack:
            cx, cy = valid_stack.pop()
            pixels[cx, cy] = (0, 0, 0, 0) # Make transparent
            
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        # Check if it matches BG color
                        if color_dist(pixels[nx, ny], bg_color) < TOLERANCE:
                            visited.add((nx, ny))
                            valid_stack.append((nx, ny))

        # Re-scan for content bounds
        min_x, max_x = width, 0
        min_y, max_y = height, 0
        has_content = False
        
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                
                if a > 0:
                    if x < min_x: min_x = x
                    if x > max_x: max_x = x
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y
                    has_content = True
        
        if has_content:
            # 2. Crop
            cropped = img.crop((min_x, min_y, max_x + 1, max_y + 1))
            
            # 3. Resize (Keep Aspect Ratio)
            # bound to target_size
            ratio = min(target_size[0] / cropped.width, target_size[1] / cropped.height)
            new_w = int(cropped.width * ratio)
            new_h = int(cropped.height * ratio)
            
            resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # 4. Save
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            resized.save(output_path, "PNG")
            print(f"Saved processed asset to: {output_path}")
        else:
            print("Error: Image appears empty (all white?)")
            
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_assets.py <input_path> <output_path> [tolerance]")
    else:
        tol = 50
        if len(sys.argv) > 3:
            tol = int(sys.argv[3])
        process_single_asset(sys.argv[1], sys.argv[2], tolerance=tol)
