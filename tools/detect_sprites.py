import json
import cv2
import numpy as np

class sortable_contour:
    def __init__(self, cnt):
        self.cnt = cnt
        self.bdbox = cv2.boundingRect(cnt)

    def __lt__(self, b):
        if self.bdbox[1] < b.bdbox[1]:
            return True
        if self.bdbox[1] == b.bdbox[1]:
            if self.bdbox[0] < b.bdbox[0] or self.bdbox[0] == b.bdbox[0]:
                return True
            else:
                return False
        else:
            return False

    def __eq__(self, b):
        return self.bdbox[0] == b.bdbox[0] and self.bdbox[1] == b.bdbox[1]

    def __gt__(self, b):
        if self.__eq__(b):
            return False
        if self.__lt__(b):
            return False
        return True


class sortable_bdbox:
    def __init__(self, bdbox, name=''):
        self.bdbox = bdbox
        self.name = name

    def __lt__(self, b):
        if self.bdbox[1] < b.bdbox[1]:
            return True
        if self.bdbox[1] == b.bdbox[1]:
            if self.bdbox[0] < b.bdbox[0] or self.bdbox[0] == b.bdbox[0]:
                return True
            else:
                return False
        else:
            return False

    def __eq__(self, b):
        return self.bdbox[0] == b.bdbox[0] and self.bdbox[1] == b.bdbox[1]

    def __gt__(self, b):
        if self.__eq__(b):
            return False
        if self.__lt__(b):
            return False
        return True



def sort_contours(cnts):
    # construct the list of bounding boxes and sort them from top to
    # bottom
    
    sort_contours = [sortable_contour(cnt) for cnt in cnts]
    sorted_contours = [cnt.cnt for cnt in sorted(sort_contours)]

    return sorted_contours


img = cv2.imread(
    '../src/assets/Nintendo Switch - Disgaea 5 Complete - LiezerotaDark.png')

gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
thresh_img = cv2.threshold(
    gray_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

cnts = cv2.findContours(thresh_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cnts = cnts[0] if len(cnts) == 2 else cnts[1]
sprites_map = {}

cnts = sort_contours(cnts)

for i, cnt in enumerate(cnts):
    approx = cv2.contourArea(cnt)
    x1, y1, w, h = cv2.boundingRect(cnt)
    if approx < 64 or w < 4 or h < 4:
        continue

    cv2.rectangle(img, (x1, y1), (x1 + w, y1 + h), (255, 0, 0), 2)
    cv2.putText(img, str(i), (x1, y1 + 20),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv2.LINE_AA, False)
    sprites_map[i] = (x1, y1, w, h)

cv2.imwrite(
    '../src/assets/Nintendo Switch - Disgaea 5 Complete - LiezerotaDark.marked.png', img)
with open('../src/assets/Nintendo Switch - Disgaea 5 Complete - LiezerotaDark.marked.json', 'wb') as f:
    f.write(json.dumps(sprites_map).encode('utf-8'))
