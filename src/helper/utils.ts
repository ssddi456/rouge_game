
export const fixed2 = (num: number ) => {
    return num > 9 ? String(num) : '0' + num;
}

export const formatTime = (time: number) => {
    return fixed2(Math.floor(time / 60e3)) + ':' + fixed2(Math.floor((time % 60e3) / 1e3));
}