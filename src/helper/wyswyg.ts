
const editablePropetyMap: Record<string, PropertyInfo & { value: any }> = {};

//
// make a property editor ui
// in dev mod, swc parser seems not flexible enough to
// go in deeper
//

interface PropertyInfo {
    fileName: string;
    startNumber: number;
    endNumber: number;
}

export function WYSIWYGProperty<T>(propertyName: string | string[], currentValue: T, options?: PropertyInfo): T {
    if (options) {
        console.log('WYSIWYGProperty', options);
    }
    editablePropetyMap[Array.isArray(propertyName) ? propertyName.join('.') : propertyName] = {
        ...options!,
        value: currentValue,
    };

    return currentValue;
}