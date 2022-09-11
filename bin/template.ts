import * as fs from 'fs-extra';
import * as path from 'path';
import template from 'lodash/template';
import * as inquirer from 'inquirer';
import { camelCase } from 'lodash';


(async () => {
    const templatingType = await inquirer.prompt({
        message: 'choose a template type',
        name: 'templateType',
        type: 'list',
        choices: [
            'demo',
            'level',
            'menu',
        ]
    });

    const templatingName = await inquirer.prompt({
        message: 'input a name',
        name: 'templateName',
        type: 'input',
    });

    console.log('templatingType', templatingType, 'templatingName', templatingName);
    
    const templateText = await fs.readFile(path.join(__dirname, `../template/${templatingType.templateType}.ts.tpl`), 'utf8');
    const templateName = templatingName.templateName;
    const rendered = template(templateText)({
        ...templatingType,
        templateName,
        camelCasetemplateName: templateName[0].toUpperCase() + templateName.slice(1)
    });
    
    switch (templatingType.templateType) {
        case 'demo':
            await fs.writeFile(path.join(__dirname, `../src/demos/${templatingName.templateName}_demo.ts`), rendered);
            break;
        case 'level':
            await fs.writeFile(path.join(__dirname, `../src/levels/${templatingName.templateName}.ts`), rendered);
            break;
        case 'menu':
            await fs.writeFile(path.join(__dirname, `../src/menu/${templatingName.templateName}.ts`), rendered);
            break;
        default:
            throw new Error('illegal templatingType');
    }

})();