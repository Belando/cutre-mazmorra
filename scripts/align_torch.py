from PIL import Image, ImageChops
import sys
import math

def align_torch_precise(path):
    print(f"Aligning {path} with precision...")
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    n_frames = 4
    frame_w = w // n_frames
    
    frames = []
    for i in range(n_frames):
        frames.append(img.crop((i * frame_w, 0, (i + 1) * frame_w, h)))
        
    # Region of interest: The handle (Bottom 40% of the image)
    # This should be static.
    roi_top = int(h * 0.6)
    roi_bottom = h
    roi_left = 0
    roi_right = frame_w
    
    base_frame = frames[0]
    
    offsets = [(0, 0)] # First frame is reference
    
    for i in range(1, n_frames):
        curr_frame = frames[i]
        best_off = (0, 0)
        min_diff = float('inf')
        
        # Search range: +/- 10 pixels
        search_range = 10
        
        for dy in range(-search_range, search_range + 1):
            for dx in range(-search_range, search_range + 1):
                # Create a shifted version of current frame's ROI
                # We only care about matching pixels in the ROI
                
                # Simple pixel diff sum
                diff = 0
                
                # Check intersection of ROI with shifted ROI
                # Ideally, we just shift the current frame overlay and compare with base
                
                # Optimization: iterate pixels in ROI
                # This is slow in pure python but fine for 64x64 sprites
                
                # Let's use ImageChops for speed
                shifted = Image.new("RGBA", (frame_w, h))
                shifted.paste(curr_frame, (dx, dy))
                
                # Crop to ROI
                roi_base = base_frame.crop((0, roi_top, frame_w, roi_bottom))
                roi_shift = shifted.crop((0, roi_top, frame_w, roi_bottom))
                
                # Calculate difference
                diff_img = ImageChops.difference(roi_base, roi_shift)
                # Sum alpha or something? Diff is RGB
                # Gray scale
                gray = diff_img.convert("L")
                hist = gray.histogram()
                # Sum of (pixel_val * count)
                score = sum(i * n for i, n in enumerate(hist))
                
                if score < min_diff:
                    min_diff = score
                    best_off = (dx, dy)
        
        offsets.append(best_off)
        print(f"Frame {i} offset: {best_off} (Score: {min_diff})")
        
    # Reconstruct
    new_img = Image.new("RGBA", (w, h), (0,0,0,0))
    for i, frame in enumerate(frames):
        dx, dy = offsets[i]
        # We want to APPLY the shift that made it match base
        # So paste at (i*w + dx, dy)
        new_img.paste(frame, (i * frame_w + dx, dy))
        
    new_img.save(path)
    print("Precision alignment complete.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        align_torch_precise(sys.argv[1])
