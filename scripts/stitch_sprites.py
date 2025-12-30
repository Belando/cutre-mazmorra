
from PIL import Image
import sys
import os
import math

def clean_and_extract_grid(input_path, rows=4, cols=4, limit_cols=None):
    print(f"Loading {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    cell_w = w // cols
    cell_h = h // rows
    
    tgt_size = 256
    
    output_cols = limit_cols if limit_cols is not None else cols
    clean_img = Image.new("RGBA", (output_cols * tgt_size, rows * tgt_size), (0,0,0,0))
    pixels = img.load()
    
    # Calculate safe area to ignore text labels (typically on top/left)
    margin_top = int(cell_h * 0.1) # Ignore top 10%
    margin_left = int(cell_w * 0.15) # Ignore left 15% (where "DOWN", "LEFT" etc usually are)

    for r in range(rows):
        for c in range(cols):
            # If we requested fewer columns, skip the rest (e.g. for Goblin King variants)
            if limit_cols is not None and c >= limit_cols: 
                continue

            src_x = c * cell_w
            src_y = r * cell_h
            
            # --- STEP 1: FIND BACKGROUND REFERENCE COLOR ---
            # Scan corners (with offset) to find the "greenest" pixel (highest G value)
            corners_offsets = [
                (margin_left + 5, margin_top + 5), (cell_w-6, margin_top + 5), 
                (margin_left + 5, cell_h-6), (cell_w-6, cell_h-6),
                (cell_w//2, cell_h//2) # Center too
            ]
            
            best_ref = (0, 255, 0) # Default fallback
            max_g_found = -1
            
            for off_x, off_y in corners_offsets:
                gx, gy = src_x + off_x, src_y + off_y
                if gx < w and gy < h:
                    pr, pg, pb, _ = pixels[gx, gy]
                    # We want the brightest green
                    if pg > max_g_found:
                        max_g_found = pg
                        best_ref = (pr, pg, pb)
            
            ref_r, ref_g, ref_b = best_ref
            
            # --- STEP 2: SCAN CONTENT with CHROMA KEY ---
            min_x, max_x = cell_w, 0
            min_y, max_y = cell_h, 0
            content_pixels = []
            
            for y in range(cell_h):
                if y < margin_top: continue # Skip top margin (text labels)

                for x in range(cell_w):
                    if x < margin_left: continue # Skip left margin (text labels)

                    gx, gy = src_x + x, src_y + y
                    if gx >= w or gy >= h: continue
                    
                    rgb = pixels[gx, gy]
                    pr, pg, pb = rgb[0], rgb[1], rgb[2]
                    
                    is_background = False
                    
                    # 1. Dark Protection: If it's dark, it's NOT background (Shadows/Fur)
                    if pg < 80:
                        is_background = False
                    else:
                        # 2. Euclidean Distance to Reference
                        dist = math.sqrt((pr - ref_r)**2 + (pg - ref_g)**2 + (pb - ref_b)**2)
                        if dist < 90: # Liberal tolerance for background
                            is_background = True
                        
                        # 3. Dominant Green Safety: If it's super green, it's background
                        if pg > pr + 40 and pg > pb + 40:
                            is_background = True

                    if not is_background:
                        content_pixels.append((x, y, rgb))
                        if x < min_x: min_x = x
                        if x > max_x: max_x = x
                        if y < min_y: min_y = y
                        if y > max_y: max_y = y

            # --- STEP 3: COPY & CENTER ---
            if content_pixels:
                cw = max_x - min_x + 1
                ch = max_y - min_y + 1
                
                # Center in Target Cell
                dst_cell_x = c * tgt_size
                dst_cell_y = r * tgt_size
                
                off_x = (tgt_size - cw) // 2
                off_y = (tgt_size - ch) // 2
                
                for x, y, (pr, pg, pb, pa) in content_pixels:
                    # Despill: Remove green halo from edges
                    if pg > pr and pg > pb:
                         # Clamp Green to max of Red/Blue
                         pg = int(max(pr, pb))
                    
                    # Target Coordinates
                    dest_x = dst_cell_x + off_x + (x - min_x)
                    dest_y = dst_cell_y + off_y + (y - min_y)
                    
                    clean_img.putpixel((dest_x, dest_y), (pr, pg, pb, 255)) # Force Alpha 255
                        
    return clean_img

def stitch_sheets(walk_path, attack_path, output_path, limit_cols=None):
    # limit_cols: If set (e.g. 2), only take the first N columns from the input sheet
    # This handles cases where DALL-E generates variants side-by-side
    
    # Allow passing limit_cols via argv[4] if present
    
    print("Processing Walk Sheet...")
    # Input is ALWAYS 4 cols, output is limited
    walk_img = clean_and_extract_grid(walk_path, 4, 4, limit_cols)
    
    atk_img = None
    if attack_path and attack_path.lower() != "none":
        print("Processing Attack Sheet...")
        atk_img = clean_and_extract_grid(attack_path, 4, 4, limit_cols)
    
    # Combined: double the width (Walk + Attack) if Attack exists
    
    used_cols = 4 if limit_cols is None else limit_cols 
    
    if atk_img:
        final_w = 256 * (used_cols * 2)
    else:
        final_w = 256 * used_cols
        
    final_h = 256 * 4
    final_img = Image.new("RGBA", (final_w, final_h), (0,0,0,0))
    
    for r in range(4):
        # Walk Row r
        walk_row_crop = walk_img.crop((0, r*256, used_cols*256, (r+1)*256))
        
        # Paste into final
        dest_y = r * 256
        final_img.paste(walk_row_crop, (0, dest_y))
        
        if atk_img:
            # Attack Row r
            atk_row_crop = atk_img.crop((0, r*256, used_cols*256, (r+1)*256))
            final_img.paste(atk_row_crop, (used_cols*256, dest_y))
        
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_img.save(output_path)
    print(f"Saved Combined Sheet: {output_path}")

if __name__ == "__main__":
    path1 = sys.argv[1]
    path2 = sys.argv[2]
    out = sys.argv[3]
    limit = int(sys.argv[4]) if len(sys.argv) > 4 else None
    
    stitch_sheets(path1, path2, out, limit)
