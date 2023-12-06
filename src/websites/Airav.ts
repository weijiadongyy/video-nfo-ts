import { fetch_data } from "../network";

export default class Airav implements WebSiteInterface {
    description = true;
    extrafanart = true;
    posterUrl = true;

    async get_data(barCode: string) {
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
        const data: NFOData = {
            barCode: barCode,
            title: result.name,
            description: result.description,
            publish_date: result.publish_date,
            tags: result.tags,
            actors: result.actors,
            posterUrl: result.img_url,
            extrafanart: []
        };
        const images: string[] = result.images;
        if (images) {
            images.forEach(imageUrl => {
                data.extrafanart!.push({
                    url: imageUrl,
                })
            })
        }
        return data;
    }

}