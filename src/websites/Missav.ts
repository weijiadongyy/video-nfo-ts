import { log } from "console";
import { fetch_data } from "../network";
import * as cheerio from 'cheerio';

export default class Missav implements WebSiteInterface {
    description = true;
    extrafanart = false;
    posterUrl = true;

    async get_data(barCode: string) {
        const url = 'https://missav.com/cn/' + barCode;
        log('请求:', url);
        const response = await fetch_data(url);
        const htmlString = response.data;

        const data: NFOData = {
            barCode: barCode,
            website: url
        }
        const $ = cheerio.load(htmlString);

        let htmlBarCode;

        $('.space-y-2>.text-secondary').each((index, item) => {
            const name = $(item).children('span:nth-child(1)').text();
            const value = $(item).text().substring(name.length + 1).trim();
            if (name == '番号:') {
                htmlBarCode = value;
            }

            else if (name == '发行时间:') {
                data.publish_date = value;
            }
            else if (name == '标题:') {
                data.title = value;
            }
            else if (name == '女优:' || name == '男优:') {
                data.actors = data.actors || [];
                value.split(', ').forEach(item => {
                    data.actors!.push({
                        name: item.split('(')[0].trim(),
                        man: name == '男优:'
                    })
                })
            }
            else if (name == '类型:') {
                data.tags = [];
                value.split(', ').forEach(name => {
                    data.tags!.push({
                        name
                    })
                })
            }
        })

        if (htmlBarCode != barCode) {
            log("番号不对:")
            return;
        }

        if (!data.title) {
            data.title = $('h1').text();
        }

        data.description = $(".text-secondary.break-all").text().trim();

        if (!data.description) {
            data.description = $('h1').text();
        }
        data.posterUrl = $('video.player').attr('data-poster');
        return data;


    }

    async get_avatar(name: string) {
        const url = 'https://missav.com/cn/search/' + name;
        const response = await fetch_data(url);
        const htmlString = response.data;
        const $ = cheerio.load(htmlString);
        const imgs = $('img.object-cover');
        for (let i = 0; i < imgs.length; i++) {
            const img = imgs[i];
            const src = img.attribs['src'];
            const alt = img.attribs['alt'];
            const parts = alt.split(/[()\s]+/);
            // 过滤掉空字符串
            const names = parts.filter(part => part !== '');
            if (names.includes(name)) {
                return src;
            }
        }

    }
}