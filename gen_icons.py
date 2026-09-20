import zlib, struct

def png(path, size):
    w = h = size
    rows = []
    cx, cy = w/2, h/2
    r_out = size*0.42
    r_in = size*0.30
    for y in range(h):
        row = bytearray()
        for x in range(w):
            dx, dy = x-cx, y-cy
            d = (dx*dx + dy*dy) ** 0.5
            if d < r_in:
                px = (255, 255, 255, 255)
            elif d < r_out:
                px = (76, 175, 80, 255)
            else:
                px = (76, 175, 80, 255)
            row += bytes(px)
        rows.append(b'\x00' + bytes(row))
    raw = b''.join(rows)
    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)

png('/data/data/com.termux/files/home/price-truth/web/icon-192.png', 192)
png('/data/data/com.termux/files/home/price-truth/web/icon-512.png', 512)
print('ICONS_OK')
