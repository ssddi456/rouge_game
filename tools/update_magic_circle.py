import json
import cv2
import numpy as np
from utils import *

def process_magic_circle(img_name, ): 
    img = cv2.imread(get_file_path(img_name))
    b_channel, g_channel, r_channel = cv2.split(img)
    img_rgba = cv2.merge((b_channel, g_channel, r_channel, b_channel))
    [basename, _] = os.path.splitext(os.path.basename(img_name))
    cv2.imwrite(
        get_file_path('%s.rgba.png' % basename), img_rgba)


process_magic_circle('spell_circle_2.jpeg')
process_magic_circle('spell_circle_1.webp')
