export const keypressed: Record<string, 0 | 1> = {};

function keyAlias () {
    
    keypressed.up = keypressed.ArrowUp || keypressed.w;
    keypressed.down = keypressed.ArrowDown || keypressed.s;
    keypressed.left = keypressed.ArrowLeft || keypressed.a;
    keypressed.right = keypressed.ArrowRight || keypressed.d;
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