

import os


def get_file_path(file_name):
    """
    Get the path of the file.
    """
    return os.path.join(os.path.dirname(__file__), '../src/assets/%s' % (file_name))


def update_resource_loader():
    os.system('ts-node -p update_resource_loader.ts')
