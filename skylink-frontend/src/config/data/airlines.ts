export interface Airline {
  name: string;
  code: string;
}

export const AIRLINES: Airline[] = [
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

export const getAirlineByCode = (code: string): Airline | undefined => {
  return AIRLINES.find(a => a.code === code);
};
