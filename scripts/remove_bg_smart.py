from PIL import Image
import sys

def remove_bg_smart(input_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        width, height = img.size
        
        # Sample corners to find background color
        corners = [
            datas[0],                   # Top-Left
            datas[width-1],             # Top-Right
            datas[(height-1)*width],    # Bottom-Left
            datas[height*width - 1]     # Bottom-Right
        ]
        
        # Simple voting or just take the first one?
        # Let's take Top-Left as key
        bg_key = corners[0]
        bg_r, bg_g, bg_b, _ = bg_key
        
        print(f"Detected Background Key: {bg_key}")

        threshold = 30 # Tolerance

        new_data = []
        for item in datas:
            r, g, b, a = item
            
            # Check distance to bg_key
            dist = abs(r - bg_r) + abs(g - bg_g) + abs(b - bg_b)
            
            if dist < threshold:
                new_data.append((0, 0, 0, 0))
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(input_path, "PNG")
        print(f"Done: {input_path}")
    except Exception as e:
        print(f"Failed to process {input_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        for f in sys.argv[1:]:
            remove_bg_smart(f)
