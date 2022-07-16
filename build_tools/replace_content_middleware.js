const fs = require('fs-extra');

module.exports = async function (req, res, next) {
    const {
        fileName,
        start,
        end,
        oldValue,
        newValue,
    } = req.body;

    const file = await fs.readFile(fileName, 'utf-8');
    const parts = file.slice(start, end);
    console.log('replace content', fileName, oldValue, parts, newValue);
    if (parts == oldValue) {
        const newFile = file.slice(0, start) + newValue + file.slice(end);
        await fs.writeFile(fileName, newFile);
    }

    res.json({
        errno: 0
    });
};
