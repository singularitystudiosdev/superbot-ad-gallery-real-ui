# Course curve, runner, mile posts, labels, lights and the profile export. Uses scene_build.9f1df009.
import bpy, json, math
import numpy as np
import scene_build_9f1df009 as SB

MI = 13.1094


def course_points():
    pts = json.load(open(f'{SB.ROOT}/route.9f1df009.json'))['pts']
    xy = np.array([SB.to_local(a, b) for a, b in pts])
    for _ in range(2):  # Chaikin corner cut: streets turn, they do not kink
        q = 0.75 * xy[:-1] + 0.25 * xy[1:]; r = 0.25 * xy[:-1] + 0.75 * xy[1:]
        xy = np.vstack([xy[:1], np.stack([q, r], 1).reshape(-1, 2), xy[-1:]])
    seg = np.hypot(*np.diff(xy, axis=0).T)
    cum = np.concatenate([[0], np.cumsum(seg)])
    s = np.linspace(0, cum[-1], int(cum[-1] / 8))
    x, y = np.interp(s, cum, xy[:, 0]), np.interp(s, cum, xy[:, 1])
    lon, lat = SB.to_lonlat(x, y)
    e = SB.elev(lon, lat)
    k = np.ones(25) / 25  # smooth the street-level DEM noise along the line
    e = np.convolve(np.pad(e, 12, mode='edge'), k, mode='valid')
    return x, y, e, s / s[-1]


def curve_object(name, x, y, z, depth, mat):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    sp = cu.splines.new('POLY'); sp.points.add(len(x) - 1)
    co = np.stack([x, y, z, np.ones_like(x)], 1).astype(np.float32).ravel()
    sp.points.foreach_set('co', co)
    cu.bevel_depth = depth; cu.bevel_resolution = 3; cu.use_fill_caps = True
    cu.bevel_factor_mapping_end = 'SPLINE'
    ob = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(mat)
    return ob


def label(text, x, y, z, size, cam):
    cu = bpy.data.curves.new(text, 'FONT'); cu.body = text; cu.size = size
    cu.align_x = 'CENTER'; cu.align_y = 'BOTTOM'
    for f in ('/System/Library/Fonts/Supplemental/Arial Bold.ttf',):
        try: cu.font = bpy.data.fonts.load(f)
        except Exception as err: print('font load failed', f, err)
    ob = bpy.data.objects.new('Label_' + text, cu); bpy.context.scene.collection.objects.link(ob)
    ob.location = (x, y, z)
    ob.data.materials.append(SB.emit_material('Label', (1, 1, 1), 2.2))
    c = ob.constraints.new('TRACK_TO'); c.target = cam; c.track_axis = 'TRACK_Z'; c.up_axis = 'UP_Y'
    return ob


def build(cam):
    x, y, e, f = course_points()
    z = e * SB.EXAG + 14
    orange = (1.0, 0.16, 0.015)
    trail = curve_object('Course_Trail', x, y, z - 4, 7, SB.emit_material('Trail', orange, 0.5))
    run = curve_object('Course_13.1mi', x, y, z, 17, SB.emit_material('Route', orange, 1.9))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=48, segments=24, ring_count=12)
    dot = bpy.context.active_object; dot.name = 'Runner'
    dot.data.materials.append(SB.emit_material('Runner', (1, 1, 1), 14))
    glow = bpy.data.lights.new('RunnerGlow', 'POINT'); glow.energy = 1.6e6; glow.color = orange
    glow.shadow_soft_size = 60
    gl = bpy.data.objects.new('RunnerGlow', glow); bpy.context.scene.collection.objects.link(gl)
    post_mat = SB.emit_material('MilePost', (1, 1, 1), 3.0)
    for m in range(1, 14):
        i = int(np.searchsorted(f, m / MI))
        bpy.ops.mesh.primitive_cylinder_add(radius=9, depth=170, location=(x[i], y[i], z[i] + 85))
        p = bpy.context.active_object; p.name = f'Mile_{m:02d}'; p.data.materials.append(post_mat)
    label('START', x[0] + 260, y[0] + 120, z[0] + 260, 230, cam)
    label('FINISH', x[-1] - 200, y[-1] - 60, z[-1] + 260, 260, cam)
    px, py = SB.to_local(40.6600, -73.9835); label('PROSPECT PARK', px, py, 70 * SB.EXAG + 300, 240, cam)
    ox, oy = SB.to_local(40.6080, -73.9705); label('OCEAN PKWY', ox + 520, oy, 40 * SB.EXAG + 180, 230, cam)
    return dict(x=x, y=y, z=z, e=e, f=f, run=run, dot=dot, glow=gl)


def lights():
    sun = bpy.data.lights.new('Sun', 'SUN'); sun.energy = 3.2; sun.angle = math.radians(1.5)
    sun.color = (1.0, 0.86, 0.72)
    ob = bpy.data.objects.new('Sun', sun); bpy.context.scene.collection.objects.link(ob)
    ob.rotation_euler = (math.radians(70), 0, math.radians(66))
    w = bpy.context.scene.world or bpy.data.worlds.new('World'); bpy.context.scene.world = w
    w.use_nodes = True; bg = w.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.016, 0.024, 0.042, 1); bg.inputs['Strength'].default_value = 1.0


def export_profile(c):
    ft = c['e'] * 3.28084
    miles = c['f'] * MI
    tick = np.arange(0, MI + 1e-9, 0.1)
    prof = np.interp(tick, miles, ft)
    gain = float(np.sum(np.clip(np.diff(prof), 0, None)))
    xs, ys = c['x'], c['y']
    span = max(xs.max() - xs.min(), ys.max() - ys.min())
    path = [[round(float((xs[i] - xs.min()) / span), 4), round(float((ys.max() - ys[i]) / span), 4)]
            for i in range(0, len(xs), 12)]
    out = dict(mi=MI, step=0.1, ft=[round(float(v), 1) for v in prof], gain_ft=round(gain),
               min_ft=round(float(prof.min())), max_ft=round(float(prof.max())), path=path,
               points=len(xs))
    json.dump(out, open(f'{SB.ROOT}/profile.9f1df009.json', 'w'))
    print('PROFILE', out['gain_ft'], out['min_ft'], out['max_ft'], out['points'])


def no_shadows():
    """Emissive props (route, posts, labels, runner) cast no shadow: a low dawn sun turned them into black streaks."""
    for ob in bpy.context.scene.objects:
        if ob.type in ('CURVE', 'FONT') or ob.name.startswith(('Mile_', 'Runner')):
            ob.visible_shadow = False
