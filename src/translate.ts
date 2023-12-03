import config from "./config";
const translateActors: { [key: string]: string } = config.translateActors || {}

type OriginalObject = {
    [key: string]: string;
};

type ReversedObject = {
    [key: string]: string[];
};

function reverseObjectWithArrays(obj: OriginalObject): ReversedObject {
    const reversedObject: ReversedObject = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value: string = obj[key];
            // 如果值在反转对象中不存在，则创建一个数组
            if (!reversedObject.hasOwnProperty(value)) {
                reversedObject[value] = [key];
            } else {
                // 如果值已经存在，则将新的键添加到数组中
                reversedObject[value].push(key);
            }
        }
    }

    return reversedObject;
}
const translateActors_ = reverseObjectWithArrays(translateActors);



//翻译
export async function translate_actor_日语_中文(name: string) {
    if (translateActors[name]) {
        return translateActors[name];
    }
    return name;
}

//搜索用
export async function translate_actor_中文_日语(name: string) {
    if (translateActors_[name]) {
        return [...translateActors_[name]]
    }
    return [name];
}
