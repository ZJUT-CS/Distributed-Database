
import { POPULAR_AIRPORTS, AIRLINES, AIRCRAFTS } from '@/constants';
import { type FlightStatus } from '@/features/flight';

export const generateMockFlights = (origin: string, destination: string, date: string): any[] => {
  const seed = origin.length + destination.length + date.length;
  const count = 15 + (seed % 6);
  const flights = [];

  const getAirportCodes = (loc: string) => {
    const directMatch = POPULAR_AIRPORTS.find((a) => a.code === loc);
    if (directMatch) return [loc];

    const cityMatches = POPULAR_AIRPORTS.filter((a) => a.city === loc).map((a) => a.code);
    if (cityMatches.length > 0) return cityMatches;

    return [loc];
  };

  const originCodes = getAirportCodes(origin);
  const destCodes = getAirportCodes(destination);

  for (let i = 0; i < count; i++) {
    const airline = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
    const priceBase = 800 + Math.random() * 2000;

    const depHour = 6 + Math.floor(Math.random() * 16);
    const depMin = Math.floor(Math.random() * 60);

    const durationHours = 2 + Math.floor(Math.random() * 12);

    const departure = new Date(date);
    departure.setHours(depHour, depMin);

    const arrival = new Date(departure);
    arrival.setHours(departure.getHours() + durationHours);

    const isPremium = priceBase > 1800;

    const actualOrigin = originCodes[Math.floor(Math.random() * originCodes.length)];
    const actualDest = destCodes[Math.floor(Math.random() * destCodes.length)];

    flights.push({
      id: `FL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      airline: airline.name,
      airlineCode: airline.code,
      flightNumber: `${airline.code}${1000 + Math.floor(Math.random() * 9000)}`,
      origin: actualOrigin,
      destination: actualDest,
      departureTime: departure.toISOString(),
      arrivalTime: arrival.toISOString(),
      price: Math.floor(priceBase),
      duration: `${durationHours}小时 ${Math.floor(Math.random() * 60)}分`,
      stops: Math.random() > 0.8 ? 1 : 0,
      baggageWeight: Math.random() > 0.6 ? 30 : 23,
      amenities: {
        hasPower: isPremium || Math.random() > 0.4,
        hasMeal: true,
        hasWifi: isPremium || Math.random() > 0.5,
        hasEntertainment: isPremium || Math.random() > 0.3,
      },
      aircraft: AIRCRAFTS[Math.floor(Math.random() * AIRCRAFTS.length)],
    });
  }

  return flights.sort((a, b) => a.price - b.price);
};

export const INITIAL_FLIGHTS = [
  {
    id: 'CA1831',
    airline: '中国国航',
    route: 'PEK - SHA',
    dep: '08:00',
    arr: '10:15',
    aircraft: 'A350-900',
    price: 1240,
    seats: 312,
    sold: 289,
    status: 'active' as FlightStatus,
  },
  {
    id: 'MU5137',
    airline: '东方航空',
    route: 'SHA - PEK',
    dep: '09:30',
    arr: '11:55',
    aircraft: 'B777-300ER',
    price: 980,
    seats: 311,
    sold: 150,
    status: 'active' as FlightStatus,
  },
  {
    id: 'CZ3001',
    airline: '南方航空',
    route: 'PKX - CAN',
    dep: '10:00',
    arr: '13:15',
    aircraft: 'A380',
    price: 1560,
    seats: 506,
    sold: 480,
    status: 'delayed' as FlightStatus,
  },
  {
    id: 'HU7608',
    airline: '海南航空',
    route: 'PEK - SZX',
    dep: '14:20',
    arr: '17:40',
    aircraft: 'B787-9',
    price: 1800,
    seats: 290,
    sold: 290,
    status: 'full' as FlightStatus,
  },
  {
    id: '3U8881',
    airline: '四川航空',
    route: 'CTU - PEK',
    dep: '11:10',
    arr: '13:50',
    aircraft: 'A330',
    price: 1100,
    seats: 280,
    sold: 100,
    status: 'cancelled' as FlightStatus,
  },
  {
    id: 'CA4102',
    airline: '中国国航',
    route: 'CTU - SHA',
    dep: '16:00',
    arr: '18:30',
    aircraft: 'A320',
    price: 850,
    seats: 158,
    sold: 140,
    status: 'active' as FlightStatus,
  },
  {
    id: 'MF8101',
    airline: '厦门航空',
    route: 'XMN - PEK',
    dep: '07:15',
    arr: '10:05',
    aircraft: 'B737-800',
    price: 760,
    seats: 164,
    sold: 160,
    status: 'active' as FlightStatus,
  },
  {
    id: 'ZH9101',
    airline: '深圳航空',
    route: 'SZX - SHA',
    dep: '19:00',
    arr: '21:15',
    aircraft: 'A320neo',
    price: 920,
    seats: 158,
    sold: 45,
    status: 'active' as FlightStatus,
  },
  {
    id: 'HO1234',
    airline: '吉祥航空',
    route: 'SHA - SZX',
    dep: '13:00',
    arr: '15:30',
    aircraft: 'B787',
    price: 1100,
    seats: 300,
    sold: 210,
    status: 'active' as FlightStatus,
  },
  {
    id: 'JD5678',
    airline: '首都航空',
    route: 'PKX - HGH',
    dep: '18:00',
    arr: '20:15',
    aircraft: 'A320',
    price: 680,
    seats: 180,
    sold: 175,
    status: 'active' as FlightStatus,
  },
];

export const INITIAL_BOOKINGS = [
  { id: 'ORD-992812', customer: { name: 'Alice Wu', email: 'alice@example.com' }, flight: 'CA1831', route: '北京 → 上海', date: '2024-05-24', status: 'paid', amount: 1240 },
  { id: 'ORD-992813', customer: { name: 'Bob Chen', email: 'bob@example.com' }, flight: 'MU5137', route: '上海 → 北京', date: '2024-05-25', status: 'pending', amount: 980 },
  { id: 'ORD-992814', customer: { name: 'Charlie', email: 'charlie@tech.com' }, flight: 'CZ3001', route: '北京 → 广州', date: '2024-05-25', status: 'refunded', amount: 1560 },
  { id: 'ORD-992815', customer: { name: 'David Lee', email: 'david@art.com' }, flight: 'HU7608', route: '北京 → 深圳', date: '2024-05-26', status: 'paid', amount: 3600 },
  { id: 'ORD-992816', customer: { name: 'Eva Zhang', email: 'eva@edu.cn' }, flight: 'CA1831', route: '北京 → 上海', date: '2024-05-24', status: 'paid', amount: 1240 },
  { id: 'ORD-992817', customer: { name: 'Frank Liu', email: 'frank@biz.com' }, flight: '3U8881', route: '成都 → 北京', date: '2024-05-27', status: 'cancelled', amount: 0 },
  { id: 'ORD-992818', customer: { name: 'Grace Ho', email: 'grace@design.io' }, flight: 'MF8101', route: '厦门 → 北京', date: '2024-05-28', status: 'paid', amount: 760 },
  { id: 'ORD-992819', customer: { name: 'Henry Wang', email: 'henry@dev.io' }, flight: 'ZH9101', route: '深圳 → 上海', date: '2024-05-29', status: 'paid', amount: 920 },
];

export const INITIAL_USERS = [
  { id: 'U-001', username: 'admin', email: 'admin@skylink.com', role: 'admin', status: 'active', lastLogin: '2024-05-20 09:30', avatar: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff' },
  { id: 'U-002', username: 'alice_wu', email: 'alice@example.com', role: 'user', status: 'active', lastLogin: '2024-05-19 14:20', avatar: 'https://ui-avatars.com/api/?name=Alice+Wu&background=random' },
  { id: 'U-003', username: 'bob_chen', email: 'bob@example.com', role: 'user', status: 'inactive', lastLogin: '2024-05-10 11:15', avatar: 'https://ui-avatars.com/api/?name=Bob+Chen&background=random' },
  { id: 'U-004', username: 'staff_zhang', email: 'zhang@skylink.com', role: 'admin', status: 'active', lastLogin: '2024-05-20 08:45', avatar: 'https://ui-avatars.com/api/?name=Staff+Zhang&background=random' },
  { id: 'U-005', username: 'david_lee', email: 'david@art.com', role: 'user', status: 'active', lastLogin: '2024-05-18 20:10', avatar: 'https://ui-avatars.com/api/?name=David+Lee&background=random' },
  { id: 'U-006', username: 'sarah_m', email: 'sarah@design.co', role: 'user', status: 'active', lastLogin: '2024-05-15 10:10', avatar: 'https://ui-avatars.com/api/?name=Sarah+M&background=random' },
];

export const INITIAL_TRANSACTIONS = [
  { id: 'TXN-882910', user: 'alice_wu', type: 'payment', amount: 1240, method: 'alipay', status: 'success', time: '2024-05-24 10:30' },
  { id: 'TXN-882911', user: 'bob_chen', type: 'payment', amount: 980, method: 'wechat', status: 'pending', time: '2024-05-25 09:15' },
  { id: 'TXN-882912', user: 'charlie', type: 'refund', amount: 1560, method: 'unionpay', status: 'success', time: '2024-05-25 14:20' },
  { id: 'TXN-882913', user: 'david_lee', type: 'payment', amount: 3600, method: 'credit_card', status: 'success', time: '2024-05-26 11:00' },
  { id: 'TXN-882914', user: 'frank_liu', type: 'payment', amount: 760, method: 'alipay', status: 'failed', time: '2024-05-27 16:45' },
  { id: 'TXN-882915', user: 'eva_zhang', type: 'payment', amount: 1240, method: 'alipay', status: 'success', time: '2024-05-24 11:20' },
  { id: 'TXN-882916', user: 'grace_ho', type: 'payment', amount: 760, method: 'wechat', status: 'success', time: '2024-05-28 09:30' },
];

export const INITIAL_GATEWAYS = [
  { id: 'alipay', name: '支付宝 (Alipay)', type: 'wallet', status: true, fee: '0.6%', cycle: 'T+1', color: 'bg-blue-500' },
  { id: 'wechat', name: '微信支付 (WeChat Pay)', type: 'wallet', status: true, fee: '0.6%', cycle: 'T+1', color: 'bg-green-500' },
  { id: 'unionpay', name: '云闪付 (UnionPay)', type: 'bank', status: true, fee: '0.5%', cycle: 'T+1', color: 'bg-red-500' },
  { id: 'visa_master', name: 'Visa / Mastercard', type: 'card', status: false, fee: '2.5%', cycle: 'T+7', color: 'bg-indigo-500' },
];

