import { log } from "console";
import { fetch_data } from "./network";

fetch_data('https://missav.com/cn/HBAD-266').then(res => {
    log('data:', res.data);
})
