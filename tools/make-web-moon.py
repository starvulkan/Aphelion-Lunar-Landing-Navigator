"""Re-encode the texture of NASA's moon_small.glb (SVS 14959) as JPEG for faster loading.
Writes moon_web.glb (4096 px texture, desktops) and moon_mobile.glb (2048 px, phones and tablets).
Geometry and materials are copied unchanged. Needs Pillow:  pip install pillow
Usage:  python3 tools/make-web-moon.py"""
import io, json, struct
from PIL import Image

SRC, QUALITY = 'graphics/models/moon_small.glb', 88
OUTPUTS = {'graphics/models/moon_web.glb': 4096, 'graphics/models/moon_mobile.glb': 2048}

def build(DST, SIZE):
    b = open(SRC, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    bin_start = 20 + jl + 8
    BIN = b[bin_start:bin_start + struct.unpack('<I', b[20 + jl:24 + jl])[0]]
    views = [BIN[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']] for v in j['bufferViews']]

    img = j['images'][0]
    out = io.BytesIO()
    im = Image.open(io.BytesIO(views[img['bufferView']])).convert('RGB')
    if im.width != SIZE: im = im.resize((SIZE, SIZE), Image.LANCZOS)
    im.save(out, 'JPEG', quality=QUALITY, optimize=True)
    views[img['bufferView']] = out.getvalue()
    img['mimeType'] = 'image/jpeg'

    data = bytearray()
    for i, d in enumerate(views):
        while len(data) % 4: data.append(0)
        j['bufferViews'][i]['byteOffset'] = len(data); j['bufferViews'][i]['byteLength'] = len(d); data += d
    while len(data) % 4: data.append(0)
    j['buffers'][0]['byteLength'] = len(data)
    j['asset']['extras'] = {'note': "NASA SVS 14959 moon_small.glb, texture re-encoded PNG->JPEG for web by Aphelion. Credit: NASA's Goddard Space Flight Center."}

    js = json.dumps(j, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    glb = struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(data)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(data), 0x004E4942) + data
    open(DST, 'wb').write(glb)
    print(f'{DST}: {len(glb) / 1e6:.1f} MB')

for dst, size in OUTPUTS.items():
    build(dst, size)
