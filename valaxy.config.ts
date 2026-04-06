import { defineValaxyConfig } from 'valaxy'

const nav = [] as any
const sidebar = [
  {
    text: '开始',
    link: '/0_start/',
  },
  {
    text: '乐理',
    link: '/1_yueli/',
    collapsed: false,
    items: [
      {
        text: '四种记谱法',
        link: '/1_yueli/1_pu/',
      },
      {
        text: '乐理游乐场',
        link: '/1_yueli/2_playground/',
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
