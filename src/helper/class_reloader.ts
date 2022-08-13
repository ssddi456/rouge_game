export function HotClass<T extends { new(...args: any[]): any }>({ module, hotClassId }: { module: NodeModule, hotClassId?: string }) {
    if (!hotClassId) {
        console.warn('nedd hotclass id');
        return function(c: T){
            return c;
        }
    }

    const info = module?.hot?.data?.[hotClassId] || {};

    const instanceList: any[] = info?.instanceList || [];
    info.instanceList = instanceList;
    if (module.hot) {
        module.hot.accept();
        module.hot.dispose((module) => {
            console.log('dispose', module);
            module[hotClassId] = info;
        });
    }
    
    return function _DecoratorName(constr: T) {
        const prevConstructor = info.prevConstructor || constr;
        info.prevConstructor = constr;

        if (prevConstructor.toString() !== constr.toString()) {
            location.reload();
        } else {

            instanceList.forEach(item => {
                hottedClass.prototype.__proto__ = constr.prototype;
            });
        }


        const hottedClass = class extends constr {
            constructor(...args: any[]) {
                super(...args);
                instanceList.push(this);
            }
        };

        hottedClass.prototype._constructor = constr;
        
        (hottedClass as any).displayName = constr.name;
        return hottedClass as T
    }
}
