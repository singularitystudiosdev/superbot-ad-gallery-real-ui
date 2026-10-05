# Brooklyn Half course scene for Blender 5.2: real DEM terrain (AWS terrarium z13 tiles), the course as a
# glowing curve, mile posts, labels, sun + world. Imported by render.9f1df009.py; units are meters (local ENU).
import bpy, json, math
import numpy as np

ROOT = '/tmp/rd-9f1df009'
Z, TX0, TX1, TY0, TY1 = 13, 2411, 2414, 3080, 3085
EXAG = 6.0
LAT0, LON0 = 40.623, -73.970
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110574.0
GX0, GX1, GY0, GY1, STEP = -6200, 6000, -10500, 8200, 25


def to_local(lat, lon):
    return (lon - LON0) * KX, (lat - LAT0) * KY


def to_lonlat(x, y):
    return LON0 + x / KX, LAT0 + y / KY


def load_dem():
    rows = []
    for ty in range(TY0, TY1 + 1):
        row = []
        for tx in range(TX0, TX1 + 1):
            img = bpy.data.images.load(f'{ROOT}/dem/{Z}_{tx}_{ty}.png')
            img.colorspace_settings.name = 'Non-Color'
            w, h = img.size
            px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, img.channels)[::-1]
            rgb = np.round(px[:, :, :3] * 255.0)
            row.append(rgb[:, :, 0] * 256 + rgb[:, :, 1] + rgb[:, :, 2] / 256 - 32768)
        rows.append(np.concatenate(row, axis=1))
    dem = np.concatenate(rows, axis=0)
    for _ in range(3):  # 3x3 box blur: street-level noise would read as contour confetti
        p = np.pad(dem, 1, mode='edge')
        dem = sum(p[i:i + dem.shape[0], j:j + dem.shape[1]] for i in range(3) for j in range(3)) / 9
    return dem


DEM = None


def elev(lon, lat):
    """Bilinear DEM sample (meters) at arrays of lon/lat."""
    n = 2 ** Z * 256
    gx = (np.asarray(lon) + 180) / 360 * n - TX0 * 256 - 0.5
    lr = np.radians(np.asarray(lat))
    gy = (1 - np.log(np.tan(lr) + 1 / np.cos(lr)) / math.pi) / 2 * n - TY0 * 256 - 0.5
    h, w = DEM.shape
    gx, gy = np.clip(gx, 0, w - 1.001), np.clip(gy, 0, h - 1.001)
    x0, y0 = np.floor(gx).astype(int), np.floor(gy).astype(int)
    fx, fy = gx - x0, gy - y0
    a, b = DEM[y0, x0], DEM[y0, x0 + 1]
    c, d = DEM[y0 + 1, x0], DEM[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def build_terrain():
    xs = np.arange(GX0, GX1 + 1, STEP, dtype=np.float64)
    ys = np.arange(GY0, GY1 + 1, STEP, dtype=np.float64)
    gx, gy = np.meshgrid(xs, ys)
    lon, lat = to_lonlat(gx, gy)
    z = np.maximum(elev(lon, lat), -4.0) * EXAG
    nx, ny = len(xs), len(ys)
    verts = np.stack([gx.ravel(), gy.ravel(), z.ravel()], axis=1).astype(np.float32)
    i = np.arange(nx * ny).reshape(ny, nx)
    quads = np.stack([i[:-1, :-1], i[:-1, 1:], i[1:, 1:], i[1:, :-1]], axis=-1).reshape(-1, 4)
    me = bpy.data.meshes.new('Terrain_DEM')
    me.vertices.add(len(verts)); me.vertices.foreach_set('co', verts.ravel())
    me.loops.add(quads.size); me.loops.foreach_set('vertex_index', quads.ravel().astype(np.int32))
    me.polygons.add(len(quads))
    me.polygons.foreach_set('loop_start', (np.arange(len(quads)) * 4).astype(np.int32))
    me.update(); me.validate()
    me.shade_smooth() if hasattr(me, 'shade_smooth') else None
    ob = bpy.data.objects.new('Terrain_DEM', me)
    bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(terrain_material())
    return ob


def node_mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links


def terrain_material():
    m, N, L = node_mat('Terrain')
    bsdf = N['Principled BSDF']
    geo = N.new('ShaderNodeNewGeometry'); sep = N.new('ShaderNodeSeparateXYZ')
    L.new(geo.outputs['Position'], sep.inputs[0])
    norm = N.new('ShaderNodeMath'); norm.operation = 'DIVIDE'; norm.inputs[1].default_value = 55 * EXAG
    L.new(sep.outputs['Z'], norm.inputs[0])
    ramp = N.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.030, 0.042, 0.058, 1)
    ramp.color_ramp.elements[1].color = (0.105, 0.140, 0.165, 1)
    L.new(norm.outputs[0], ramp.inputs[0])
    # 4 m contour lines: fract(z / 4m) near 1 -> lighter line
    cdiv = N.new('ShaderNodeMath'); cdiv.operation = 'DIVIDE'; cdiv.inputs[1].default_value = 4 * EXAG
    L.new(sep.outputs['Z'], cdiv.inputs[0])
    fr = N.new('ShaderNodeMath'); fr.operation = 'FRACT'; L.new(cdiv.outputs[0], fr.inputs[0])
    gt = N.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.92
    L.new(fr.outputs[0], gt.inputs[0])
    mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['B'].default_value = (0.20, 0.30, 0.36, 1)
    L.new(gt.outputs[0], mix.inputs['Factor']); L.new(ramp.outputs['Color'], mix.inputs['A'])
    L.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.85
    return m


def emit_material(name, rgb, strength):
    m, N, L = node_mat(name)
    for n in list(N):
        if n.type != 'OUTPUT_MATERIAL': N.remove(n)
    e = N.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*rgb, 1); e.inputs['Strength'].default_value = strength
    L.new(e.outputs[0], N['Material Output'].inputs['Surface'])
    return m


def build_water():
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 1.0 * EXAG))
    ob = bpy.context.active_object; ob.name = 'Ocean'
    ob.scale = (400000, 400000, 1)
    m, N, L = node_mat('Water'); b = N['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.004, 0.022, 0.050, 1); b.inputs['Roughness'].default_value = 0.22
    b.inputs['Specular IOR Level'].default_value = 0.7
    ob.data.materials.append(m)
    return ob
