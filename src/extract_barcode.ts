/**
 * 提取番号
 * @param filePath 
 * @returns 
 */
export function extractBarCode(filePath: string) {
    // 定义匹配番号的正则表达式
    const p1 = /([a-zA-Z]{2,5})[-_](\d{3,4})/;
    const p2 = /([a-zA-Z]{2,5})(\d{3,4})/;
    const patterns = [p1, p2];
    // 从文件路径中搜索匹配的番号
    for (let pattern of patterns) {
        const match = filePath.match(pattern);
        if (match) {
            return match[1] + '-' + match[2];
        }
    }
    return;
}
