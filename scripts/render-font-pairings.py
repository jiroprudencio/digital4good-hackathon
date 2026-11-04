"""Standalone type specimens, not browser screenshots. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PAIRS = [
    ('Nunito + DM Sans', 'nunito', 'dmsans', 'Rounded and readable. Recommended.'),
    ('Space Grotesk + Inter', 'spacegrotesk', 'inter', 'Crisp headings, neutral interface.'),
    ('Outfit + Source Sans 3', 'outfit', 'sourcesans3', 'Friendly shapes, clear reading.'),
    ('Pixelify Sans + Nunito Sans', 'pixelifysans', 'nunitosans', 'Pixel headings with smooth body text.'),
    ('Silkscreen + IBM Plex Sans', 'silkscreen', 'ibmplexsans', 'Arcade headings with practical body text.'),
]

def font(name, size, weight=400):
    face = ImageFont.truetype(str(ROOT / 'public' / 'fonts' / f'{name}.ttf'), size)
    try:
        axes = face.get_variation_axes()
        values = [min(a['maximum'], max(a['minimum'], weight)) if a['name'] == b'Weight' else a['default'] for a in axes]
        face.set_variation_by_axes(values)
    except OSError:
        pass
    return face

image = Image.new('RGB', (1440, 2460), '#f7f6f0')
draw = ImageDraw.Draw(image)
ink, muted, line = '#222720', '#5e665a', '#d7d9ce'
draw.text((64, 42), 'Scamagotchi / Font pairings', font=font('inter', 38, 650), fill=ink)
draw.text((64, 100), 'Same sizes and content. Heading family + reading family.', font=font('inter', 24), fill=muted)
for index, (label, heading, body, note) in enumerate(PAIRS):
    y = 166 + index * 450
    draw.line((64, y, 1376, y), fill=line, width=2)
    draw.text((64, y + 22), f'0{index + 1}  {label}', font=font('inter', 27, 600), fill=ink)
    draw.text((64, y + 67), note, font=font('inter', 23), fill=muted)
    draw.text((64, y + 120), 'Scamagotchi', font=font(heading, 64, 700), fill=ink)
    draw.text((900, y + 134), 'SGD 1,000,000', font=font(heading, 38, 700), fill=ink)
    draw.text((64, y + 214), 'Check the payment details', font=font(heading, 36, 700), fill=ink)
    draw.text((64, y + 270), 'A familiar name is not enough. Call your saved contact before sending money.', font=font(body, 28), fill=ink)
    draw.rounded_rectangle((64, y + 330, 302, y + 394), radius=10, fill='#f2ce55')
    draw.text((90, y + 344), 'Open phone', font=font(body, 28, 600), fill=ink)
    draw.text((342, y + 345), '+SGD 20 per tap', font=font(body, 28), fill=ink)
    draw.text((900, y + 345), '0123456789 / I l 1 / O 0', font=font(body, 27), fill=muted)

output = ROOT / 'artifacts' / 'font-pairings.png'
output.parent.mkdir(exist_ok=True)
image.save(output)
print(output)
