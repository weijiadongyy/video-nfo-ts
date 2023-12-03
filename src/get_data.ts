import { log } from "console";
import { fetch_data } from "./network"
import * as cheerio from 'cheerio';
import urlModel from 'url'
import config from './config'
import { translate_actor_日语_中文 } from "./translate";
const websites = config.websites;

declare global {
    interface NFOData {
        barCode?: string;
        title?: string;
        website?: string;
        posterUrl?: string;
        description?: string;
        publish_date?: string;
        tags?: { name: string }[]
        actors?: {
            name: string;
            man?: boolean;//是否男优
            tag_thumb?: string;
        }[],
        tag_poster?: string;
        tag_fanart?: string;
        tag_thumb?: string;
    }
}

export async function get_data(barCode: string) {
    const mds: ((barCode: string) => Promise<NFOData | undefined>)[] = [];
    websites.split(',').forEach(website => {
        switch (website) {
            case 'airav':
                mds.push(get_data_airav);
                break;
            case 'javbus':
                mds.push(get_data_javbus);
                break;
            case 'missav':
                mds.push(get_data_missav);
                break;
        }
    })

    for (let md of mds) {
        try {
            const data = await md(barCode);
            if (data) {
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
                return data;
            }
        } catch (e: any) {
            console.log('get_data出错:', e.message);
        }
    }
    throw new Error('获取番号信息出错,可能是番号不对');
}

export async function get_data_airav(barCode: string) {
    const url = `https://www.airav.wiki/api/video/barcode/${barCode}?lng=zh-CN`;
    console.log('请求url:', url);
    const response = await fetch_data(url);
    if (response.status != 200) {
        return;
    }
    const json = response.data;
    const result = json.result;

    const _barCode = result.barcode as string;
    if (!_barCode || _barCode.toUpperCase() != barCode) {
        return;
    }

    let website = `https://www.airav.wiki/video/${barCode}`;

    try {
        const javbus_data = await get_data_javbus(barCode);
        if (javbus_data?.website) {
            website = javbus_data.website;
        }
    } catch (e) {

    }
    const data: NFOData = {
        barCode: barCode,
        website,
        title: result.name,
        description: result.description,
        publish_date: result.publish_date,
        tags: result.tags,
        actors: result.actors,
        posterUrl: result.img_url
    };

    return data;
}


export async function get_data_missav(barCode: string) {
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
            log('设置番号:', value)
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



export async function get_data_javbus(barCode: string) {
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

    return data;
}


export async function get_avator(name: string) {
    const mds: ((name: string) => Promise<string | undefined>)[] = [];
    websites.split(',').forEach(website => {
        switch (website) {
            case 'javbus':
                mds.push(get_avator_javbus);
                break;
            case 'missav':
                mds.push(get_avator_missav);
                break;
        }
    })
    for (let md of mds) {
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

export async function get_avator_javbus(name: string) {
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

export async function get_avator_missav(name: string) {
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