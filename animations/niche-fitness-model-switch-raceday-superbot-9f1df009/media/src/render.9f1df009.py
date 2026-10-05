# blender -b --factory-startup -P render.9f1df009.py -- <test|still|solid|frames> [N]
import bpy, sys, os, math, importlib.util
import numpy as np
from mathutils import Vector

ROOT = '/tmp/rd-9f1df009'
for name in ('scene_build', 'scene_route'):
    spec = importlib.util.spec_from_file_location(f'{name}_9f1df009', f'{ROOT}/{name}.9f1df009.py')
    mod = importlib.util.module_from_spec(spec); sys.modules[f'{name}_9f1df009'] = mod; spec.loader.exec_module(mod)
import scene_build_9f1df009 as SB
import scene_route_9f1df009 as SR

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
MODE = ARGS[0] if ARGS else 'test'
NFR = int(ARGS[1]) if len(ARGS) > 1 else 90

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
SB.DEM = SB.load_dem()
print('DEM', SB.DEM.shape, float(SB.DEM.min()), float(SB.DEM.max()))
SB.build_terrain(); SB.build_water(); SR.lights()
cam_data = bpy.data.cameras.new('Camera_Flyover'); cam_data.lens = 30; cam_data.clip_end = 400000; cam_data.clip_start = 5
cam = bpy.data.objects.new('Camera_Flyover', cam_data); scene.collection.objects.link(cam); scene.camera = cam
C = SR.build(cam)
SR.export_profile(C); SR.no_shadows()


def engine(kind):
    if kind == 'solid':
        scene.render.engine = 'BLENDER_WORKBENCH'
        sh = scene.display.shading; sh.light = 'STUDIO'; sh.color_type = 'MATERIAL'
        sh.show_cavity = True; sh.show_shadows = False
        return
    for e in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'):
        try:
            scene.render.engine = e; break
        except TypeError as err:
            print('engine not available', e, err)
    scene.eevee.taa_render_samples = 48
    try:
        scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
    except TypeError as err:
        print('look not available', err)


def aim(pos, target):
    cam.location = Vector(pos)
    cam.rotation_euler = (Vector(target) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()


def place_runner(p):
    i = min(int(np.searchsorted(C['f'], p)), len(C['x']) - 1)
    loc = Vector((C['x'][i], C['y'][i], C['z'][i] + 40))
    C['dot'].location = loc; C['glow'].location = loc + Vector((0, 0, 120))
    C['run'].data.bevel_factor_end = max(p, 0.0005)
    return i


def flyover_cam(p):
    w = 0.10
    sel = (C['f'] > p - w) & (C['f'] < p + w)
    tx, ty, tz = C['x'][sel].mean(), C['y'][sel].mean(), C['z'][sel].mean()
    k = 0.5 - 0.5 * math.cos(math.pi * p)
    off = Vector((-900 + -700 * k, 3400 - 900 * k, 2500 - 900 * k))
    aim(Vector((tx, ty, tz)) + off, (tx, ty - 600 * k, tz))


def out(res, path, fmt='PNG', q=88):
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = fmt
    if fmt == 'JPEG': scene.render.image_settings.quality = q
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


HERO = ((-3900, 12600, 7400), (-500, -1700, 0))
if MODE in ('test', 'still', 'solid'):
    engine('solid' if MODE == 'solid' else 'eevee')
    place_runner(1.0); aim(*HERO); cam_data.lens = 32
    res = (640, 360) if MODE == 'test' else (1920, 1080)
    out(res, f'{ROOT}/{MODE}.9f1df009.png')
elif MODE == 'frames':
    engine('eevee'); os.makedirs(f'{ROOT}/frames', exist_ok=True)
    for n in range(NFR):
        p = n / (NFR - 1)
        place_runner(p); flyover_cam(p)
        out((1280, 720), f'{ROOT}/frames/f_{n:03d}.jpg', 'JPEG', 82)
print('DONE', MODE)
