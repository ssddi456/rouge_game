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


def show_ui(marked_img, mask, img_rgba):
    cv2.namedWindow("marked", cv2.WINDOW_NORMAL)
    cv2.namedWindow("mask", cv2.WINDOW_NORMAL)
    cv2.namedWindow("img_rgba", cv2.WINDOW_NORMAL)

    cv2.imshow("marked", marked_img)
    cv2.imshow("mask", mask)
    cv2.imshow("img_rgba", img_rgba)

    if cv2.waitKey(0):
        cv2.destroyAllWindows()

def nothing(x):
    pass

def pick_color_hsv(name):

    # Create a window
    cv2.namedWindow('image')

    # create trackbars for color change
    # Hue is from 0-179 for Opencv
    cv2.createTrackbar('HMin', 'image', 0, 179, nothing)
    cv2.createTrackbar('SMin', 'image', 0, 255, nothing)
    cv2.createTrackbar('VMin', 'image', 0, 255, nothing)
    cv2.createTrackbar('HMax', 'image', 0, 179, nothing)
    cv2.createTrackbar('SMax', 'image', 0, 255, nothing)
    cv2.createTrackbar('VMax', 'image', 0, 255, nothing)

    # Set default value for MAX HSV trackbars.
    cv2.setTrackbarPos('HMax', 'image', 179)
    cv2.setTrackbarPos('SMax', 'image', 255)
    cv2.setTrackbarPos('VMax', 'image', 255)

    # Initialize to check if HSV min/max value changes
    hMin = sMin = vMin = hMax = sMax = vMax = 0
    phMin = psMin = pvMin = phMax = psMax = pvMax = 0

    img = cv2.imread(('../src/assets/%s.png' % name), cv2.IMREAD_UNCHANGED)

    output = img
    waitTime = 33

    while(1):

        # get current positions of all trackbars
        hMin = cv2.getTrackbarPos('HMin', 'image')
        sMin = cv2.getTrackbarPos('SMin', 'image')
        vMin = cv2.getTrackbarPos('VMin', 'image')

        hMax = cv2.getTrackbarPos('HMax', 'image')
        sMax = cv2.getTrackbarPos('SMax', 'image')
        vMax = cv2.getTrackbarPos('VMax', 'image')

        # Set minimum and max HSV values to display
        lower = np.array([hMin, sMin, vMin])
        upper = np.array([hMax, sMax, vMax])

        # Create HSV Image and threshold into a range.
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, lower, upper)

        color = (200, 100, 255)  # sample of a color
        filledImg = np.full(img.shape, color, np.uint8)
        output = cv2.bitwise_or(img, filledImg, mask=mask)

        # Print if there is a change in HSV value
        if((phMin != hMin) | (psMin != sMin) | (pvMin != vMin) | (phMax != hMax) | (psMax != sMax) | (pvMax != vMax)):
            print("(hMin = %d , sMin = %d, vMin = %d), (hMax = %d , sMax = %d, vMax = %d)" % (
                hMin, sMin, vMin, hMax, sMax, vMax))

            print(
                "np.array([%d, %d, %d], dtype=\"uint8\"),np.array([%d, %d, %d], dtype=\"uint8\")" 
                & ( hMin, sMin, vMin, hMax, sMax, vMax))

            phMin = hMin
            psMin = sMin
            pvMin = vMin
            phMax = hMax
            psMax = sMax
            pvMax = vMax

        # Display output image
        cv2.imshow('image', output)

        # Wait longer to prevent freeze for videos.
        if cv2.waitKey(waitTime) & 0xFF == ord('q'):
            break

    cv2.destroyAllWindows()


def pick_color_rgb(name):

    # Create a window
    cv2.namedWindow('image')

    # create trackbars for color change
    # Hue is from 0-179 for Opencv
    cv2.createTrackbar('rMin', 'image', 0, 255, nothing)
    cv2.createTrackbar('bMin', 'image', 0, 255, nothing)
    cv2.createTrackbar('gMin', 'image', 0, 255, nothing)
    cv2.createTrackbar('rMax', 'image', 0, 255, nothing)
    cv2.createTrackbar('bMax', 'image', 0, 255, nothing)
    cv2.createTrackbar('gMax', 'image', 0, 255, nothing)

    # Set default value for MAX HSV trackbars.
    cv2.setTrackbarPos('rMax', 'image', 255)
    cv2.setTrackbarPos('bMax', 'image', 255)
    cv2.setTrackbarPos('gMax', 'image', 255)

    # Initialize to check if HSV min/max value changes
    rMin = bMin = gMin = rMax = bMax = gMax = 0
    prMin = pbMin = pgMin = prMax = pbMax = pgMax = 0

    img = cv2.imread(('../src/assets/%s.png' % name), cv2.IMREAD_UNCHANGED)

    waitTime = 33
    b_channel, g_channel, r_channel = cv2.split(img)

    while(1):

        # get current positions of all trackbars
        rMin = cv2.getTrackbarPos('rMin', 'image')
        bMin = cv2.getTrackbarPos('bMin', 'image')
        gMin = cv2.getTrackbarPos('gMin', 'image')

        rMax = cv2.getTrackbarPos('rMax', 'image')
        bMax = cv2.getTrackbarPos('bMax', 'image')
        gMax = cv2.getTrackbarPos('gMax', 'image')

        # Set minimum and max HSV values to display
        lower = np.array([rMin, bMin, gMin])
        upper = np.array([rMax, bMax, gMax])

        mask = cv2.bitwise_not(cv2.inRange(img, lower, upper))

        img_rgba = cv2.merge((b_channel, g_channel, r_channel, mask))

        # Print if there is a change in HSV value
        if((prMin != rMin) | (pbMin != bMin) | (pgMin != gMin) | (prMax != rMax) | (pbMax != bMax) | (pgMax != gMax)):
            # print("(rMin = %d , bMin = %d, gMin = %d), (rMax = %d , bMax = %d, gMax = %d)" % (
            #     rMin, bMin, gMin, rMax, bMax, gMax))

            print("[%d, %d, %d], [%d, %d, %d]" % (rMin, bMin, gMin, rMax, bMax, gMax))

            prMin = rMin
            pbMin = bMin
            pgMin = gMin
            prMax = rMax
            pbMax = bMax
            pgMax = gMax

        # Display output image
        cv2.imshow('image', img_rgba)

        # Wait longer to prevent freeze for videos.
        if cv2.waitKey(waitTime) & 0xFF == ord('q'):
            break

    cv2.destroyAllWindows()

def process_sheet(name):
    img = cv2.imread(
        ('../src/assets/%s.png' % name), cv2.IMREAD_UNCHANGED)
    # get color at y, x
    # print(img[52][28])

    marked_img = img.copy()
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

        cv2.rectangle(marked_img, (x1, y1), (x1 + w, y1 + h), (255, 0, 0), 2)
        cv2.putText(marked_img, str(i), (x1, y1 + 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv2.LINE_AA, False)
        sprites_map[i] = (x1 + 1, y1 + 1, w - 2, h - 2)


    # RGB 150 187 235
    # BRG 235 187 150
    mask1 = cv2.bitwise_not(cv2.inRange(
        img,
        np.array([230, 180, 140], dtype="uint8"),
        np.array([236, 187, 150], dtype="uint8")
    ))

    # rgb(90 165 80);
    # 80, 165, 90
    mask2 = cv2.bitwise_not(cv2.inRange(
        img,
        np.array([75, 165, 84], dtype="uint8"),
        np.array([75, 165, 85], dtype="uint8")
    ))

    mask = cv2.bitwise_and(mask1, mask2)

    b_channel, g_channel, r_channel = cv2.split(img)

    img_rgba = cv2.merge((b_channel, g_channel, r_channel, mask))

    cv2.imwrite(
        ('../src/assets/%s.marked.png' % name), marked_img)
    cv2.imwrite(
        ('../src/assets/%s.rgba.png' % name), img_rgba)

    with open(
        ('../src/assets/%s.marked.json' % name), 'wb') as f:
        f.write(json.dumps(sprites_map).encode('utf-8'))


def process_sheet2(name, low, high):
    img = cv2.imread(
        ('../src/assets/%s.png' % name))
    # print("%s" % name)
    # get color at y, x
    # print(img[52][28])

    marked_img = img.copy()
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    thresh_img = cv2.threshold(
        gray_img, 100, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    cnts = cv2.findContours(
        thresh_img, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)
    cnts = cnts[0] if len(cnts) == 2 else cnts[1]
    sprites_map = {}

    cnts = sort_contours(cnts)

    for i, cnt in enumerate(cnts):
        approx = cv2.contourArea(cnt)
        x1, y1, w, h = cv2.boundingRect(cnt)
        print('cnt', cnt, (x1, y1, w, h))
        if approx < 64 or w < 4 or h < 4:
            continue

        cv2.rectangle(marked_img, (x1, y1), (x1 + w, y1 + h), (255, 0, 0), 2)
        cv2.putText(marked_img, str(i), (x1, y1 + 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv2.LINE_AA, False)
        sprites_map[i] = (x1 + 1, y1 + 1, w - 2, h - 2)

    show_ui(marked_img, marked_img, img)


def process_rgba(name, low, high):
    img = cv2.imread(
        ('../src/assets/%s.png' % name), cv2.IMREAD_UNCHANGED)
    b_channel, g_channel, r_channel, oa_channel = cv2.split(img)
    # test_oa = cv2.merge((oa_channel, oa_channel, oa_channel, oa_channel))
    # cv2.imshow("test_oa", test_oa)
    _img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
    mask = cv2.bitwise_not(cv2.inRange(
        _img,
        np.array(low, dtype="uint8"),
        np.array(high, dtype="uint8")
    ))

    test_oa = cv2.merge((mask, mask, mask, mask))
    cv2.namedWindow("test_oa", cv2.WINDOW_NORMAL)
    cv2.imshow("test_oa", test_oa)

    img_rgba = cv2.merge((b_channel, g_channel, r_channel, mask))

    cv2.imwrite(
        ('../src/assets/%s.rgba.png' % name), img_rgba)

    cv2.namedWindow("img_rgba", cv2.WINDOW_NORMAL)
    cv2.imshow("img_rgba", img)

    if cv2.waitKey(0):

        cv2.destroyAllWindows()


# pick_color_rgb('Nintendo Switch - Disgaea 4 - Succubus')

# process_rgba('Nintendo Switch - Disgaea 4 - Succubus',
#              [202, 138, 100], [209, 141, 103])


# pick_color_hsv('Nintendo Switch - Disgaea 4 - Succubus')
# process_sheet('Nintendo Switch - Disgaea 5 Complete - LiezerotaDark')
# process_sheet('Nintendo Switch - Disgaea 5 Complete - Weapons Bow')
# process_sheet('Nintendo Switch - Disgaea 5 Complete - Weapons Gun')
# process_sheet('Nintendo Switch - Disgaea 5 Complete - Miscellaneous Monsters')
# process_sheet('Nintendo Switch - Disgaea 5 Complete - Weapons Spear')

process_rgba('Nintendo Switch - Disgaea 5 Complete - Weapons Spear',
             [75, 165, 84], 
             [75, 165, 85])
