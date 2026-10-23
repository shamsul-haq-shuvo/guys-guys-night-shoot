import struct
import json
from pathlib import Path

def get_jpeg_size(file_path):
    try:
        with open(file_path, 'rb') as f:
            data = f.read(2)
            if data != b'\xff\xd8':
                return None, None
            while True:
                marker_data = f.read(4)
                if len(marker_data) < 4:
                    break
                marker, length = struct.unpack('>2sH', marker_data)
                if marker in (b'\xff\xc0', b'\xff\xc2'):
                    mode, height, width = struct.unpack('>BHH', f.read(5))
                    return width, height
                f.seek(length - 2, 1)
    except Exception as e:
        pass
    return None, None

photos_dir = Path('photos')
folders = sorted([d for d in photos_dir.iterdir() if d.is_dir()])
people = []

for folder in folders:
    imgs = sorted([p for p in folder.iterdir() if p.suffix.lower() in ['.jpg', '.jpeg', '.png']])
    photo_list = []
    for img in imgs:
        w, h = get_jpeg_size(img)
        photo_list.append({
            'filename': img.name,
            'url': f'photos/{folder.name}/{img.name}',
            'width': w or 2808,
            'height': h or 4096,
            'isPortrait': (h > w) if (w and h) else True
        })
    
    people.append({
        'id': folder.name.lower().replace(' ', '-').replace('.', ''),
        'name': folder.name,
        'count': len(photo_list),
        'cover': photo_list[0]['url'] if photo_list else '',
        'coverWidth': photo_list[0]['width'] if photo_list else 2808,
        'coverHeight': photo_list[0]['height'] if photo_list else 4096,
        'photos': photo_list
    })

output_file = Path('gallery-data.js')
output_file.write_text(f"window.GUYS_GALLERY_DATA = {json.dumps(people, indent=2)};\n", encoding='utf-8')

json_output_file = Path('gallery-data.json')
json_output_file.write_text(json.dumps(people, indent=2), encoding='utf-8')

print(f"Generated gallery data for {len(people)} people. Total photos: {sum(p['count'] for p in people)}")
