from PIL import Image
import sys

def stabilize_torch_absolute(path):
    print(f"Stabilizing {path} with absolute handle transplant...")
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    n_frames = 4
    frame_w = w // n_frames
    
    frames = []
    for i in range(n_frames):
        frames.append(img.crop((i * frame_w, 0, (i + 1) * frame_w, h)))
        
    # Master Base: Frame 0
    base_frame = frames[0]
    
    # Split point: Where does the handle end and fire begin?
    # Assuming fire is top 40%, handle is bottom 60%.
    # Let's be conservative and take bottom 55% as pure static base.
    split_y = int(h * 0.45) 
    
    print(f"Transplanting bottom section from y={split_y} to {h}")
    
    static_base = base_frame.crop((0, split_y, frame_w, h))
    
    new_img = Image.new("RGBA", (w, h), (0,0,0,0))
    
    for i in range(n_frames):
        # Start with the original frame (for the fire on top)
        frame = frames[i]
        
        # Paste the static base over the bottom
        frame.paste(static_base, (0, split_y))
        
        # Add to sheet
        new_img.paste(frame, (i * frame_w, 0))
        
    new_img.save(path)
    print("Absolute stabilization complete.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        stabilize_torch_absolute(sys.argv[1])
