import express, { Request, Response, NextFunction} from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';
import bodyParser from 'body-parser';
import updateResource from '../tools/update_resource_loader';

const configRoot = path.join(__dirname, '../src/assets/');
const animationConfig = (name: string) => path.join(configRoot, `${name}.animation.json`);
const markedConfig = (name: string) => path.join(configRoot, `${name}.marked.json`);
const rgbaImage = (name: string) => path.join(configRoot, `${name}.rgba.png`);
const shapeConfig = () => path.join(configRoot, `all.shape.json`);

const resOk = (data: any) => {
    return {
        code: 0,
        msg: '',
        data,
    };
}
const app = express();
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', '*');

    if (req.method == 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});
const imageMiddleWare = express.static(configRoot);
app.use('/public', imageMiddleWare, (req, res, next) => {
    const relativePath = decodeURIComponent(req.path);
    console.log('req.path', relativePath);
    if (relativePath.match('.rgba.')) {
        const foreignImage = path.join(configRoot, relativePath.replace('.rgba.', '.'))
        if (fs.existsSync(foreignImage)) {
            fs.copyFileSync(foreignImage, path.join(configRoot, relativePath));
            return imageMiddleWare(req,res, next);
        }
    }
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());


app.get('/list', (req, res,) => {
    const list = fs.readdirSync(configRoot);
    res.json(resOk({
        list: list.filter(name => {
            const ext1 = path.extname(name);
            const base1 = path.basename(name, ext1);
            return !path.extname(base1);
        }).map(_x => {
            const x = path.basename(_x, path.extname(_x));
            return {
                name: x,
                resource: path.basename(rgbaImage(x)),
                marked: fs.existsSync(markedConfig(x)),
                markedName: markedConfig(x),
                animation: fs.existsSync(animationConfig(x)),
                animationName: animationConfig(x),
            };
        }),
    }));
});

app.get('/get_marked', (req, res) => {
    const fileName = markedConfig(req.query.name as string);
    if (fs.existsSync(fileName)) {
        const config = fs.readJSONSync(markedConfig(req.query.name as string));
        res.json(resOk({ config }));
    } else {
        fs.writeJSONSync(fileName, {});
        res.json(resOk({ config: {} }));
    }
});

app.post('/save_marked', (req, res, next) => {
    if (!req.body.name || !req.body.config) {
        throw new Error('name or config is not found');
    }
    fs.writeJSONSync(markedConfig(req.body.name), req.body.config);
    updateResource();
    res.json(resOk({}));
});

app.get('/get_animation', (req, res, next) => {
    const fileName = animationConfig(req.query.name as string);
    if (fs.existsSync(fileName)) {
        const config = fs.readJSONSync(fileName);
        res.json(resOk({config}));
    } else {
        fs.writeJSONSync(fileName, {});
        res.json(resOk({ config: {} }));
    }
});

app.post('/save_animation', (req, res, next) => {

    if (!req.body.name || !req.body.config) {
        throw new Error('name or config is not found');
    }
    fs.writeJSONSync(animationConfig(req.body.name), req.body.config);
    updateResource();
    res.json(resOk({}));
});


app.get('/get_shape', (req, res) => {
    const fileName = shapeConfig();
    if (fs.existsSync(fileName)) {
        const config = fs.readJSONSync(shapeConfig());
        res.json(resOk({ config }));
    } else {
        fs.writeJSONSync(fileName, {});
        res.json(resOk({ config: {} }));
    }
});

app.post('/save_shape', (req, res) => {
    fs.writeJSONSync(shapeConfig(), req.body);
    updateResource();
    res.json(resOk({}));
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json(err);
});

app.listen(7001);