//#TODO 读取nfo文件,比较添加内容
import config from './config'
import * as path from 'path'
import { extractBarCode } from './extract_barcode';
import { log } from 'console';
import { findFiles } from './utils';
import code from './code';

const sourceFolderPath = path.resolve(config.sourceFolderPath);
const destFolderPath = path.resolve(config.destFolderPath);
const videoExtensions = config.videoTypes.split(/,|\|/);
const videoMinSize = config.videoMinSize;


async function main() {

    log('寻找视频文件');
    const filePaths = await findFiles(sourceFolderPath, videoExtensions, videoMinSize * 1024 * 1024);
    log(`共找到视频文件${filePaths.length}个`)

    const errList = [];
    for (let i = 0; i < filePaths.length; i++) {
        let line = `\n\n===============进度:${i + 1}/${filePaths.length}===============`
        if (errList.length > 0) {
            line += ' 失败数量:' + errList.length;
        }
        log(line);

        const filePath = filePaths[i];
        const fileInfo = path.parse(filePath);
        const fileName = fileInfo.name;
        const barCode = extractBarCode(fileName) || fileName;

        const barCodes = [barCode];
        if (barCode != fileName) {
            barCodes.push(fileName);
        }
        for (let i = 0; i < barCodes.length; i++) {
            const bc = barCodes[i];
            try {
                await code(filePath, destFolderPath, bc);
                break;
            } catch (e: any) {
                log('出错了:', e.message);
                if (i == barCodes.length - 1) {
                    errList.push(filePath);
                }
            }
        }
    }
    if (errList.length > 0) {
        log('失败文件:');
        errList.forEach(str => {
            log(str);
        })
    }

}
main();
