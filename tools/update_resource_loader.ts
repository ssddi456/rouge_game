import * as ts from 'typescript';
import * as fs from 'fs-extra';
import * as path from 'path';
import glob from 'glob';
import { difference, uniq } from 'lodash';


async function loadResourceMap() {

    const root = path.join(__dirname, '../src/assets');
    console.log('root', root);
    return new Promise<{
        animations: string[], 
        sprites: string[],
        shapes: string[],
        animationsNames: Record<string, string[]>,
        spritesNames: Record<string, string[]>
        shapesNames: string[],
    }>(resolve => {

        glob("*.json", {
            cwd: root,
        }, function (er, files) {
            // files is an array of filenames.
            // If the `nonull` option is set, and nothing
            // was found, then files is ["**/*.js"]
            // er is an error object or null.
            console.log(files);
            const animationExt = '.animation.json';
            const spritsExt = '.marked.json';
            const shapeExt = '.shape.json';
            const animations = files.filter(x => x.endsWith(animationExt)).map(x => path.basename(x, animationExt));
            const sprites = files.filter(x => x.endsWith(spritsExt)).map(x => path.basename(x, spritsExt));
            const shapes = files.filter(x => x.endsWith(shapeExt)).map(x => path.basename(x, shapeExt));

            const animationsNames = animations.reduce((map, k) => {
                map[k] = Object.keys(fs.readJsonSync( path.join(root, k + animationExt)));
                return map;
            }, {} as Record<string, string[]>);

            const spritesNames = sprites.reduce((map, k) => {
                map[k] = Object.keys(fs.readJsonSync(path.join(root, k + spritsExt)));
                return map;
            }, {} as Record<string, string[] >);

            const shapesNames = Object.keys(shapes.reduce((map, k) => {
                Object.keys(fs.readJsonSync(path.join(root, k + shapeExt)))
                    .forEach(x => map[x] = 1);
                return map;
            }, {} as Record<string, 1>));

            console.log(
                'animations', animations,
                'sprites', sprites,
                'shapes', shapes,
            );
            resolve({ 
                animations,
                sprites,
                shapes,
                animationsNames,
                spritesNames,
                shapesNames,
            });
        });
    });
}


async function loadConfig(source: string) {
    
    const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
    const animationsConfig = sourceFile.statements.filter( x => (
        ts.isVariableStatement(x)
        && ts.isVariableDeclarationList(x.declarationList)
        && ts.isIdentifier(x.declarationList.declarations[0].name)
        && x.declarationList.declarations[0].name.text == 'animations'
    )) as ts.VariableStatement[];
    
    console.assert(ts.isObjectLiteralExpression(animationsConfig![0].declarationList!.declarations![0]!.initializer!));
    const animationsAlias: Record<string, string> = eval(`(${animationsConfig![0].declarationList!.declarations![0]!.initializer?.getFullText()})`); 
    console.log('animationsAlias', animationsAlias);


    const spritesConfig = sourceFile.statements.filter(x => (
        ts.isVariableStatement(x)
        && ts.isVariableDeclarationList(x.declarationList)
        && ts.isIdentifier(x.declarationList.declarations[0].name)
        && x.declarationList.declarations[0].name.text == 'sprites'
    )) as ts.VariableStatement[];

    console.assert(ts.isObjectLiteralExpression(spritesConfig![0].declarationList!.declarations![0]!.initializer!));
    const spritesAlias: Record<string, string> = eval(`(${spritesConfig![0].declarationList!.declarations![0]!.initializer?.getFullText()})`);
    console.log('spritesAlias', spritesAlias);

    const shapesConfig = sourceFile.statements.filter(x => (
        ts.isVariableStatement(x)
        && ts.isVariableDeclarationList(x.declarationList)
        && ts.isIdentifier(x.declarationList.declarations[0].name)
        && x.declarationList.declarations[0].name.text == 'shapes'
    )) as ts.VariableStatement[];

    console.assert(ts.isObjectLiteralExpression(shapesConfig![0].declarationList!.declarations![0]!.initializer!));
    const shapesAlias: Record<string, string> = eval(`(${shapesConfig![0].declarationList!.declarations![0]!.initializer?.getFullText()})`);
    console.log('shapesAlias', shapesAlias);

    return {
        animationsAlias,
        spritesAlias,
        shapesAlias,
    };
}

async function updateResource() {
    const loaderCode = path.join(__dirname, '../src/loadAnimation.ts');
    const sourceCode = fs.readFileSync(loaderCode, 'utf8');

    const codeConfig = await loadConfig(sourceCode);
    const resourceContent = await loadResourceMap();

    const loadAnimateCodeTpl = (alias: string, resource: string) => `    const ${alias}AnimateMap = await loadSpriteSheet(loader, '${resource}');`;
    const loadSpriteCodeTpl = (alias: string, resource: string) => `    const ${alias}SpriteMap = await loadSprites(loader, '${resource}');`;

    const declareAnimateCodeTpl = (alias: string, origin: string) => `        ${alias}AnimateMap: cloneAnimationSprites(${alias}AnimateMap) as Record<${
        resourceContent.animationsNames[origin].map(x => JSON.stringify(x)).join(' | ')
    }, AnimatedSprite>,`;
    const declareSpriteCodeTpl = (alias: string, origin: string) => `        ${alias}SpriteMap: ${alias}SpriteMap as Record<${
        resourceContent.spritesNames[origin].map(x => JSON.stringify(x)).join(' | ')
    }, Sprite>,`;
    const declareShapeCodeTpl = (names: string[]) => `        shapeConfig: shapeConfig as Record<${
        names.map(x => JSON.stringify(x)).join(' | ')
    }, Vector[]>,`;

    console.log(
        resourceContent.animations,
        uniq(Object.values(codeConfig.animationsAlias))
    )
    const notConfigResource =  {
        animations: difference(
            resourceContent.animations,
            uniq(Object.values(codeConfig.animationsAlias)),
        ),
        sprites: difference(
            resourceContent.sprites,
            uniq(Object.values(codeConfig.spritesAlias)),
        )
    };

    const getIndexBetweenMark = (start: string, end: string) => [sourceCode.indexOf(start) + start.length, sourceCode.indexOf(end)];
    const indexNotConfigedRange = getIndexBetweenMark('/** not config start */', '/** not config end */');
    const indexLoaderCodeRange = getIndexBetweenMark('/** load resource start */', '/** load resource end */');
    const indexDeclareCodeRange = getIndexBetweenMark('/** declare resource start */', '/** declare resource end */');

    const currentContent = sourceCode.slice(...indexNotConfigedRange);
    console.log(indexNotConfigedRange, currentContent);

    fs.writeFileSync(loaderCode, [
        sourceCode.slice(0, indexNotConfigedRange[0]),
        `(${JSON.stringify(notConfigResource, null, 4)})`,
        sourceCode.slice(indexNotConfigedRange[1], indexLoaderCodeRange[0]),
        Object.entries(codeConfig.animationsAlias).map((entry) => loadAnimateCodeTpl(...entry)).join('\n'),
        '',
        Object.entries(codeConfig.spritesAlias).map((entry) => loadSpriteCodeTpl(...entry)).join('\n'),
        '',
        // shape is hardcoded
        '',
        sourceCode.slice(indexLoaderCodeRange[1], indexDeclareCodeRange[0]),
        Object.keys(codeConfig.animationsAlias).map(alias => declareAnimateCodeTpl(alias, codeConfig.animationsAlias[alias])).join('\n'),
        '',
        Object.keys(codeConfig.spritesAlias).map(alias => declareSpriteCodeTpl(alias, codeConfig.spritesAlias[alias])).join('\n'),
        '',
        declareShapeCodeTpl(resourceContent.shapesNames),
        '',
        sourceCode.slice(indexDeclareCodeRange[1]),
    ].join('\n'))
}

if (require.main == module) {
    updateResource();
}

export default updateResource;