"""
RecoverFlow Canonical Favicon & Brand Asset Generator
Single source of truth: frontend/public/brand/recoverflow-logo.png
"""
import os
from PIL import Image, ImageFilter

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(REPO_ROOT, "frontend")
PUBLIC_DIR = os.path.join(FRONTEND_DIR, "public")
APP_DIR = os.path.join(FRONTEND_DIR, "app")
BRAND_DIR = os.path.join(PUBLIC_DIR, "brand")

SRC_PATH = os.path.join(BRAND_DIR, "recoverflow-logo.png")

def generate_assets():
    if not os.path.exists(SRC_PATH):
        raise FileNotFoundError(f"Source canonical logo not found at {SRC_PATH}")

    img = Image.open(SRC_PATH).convert("RGBA")
    os.makedirs(BRAND_DIR, exist_ok=True)

    # 1. High-res master 512x512
    img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    img_512.save(os.path.join(BRAND_DIR, "recoverflow-logo-512.png"), format="PNG")
    img_512.save(os.path.join(PUBLIC_DIR, "android-chrome-512x512.png"), format="PNG")

    # 2. PWA / Android 192x192
    img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    img_192.save(os.path.join(PUBLIC_DIR, "android-chrome-192x192.png"), format="PNG")

    # 3. Apple Touch Icon 180x180
    img_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
    img_180.save(os.path.join(PUBLIC_DIR, "apple-touch-icon.png"), format="PNG")
    img_180.save(os.path.join(APP_DIR, "apple-icon.png"), format="PNG")

    # 4. Standard Next.js icon.png (256x256)
    img_256 = img.resize((256, 256), Image.Resampling.LANCZOS)
    img_256.save(os.path.join(PUBLIC_DIR, "icon.png"), format="PNG")
    img_256.save(os.path.join(APP_DIR, "icon.png"), format="PNG")
    img.save(os.path.join(PUBLIC_DIR, "logo.png"), format="PNG")

    # 5. PNG Favicon variants (16x16, 32x32, 48x48) with micro-contrast preservation
    im16 = img.resize((16, 16), Image.Resampling.LANCZOS).filter(
        ImageFilter.UnsharpMask(radius=0.8, percent=130, threshold=2)
    )
    im32 = img.resize((32, 32), Image.Resampling.LANCZOS).filter(
        ImageFilter.UnsharpMask(radius=0.8, percent=110, threshold=2)
    )
    im48 = img.resize((48, 48), Image.Resampling.LANCZOS)

    im16.save(os.path.join(PUBLIC_DIR, "favicon-16x16.png"), format="PNG")
    im32.save(os.path.join(PUBLIC_DIR, "favicon-32x32.png"), format="PNG")
    im32.save(os.path.join(PUBLIC_DIR, "favicon.png"), format="PNG")
    im48.save(os.path.join(PUBLIC_DIR, "favicon-48x48.png"), format="PNG")

    # 6. Multi-resolution favicon.ico
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img_256.save(
        os.path.join(PUBLIC_DIR, "favicon.ico"),
        format="ICO",
        sizes=ico_sizes
    )
    img_256.save(
        os.path.join(APP_DIR, "favicon.ico"),
        format="ICO",
        sizes=ico_sizes
    )

    print("RecoverFlow canonical favicons and brand assets generated successfully!")

if __name__ == "__main__":
    generate_assets()
