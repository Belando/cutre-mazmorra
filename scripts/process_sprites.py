from PIL import Image
import sys
import os

def is_green(r, g, b):
    # Aggressive Green: if Green is dominant or close to pure green
    if g > r + 20 and g > b + 20: return True
    dist = ((r - 0)**2 + (g - 255)**2 + (b - 0)**2) ** 0.5
    return dist < 150

def process_grid_rigid(input_path, output_path):
    try:
        print(f"Rigid Grid Processing: {input_path}")
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        pixels = img.load()
        
        # Source Grid (DALL-E standard square)
        SRC_COLS = 4
        SRC_ROWS = 4
        SRC_CELL_W = width // SRC_COLS  # Should be 224 for 1792
        SRC_CELL_H = height // SRC_ROWS # Should be 256 for 1024
        
        # Target Grid (Game Engine)
        DST_CELL_W = 256
        DST_CELL_H = 256
        
        final_w = DST_CELL_W * SRC_COLS
        final_h = DST_CELL_H * SRC_ROWS
        new_img = Image.new("RGBA", (final_w, final_h), (0, 0, 0, 0))
        
        for r in range(SRC_ROWS):
            for c in range(SRC_COLS):
                # 1. Define Source Box
                src_x = c * SRC_CELL_W
                src_y = r * SRC_CELL_H
                
                # 2. Find Content Bounds within this cell
                min_x, max_x = SRC_CELL_W, 0
                min_y, max_y = SRC_CELL_H, 0
                has_content = False
                
                cell_pixels = []
                
                for y in range(SRC_CELL_H):
                    for x in range(SRC_CELL_W):
                        # Global coordinates
                        gx, gy = src_x + x, src_y + y
                        if gx >= width or gy >= height: continue
                        
                        r_val, g_val, b_val, a_val = pixels[gx, gy]
                        
                        if not is_green(r_val, g_val, b_val):
                            if x < min_x: min_x = x
                            if x > max_x: max_x = x
                            if y < min_y: min_y = y
                            if y > max_y: max_y = y
                            has_content = True
                            
                # 3. Copy & Center
                if has_content:
                    # Content Dimensions
                    content_w = max_x - min_x + 1
                    content_h = max_y - min_y + 1
                    
                    # Target Center Offset
                    dst_cell_x = c * DST_CELL_W
                    dst_cell_y = r * DST_CELL_H
                    
                    center_offset_x = (DST_CELL_W - content_w) // 2
                    center_offset_y = (DST_CELL_H - content_h) // 2
                    
                    # Iterate content pixels and copy
                    for y in range(min_y, max_y + 1):
                        for x in range(min_x, max_x + 1):
                            gx, gy = src_x + x, src_y + y
                            r_val, g_val, b_val, a_val = pixels[gx, gy]
                            
                            if is_green(r_val, g_val, b_val): 
                                continue # Skip internal holes? Maybe safer not to? 
                                # Actually, we want to skip background green loops
                            
                            # De-Spill (Green Halo Kill)
                            if g_val > r_val and g_val > b_val:
                                g_val = int(max(r_val, b_val))
                                
                            # Dest Coords
                            dx = dst_cell_x + center_offset_x + (x - min_x)
                            dy = dst_cell_y + center_offset_y + (y - min_y)
                            
                            new_img.putpixel((dx, dy), (r_val, g_val, b_val, 255))

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        new_img.save(output_path, "PNG")
        print(f"Saved Rigid Grid to: {output_path}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_sprites.py <input_path> <output_path>")
    else:
        process_grid_rigid(sys.argv[1], sys.argv[2])
