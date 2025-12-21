
import { type Airport } from '@/features/flight';

export const POPULAR_AIRPORTS: Airport[] = [
  { code: 'PEK', city: '北京', name: '首都国际机场', lat: 40.0799, lng: 116.6031 },
  { code: 'PKX', city: '北京', name: '大兴国际机场', lat: 39.5098, lng: 116.4105 }, // Added PKX
  { code: 'SHA', city: '上海', name: '虹桥国际机场', lat: 31.1979, lng: 121.3363 },
  { code: 'PVG', city: '上海', name: '浦东国际机场', lat: 31.1443, lng: 121.8083 },
  { code: 'CAN', city: '广州', name: '白云国际机场', lat: 23.3959, lng: 113.2988 },
  { code: 'SZX', city: '深圳', name: '宝安国际机场', lat: 22.6394, lng: 113.8115 },
  { code: 'CTU', city: '成都', name: '天府国际机场', lat: 30.5785, lng: 104.0665 },
  { code: 'HGH', city: '杭州', name: '萧山国际机场', lat: 30.2285, lng: 120.4344 },
  { code: 'XIY', city: '西安', name: '咸阳国际机场', lat: 34.4371, lng: 108.7573 },
  { code: 'CKG', city: '重庆', name: '江北国际机场', lat: 29.7192, lng: 106.6304 },
  { code: 'HKG', city: '香港', name: '香港国际机场', lat: 22.3080, lng: 113.9185 },
  { code: 'NRT', city: '东京', name: '成田国际机场', lat: 35.7719, lng: 140.3929 },
  { code: 'HND', city: '东京', name: '羽田机场', lat: 35.5494, lng: 139.7798 },
  { code: 'SIN', city: '新加坡', name: '樟宜机场', lat: 1.3644, lng: 103.9915 },
  { code: 'BKK', city: '曼谷', name: '素万那普机场', lat: 13.6900, lng: 100.7501 },
  { code: 'LHR', city: '伦敦', name: '希思罗机场', lat: 51.4700, lng: -0.4543 },
  { code: 'JFK', city: '纽约', name: '肯尼迪国际机场', lat: 40.6413, lng: -73.7781 },
  { code: 'SYD', city: '悉尼', name: '金斯福德·史密斯机场', lat: -33.9399, lng: 151.1753 },
];

export const AIRLINES = [
  { name: '中国国际航空', code: 'CA' },
  { name: '东方航空', code: 'MU' },
  { name: '南方航空', code: 'CZ' },
  { name: '海南航空', code: 'HU' },
  { name: '厦门航空', code: 'MF' },
  { name: '四川航空', code: '3U' },
  { name: '国泰航空', code: 'CX' },
  { name: '新加坡航空', code: 'SQ' },
  { name: '全日空', code: 'NH' },
];

export const AIRCRAFTS = ['A320', 'A321', 'A330', 'A350', 'B737', 'B777', 'B787'];
