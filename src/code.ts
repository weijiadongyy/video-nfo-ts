import { log } from "console";
import path from "path";
import * as  fs from 'fs'
import { get_avator, get_data } from "./get_data";
import { write_nfo } from "./nfo";
import Jimp from "jimp";
import * as fsExtra from 'fs-extra';
import { downloadImage } from "./network";
import config from './config'
import { translate_actor_中文_日语 } from "./translate";
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

    log(`开始处理[${barCode}] ${filePath}`)
    const data = await get_data(barCode);

    let actorNames;//文件夹名称
    if (data.actors && data.actors.length > 0) {
        actorNames = data.actors.filter(a => !a.man).map(actor => actor.name).join(',');
    } else {
        actorNames = '佚名'
    }

    const destFolder = path.join(destFolderPathBase, actorNames, barCode);

    if (!fs.existsSync(destFolder)) {
        log('创建文件夹:' + destFolder);
        await fs.mkdirSync(destFolder, { recursive: true });
    }

    const destFileName_poster = path.join(destFolder, `${barCode}-fanart.jpg`);//海报fanart
    const destFileName_fanart = path.join(destFolder, `${barCode}-poster.jpg`);//背景图像

    if (data.posterUrl) {

        if (!fs.existsSync(destFileName_poster)) {
            log('下载海报图片:', data.posterUrl);
            const buff = await downloadImage(data.posterUrl, destFileName_poster)
            const imgData_poster = await Jimp.read(buff);
            await imgData_poster.writeAsync(destFileName_poster);
            // await imgData_poster.writeAsync(destFileName_thumb);
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
    //下载演员头像
    if (data.actors && data.actors.length > 0) {
        if (!fs.existsSync(actorImgFolderPath)) {
            log("创建演员头像文件夹:", actorImgFolderPath);
            fs.mkdirSync(actorImgFolderPath, { recursive: true });
        }
        for (const actor of data.actors) {
            if (actor.man) {
                continue;
            }
            const imgPath = path.join(actorImgFolderPath, actor.name + '.jpg');
            actor.tag_thumb = imgPath;
            if (!fs.existsSync(imgPath)) {
                log('获取演员图像:', imgPath);
                const names = await translate_actor_中文_日语(actor.name);
                names.push(actor.name);
                for (let i = 0; i < names.length; i++) {
                    const name = names[i];
                    let avator_url = await get_avator(name);
                    if (!avator_url && i == names.length - 1) {
                        avator_url = config.defaultAvator;
                    }
                    if (avator_url) {
                        await downloadImage(avator_url, imgPath);
                        break;
                    }
                }
            }
        }
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