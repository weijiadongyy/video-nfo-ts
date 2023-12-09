import { log } from "console";
import * as  path from "path";
import * as  fs from 'fs'
import { write_nfo } from "./nfo";
import * as Jimp from "jimp";
import * as fsExtra from 'fs-extra';
import { downloadImage } from "./network";
import config from './config'
import { translate_actor_中文_日语, translate_actor_日语_中文 } from "./translate";

import websites from './websites'

const actorImgFolderPath = path.resolve(config.destFolderPath, config.actorImgFolderPath || 'actor');

/**
 * 处理视频文件
 * @param filePath 
 * @param destFolderPathBase 
 * @param barCode 
 */
export default async function code(filePath: string, destFolderPathBase: string, barCode?: string) {
    const fileInfo = path.parse(filePath);
    const fileName = fileInfo.name;
    if (!barCode) {
        barCode = fileName;
    }
    barCode = barCode.toUpperCase();

    log(`开始处理[${barCode}] ${filePath}`);

    let actorNames = "佚名";
    let destFolder = path.join(destFolderPathBase, actorNames, barCode);

    const data: NFOData = {}
    for (const web of websites) {
        let has = false;
        if (!data.description && web.description) {
            has = true;
        }
        if (!data.posterUrl && web.posterUrl) {
            has = true;
        }
        if (config.extrafanart && !data.extrafanarts && web.extrafanart) {
            has = true;
        }
        if (!has) {
            continue;
        }
        const md = web.get_data;
        if (!md) {
            continue;
        }

        let _data;
        try {
            _data = await md(barCode);
        } catch (e: any) {
            log('抓包出错:', e.message);
            continue;
        }
        if (_data) {

            if ((!data.actors || data.actors.length == 0) && (_data.actors && _data.actors.length > 0)) {
                for (const actor of _data.actors) {
                    actor.name_cn = await translate_actor_日语_中文(actor.name);
                }
                actorNames = _data.actors.filter(a => !a.man).map(actor => actor.name_cn).join(',');
                //#TODO 更改destFolder文件夹,将原来的destFolder文件夹里面的内容移动到新的文件夹内
                destFolder = path.join(destFolderPathBase, actorNames, barCode);
            }

            if (!fs.existsSync(destFolder)) {
                log("创建文件夹:", destFolder);
                fs.mkdirSync(destFolder, { recursive: true });
            }

            if (!data.posterUrl && _data.posterUrl) {
                try {
                    await dealPoster({
                        posterUrl: _data.posterUrl,
                        barCode,
                        destFolder
                    });
                } catch (e: any) {
                    log('处理海报出错:', e.message);
                    //出错了
                    delete _data.posterUrl;
                }
            }

            if (config.extrafanart && (!data.extrafanarts || data.extrafanarts.length == 0) && (_data.extrafanarts && _data.extrafanarts.length > 0)) {
                try {
                    await dealExtrafanart(destFolder, _data.extrafanarts);
                } catch (e: any) {
                    log('处理剧照出错:', e.message);
                    delete _data.extrafanarts;
                }
            }

            Object.assign(data, _data);
        }
    }

    if (data.actors && data.actors.length > 0) {
        //下载演员头像
        if (!fs.existsSync(actorImgFolderPath)) {
            log("创建演员头像文件夹:", actorImgFolderPath);
            fs.mkdirSync(actorImgFolderPath, { recursive: true });
        }
        for (const actor of data.actors) {
            if (actor.man) {
                //男演员头像一般没有
                continue;
            }
            const imgPath = path.join(actorImgFolderPath, actor.name + '.jpg');
            actor.tag_thumb = imgPath;
            if (!fs.existsSync(imgPath)) {
                log('获取演员图像:', imgPath);
                const names = await translate_actor_中文_日语(actor.name_cn || actor.name);
                names.unshift(actor.name);

                loop:
                for (let i = 0; i < names.length; i++) {
                    const name = names[i];
                    for (let j = 0; j < websites.length; j++) {
                        const web = websites[j];
                        const get_avator = web.get_avatar;
                        if (!get_avator) {
                            continue;
                        }
                        const avator_url = await get_avator(name);
                        if (avator_url) {
                            try {
                                log('下载演员头像图片:', avator_url);
                                await downloadImage(avator_url, imgPath);
                                break loop;
                            } catch (e: any) {
                                log('下载演员头像图片出错:', e.message);
                            }
                        }
                    }

                    if (i == websites.length - 1) {
                        //实在找不到了
                        try {
                            log('下载默认演员头像图片:', config.defaultAvator);
                            await downloadImage(config.defaultAvator, imgPath);
                        } catch (e: any) {
                            log('下载默认演员头像图片出错:', e.message);
                        }
                    }
                }
            }
        }
    }

    if (!data.posterUrl) {
        throw new Error('数据不完整');
    }
    const destFileName_nfo = path.join(destFolder, barCode + '.nfo');
    log('开始写入nfo文件:', destFileName_nfo);
    await write_nfo(data, destFileName_nfo);

    const destFileName_video = path.join(destFolder, barCode + fileInfo.ext)
    if (filePath != destFileName_video) {
        log('开始移动视频文件到:', destFileName_video);
        fsExtra.moveSync(filePath, destFileName_video, { overwrite: true });
    }

}



/**
 * 处理剧照
 * @param destFolder 
 * @param extrafanarts 
 */
async function dealExtrafanart(destFolder: string, extrafanarts: Extrafanart[]) {
    const dir = path.join(destFolder, config.extrafanart);
    if (!fs.existsSync(dir)) {
        log("创建剧照文件夹:", dir);
        fs.mkdirSync(dir, { recursive: true });
    }
    for (let i = 0; i < extrafanarts.length; i++) {
        const image = extrafanarts[i];
        const fileName = path.join(dir, 'extrafanart_' + (i + 1) + '.jpg');
        if (!fs.existsSync(fileName)) {
            log('下载剧照图片:', image.url)
            await downloadImage(image.url, fileName);
        }
    }
}


/**
 * 处理海报
 */
async function dealPoster(opts: {
    posterUrl: string,
    destFolder: string,
    barCode: string
}) {
    const { posterUrl, destFolder, barCode } = opts;
    //#nfo可能海报名字与背景名字是反的
    const destFileName_poster = path.join(destFolder, `${barCode}-fanart.jpg`);//海报fanart
    const destFileName_fanart = path.join(destFolder, `${barCode}-poster.jpg`);//背景图像
    //处理海报
    if (!fs.existsSync(destFileName_poster)) {
        log('下载海报图片:', posterUrl);
        await downloadImage(posterUrl, destFileName_poster);
    }
    if (!fs.existsSync(destFileName_fanart) || true) {
        log('裁剪海报中背景:', destFileName_fanart);
        const imgData_poster = await Jimp.read(destFileName_poster);
        const { width, height } = imgData_poster.bitmap;
        const startPos = Math.floor(width * 0.525);
        const rightPoster = imgData_poster.clone().crop(startPos, 0, width - startPos, height);
        await rightPoster.writeAsync(destFileName_fanart);
    }
}


