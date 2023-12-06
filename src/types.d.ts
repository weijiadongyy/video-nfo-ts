
interface Actor {
    name: string;
    man?: boolean;//是否男优
    tag_thumb?: string;
}

interface Extrafanart {
    name?: string;
    url: string
}

interface NFOData {
    barCode?: string;
    title?: string;
    website?: string;
    posterUrl?: string;
    description?: string;
    publish_date?: string;
    tags?: { name: string }[]
    actors?: Actor[],
    tag_poster?: string;
    tag_fanart?: string;
    tag_thumb?: string;
    extrafanart?: Extrafanart[]
}

type GetDataFunction = (barCode: string) => Promise<NFOData | undefined>;
type GetAvatorFunction = (name: string) => Promise<string | undefined>;
interface WebSiteInterface {
    /**
     * get_data是否有简介
     */
    description?: boolean;
    extrafanart?: boolean;
    posterUrl?: boolean;
    get_data?: GetDataFunction;
    get_avatar?: GetAvatorFunction;
}


interface GET_DATA_RETURN {
    data: NFOData,
    datas: NFOData[]
}