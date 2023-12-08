import { log } from "console";
import { fetch_data } from "../network";
import * as cheerio from 'cheerio';
import * as urlModel from 'url'

export default class Javbus implements WebSiteInterface {
    extrafanart = true;
    posterUrl = true;
    description = false;
    async get_data(barCode: string) {
        const domain = 'https://www.javbus.com/'
        const url = `${domain}${barCode}`;
        log('请求:', url);
        const response = await fetch_data(url);
        const htmlString = response.data;

        const data: NFOData = {
            barCode: barCode
        }
        const $ = cheerio.load(htmlString);

        const _barCode = $('body > div.container > div.row.movie > div.col-md-3.info > p:nth-child(1) > span:nth-child(2)').text().toUpperCase()
        if (barCode != _barCode) {
            // throw new Error('番号不对:' + barCode);
            return;
        }

        const title = $('body > div.container > h3').text();
        data.title = title.substring(barCode.length).trim();
        data.website = url;

        //没有description
        data.publish_date = $('body > div.container > div.row.movie > div.col-md-3.info > p:nth-child(2)').text();
        data.publish_date = data.publish_date.substring(data.publish_date.length - 10);

        //tags
        data.tags = [];
        const tags = $('#genre-toggle').parent().next().children().find('label');
        tags.each((a, tag) => {
            data.tags?.push({
                name: $(tag).text()
            })
        })

        data.actors = [];
        const actors = $('#star-toggle').parent().next().children();
        actors.each((index, actor) => {
            data.actors?.push({
                name: $(actor).text().trim()
            })
        })


        data.posterUrl = $('.bigImage').attr('href');
        if (data.posterUrl) {
            data.posterUrl = urlModel.resolve(domain, data.posterUrl);
        }

        data.extrafanarts = [];
        $('#sample-waterfall a.sample-box').each((index, imageA) => {
            const href = $(imageA).attr('href');
            if (href) {
                data.extrafanarts!.push({
                    url: href
                })
            }
        })

        data.website = url;
        return data;
    }
    async get_avatar(name: string) {
        const url = 'https://www.javbus.com/searchstar/' + name;
        let response;
        try {
            response = await fetch_data(url);
        } catch (error: any) {
            return;
        }
        const htmlString = response.data;
        const $ = cheerio.load(htmlString);
        const imgs = $('#waterfall .photo-frame>img');

        for (let i = 0; i < imgs.length; i++) {
            const img = imgs[i];
            if (img.attribs['src'] && img.attribs['title'] == name) {
                return urlModel.resolve(url, img.attribs['src']);
            }
        }
    }


}

