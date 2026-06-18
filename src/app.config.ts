export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/booking/index',
    'pages/team/index',
    'pages/equipment/index',
    'pages/mine/index',
    'pages/route-detail/index',
    'pages/waitlist/index',
    'pages/booking-confirm/index',
    'pages/checkin/index',
    'pages/messages/index',
    'pages/team-bill/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF6B35',
    navigationBarTitleText: '攀岩预约',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FFF7F3'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#FF6B35',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/booking/index',
        text: '预约'
      },
      {
        pagePath: 'pages/team/index',
        text: '团队'
      },
      {
        pagePath: 'pages/equipment/index',
        text: '装备'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
