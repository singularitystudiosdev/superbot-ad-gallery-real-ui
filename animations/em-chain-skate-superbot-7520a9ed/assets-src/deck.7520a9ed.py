# Builds the LOW TIDE deck from the Gemini graphic and renders a spin turntable.
# blender -b -P deck.7520a9ed.py -- <mode: wire|final> <outdir> <first> <last>
import math
import sys

import bpy

MODE, OUT, F0, F1 = sys.argv[sys.argv.index('--') + 1:][:4]
F0, F1 = int(F0), int(F1)
GRAPHIC = 'deck1.png'  # Gemini take 1 at full size (1536 x 2752), next to this script
IMG_W, IMG_H = 1536, 2752
BOX = (462, 254, 1070, 2512)  # deck bounds inside the Gemini image, inset a few px

W = 0.2096  # 8.25 in
L = W * (BOX[3] - BOX[1]) / (BOX[2] - BOX[0])
T = 0.011  # 7 plies x ~1.6 mm
NOSE = 0.135  # elliptical end length
KICK_START, KICK_RISE = 0.155, 0.052
CONCAVE = 0.006
ROWS, COLS = 220, 28
FRAMES = 96


def half_width(y):
    d = min(y + L / 2, L / 2 - y)
    if d >= NOSE:
        return W / 2
    k = (NOSE - d) / NOSE
    return W / 2 * max(1 - k ** 2.15, 0.0) ** 0.5 + 1e-4


def lift(x, y):
    d = min(y + L / 2, L / 2 - y)
    z = 0.0
    if d < KICK_START:
        k = (KICK_START - d) / KICK_START
        z += KICK_RISE * k ** 1.7
    hw = W / 2
    return z + CONCAVE * (x / hw) ** 2 * (1 if d > KICK_START * 0.6 else d / (KICK_START * 0.6))


def build_mesh(ROWS=ROWS, COLS=COLS):
    verts, faces, mats, uvs = [], [], [], []
    ys = [-L / 2 + L * i / ROWS for i in range(ROWS + 1)]
    top, bot = [], []
    for y in ys:
        hw = half_width(y)
        rt, rb = [], []
        for j in range(COLS + 1):
            x = -hw + 2 * hw * j / COLS
            z = lift(x, y)
            rt.append(len(verts)); verts.append((x, y, z))
            rb.append(len(verts)); verts.append((x, y, z - T))
        top.append(rt); bot.append(rb)

    def graphic_uv(v):
        x, y, _ = verts[v]
        u = (BOX[0] + (W / 2 - x) / W * (BOX[2] - BOX[0])) / IMG_W
        vv = 1 - (BOX[1] + (L / 2 - y) / L * (BOX[3] - BOX[1])) / IMG_H
        return (u, vv)

    for i in range(ROWS):
        for j in range(COLS):
            q = [top[i][j], top[i][j + 1], top[i + 1][j + 1], top[i + 1][j]]
            faces.append(q); mats.append(1); uvs.append([graphic_uv(v) for v in q])
            q = [bot[i][j], bot[i + 1][j], bot[i + 1][j + 1], bot[i][j + 1]]
            faces.append(q); mats.append(0); uvs.append([graphic_uv(v) for v in q])
    ring = [(i, 0) for i in range(ROWS + 1)] + [(ROWS, j) for j in range(1, COLS + 1)] + \
           [(i, COLS) for i in range(ROWS - 1, -1, -1)] + [(0, j) for j in range(COLS - 1, 0, -1)]
    for n in range(len(ring)):
        a, b = ring[n], ring[(n + 1) % len(ring)]
        q = [bot[a[0]][a[1]], bot[b[0]][b[1]], top[b[0]][b[1]], top[a[0]][a[1]]]
        faces.append(q); mats.append(2)
        s0, s1 = n / len(ring), (n + 1) / len(ring)
        uvs.append([(s0, 0.0), (s1, 0.0), (s1, 1.0), (s0, 1.0)])

    me = bpy.data.meshes.new('deck')
    me.from_pydata(verts, [], faces)
    uvl = me.uv_layers.new(name='UVMap')
    for poly, fuv, m in zip(me.polygons, uvs, mats):
        poly.material_index = m
        poly.use_smooth = True
        for li, uv in zip(poly.loop_indices, fuv):
            uvl.data[li].uv = uv
    me.validate()
    return me


def principled(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m, m.node_tree.nodes['Principled BSDF'], m.node_tree


def graphic_mat():
    m, p, nt = principled('graphic')
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(GRAPHIC)
    tex.interpolation = 'Cubic'
    nt.links.new(tex.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.32
    p.inputs['Coat Weight'].default_value = 0.35
    p.inputs['Coat Roughness'].default_value = 0.12
    return m


def grip_mat():
    m, p, nt = principled('griptape')
    p.inputs['Base Color'].default_value = (0.012, 0.012, 0.014, 1)
    p.inputs['Roughness'].default_value = 0.92
    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 900
    noise.inputs['Detail'].default_value = 2
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.35
    nt.links.new(noise.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], p.inputs['Normal'])
    return m


def ply_mat():
    m, p, nt = principled('plies')
    uv = nt.nodes.new('ShaderNodeUVMap')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    plies = [(0.80, 0.62, 0.40), (0.80, 0.62, 0.40), (0.02, 0.42, 0.48), (0.82, 0.64, 0.42),
             (0.98, 0.40, 0.32), (0.80, 0.62, 0.40), (0.78, 0.60, 0.38)]
    els = ramp.color_ramp.elements
    els[0].color = (*plies[0], 1)
    els[1].position = 1 / 7
    els[1].color = (*plies[1], 1)
    for k in range(2, 7):
        e = els.new(k / 7)
        e.color = (*plies[k], 1)
    nt.links.new(uv.outputs['UV'], sep.inputs['Vector'])
    nt.links.new(sep.outputs['Y'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.55
    return m


def area(name, loc, energy, size, color):
    d = bpy.data.lights.new(name, 'AREA')
    d.energy, d.size, d.color = energy, size, color
    o = bpy.data.objects.new(name, d)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    c = o.constraints.new('TRACK_TO')
    c.target = bpy.data.objects['pivot']
    return o


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    deck = bpy.data.objects.new('deck', build_mesh())
    for m in (graphic_mat(), grip_mat(), ply_mat()):
        deck.data.materials.append(m)
    bev = deck.modifiers.new('bevel', 'BEVEL')
    bev.width, bev.segments, bev.limit_method, bev.angle_limit = 0.0018, 3, 'ANGLE', math.radians(40)
    bev.harden_normals = True

    pivot = bpy.data.objects.new('pivot', None)
    sc.collection.objects.link(pivot)
    sc.collection.objects.link(deck)
    deck.parent = pivot
    spinners = [deck]
    # long axis on a diagonal; the deck spins about it like a slow kickflip
    pivot.rotation_euler = (math.radians(90), math.radians(34), 0)

    cam_d = bpy.data.cameras.new('cam')
    cam_d.lens = 80
    cam = bpy.data.objects.new('cam', cam_d)
    sc.collection.objects.link(cam)
    cam.location = (0, -2.05, 0.22)
    tc = cam.constraints.new('TRACK_TO')
    tc.target = pivot
    sc.camera = cam

    area('key', (-0.9, -1.2, 1.1), 55, 1.4, (1, 0.97, 0.92))
    area('rim_teal', (1.1, 0.6, 0.5), 70, 0.9, (0.3, 0.85, 1.0))
    area('rim_coral', (-1.0, 0.8, -0.4), 55, 0.9, (1.0, 0.45, 0.35))
    area('fill', (0.6, -1.4, -0.6), 14, 1.6, (1, 1, 1))

    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.03, 0.03, 0.035, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    sc.world = world

    r = sc.render
    r.resolution_x = r.resolution_y = 900
    r.film_transparent = True
    r.image_settings.file_format = 'PNG'
    r.image_settings.color_mode = 'RGBA'
    sc.frame_start, sc.frame_end = F0, F1
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    if MODE == 'wire':
        r.engine = 'BLENDER_WORKBENCH'
        sh = sc.display.shading
        sh.light, sh.color_type = 'STUDIO', 'SINGLE'
        sh.single_color = (0.62, 0.62, 0.62)
        sh.show_cavity, sh.show_object_outline = True, True
        r.film_transparent = True
        wire = bpy.data.objects.new('wire', build_mesh(40, 8))
        wm = wire.modifiers.new('wire', 'WIREFRAME')
        wm.thickness, wm.use_replace = 0.0011, True
        sc.collection.objects.link(wire)
        wire.parent = pivot
        wire.color = (1.0, 0.55, 0.1, 1)
        deck.color = (0.62, 0.62, 0.62, 1)
        sh.color_type = 'OBJECT'
        spinners.append(wire)
    else:
        r.engine = 'CYCLES'
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'METAL'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        sc.cycles.device = 'GPU'
        sc.cycles.samples = 64
        sc.cycles.use_denoising = True
    for f in range(F0, F1 + 1):
        a = 2 * math.pi * (f - 1) / FRAMES + math.pi
        for o in spinners:
            o.rotation_euler = (0, a, 0)
        r.filepath = f"{OUT.rstrip('/')}/f{f:04d}.png"
        bpy.ops.render.render(write_still=True)


main()
