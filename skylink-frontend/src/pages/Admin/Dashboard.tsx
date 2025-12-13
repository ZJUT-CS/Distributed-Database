
import React from 'react';
import { DollarSign, TrendingUp, CalendarCheck, Plane, Users, Globe, ArrowRightLeft } from 'lucide-react';
import WorldMap from '../../components/common/WorldMap';
import { INITIAL_FLIGHTS, INITIAL_BOOKINGS, INITIAL_USERS } from '../../services/mockData';

const Dashboard: React.FC = () => {
  // Calculate dynamic stats
  const totalRev = INITIAL_BOOKINGS.filter(b => b.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalBookings = INITIAL_BOOKINGS.length;
  const activeFlights = INITIAL_FLIGHTS.filter(f => f.status === 'active').length;
  const totalUsers = INITIAL_USERS.length;

  // Mock data for charts
  const revenueData = [12000, 15000, 11000, 18000, 22000, 19000, 25000]; // Last 7 days
  const maxRevenue = Math.max(...revenueData);
  
  const flightStatusCounts = {
    active: INITIAL_FLIGHTS.filter(f => f.status === 'active').length,
    delayed: INITIAL_FLIGHTS.filter(f => f.status === 'delayed').length,
    cancelled: INITIAL_FLIGHTS.filter(f => f.status === 'cancelled').length,
    full: INITIAL_FLIGHTS.filter(f => f.status === 'full').length,
  };
  const totalFlights = INITIAL_FLIGHTS.length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" /> +12.5%
                  </span>
                </div>
                <p className="text-gray-500 text-sm font-medium">总营收 (Total Revenue)</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">¥{totalRev.toLocaleString()}</h3>
            </div>
          </div>

          {/* Bookings Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" /> +8.2%
                  </span>
                </div>
                <p className="text-gray-500 text-sm font-medium">总订单数 (Bookings)</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{totalBookings.toLocaleString()}</h3>
            </div>
          </div>

          {/* Flights Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                    <Plane className="w-6 h-6" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                    持平
                  </span>
                </div>
                <p className="text-gray-500 text-sm font-medium">执飞航班 (Active Flights)</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{activeFlights}</h3>
            </div>
          </div>

          {/* Users Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" /> +24%
                  </span>
                </div>
                <p className="text-gray-500 text-sm font-medium">注册用户 (Total Users)</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{totalUsers.toLocaleString()}</h3>
            </div>
          </div>
      </div>

      {/* 2. Middle Row: Revenue Chart & Flight Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
          {/* Revenue Trend (Bar Chart) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">营收趋势 (近7日)</h3>
                  <p className="text-sm text-gray-400">Revenue Trends</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-xs text-gray-500">日收入</span>
                </div>
            </div>
            <div className="flex-1 flex items-end justify-between gap-4 px-4 pb-2">
                {revenueData.map((val, idx) => {
                  const height = (val / maxRevenue) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="relative w-full bg-gray-100 rounded-t-lg h-full overflow-hidden">
                          <div 
                            className="absolute bottom-0 left-0 w-full bg-blue-500 rounded-t-lg transition-all duration-1000 ease-out group-hover:bg-blue-600" 
                            style={{ height: `${height}%` }}
                          ></div>
                          {/* Tooltip */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              ¥{val.toLocaleString()}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{['周一','周二','周三','周四','周五','周六','周日'][idx]}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Flight Status (Donut Chart) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-6">航班状态分布</h3>
            <div className="flex-1 flex items-center justify-center relative">
                {/* CSS Conic Gradient Donut */}
                <div 
                  className="w-48 h-48 rounded-full relative"
                  style={{
                    background: `conic-gradient(
                      #22c55e 0% ${flightStatusCounts.active / totalFlights * 100}%, 
                      #eab308 ${flightStatusCounts.active / totalFlights * 100}% ${(flightStatusCounts.active + flightStatusCounts.delayed) / totalFlights * 100}%,
                      #ef4444 ${(flightStatusCounts.active + flightStatusCounts.delayed) / totalFlights * 100}% ${(flightStatusCounts.active + flightStatusCounts.delayed + flightStatusCounts.cancelled) / totalFlights * 100}%,
                      #a855f7 ${(flightStatusCounts.active + flightStatusCounts.delayed + flightStatusCounts.cancelled) / totalFlights * 100}% 100%
                    )`
                  }}
                >
                  <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-800">{totalFlights}</span>
                    <span className="text-xs text-gray-400">Total Flights</span>
                  </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-xs text-gray-600">正常 ({flightStatusCounts.active})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="text-xs text-gray-600">延误 ({flightStatusCounts.delayed})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-xs text-gray-600">取消 ({flightStatusCounts.cancelled})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span className="text-xs text-gray-600">满员 ({flightStatusCounts.full})</span>
                </div>
            </div>
          </div>
      </div>

      {/* 3. Bottom Row: Map & Top Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
          {/* Map */}
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl shadow-sm overflow-hidden flex flex-col relative border border-slate-800">
            <div className="absolute top-5 left-5 z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" /> 实时航线监控
                </h3>
                <p className="text-xs text-slate-400">Real-time Global Operations</p>
            </div>
            <div className="flex-1">
                <WorldMap 
                  points={[
                    { id: 'PEK', name: '北京', lat: 39.9, lng: 116.4, value: 98, type: 'hub', info: 'Status: OK' },
                    { id: 'SHA', name: '上海', lat: 31.2, lng: 121.3, value: 95, type: 'hub', info: 'Status: Busy' },
                    { id: 'CAN', name: '广州', lat: 23.1, lng: 113.2, value: 92, type: 'hub', info: 'Status: OK' },
                    { id: 'LHR', name: '伦敦', lat: 51.5, lng: -0.45, value: 85, type: 'normal', info: 'Delayed' },
                    { id: 'JFK', name: '纽约', lat: 40.6, lng: -73.7, value: 82, type: 'normal', info: 'Status: OK' },
                    { id: 'SYD', name: '悉尼', lat: -33.9, lng: 151.2, value: 75, type: 'normal', info: 'Status: OK' },
                  ]}
                  theme="dark" // Use Dark Theme for the map in dashboard
                />
            </div>
          </div>

          {/* Top Routes & Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" /> 热门航线 TOP 5
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {[
                  { from: '北京 (PEK)', to: '上海 (SHA)', vol: 2450, trend: 'up' },
                  { from: '北京 (PEK)', to: '广州 (CAN)', vol: 1890, trend: 'up' },
                  { from: '上海 (SHA)', to: '深圳 (SZX)', vol: 1650, trend: 'down' },
                  { from: '广州 (CAN)', to: '杭州 (HGH)', vol: 1200, trend: 'up' },
                  { from: '成都 (CTU)', to: '北京 (PEK)', vol: 1100, trend: 'stable' },
                ].map((route, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors mb-1 last:mb-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${i < 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {i + 1}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-800">{route.from}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <ArrowRightLeft className="w-3 h-3" /> {route.to}
                            </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{route.vol}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            route.trend === 'up' ? 'bg-red-50 text-red-600' : route.trend === 'down' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                            {route.trend === 'up' ? '↑ 热度上升' : route.trend === 'down' ? '↓ 热度下降' : '- 持平'}
                        </span>
                      </div>
                  </div>
                ))}
            </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
