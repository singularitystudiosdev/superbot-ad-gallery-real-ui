# render-toy.101b5842.py — the Blender pass the ad's viewport shows: the exported STL on a Cycles turntable
# (16 frames), a wireframe pass (16 frames) and a cross-section through the carved speaker pocket.
#   blender -b -P gen/render-toy.101b5842.py
import bpy, math, os, sys
from mathutils import Vector
GEN = os.path.dirname(os.path.abspath(__file__))
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass
FRAMES = 16
RES = 448
SAMPLES = 26
DIST = 0.22
LENS = 58

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.stl_import(filepath=os.path.join(GEN, 'biscuit_toy.stl'))
obj = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
obj.name = 'Biscuit'
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bb = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
centre = sum(bb, Vector()) / 8
print('bbox mm', [round(d * 1000, 1) for d in obj.dimensions], 'centre', [round(c, 4) for c in centre])

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
try:
    scene.cycles.device = 'GPU'
except Exception as e:
    print('cycles device:', e)
try:
    scene.view_settings.view_transform = 'AgX'
except Exception as e:
    print('vt', e)
scene.view_settings.exposure = -1.3
world = bpy.data.worlds.new('W'); scene.world = world
world.node_tree.nodes['Background'].inputs[0].default_value = (0.08, 0.08, 0.09, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = 0.45

def light(loc, e, size, rot):
    bpy.ops.object.light_add(type='AREA', location=loc)
    L = bpy.context.object; L.data.energy = e; L.data.size = size; L.rotation_euler = rot

# lights are placed relative to the object, so the rig scales with it
light(centre + Vector((0.16, -0.20, 0.26)), 5.0, 0.22, (math.radians(48), 0, math.radians(38)))
light(centre + Vector((-0.22, -0.10, 0.10)), 1.8, 0.20, (math.radians(72), 0, math.radians(-52)))
light(centre + Vector((0.0, 0.26, 0.18)), 2.4, 0.24, (math.radians(-58), 0, math.radians(180)))
bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, min(v.z for v in bb)))
floor = bpy.context.object
fm = bpy.data.materials.new('Floor'); fm.use_nodes = True
fb = fm.node_tree.nodes['Principled BSDF']
fb.inputs['Base Color'].default_value = (0.15, 0.15, 0.17, 1); fb.inputs['Roughness'].default_value = 0.62
floor.data.materials.append(fm)
mm = bpy.data.materials.new('Clay'); mm.use_nodes = True
pb = mm.node_tree.nodes['Principled BSDF']
pb.inputs['Base Color'].default_value = (0.46, 0.43, 0.40, 1); pb.inputs['Roughness'].default_value = 0.42
obj.data.materials.clear(); obj.data.materials.append(mm)
cam_data = bpy.data.cameras.new('C'); cam = bpy.data.objects.new('C', cam_data)
scene.collection.objects.link(cam); scene.camera = cam; cam_data.lens = LENS

def place(a, lift=0.045, dist=None, lens=None):
    if lens: cam_data.lens = lens
    r = dist or DIST
    cam.location = centre + Vector((math.sin(a) * r, -math.cos(a) * r, lift * obj.dimensions.z))
    d = cam.location - centre
    cam.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()

# the ad's viewport is 862 x 834: render at that aspect, camera shifted so the model sits left of the N-panel
scene.render.resolution_x = 576; scene.render.resolution_y = 557
cam_data.shift_x = 0.17
scene.render.image_settings.file_format = 'PNG'
os.makedirs(os.path.join(GEN, 'turn'), exist_ok=True)
os.makedirs(os.path.join(GEN, 'wire'), exist_ok=True)
ONLY = os.environ.get('RENDER_ONLY', '')
if ONLY == 'one':                      # one look-dev frame, then stop
    place(math.radians(38))
    scene.render.filepath = os.path.join(GEN, 'one.png')
    bpy.ops.render.render(write_still=True)
    print('one done'); sys.exit(0)
for i in (range(FRAMES) if ONLY in ('', 'turn') else []):
    place((i / FRAMES) * math.tau)
    scene.render.filepath = os.path.join(GEN, 'turn', f'f{i:02d}.png')
    bpy.ops.render.render(write_still=True)
    print('turntable', i + 1, 'of', FRAMES)
# the wireframe pass is the mesh's real topology: a thin Wireframe modifier on the exported shell, light lines on
# black (the ad screens it over the Cycles frame), floor hidden
scene.render.engine = 'BLENDER_WORKBENCH'
sh = scene.display.shading
sh.light = 'FLAT'; sh.color_type = 'SINGLE'; sh.single_color = (0.62, 0.70, 1.0)
sh.show_object_outline = False
scene.display.render_aa = '16'
world.color = (0.0, 0.0, 0.0)
floor.hide_render = True
wf = obj.modifiers.new('Wire', 'WIREFRAME'); wf.thickness = 0.00014; wf.use_even_offset = True; wf.use_replace = True
for i in range(FRAMES):
    place((i / FRAMES) * math.tau)
    scene.render.filepath = os.path.join(GEN, 'wire', f'f{i:02d}.png')
    bpy.ops.render.render(write_still=True)
    print('wire', i + 1, 'of', FRAMES)
# cross-section through the pocket
obj.modifiers.remove(wf)
floor.hide_render = False
scene.render.engine = 'CYCLES'
bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.bisect(plane_co=(0, 0, 0), plane_no=(1, 0, 0), clear_inner=True, use_fill=False)
bpy.ops.object.mode_set(mode='OBJECT')
obj.data.materials.clear(); obj.data.materials.append(mm)
scene.render.resolution_x = 900; scene.render.resolution_y = 700
cam_data.shift_x = 0.0
place(math.radians(84), lift=0.28, dist=0.24, lens=70)
scene.render.filepath = os.path.join(GEN, 'section.png')
bpy.ops.render.render(write_still=True)
print('done')