import { Card, Form, Input } from "antd";
import "antd/dist/antd.css";
import Paragraph from "antd/lib/typography/Paragraph";

import debounce from "lodash/debounce";
import React, { Component } from "react";
import { createRoot } from "react-dom/client";

const editablePropetyMap: Record<string, PropertyInfo & { value: any }> = {};
let setState: Component["setState"] | undefined;

const updateUI = debounce(function () {
    setState?.({});
});

//
// make a property editor ui
// in dev mod, swc parser seems not flexible enough to
// go in deeper
//

interface PropertyInfo {
    fileName: string;
    startNumber: number;
    endNumber: number;
    module?: NodeModule;
    originValue: any;
    value?: any;
}

export function WYSIWYGProperty<T>(propertyName: string | string[], currentValue: T, options?: PropertyInfo): T {
    if (options) {
        console.log('WYSIWYGProperty', options);
    }
    updateUI();
    const _propertyName = Array.isArray(propertyName) ? propertyName.join('.') : propertyName; 
    editablePropetyMap[_propertyName] = {
        ...options!,
        originValue: currentValue,
        value: currentValue,
    };
    if (options?.module?.hot) {
        options?.module?.hot.dispose(() => {
            delete editablePropetyMap[_propertyName];
            updateUI();
        });
    }

    return currentValue;
}


const popover = document.createElement('div');
popover.style.cssText = `
    position:Fixed;
    top: 0;
    bottom: 0;
    left: 10;
    width: 300px;
    background: white;
    z-index: 1000;
`;
document.body.appendChild(popover);
class App extends Component {
    componentDidMount() {
        setState = this.setState.bind(this);
    }
    componentWillUnmount() {
        setState = undefined;
    }
    propertyChange( value: any, propertyInfo: PropertyInfo) {
        propertyInfo.value = value;

        this.setState({});
        // 请求服务进行更新
        this.sendUpdateNotice({
            fileName: propertyInfo.fileName,
            start: propertyInfo.startNumber,
            end: propertyInfo.endNumber,
            oldValue: JSON.stringify(propertyInfo.originValue),
            newValue: value,
        });
    }

    sendUpdateNotice = debounce((updateInfo) => {
        fetch('/__update_file', {
            method: 'post',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(updateInfo)
        });
    }, 300);

    render() {
        return <Card>
            <Form layout="horizontal" colon labelCol={{ span: 12 }} wrapperCol={{ span: 12 }}>
                {Object.keys(editablePropetyMap).map(x => {
                    const info = editablePropetyMap[x];
                    return <Form.Item key={x} label={<Paragraph ellipsis={{ tooltip: x }}>{x}</Paragraph>}>
                        <Input value={info.value} onChange={(e) => this.propertyChange(e.target.value, info)} />
                    </Form.Item>
                })}
            </Form>
        </Card>
    }
}

createRoot(popover).render(<App />);