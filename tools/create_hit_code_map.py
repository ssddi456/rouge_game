import json
from utils import *


def create_formated_sprite_map(
    name,
    start_x=1,
    start_y=1,
    horizontal_count=8,
    vertical_count=12,
    width=64,
    height=64,
):
    sprites_map = {}
    animation_map = {}

    index = 0
    for i in range(vertical_count):
        for j in range(horizontal_count):
            sprites_map[index] = [
                start_x + j * width,
                start_y + i * height,
                width,
                height,
            ]
            index += 1

    hit_effect_count = 0
    hit_effect_sizes = [5, 5, 8]
    hit_effect_start_x = 0
    while True:
        if hit_effect_start_x + hit_effect_sizes[hit_effect_count % 3] >= horizontal_count * vertical_count - 1:
            break

        animation_map['hit_%s' % hit_effect_count] = [
            x + hit_effect_start_x for x in range(hit_effect_sizes[hit_effect_count % 3])]
        hit_effect_start_x += hit_effect_sizes[hit_effect_count % 3]
        hit_effect_count += 1

    with open(
            get_file_path('%s.marked.json' % name), 'wb') as f:
        f.write(json.dumps(sprites_map).encode('utf-8'))

    with open(
            get_file_path('%s.animation.json' % name), 'wb') as f:
        f.write(json.dumps(animation_map).encode('utf-8'))


create_formated_sprite_map('crosscode_hiteffect')
create_formated_sprite_map('20m2d_powerups',
                           0, 0, 12, 13, 32, 32)
