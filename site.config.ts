import { defineSiteConfig } from 'valaxy'

export default defineSiteConfig({
  url: 'https://sutiao-liulang-fashi.github.io',
  lang: 'zh-CN',
  title: '薯条流浪法师',
  description: '薯条流浪法师的个人小屋',
  lastUpdated: true,
  timezone: 'Asia/Shanghai',
  search: {
    enable: false,
    provider: 'fuse',
  },
   frontmatter: {
    time_warning: false,
  },

  codeHeightLimit: 300,
  vanillaLazyload: {
    // 默认不开启
    enable: true,
  }
})
