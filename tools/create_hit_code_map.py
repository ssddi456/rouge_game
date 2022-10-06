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
    sprites_map = None,
    animation_map = None,
    index = 0,
    animate_index = 0,
    write = True,
    hit_effect_sizes = None,
):
    # init params, start
    if sprites_map == None:
        sprites_map = {}
    if animation_map == None:
        animation_map = {}

    print(
        'horizontal_count', horizontal_count,
        'vertical_count', vertical_count,
        'sprites_map', sprites_map,
        'animate_index', animate_index
    )

    hit_effect_sizes = hit_effect_sizes is None and [5, 5, 8] or hit_effect_sizes
    start_index = index
    hit_effect_start_x = index
    len_hit_effect_sizes = len(hit_effect_sizes)

    # init params, end

    for i in range(vertical_count):
        for j in range(horizontal_count):
            sprites_map[index] = [
                start_x + j * width,
                start_y + i * height,
                width,
                height,
            ]
            index += 1

    while True:
        index_hit_effect_sizes = animate_index % len_hit_effect_sizes

        if hit_effect_start_x + hit_effect_sizes[index_hit_effect_sizes] - start_index > horizontal_count * vertical_count:
            break

        animation_map['hit_%s' % animate_index] = [
            x + hit_effect_start_x for x in range(hit_effect_sizes[index_hit_effect_sizes])]
        hit_effect_start_x += hit_effect_sizes[index_hit_effect_sizes]
        animate_index += 1

    if write:
        with open(
                get_file_path('%s.marked.json' % name), 'wb') as f:
            f.write(json.dumps(sprites_map).encode('utf-8'))

        with open(
                get_file_path('%s.animation.json' % name), 'wb') as f:
            f.write(json.dumps(animation_map).encode('utf-8'))
    
    return (sprites_map, animation_map, index, animate_index)


create_formated_sprite_map('crosscode_hiteffect')
create_formated_sprite_map('20m2d_powerups',
                           0, 0, 12, 13, 32, 32)
create_formated_sprite_map('20m2d_FreezeFXSmall',
                           0, 0, 5, 1, 32, 32)
(powerup_sprites_map, powerup_animation_map, powerup_index, _) = create_formated_sprite_map('20m2d_PowerupPanel',
                           0, 0, 2, 1, 32, 32, write=False)
create_formated_sprite_map('20m2d_PowerupPanel',
                           0, 48, 2, 1, 48, 48,
                           powerup_sprites_map, powerup_sprites_map, powerup_index)

create_formated_sprite_map('20m2d_HeartAnimation',
                           0, 0, 4, 1, 32, 32, hit_effect_sizes=[3])

(laser_sprites_map, laser_animation_map, laser_index, laser_animate_index) = create_formated_sprite_map('20m2d_ShoggothLaser',
                           0, 0, 6, 1, 32, 272,
                           write=False, hit_effect_sizes=[6])

create_formated_sprite_map('20m2d_ShoggothLaser',
                           0, 272, 6, 1, 32, 32,
                           laser_sprites_map, laser_animation_map, laser_index, laser_animate_index,
                           hit_effect_sizes=[6])
