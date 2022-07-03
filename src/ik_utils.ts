export function line_of_circle_x_circle(circleA: [number, number, number], circleB: [number, number, number]) {
    const circle_a_formular = circle_formular(...circleA);
    const line = circle_line(
        circleA,
        circleB
    );
    const circle_a_and_line = transform_circle_formular_to_quadratic_equation(circle_a_formular, line);
    const points = get_root_quadratic_equation(...circle_a_and_line);
    return [
        [points[0], get_y_by_x_on_line(line, points[0])],
        [points[1], get_y_by_x_on_line(line, points[1])]
    ];
}
function circle_formular(x: number, y: number, r: number) {
    return [
        1,
        - 2 * x,
        x * x,
        1,
        -2 * y,
        y * y,
        - r * r
    ] as [number, number, number, number, number, number, number,];
}

function circle_line(a: [number, number, number], b: [number, number, number]) {
    const circle_a = circle_formular(...a);
    const circle_b = circle_formular(...b);
    const line = [];
    for (let index = 0; index < circle_a.length; index++) {
        const element = circle_a[index];
        const element_b = circle_b[index];
        line[index] = element_b - element;
    }
    return [line[1] / line[4], line[4] / line[4], (line[2] + line[5] + line[6]) / line[4]] as [number, number, number];
}

function get_y_by_x_on_line(line: [number, number, number], x: number) {
    return - (line[0] * x + line[2]) / line[1];
}

function transform_circle_formular_to_quadratic_equation(
    a: [number, number, number, number, number, number, number,],
    b: [number, number, number]
) {
    const n = - b[0];
    const m = - b[2];

    const expand_1 = [a[3] * n * n, a[3] * 2 * n * m, a[3] * m * m];
    const expand_2 = [a[4] * n, a[4] * m];

    const quadratic_equation = [
        a[0] + expand_1[0],

        a[1] + expand_1[1] + expand_2[0],

        a[2] + expand_1[2] + expand_2[1] +
        a[5] +
        a[6]
    ];
    return quadratic_equation as [number, number, number];
}

export function get_root_quadratic_equation(a: number, b: number, c: number) {
    const delta = b * b - 4 * a * c;
    const delta_root = Math.sqrt(delta);
    const x1 = (- b + delta_root) / (2 * a);
    const x2 = (- b - delta_root) / (2 * a);
    return [x1, x2]
}

if (module == require.main) {
    const circle_a: [number, number, number] = [0, 0, 30];
    const circle_b: [number, number, number] = [30, 30, 30];
    const circle_a_formular = circle_formular(...circle_a);
    const line = circle_line(
        circle_a,
        circle_b
    );
    const circle_a_and_line = transform_circle_formular_to_quadratic_equation(circle_a_formular, line);
    const points = get_root_quadratic_equation(...circle_a_and_line);
    console.log('points', line, circle_a_and_line, points)
    console.log(get_root_quadratic_equation(1, 2, 1));
    console.log(get_root_quadratic_equation(1, -2, 1));
    console.log(get_root_quadratic_equation(1, 4, 4));
    console.log(get_root_quadratic_equation(1, -4, 4));
    console.log(get_root_quadratic_equation(3, -9, 4));
    const ret = line_of_circle_x_circle(
        [0, 0, 30],
        [30, 30, 30]
    );
    console.log('ret', ret);
}