var Visitor = require('@swc/core/Visitor').Visitor;


class VisibleEditorTransformer extends Visitor {
    constructor(options) {
        super();
        this.options = options;
        this.hotClassCount = 0;
    }

    visitProgram(
        /** @type {import('@swc/core').Program} */ m
    ) {
        this.startSpan = m.span;
        this.hotClassCount = 0;
        return super.visitProgram(m);
    }

    visitCallExpression(
         /** @type {import('@swc/core').CallExpression} */ callExpression
    ) {
        if (callExpression.callee.type == 'Identifier'
            && callExpression.callee.value == 'WYSIWYGProperty'
        ) {
            console.log(
                'this.options', this.options, this.startSpan
            );

            const valueItem = callExpression.arguments[1].expression;

            callExpression.arguments.push({
                expression: {
                    type: 'ObjectExpression',
                    properties: [{
                        type: 'KeyValueProperty',
                        key: {
                            type: 'Identifier',
                            value: 'fileName',
                            span: callExpression.span
                        },
                        value: {
                            type: 'StringLiteral',
                            value: this.options.fileName || 'missing_file_name',
                            span: callExpression.span,
                            hasEscape: false,
                        },
                        span: callExpression.span
                    },
                    {
                        type: 'KeyValueProperty',
                        key: {
                            type: 'Identifier',
                            value: 'startNumber',
                            span: valueItem.span
                        },
                        value: {
                            type: 'NumericLiteral',
                            value: valueItem.span.start - this.startSpan.start,
                            span: valueItem.span,
                        },
                        span: callExpression.span
                    },
                    {
                        type: 'KeyValueProperty',
                        key: {
                            type: 'Identifier',
                            value: 'endNumber',
                            span: valueItem.span
                        },
                        value: {
                            type: 'NumericLiteral',
                            value: valueItem.span.end - this.startSpan.start,
                            span: valueItem.span,
                        },
                        span: callExpression.span
                    }
                    ],
                    span: callExpression.span
                }
            });
        }

        if (callExpression.callee.type == 'Identifier'
            && callExpression.callee.value == 'HotClass'
        ) {
            console.log(
                'this.options', this.options, this.startSpan
            );

            const valueItem = callExpression.arguments[0].expression;

            valueItem.properties.push({
                type: 'KeyValueProperty',
                key: {
                    type: 'Identifier',
                    value: 'hotClassId',
                    span: callExpression.span
                },
                value: {
                    type: 'StringLiteral',
                    value: this.options.fileName + '__' + this.hotClassCount,
                    span: callExpression.span,
                    hasEscape: false,
                },
                span: callExpression.span
            });
            this.hotClassCount ++;
        }

        return {
            ...callExpression,
            callee: this.visitCallee(callExpression.callee),
            arguments: this.visitArguments(callExpression.arguments),
        };
    }

    visitTsType(n) {
        return n;
    }
}

module.exports.VisibleEditorTransformer = VisibleEditorTransformer;
