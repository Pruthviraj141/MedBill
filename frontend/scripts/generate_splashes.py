import os
from PIL import Image, ImageDraw, ImageFont

def generate_splash(width, height, is_night=False):
    # Background color
    bg_color = (15, 23, 42, 255) if is_night else (248, 250, 252, 255) # Slate-900 / Slate-50
    img = Image.new("RGBA", (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # Load master logo
    logo = Image.open("frontend/src/assets/logo.png").convert("RGBA")
    
    # Scale logo to ~25% of min dimension
    min_dim = min(width, height)
    logo_size = int(min_dim * 0.28)
    logo_size = max(64, min(logo_size, 320))
    logo_scaled = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

    # Position logo slightly above center
    logo_x = (width - logo_size) // 2
    logo_y = (height - logo_size) // 2 - int(logo_size * 0.2)
    img.paste(logo_scaled, (logo_x, logo_y), logo_scaled)

    # Text colors
    title_color = (255, 255, 255, 255) if is_night else (15, 23, 42, 255)
    sub_color = (56, 189, 248, 255) if is_night else (2, 132, 199, 255) # Sky-400 / Sky-600

    # Draw simple fallback text below logo
    text_y = logo_y + logo_size + int(logo_size * 0.15)
    
    # Bottom branding: By @Rudra Info Tech
    footer_text = "Product of @Rudra Info Tech"
    footer_y = height - int(height * 0.08)
    
    # Draw simple clean badges / text using basic font
    try:
        # Check if default font or ttf available
        font_size = max(14, int(min_dim * 0.045))
        font = ImageFont.load_default()
    except Exception:
        font = None

    return img

if __name__ == "__main__":
    res_dir = "frontend/android/app/src/main/res"
    # Find all splash.png paths
    for root, dirs, files in os.walk(res_dir):
        for f in files:
            if f == "splash.png":
                path = os.path.join(root, f)
                with Image.open(path) as orig:
                    w, h = orig.size
                    mode = orig.mode
                is_night = "night" in root
                splash = generate_splash(w, h, is_night)
                if mode == "RGB":
                    splash = splash.convert("RGB")
                splash.save(path)
                print(f"Updated splash: {path} ({w}x{h}, night={is_night})")
