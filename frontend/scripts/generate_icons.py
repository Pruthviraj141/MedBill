import math
import os
from PIL import Image, ImageDraw, ImageFilter

def create_medbill_icon(size=1024):
    # Render at 4x resolution for super-sampled anti-aliasing
    scale = 4
    W = size * scale
    H = size * scale

    # Master canvas with transparency
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background Rounded Squircle
    padding = int(W * 0.05)
    corner_radius = int(W * 0.24)
    x0, y0 = padding, padding
    x1, y1 = W - padding, H - padding

    # Create gradient background
    bg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)

    # Vertical / diagonal gradient: #0284c7 (Sky Blue) to #059669 (Emerald) to #0f766e (Dark Teal)
    c1 = (2, 132, 199)    # #0284c7
    c2 = (13, 148, 136)   # #0d9488
    c3 = (5, 150, 105)    # #059669

    # Draw gradient with squircle mask
    mask = Image.new("L", (W, H), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([x0, y0, x1, y1], radius=corner_radius, fill=255)

    # Gradient buffer
    grad = Image.new("RGBA", (W, H))
    grad_draw = ImageDraw.Draw(grad)
    for y in range(H):
        t = y / float(H)
        if t < 0.5:
            f = t / 0.5
            r = int(c1[0] * (1 - f) + c2[0] * f)
            g = int(c1[1] * (1 - f) + c2[1] * f)
            b = int(c1[2] * (1 - f) + c2[2] * f)
        else:
            f = (t - 0.5) / 0.5
            r = int(c2[0] * (1 - f) + c3[0] * f)
            g = int(c2[1] * (1 - f) + c3[1] * f)
            b = int(c2[2] * (1 - f) + c3[2] * f)
        grad_draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Apply mask
    bg.paste(grad, (0, 0), mask)

    # Add subtle top highlight (glass / ambient sheen)
    sheen = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sheen_draw = ImageDraw.Draw(sheen)
    sheen_draw.rounded_rectangle([x0 + 10, y0 + 10, x1 - 10, y0 + int(H * 0.45)], radius=corner_radius, fill=(255, 255, 255, 35))
    sheen_mask = Image.new("L", (W, H), 0)
    sheen_mask_draw = ImageDraw.Draw(sheen_mask)
    for y in range(y0, y0 + int(H * 0.45)):
        alpha = int(255 * (1.0 - (y - y0) / (H * 0.45)))
        sheen_mask_draw.line([(0, y), (W, y)], fill=alpha)
    sheen = Image.composite(sheen, Image.new("RGBA", (W, H), (0, 0, 0, 0)), sheen_mask)
    sheen = Image.composite(sheen, Image.new("RGBA", (W, H), (0, 0, 0, 0)), mask)
    bg = Image.alpha_composite(bg, sheen)

    # 2. Central Symbol: Modern Medical Cross + Pill Emblem
    cx = W // 2
    cy = H // 2
    cross_span = int(W * 0.52)
    cross_thick = int(W * 0.17)
    r_cross = int(cross_thick * 0.32)

    # Subtle drop shadow behind the cross
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    # Horizontal bar shadow
    s_draw.rounded_rectangle(
        [cx - cross_span // 2, cy - cross_thick // 2 + int(W * 0.02),
         cx + cross_span // 2, cy + cross_thick // 2 + int(W * 0.02)],
        radius=r_cross, fill=(0, 30, 50, 90)
    )
    # Vertical bar shadow
    s_draw.rounded_rectangle(
        [cx - cross_thick // 2, cy - cross_span // 2 + int(W * 0.02),
         cx + cross_thick // 2, cy + cross_span // 2 + int(W * 0.02)],
        radius=r_cross, fill=(0, 30, 50, 90)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=int(W * 0.025)))
    bg = Image.alpha_composite(bg, shadow)

    # Foreground Cross in crisp pure white
    cross = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(cross)

    # Horizontal arm
    c_draw.rounded_rectangle(
        [cx - cross_span // 2, cy - cross_thick // 2,
         cx + cross_span // 2, cy + cross_thick // 2],
        radius=r_cross, fill=(255, 255, 255, 255)
    )
    # Vertical arm
    c_draw.rounded_rectangle(
        [cx - cross_thick // 2, cy - cross_span // 2,
         cx + cross_thick // 2, cy + cross_span // 2],
        radius=r_cross, fill=(255, 255, 255, 255)
    )

    # Add stylized medical pharmacy pill accent inside the cross center
    # Diagonal capsule accent in center
    pill_w = int(cross_thick * 0.65)
    pill_h = int(cross_thick * 1.5)
    pill_canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    p_draw = ImageDraw.Draw(pill_canvas)

    # Left half: medical cyan #0284c7, Right half: emerald #10b981
    p_cx = cx
    p_cy = cy
    # Draw rotated capsule or modern circular/heartbeat groove in center
    inner_r = int(cross_thick * 0.35)
    c_draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r], fill=(240, 249, 255, 255))
    inner_accent_r = int(cross_thick * 0.22)
    c_draw.ellipse([cx - inner_accent_r, cy - inner_accent_r, cx + inner_accent_r, cy + inner_accent_r], fill=(2, 132, 199, 255))

    bg = Image.alpha_composite(bg, cross)

    # Downsample with Lanczos high-quality filter
    final_icon = bg.resize((size, size), Image.Resampling.LANCZOS)
    return final_icon

def create_adaptive_foreground(size=512):
    # Android Adaptive foreground: 108dp canvas where icon safe zone is central 66dp (~61% diameter)
    scale = 4
    W = size * scale
    H = size * scale
    fg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(fg)

    cx = W // 2
    cy = H // 2
    # Safe zone fits within 60% of W
    cross_span = int(W * 0.44)
    cross_thick = int(W * 0.15)
    r_cross = int(cross_thick * 0.32)

    # Shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle(
        [cx - cross_span // 2, cy - cross_thick // 2 + int(W * 0.015),
         cx + cross_span // 2, cy + cross_thick // 2 + int(W * 0.015)],
        radius=r_cross, fill=(0, 25, 45, 100)
    )
    s_draw.rounded_rectangle(
        [cx - cross_thick // 2, cy - cross_span // 2 + int(W * 0.015),
         cx + cross_thick // 2, cy + cross_span // 2 + int(W * 0.015)],
        radius=r_cross, fill=(0, 25, 45, 100)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=int(W * 0.02)))
    fg = Image.alpha_composite(fg, shadow)

    # White cross
    cross = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cr_draw = ImageDraw.Draw(cross)
    cr_draw.rounded_rectangle(
        [cx - cross_span // 2, cy - cross_thick // 2,
         cx + cross_span // 2, cy + cross_thick // 2],
        radius=r_cross, fill=(255, 255, 255, 255)
    )
    cr_draw.rounded_rectangle(
        [cx - cross_thick // 2, cy - cross_span // 2,
         cx + cross_thick // 2, cy + cross_span // 2],
        radius=r_cross, fill=(255, 255, 255, 255)
    )

    inner_r = int(cross_thick * 0.35)
    cr_draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r], fill=(240, 249, 255, 255))
    inner_accent_r = int(cross_thick * 0.22)
    cr_draw.ellipse([cx - inner_accent_r, cy - inner_accent_r, cx + inner_accent_r, cy + inner_accent_r], fill=(2, 132, 199, 255))

    fg = Image.alpha_composite(fg, cross)
    return fg.resize((size, size), Image.Resampling.LANCZOS)

def create_adaptive_background(size=512):
    # Full bleed background for adaptive icon
    img = Image.new("RGBA", (size, size))
    draw = ImageDraw.Draw(img)
    c1 = (2, 132, 199)    # Sky
    c2 = (13, 148, 136)   # Teal
    c3 = (5, 150, 105)    # Emerald
    for y in range(size):
        t = y / float(size)
        if t < 0.5:
            f = t / 0.5
            r = int(c1[0] * (1 - f) + c2[0] * f)
            g = int(c1[1] * (1 - f) + c2[1] * f)
            b = int(c1[2] * (1 - f) + c2[2] * f)
        else:
            f = (t - 0.5) / 0.5
            r = int(c2[0] * (1 - f) + c3[0] * f)
            g = int(c2[1] * (1 - f) + c3[1] * f)
            b = int(c2[2] * (1 - f) + c3[2] * f)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    return img

def create_round_icon(size=512):
    # Perfect circular icon for ic_launcher_round
    base = create_medbill_icon(size)
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([int(size * 0.04), int(size * 0.04), int(size * 0.96), int(size * 0.96)], fill=255)
    round_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    round_img.paste(base, (0, 0), mask)
    return round_img

if __name__ == "__main__":
    print("Generating MedBill icons...")
    # Master logo
    master = create_medbill_icon(1024)
    master.save("frontend/src/assets/logo.png")
    master.save("frontend/public/android-chrome-512x512.png")
    master.resize((192, 192), Image.Resampling.LANCZOS).save("frontend/public/android-chrome-192x192.png")
    master.resize((180, 180), Image.Resampling.LANCZOS).save("frontend/public/apple-touch-icon.png")
    master.resize((32, 32), Image.Resampling.LANCZOS).save("frontend/public/favicon-32x32.png")
    master.resize((16, 16), Image.Resampling.LANCZOS).save("frontend/public/favicon-16x16.png")
    print("Master web assets generated.")

    # Android mipmaps
    densities = {
        "mdpi": 48,
        "hdpi": 72,
        "xhdpi": 96,
        "xxhdpi": 144,
        "xxxhdpi": 192
    }

    res_dir = "frontend/android/app/src/main/res"
    for d, s in densities.items():
        folder = os.path.join(res_dir, f"mipmap-{d}")
        os.makedirs(folder, exist_ok=True)
        # Standard launcher
        icon = master.resize((s, s), Image.Resampling.LANCZOS)
        icon.save(os.path.join(folder, "ic_launcher.png"))
        # Round launcher
        r_icon = create_round_icon(s)
        r_icon.save(os.path.join(folder, "ic_launcher_round.png"))
        # Foreground (for adaptive icon)
        fg_s = int(s * (108.0 / 48.0)) # 108dp equivalent
        fg = create_adaptive_foreground(fg_s)
        fg.save(os.path.join(folder, "ic_launcher_foreground.png"))
        # Background (for adaptive icon)
        bg = create_adaptive_background(fg_s)
        bg.save(os.path.join(folder, "ic_launcher_background.png"))
        print(f"Generated mipmap-{d} ({s}x{s}, fg={fg_s}x{fg_s})")

    # Update ldpi if exists
    ldpi_folder = os.path.join(res_dir, "mipmap-ldpi")
    if os.path.exists(ldpi_folder):
        master.resize((36, 36), Image.Resampling.LANCZOS).save(os.path.join(ldpi_folder, "ic_launcher.png"))
        create_round_icon(36).save(os.path.join(ldpi_folder, "ic_launcher_round.png"))
        create_adaptive_foreground(81).save(os.path.join(ldpi_folder, "ic_launcher_foreground.png"))
        create_adaptive_background(81).save(os.path.join(ldpi_folder, "ic_launcher_background.png"))
        print("Generated mipmap-ldpi")

    print("All Android & web icons successfully generated!")
