import axios from "axios";
import config from './config'
import * as fs from "fs";
const proxy = config.proxy;

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.133 Safari/537.36';
if (proxy) {
    process.env.http_proxy = proxy;
    process.env.https_proxy = proxy;
}


export async function fetch_data(url: string) {
    const headers = {
        'User-Agent': userAgent,
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6'
    }
    const response = await axios.get(url, {
        headers
    });
    return response;
}

/**
 * 下载图片,返回Buffer
 * @param url 
 * @param fileName 
 * @returns 
 */
export async function downloadImage(url: string, fileName: string) {

    // 发起 HTTP GET 请求获取图片数据
    const response = await axios.get(url, {
        responseType: 'arraybuffer', headers: {
            'User-Agent': userAgent
        }
    });
    fs.writeFileSync(fileName, Buffer.from(response.data), {});

    return response.data as Buffer;
}