export const keypressed: Record<string, 0 | 1> = {};

function keyAlias() {

    keypressed.up = keypressed.ArrowUp || keypressed.w;
    keypressed.down = keypressed.ArrowDown || keypressed.s;
    keypressed.left = keypressed.ArrowLeft || keypressed.a;
    keypressed.right = keypressed.ArrowRight || keypressed.d;

    keypressed.attack = keypressed.x;
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

export const mouse = { x: 0, y: 0 };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.screenX;
    mouse.y = e.screenY;
});
