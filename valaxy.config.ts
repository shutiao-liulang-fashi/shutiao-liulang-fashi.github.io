import { defineValaxyConfig } from 'valaxy'

const nav = [] as any
const sidebar = [
  {
    text: '开始',
    link: '/start/',
  },
  {
    text: '乐理',
    link: '/yueli/',
    collapsed: false,
    items: [
      {
        text: 'ABC 记谱法',
        link: '/yueli/ABCNotation/',
      },
      {
        text: '月琴',
        link: '/yueli/p_yueqin/',
      },
      {
        text: 'playground',
        link: '/yueli/playground/',
      },
      {
        text: '五线谱',
        link: '/yueli/staff/',
      },
    ]
  },
] as any


export default defineValaxyConfig({
  theme: 'press',
  themeConfig: {
    nav,
    sidebar,
    footer: {
      message: 'Powered by <a href="https://valaxy.site">Valaxy</a>',
    },

    editLink: {
      pattern: 'https://github.com/sutiao-liulang-fashi/sutiao-liulang-fashi.github.io/edit/main/:path',
    },
  },
  unocss: {},
})
