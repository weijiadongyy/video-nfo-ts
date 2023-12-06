import { log } from 'console';
import config from './config'
import { translate_actor_日语_中文 } from "./translate";
import Airav from './websites/Airav';
import Javbus from './websites/Javbus';
import Missav from './websites/Missav';
const websites = config.websites.split(/\||,/);

const webs: WebSiteInterface[] = [];
let isInit = false;
function init() {
    if (isInit) {
        return;
    }
    isInit = true;
    websites.forEach(website => {
        switch (website) {
            case 'airav':
                webs.push(new Airav());
                break;
            case 'javbus':
                webs.push(new Javbus());
                break;
            case 'missav':
                webs.push(new Missav());
                break;
        }
    })
}


export async function get_data(barCode: string) {
    init();
    const data: NFOData = {};
    const datas: NFOData[] = [];
    for (const web of webs) {
        let has = false;
        if (!data.description && web.description) {
            has = true;
        }
        if (!data.posterUrl && web.posterUrl) {
            has = true;
        }
        if (config.extrafanart && !data.extrafanart && web.extrafanart) {
            has = true;
        }
        if (!has) {
            continue;
        }
        const md = web.get_data;
        if (!md) {
            continue;
        }
        try {
            const _data = await md(barCode);
            if (_data) {
                if (_data.actors && _data.actors.length == 0) {
                    _data.actors = undefined;
                }
                if (_data.extrafanart && _data.extrafanart.length == 0) {
                    _data.extrafanart = undefined;
                }
                datas.push(_data);
                Object.assign(data, _data);
            }
        } catch (e: any) {
            log('出错:' + e.message)
        }
    }

    if (data.barCode) {
        if (data.title?.startsWith(barCode)) {
            data.title = data.title.substring(barCode.length);
        }
        if (data.description?.startsWith(barCode)) {
            data.description = data.description.substring(barCode.length);
        }
        if (data.actors) {
            for (let actor of data.actors) {
                actor.name = actor.name.replace(/[?@$]/g, '_');
                actor.name = await translate_actor_日语_中文(actor.name);
            }
        }
        return { data, datas }
    } else {
        throw new Error('获取番号信息出错,可能是番号不对');
    }
}


export async function get_avator(name: string) {
    init();
    for (const web of webs) {
        const md = web.get_avatar;
        if (!md) {
            continue;
        }
        try {
            const avatorUrl = await md(name);
            if (avatorUrl) {
                return avatorUrl;
            }
        } catch (e: any) {
            console.log('get_avator出错:', e.message);
        }
    }

}


