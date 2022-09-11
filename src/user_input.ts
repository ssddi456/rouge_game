export const keypressed: Record<string, 0 | 1> = {};

function keyAlias() {

    keypressed.up = keypressed.ArrowUp || keypressed.w;
    keypressed.down = keypressed.ArrowDown || keypressed.s;
    keypressed.left = keypressed.ArrowLeft || keypressed.a;
    keypressed.right = keypressed.ArrowRight || keypressed.d;

    keypressed.attack = keypressed.z;
    keypressed.heavy_attack = keypressed.x;
    keypressed.shoot = keypressed.c;
}

export function cleanInput() {
    for (const key in keypressed) {
        if (Object.prototype.hasOwnProperty.call(keypressed, key)) {
            keypressed[key] = 0;
        }
    }
    keyAlias();
}

window.addEventListener('keydown', (e) => {
    keypressed[e.key] = 1;
    keypressed[e.code] = 1;
    keyAlias();
});

window.addEventListener('keyup', (e) => {
    keypressed[e.key] = 0;
    keypressed[e.code] = 0;

    keyAlias();
});

export const mouse = { 
    x: 0, 
    y: 0,
    left: 0,
    right: 0,
    middle: 0,
    wheel: 0,
    0: 0,
    1: 0,
    2: 0,
};
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', (e) => {
    const button = e.button as 0 | 1 | 2;
    mouse[button] = 1;
    mouse.left = button === 0 ? 1 : 0;
    mouse.right = button === 2 ? 1 : 0;
});

window.addEventListener('mouseup', (e) => {
    const button = e.button as 0 | 1 | 2;
    mouse[button] = 0;
    mouse.left = button === 0 ? 0 : 1;
    mouse.right = button === 2 ? 0 : 1;
});
