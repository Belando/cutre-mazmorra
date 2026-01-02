
from PIL import Image
import sys

def remove_background(image_path, mode="auto"):
    print(f"Processing {image_path} with mode {mode}...")
    try:
        img = Image.open(image_path).convert("RGBA")
        datas = img.getdata()
        
        # Sample corners for background color if auto
        width, height = img.size
        
        targets = []
        tolerance = 25 # Default tolerance
        
        if mode == "black":
            # Target pure black and very dark colors
            targets.append((0, 0, 0, 255))
            targets.append((0, 0, 0))
            # Lower tolerance to avoid eating into dark forest sprites
            tolerance = 10 
            print("Mode BLACK: Targeting black background with strict tolerance.")
        elif mode == "white":
            # Target pure white
            targets.append((255, 255, 255, 255))
            targets.append((255, 255, 255))
            tolerance = 60 # Increased tolerance for white/light artifacts
            print("Mode WHITE: Targeting white background with strict tolerance.")
        else:
            # AUTO / GRID mode
            corners = [
                datas[0],                   # Top-left
                datas[width-1],             # Top-right
                datas[(height-1)*width],    # Bottom-left
                datas[len(datas)-1]         # Bottom-right
            ]
            for c in corners:
                targets.append(c)
            
            # Hardcode common grid colors
            targets.append((255, 255, 255, 255))
            targets.append((255, 255, 255)) 
            targets.append((236, 236, 234, 255))
            targets.append((180, 180, 180, 255))
            targets.append((204, 204, 204, 255))
            targets.append((240, 240, 240, 255))
            print(f"Mode AUTO: Sampled corners + Grid defaults: {targets}")
        
        newData = []
        
        for item in datas:
            is_bg = False
            for target in targets:
                # Handle target vs item length mismatch
                r_diff = item[0] - target[0]
                g_diff = item[1] - target[1]
                b_diff = item[2] - target[2]
                
                dist_sq = r_diff*r_diff + g_diff*g_diff + b_diff*b_diff
                
                if dist_sq < (tolerance * tolerance):
                    is_bg = True
                    break
            
            if is_bg:
                newData.append((0, 0, 0, 0)) # Transparent
            else:
                newData.append(item)
        
        img.putdata(newData)
        img.save(image_path, "PNG")
        print(f"Saved fixed image to {image_path}")
        
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fix_transparency.py [--mode=black/auto] <file1> <file2> ...")
    else:
        mode = "auto"
        files = []
        for arg in sys.argv[1:]:
            if arg.startswith("--mode="):
                mode = arg.split("=")[1]
            else:
                files.append(arg)
                
        for f in files:
            remove_background(f, mode)
