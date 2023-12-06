import { log } from 'console';
import * as  fs from 'fs'
import * as path from 'path'

/**
 * 获取目标文件夹中所有的视频文件(包括子文件夹)
 * @param dir 
 * @param videoExtensions 
 * @param videoMinSize 
 * @returns 
 */
export async function findFiles(dir: string, videoExtensions: string[], videoMinSize: number = 0) {
    const lowerCaseExtensions = videoExtensions.map(ext => ext.toLowerCase());
    function _findFiles(_dir: string, _filePaths: string[] = [],) {
        const files = fs.readdirSync(_dir);
        files.forEach(file => {
            const filePath = path.join(_dir, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    _findFiles(filePath, _filePaths);
                } else {
                    const fileExtension = path.extname(file).toLowerCase();
                    if (lowerCaseExtensions.includes(fileExtension)) {
                        if (stat.size > videoMinSize) {
                            _filePaths.push(filePath);
                        }
                    }
                }
            } catch (e: any) {
                log("读取文件目录出错:", e.message)
            }
        })
        return _filePaths;
    }
    return _findFiles(dir, []);
}




