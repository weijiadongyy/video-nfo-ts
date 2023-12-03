import * as  fs from 'fs'
import * as xml2js from 'xml2js'
import config from './config';

declare global {
    interface NFOXMLObj {
        title?: string;
        plot?: string;
        mpaa?: string;
        poster?: string;
        thumb?: string;
        fanart?: string;
        premiered?: string;
        actor: {
            name: string;
            thumb?: string;
        }[];
        tag: string[];
        genre: string[];
    }
}


export async function write_nfo(data: NFOData, fileName: string) {

    const obj: NFOXMLObj = {
        title: `${data.barCode} ${data.title}`,
        plot: `${data.description || ''}`,//情节
        mpaa: 'JP-18+',
        poster: data.tag_poster,
        thumb: data.tag_thumb,
        fanart: data.tag_fanart,
        premiered: data.publish_date,
        actor: [],
        tag: [],
        genre: []
    };
    if (config.descriptionInsertWebsite && data.website) {
        obj.plot = `<a href="${data.website}">${data.barCode}</a>  ${obj.plot || ''}`;
    }
    (data.actors || []).forEach(actor => {
        obj.actor.push({
            name: actor.name,
            thumb: actor.tag_thumb
        });
    });

    (data.tags || []).forEach(tag => {
        obj.tag.push(tag.name);
        obj.genre.push(tag.name);
    });

    const xml = new xml2js.Builder({ cdata: true, rootName: 'movie' }).buildObject(obj);
    fs.writeFileSync(fileName, xml, { encoding: 'utf-8' });
}