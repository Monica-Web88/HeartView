#!/usr/bin/env python3
"""
Generate a SYNTHETIC coronary CT phantom as a DICOM series (no real patient data).

Output: public/demo/slice_001.dcm ... slice_040.dcm
Each slice is an axial 256x256 CT image (16-bit, HU via RescaleIntercept=-1024) showing a
contrast-filled artery running through the stack with three kinds of plaque:
  - calcified          (very bright, > 400 HU)
  - non-calcified      (soft plaque, ~70 HU)
  - low-attenuation    (lipid-rich core, ~15 HU)

Only needs numpy. Usage:  python scripts/generate_demo_dicom.py
"""
import os
import struct
import uuid

import numpy as np

N_SLICES = 40
SIZE = 256
PIXEL_SPACING = 0.35   # mm
SLICE_SPACING = 0.5    # mm
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "demo")


# --------------------------------------------------------------------------- DICOM writer
def _even(b: bytes, pad: bytes) -> bytes:
    return b + pad if len(b) % 2 else b


def _el(tag, vr: str, value: bytes) -> bytes:
    group, elem = tag
    if vr in ("OB", "OW", "OF", "SQ", "UN", "UT"):
        return struct.pack("<HH2sHI", group, elem, vr.encode(), 0, len(value)) + value
    return struct.pack("<HH2sH", group, elem, vr.encode(), len(value)) + value


def _ui(tag, s):
    return _el(tag, "UI", _even(s.encode("ascii"), b"\x00"))


def _txt(tag, vr, s):
    return _el(tag, vr, _even(s.encode("ascii"), b" "))


def _us(tag, v):
    return _el(tag, "US", struct.pack("<H", v))


def _uid() -> str:
    return "2.25." + str(uuid.uuid4().int)


def write_dicom(path, pixels_u16, instance_number, z_mm, uids):
    sop_class = "1.2.840.10008.5.1.4.1.1.2"  # CT Image Storage
    sop_instance = _uid()

    meta_body = b"".join([
        _el((0x0002, 0x0001), "OB", b"\x00\x01"),
        _ui((0x0002, 0x0002), sop_class),
        _ui((0x0002, 0x0003), sop_instance),
        _ui((0x0002, 0x0010), "1.2.840.10008.1.2.1"),   # Explicit VR Little Endian
        _ui((0x0002, 0x0012), "2.25.123456789012345678901234567890123456"),
        _txt((0x0002, 0x0013), "SH", "HEARTVIEW_DEMO"),
    ])
    meta = _el((0x0002, 0x0000), "UL", struct.pack("<I", len(meta_body))) + meta_body

    rows, cols = pixels_u16.shape
    elements = [
        ((0x0008, 0x0008), _txt((0x0008, 0x0008), "CS", "DERIVED\\PRIMARY\\AXIAL")),
        ((0x0008, 0x0016), _ui((0x0008, 0x0016), sop_class)),
        ((0x0008, 0x0018), _ui((0x0008, 0x0018), sop_instance)),
        ((0x0008, 0x0020), _txt((0x0008, 0x0020), "DA", "20240101")),
        ((0x0008, 0x0060), _txt((0x0008, 0x0060), "CS", "CT")),
        ((0x0008, 0x103E), _txt((0x0008, 0x103E), "LO", "Synthetic coronary phantom")),
        ((0x0010, 0x0010), _txt((0x0010, 0x0010), "PN", "SYNTHETIC^PHANTOM")),
        ((0x0010, 0x0020), _txt((0x0010, 0x0020), "LO", "DEMO-0001")),
        ((0x0018, 0x0050), _txt((0x0018, 0x0050), "DS", f"{SLICE_SPACING}")),
        ((0x0020, 0x000D), _ui((0x0020, 0x000D), uids["study"])),
        ((0x0020, 0x000E), _ui((0x0020, 0x000E), uids["series"])),
        ((0x0020, 0x0010), _txt((0x0020, 0x0010), "SH", "1")),
        ((0x0020, 0x0011), _txt((0x0020, 0x0011), "IS", "1")),
        ((0x0020, 0x0013), _txt((0x0020, 0x0013), "IS", str(instance_number))),
        ((0x0020, 0x0032), _txt((0x0020, 0x0032), "DS", f"0\\0\\{z_mm:.3f}")),
        ((0x0020, 0x0037), _txt((0x0020, 0x0037), "DS", "1\\0\\0\\0\\1\\0")),
        ((0x0020, 0x0052), _ui((0x0020, 0x0052), uids["frame"])),
        ((0x0028, 0x0002), _us((0x0028, 0x0002), 1)),
        ((0x0028, 0x0004), _txt((0x0028, 0x0004), "CS", "MONOCHROME2")),
        ((0x0028, 0x0010), _us((0x0028, 0x0010), rows)),
        ((0x0028, 0x0011), _us((0x0028, 0x0011), cols)),
        ((0x0028, 0x0030), _txt((0x0028, 0x0030), "DS", f"{PIXEL_SPACING}\\{PIXEL_SPACING}")),
        ((0x0028, 0x0100), _us((0x0028, 0x0100), 16)),
        ((0x0028, 0x0101), _us((0x0028, 0x0101), 16)),
        ((0x0028, 0x0102), _us((0x0028, 0x0102), 15)),
        ((0x0028, 0x0103), _us((0x0028, 0x0103), 0)),
        ((0x0028, 0x1050), _txt((0x0028, 0x1050), "DS", "200")),
        ((0x0028, 0x1051), _txt((0x0028, 0x1051), "DS", "700")),
        ((0x0028, 0x1052), _txt((0x0028, 0x1052), "DS", "-1024")),
        ((0x0028, 0x1053), _txt((0x0028, 0x1053), "DS", "1")),
        ((0x0028, 0x1054), _txt((0x0028, 0x1054), "LO", "HU")),
        ((0x7FE0, 0x0010), _el((0x7FE0, 0x0010), "OW", pixels_u16.astype("<u2").tobytes())),
    ]
    elements.sort(key=lambda t: t[0])
    body = b"".join(e for _, e in elements)

    with open(path, "wb") as f:
        f.write(b"\x00" * 128 + b"DICM" + meta + body)


# --------------------------------------------------------------------------- phantom
def gaussian_blur(img, sigma=1.0):
    radius = int(3 * sigma)
    x = np.arange(-radius, radius + 1)
    k = np.exp(-(x ** 2) / (2 * sigma ** 2))
    k /= k.sum()
    out = np.apply_along_axis(lambda r: np.convolve(r, k, mode="same"), 1, img)
    return np.apply_along_axis(lambda c: np.convolve(c, k, mode="same"), 0, out)


# (k_start, k_end, hu, angle_deg, half_sector_deg, max_intrusion_px)
PLAQUES = [
    (5, 13, 520.0, 30, 45, 5.0),     # calcified
    (16, 31, 70.0, 200, 70, 5.0),    # non-calcified (soft)
    (33, 38, 680.0, 300, 35, 4.0),   # calcified
]
CORE = (20, 27, 15.0, 200, 25)       # low-attenuation lipid core inside the soft plaque


def make_slice(k, rng):
    yy, xx = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)
    hu = np.full((SIZE, SIZE), -100.0, np.float32)  # epicardial fat

    # myocardium + contrast-filled ventricle
    hu[((xx - 128) / 105) ** 2 + ((yy - 132) / 95) ** 2 <= 1] = 80.0
    hu[((xx - 140) / 52) ** 2 + ((yy - 140) / 42) ** 2 <= 1] = 280.0

    # artery runs along the heart surface and drifts a little with each slice
    theta = 0.75 + 0.03 * k
    cx = 128 + 105 * 1.14 * np.cos(theta)
    cy = 132 + 95 * 1.14 * np.sin(theta)
    r_lumen = 8.0 + 0.8 * np.sin(k / 6.0)
    r_wall = r_lumen + 4.0

    dx, dy = xx - cx, yy - cy
    r = np.hypot(dx, dy)
    ang = np.degrees(np.arctan2(dy, dx))

    hu[r <= r_wall] = 40.0      # vessel wall
    hu[r <= r_lumen] = 340.0    # contrast-filled lumen

    def sector(center_deg, half_deg):
        d = np.abs(((ang - center_deg + 180) % 360) - 180)
        return d <= half_deg

    for k0, k1, val, a, half, t_max in PLAQUES:
        if k0 <= k <= k1:
            t = t_max * np.sin(np.pi * (k - k0) / (k1 - k0))
            hu[sector(a, half) & (r <= r_wall) & (r >= r_lumen - t)] = val

    k0, k1, val, a, half = CORE
    if k0 <= k <= k1:
        t = 3.5 * np.sin(np.pi * (k - k0) / (k1 - k0))
        hu[sector(a, half) & (r <= r_lumen - 0.5) & (r >= r_lumen - 0.5 - t)] = val

    hu = gaussian_blur(hu, 1.0) + rng.normal(0, 7.0, hu.shape)
    hu = np.clip(hu, -1024, 3071)
    return (hu + 1024).round().astype(np.uint16)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    rng = np.random.default_rng(42)
    uids = {"study": _uid(), "series": _uid(), "frame": _uid()}
    for k in range(N_SLICES):
        path = os.path.join(OUT_DIR, f"slice_{k + 1:03d}.dcm")
        write_dicom(path, make_slice(k, rng), k + 1, k * SLICE_SPACING, uids)
    print(f"Wrote {N_SLICES} synthetic slices to {os.path.abspath(OUT_DIR)}")


if __name__ == "__main__":
    main()
