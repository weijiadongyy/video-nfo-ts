import config from '../config'
import Airav from './Airav';
import Javbus from './Javbus';
import Missav from './Missav';
const websiteStrs = config.websites.split(/\||,/);

const websites: WebSiteInterface[] = [];
websiteStrs.forEach(website => {
    switch (website) {
        case 'airav':
            websites.push(new Airav());
            break;
        case 'javbus':
            websites.push(new Javbus());
            break;
        case 'missav':
            websites.push(new Missav());
            break;
    }
})
export default websites;