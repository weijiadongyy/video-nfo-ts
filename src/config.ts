export default {
    sourceFolderPath: "E:\\ebdata", //需要处理的视频文件夹,(路径中不要出现\,用/代替,下同)
    destFolderPath: "E:\\ebdata\\av001", //处理后的文件夹
    proxy: "http://127.0.0.1:7890", //代理,例如:http://127.0.0.1:7890
    websites: "missav,airav,javbus", //请求的网址
    videoTypes: ".mp4,.avi,.mkv,.mov,.wmv", //识别的视频文件后缀名
    videoMinSize: 20, //识别的最小视频文件大小,单位:M (用来忽略掉一些广告视频文件)
    descriptionInsertWebsite: true,//在nfo文件描述前加入网站标签
    actorImgFolderPath: 'C://actor',//演员头像保存文件夹,默认在$destFolderPath/actor
    defaultAvator: 'https://pics.dmm.co.jp/mono/actjpgs/nowprinting.gif', //默认演员头像
    extrafanart: "extrafanart",//留空将不下载剧照图片
    translateActors: {
        '羽田あい': '羽田爱',
        '深田えいみ': '深田咏美',
        '星宮一花': '星宫一花',
        '田中レモン': '枫可怜',
        '楓カレン': '枫可怜',
        '永野鈴': '永野铃'
    },
}
