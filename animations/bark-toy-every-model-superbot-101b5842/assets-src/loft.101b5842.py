# loft.101b5842.py — the Blender half of the bark-toy spot.
#   blender -b -P gen/loft.101b5842.py
# Shape from silhouette, lofted: Gemini drew the toy's front and side silhouettes (gen/sil-front.png,
# gen/sil-side.png). Every row of the two masks gives the toy's width runs (front) and length runs (side) at that
# height; each width run x length run pair becomes one superellipse slice (a rounded rectangle, so the body reads
# as a loaf, not a lemon). The slices are joined, voxel-remeshed into ONE watertight shell and smoothed, carried to
# 88 mm, given a speaker/paw pocket open under the belly, decimated to the print count and exported as an STL.
# Every number the ad quotes is written to gen/blender-stats.101b5842.json by this run.
import bpy, bmesh, json, math, os, sys
import numpy as np
from mathutils import Vector

try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass
GEN = os.path.dirname(os.path.abspath(__file__))
NZ = 160                     # slices up the height
HEIGHT_MM = 88.0
CAV_MM = (28.0, 14.0, 6.0)   # length x width x depth of the speaker + paw-switch pocket
TARGET_TRIS = 42612
SUPER = 3.2                  # superellipse exponent: 2 = ellipse, higher = squarer (loaf, not lemon)
SEG = 40                     # points per slice outline

def load_mask(path, thresh=0.42):
    img = bpy.data.images.load(path)
    w, h = img.size
    a = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1]   # Blender stores bottom-up
    m = a[:, :, :3].mean(axis=2) < thresh
    bpy.data.images.remove(img)
    ys, xs = np.where(m)
    return m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

def resample(mask, nz=NZ):
    h, w = mask.shape
    nw = max(2, int(round(w * nz / h)))
    yi = (np.arange(nz) * h / nz).astype(int).clip(0, h - 1)
    xi = (np.arange(nw) * w / nw).astype(int).clip(0, w - 1)
    return mask[yi][:, xi][::-1]          # row 0 = top of the image -> flip so row 0 = the floor

def runs(row):
    """[start, end) runs of True in a 1-D bool row, dropping 1-cell specks"""
    out, start = [], None
    for i, v in enumerate(list(row) + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= 2:
                out.append((start, i))
            start = None
    return out

F = resample(load_mask(os.path.join(GEN, 'sil-front.png')))     # rows = z (floor up), cols = x (width)
S = resample(load_mask(os.path.join(GEN, 'sil-side.png')))      # rows = z, cols = y (length)
NX, NY = F.shape[1], S.shape[1]
print('front', F.shape, 'side', S.shape)

bpy.ops.wm.read_factory_settings(use_empty=True)
bm = bmesh.new()
cell = 1.0 / NZ                        # one slice = 1/NZ of the height; the toy is built 1.0 tall, scaled later
slices = 0
for z in range(NZ):
    for (x0, x1) in runs(F[z]):
        for (y0, y1) in runs(S[z]):
            cx, cy = ((x0 + x1) / 2 - NX / 2) * cell, ((y0 + y1) / 2 - NY / 2) * cell
            rx, ry = (x1 - x0) / 2 * cell, (y1 - y0) / 2 * cell
            ring_lo, ring_hi = [], []
            for k in range(SEG):
                t = k / SEG * math.tau
                c, s = math.cos(t), math.sin(t)
                px = cx + rx * math.copysign(abs(c) ** (2 / SUPER), c)
                py = cy + ry * math.copysign(abs(s) ** (2 / SUPER), s)
                ring_lo.append(bm.verts.new((px, py, z * cell)))
                ring_hi.append(bm.verts.new((px, py, (z + 1.6) * cell)))   # 60% overlap with the next slice
            bm.faces.new(ring_lo[::-1])
            bm.faces.new(ring_hi)
            for k in range(SEG):
                a, b = k, (k + 1) % SEG
                bm.faces.new((ring_lo[a], ring_lo[b], ring_hi[b], ring_hi[a]))
            slices += 1
me = bpy.data.meshes.new('Biscuit')
bm.to_mesh(me); bm.free()
obj = bpy.data.objects.new('Biscuit', me)
bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
print('slices', slices, 'verts', len(me.vertices))

# ---- one watertight shell: voxel union of the slices, then smoothing to melt the slice steps ----
r = obj.modifiers.new('Union', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = 0.0045; r.use_smooth_shade = True
bpy.ops.object.modifier_apply(modifier='Union')
sm = obj.modifiers.new('Melt', 'CORRECTIVE_SMOOTH'); sm.factor = 1.0; sm.iterations = 40; sm.smooth_type = 'SIMPLE'
sm.use_only_smooth = True
bpy.ops.object.modifier_apply(modifier='Melt')
lp = obj.modifiers.new('Round', 'LAPLACIANSMOOTH'); lp.lambda_factor = 1.0; lp.iterations = 8; lp.use_volume_preserve = True
bpy.ops.object.modifier_apply(modifier='Round')
bpy.ops.object.shade_smooth()

# ---- print scale: exactly 88.0 mm tall, standing on z = 0 ----
bpy.context.view_layer.update()
k = (HEIGHT_MM / 1000.0) / obj.dimensions.z
obj.scale = (k, k, k)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.context.view_layer.update()
low = min((obj.matrix_world @ v.co).z for v in obj.data.vertices)
obj.location.z -= low
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
bpy.context.view_layer.update()

# ---- the pocket, open under the belly: at the middle of the body, the lowest row both masks fill ----
mid_x, mid_y = NX // 2, NY // 2
body_ys = [y for y in range(NY) if S[:, y].any()]
belly_rows = []
for y in range(int(NY * 0.35), int(NY * 0.65)):
    col_s = np.where(S[:, y])[0]
    col_f = np.where(F[:, mid_x])[0]
    if len(col_s) and len(col_f):
        belly_rows.append(max(col_s[0], col_f[0]))
belly_z = (min(belly_rows) / NZ) * (HEIGHT_MM / 1000.0) if belly_rows else 0.0
cy = 0.0
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, cy, belly_z + CAV_MM[2] / 2000.0 - 0.0010))
cut = bpy.context.object
cut.scale = (CAV_MM[1] / 1000.0, CAV_MM[0] / 1000.0, CAV_MM[2] / 1000.0)   # 14 wide (x), 28 long (y), 6 deep (z)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bv = cut.modifiers.new('B', 'BEVEL'); bv.width = 0.0012; bv.segments = 3
bpy.ops.object.modifier_apply(modifier='B')
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True); bpy.context.view_layer.objects.active = obj
bo = obj.modifiers.new('Pocket', 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = cut; bo.solver = 'EXACT'
bpy.ops.object.modifier_apply(modifier='Pocket')
bpy.data.objects.remove(cut, do_unlink=True)
print('belly at mm', round(belly_z * 1000, 1))
heal = obj.modifiers.new('Heal', 'REMESH'); heal.mode = 'VOXEL'; heal.voxel_size = 0.00045; heal.use_smooth_shade = True
bpy.ops.object.modifier_apply(modifier='Heal')

# ---- print count ----
tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
if tris > TARGET_TRIS:
    d = obj.modifiers.new('Dec', 'DECIMATE'); d.ratio = TARGET_TRIS / tris
    bpy.ops.object.modifier_apply(modifier='Dec')
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.quads_convert_to_tris()
bpy.ops.mesh.remove_doubles(threshold=1e-6)
bpy.ops.mesh.delete_loose()
bpy.ops.mesh.select_all(action='DESELECT')
bpy.ops.mesh.select_non_manifold()
bpy.ops.mesh.fill_holes(sides=0)
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.quads_convert_to_tris()
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')
bpy.context.view_layer.update()
b2 = bmesh.new(); b2.from_mesh(obj.data)
nonman = sum(1 for e in b2.edges if not e.is_manifold)
b2.free()
stats = {
  'source': 'lofted silhouette hull: superellipse slices from the Gemini front + side silhouettes',
  'slices': slices,
  'verts': len(obj.data.vertices),
  'tris': len(obj.data.polygons),
  'non_manifold_edges': nonman,
  'size_mm_xyz': [round(d * 1000, 1) for d in obj.dimensions],
  'height_mm': round(obj.dimensions.z * 1000, 1),
  'pocket_mm': list(CAV_MM),
  'belly_mm': round(belly_z * 1000, 1),
}
stl = os.path.join(GEN, 'biscuit_toy.stl')
bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active = obj
bpy.ops.wm.stl_export(filepath=stl, export_selected_objects=True)
stats['stl_mb'] = round(os.path.getsize(stl) / 1e6, 1)
with open(os.path.join(GEN, 'blender-stats.101b5842.json'), 'w') as f:
    json.dump(stats, f, indent=1)
print('STATS', json.dumps(stats))