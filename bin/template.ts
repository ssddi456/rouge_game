import * as fs from 'fs-extra';
import * as path from 'path';
import template from 'lodash/template';
import * as inquirer from 'inquirer';


(async () => {
    const templatingType = await inquirer.prompt({
        message: 'choose a template type',
        name: 'templateType',
        type: 'list',
        choices: [
            'demo',
            'level'
        ]
    });

    const templatingName = await inquirer.prompt({
        message: 'input a name',
        name: 'templateName',
        type: 'input',
    });

    console.log('templatingType', templatingType, 'templatingName', templatingName);
    
    const templateText = await fs.readFile(path.join(__dirname, `../template/${templatingType.templateType}.ts.tpl`), 'utf8');
    const rendered = template(templateText)({
        ...templatingType,
        ...templatingName
    });
    
    switch (templatingType.templateType) {
        case 'demo':
            await fs.writeFile(path.join(__dirname, `../src/demos/${templatingName.templateName}_demo.ts`), rendered);
            break;
        case 'level':
            await fs.writeFile(path.join(__dirname, `../src/levels/${templatingName.templateName}.ts`), rendered);
            break;
        default:
            throw new Error('illegal templatingType');
    }

})();