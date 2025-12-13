
import React, { useState, useEffect, useRef } from 'react';
import { User, MapPoint } from '../types';
import WorldMap from './WorldMap';
import { 
  LayoutDashboard, 
  Plane, 
  Users, 
  CalendarCheck, 
  Settings, 
  LogOut, 
  Search,
  Bell,
  MoreHorizontal,
  Map as MapIcon,
  TrendingUp,
  Plus,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Edit2,
  Trash2,
  Ban,
  Save,
  Shield,
  Mail,
  Globe,
  Lock,
  RefreshCw,
  Power,
  UserPlus,
  BadgeCheck,
  ToggleLeft,
  ToggleRight,
  CreditCard,
  Wallet,
  Receipt,
  ArrowRightLeft,
  PieChart,
  DollarSign,
  Smartphone,
  Eye,
  Undo2,
  FileText
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'flights' | 'bookings' | 'users' | 'payments' | 'settings';
type FlightStatus = 'active' | 'delayed' | 'cancelled' | 'full';

// Initial Mock Data moved outside component to be used as initial state
const INITIAL_FLIGHTS = [
  { id: 'CA1831', airline: '中国国航', route: 'PEK - SHA', dep: '08:00', arr: '10:15', aircraft: 'A350-900', price: 1240, seats: 312, sold: 289, status: 'active' as FlightStatus },
  { id: 'MU5137', airline: '东方航空', route: 'SHA - PEK', dep: '09:30', arr: '11:55', aircraft: 'B777-300ER', price: 980, seats: 311, sold: 150, status: 'active' as FlightStatus },
  { id: 'CZ3001', airline: '南方航空', route: 'PKX - CAN', dep: '10:00', arr: '13:15', aircraft: 'A380', price: 1560, seats: 506, sold: 480, status: 'delayed' as FlightStatus },
  { id: 'HU7608', airline: '海南航空', route: 'PEK - SZX', dep: '14:20', arr: '17:40', aircraft: 'B787-9', price: 1800, seats: 290, sold: 290, status: 'full' as FlightStatus },
  { id: '3U8881', airline: '四川航空', route: 'CTU - PEK', dep: '11:10', arr: '13:50', aircraft: 'A330', price: 1100, seats: 280, sold: 100, status: 'cancelled' as FlightStatus },
  { id: 'CA4102', airline: '中国国航', route: 'CTU - SHA', dep: '16:00', arr: '18:30', aircraft: 'A320', price: 850, seats: 158, sold: 140, status: 'active' as FlightStatus },
  { id: 'MF8101', airline: '厦门航空', route: 'XMN - PEK', dep: '07:15', arr: '10:05', aircraft: 'B737-800', price: 760, seats: 164, sold: 160, status: 'active' as FlightStatus },
  { id: 'ZH9101', airline: '深圳航空', route: 'SZX - SHA', dep: '19:00', arr: '21:15', aircraft: 'A320neo', price: 920, seats: 158, sold: 45, status: 'active' as FlightStatus },
  { id: 'HO1234', airline: '吉祥航空', route: 'SHA - SZX', dep: '13:00', arr: '15:30', aircraft: 'B787', price: 1100, seats: 300, sold: 210, status: 'active' as FlightStatus },
  { id: 'JD5678', airline: '首都航空', route: 'PKX - HGH', dep: '18:00', arr: '20:15', aircraft: 'A320', price: 680, seats: 180, sold: 175, status: 'active' as FlightStatus },
];

const INITIAL_BOOKINGS = [
  { id: 'ORD-992812', customer: { name: 'Alice Wu', email: 'alice@example.com' }, flight: 'CA1831', route: '北京 → 上海', date: '2024-05-24', status: 'paid', amount: 1240 },
  { id: 'ORD-992813', customer: { name: 'Bob Chen', email: 'bob@example.com' }, flight: 'MU5137', route: '上海 → 北京', date: '2024-05-25', status: 'pending', amount: 980 },
  { id: 'ORD-992814', customer: { name: 'Charlie', email: 'charlie@tech.com' }, flight: 'CZ3001', route: '北京 → 广州', date: '2024-05-25', status: 'refunded', amount: 1560 },
  { id: 'ORD-992815', customer: { name: 'David Lee', email: 'david@art.com' }, flight: 'HU7608', route: '北京 → 深圳', date: '2024-05-26', status: 'paid', amount: 3600 },
  { id: 'ORD-992816', customer: { name: 'Eva Zhang', email: 'eva@edu.cn' }, flight: 'CA1831', route: '北京 → 上海', date: '2024-05-24', status: 'paid', amount: 1240 },
  { id: 'ORD-992817', customer: { name: 'Frank Liu', email: 'frank@biz.com' }, flight: '3U8881', route: '成都 → 北京', date: '2024-05-27', status: 'cancelled', amount: 0 },
  { id: 'ORD-992818', customer: { name: 'Grace Ho', email: 'grace@design.io' }, flight: 'MF8101', route: '厦门 → 北京', date: '2024-05-28', status: 'paid', amount: 760 },
  { id: 'ORD-992819', customer: { name: 'Henry Wang', email: 'henry@dev.io' }, flight: 'ZH9101', route: '深圳 → 上海', date: '2024-05-29', status: 'paid', amount: 920 },
];

const INITIAL_USERS = [
  { id: 'U-001', username: 'admin', email: 'admin@skylink.com', role: 'admin', status: 'active', lastLogin: '2024-05-20 09:30', avatar: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff' },
  { id: 'U-002', username: 'alice_wu', email: 'alice@example.com', role: 'user', status: 'active', lastLogin: '2024-05-19 14:20', avatar: 'https://ui-avatars.com/api/?name=Alice+Wu&background=random' },
  { id: 'U-003', username: 'bob_chen', email: 'bob@example.com', role: 'user', status: 'inactive', lastLogin: '2024-05-10 11:15', avatar: 'https://ui-avatars.com/api/?name=Bob+Chen&background=random' },
  { id: 'U-004', username: 'staff_zhang', email: 'zhang@skylink.com', role: 'admin', status: 'active', lastLogin: '2024-05-20 08:45', avatar: 'https://ui-avatars.com/api/?name=Staff+Zhang&background=random' },
  { id: 'U-005', username: 'david_lee', email: 'david@art.com', role: 'user', status: 'active', lastLogin: '2024-05-18 20:10', avatar: 'https://ui-avatars.com/api/?name=David+Lee&background=random' },
  { id: 'U-006', username: 'sarah_m', email: 'sarah@design.co', role: 'user', status: 'active', lastLogin: '2024-05-15 10:10', avatar: 'https://ui-avatars.com/api/?name=Sarah+M&background=random' },
];

const INITIAL_TRANSACTIONS = [
  { id: 'TXN-882910', user: 'alice_wu', type: 'payment', amount: 1240, method: 'alipay', status: 'success', time: '2024-05-24 10:30' },
  { id: 'TXN-882911', user: 'bob_chen', type: 'payment', amount: 980, method: 'wechat', status: 'pending', time: '2024-05-25 09:15' },
  { id: 'TXN-882912', user: 'charlie', type: 'refund', amount: 1560, method: 'unionpay', status: 'success', time: '2024-05-25 14:20' },
  { id: 'TXN-882913', user: 'david_lee', type: 'payment', amount: 3600, method: 'credit_card', status: 'success', time: '2024-05-26 11:00' },
  { id: 'TXN-882914', user: 'frank_liu', type: 'payment', amount: 760, method: 'alipay', status: 'failed', time: '2024-05-27 16:45' },
  { id: 'TXN-882915', user: 'eva_zhang', type: 'payment', amount: 1240, method: 'alipay', status: 'success', time: '2024-05-24 11:20' },
  { id: 'TXN-882916', user: 'grace_ho', type: 'payment', amount: 760, method: 'wechat', status: 'success', time: '2024-05-28 09:30' },
];

const INITIAL_GATEWAYS = [
  { id: 'alipay', name: '支付宝 (Alipay)', type: 'wallet', status: true, fee: '0.6%', cycle: 'T+1', color: 'bg-blue-500' },
  { id: 'wechat', name: '微信支付 (WeChat Pay)', type: 'wallet', status: true, fee: '0.6%', cycle: 'T+1', color: 'bg-green-500' },
  { id: 'unionpay', name: '云闪付 (UnionPay)', type: 'bank', status: true, fee: '0.5%', cycle: 'T+1', color: 'bg-red-500' },
  { id: 'visa_master', name: 'Visa / Mastercard', type: 'card', status: false, fee: '2.5%', cycle: 'T+7', color: 'bg-indigo-500' },
];

// Extracted Pagination Component to avoid Hook errors inside render loop
const Pagination = ({ 
  currentPage, 
  totalPages, 
  setPage, 
  totalItems, 
  itemsPerPage 
}: { 
  currentPage: number, 
  totalPages: number, 
  setPage: (p: any) => void, 
  totalItems: number, 
  itemsPerPage: number 
}) => {
  const [jumpPage, setJumpPage] = useState("");

  const handleJump = () => {
      const p = parseInt(jumpPage);
      if (p >= 1 && p <= totalPages) {
          setPage(p);
          setJumpPage("");
      }
  };

  return (
    <div className="mt-auto px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
      <div className="text-xs text-gray-500">
         显示 {(currentPage - 1) * itemsPerPage + 1} 至 {Math.min(currentPage * itemsPerPage, totalItems)} 条，共 {totalItems} 条
      </div>
      
      <div className="flex items-center gap-2">
         <div className="flex gap-1 mr-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setPage((p: number) => Math.max(1, p - 1))}
              className="p-1.5 rounded hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:hover:border-transparent transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
               const p = i + 1;
               if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                   return (
                     <button
                       key={i}
                       onClick={() => setPage(p)}
                       className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                           currentPage === p 
                             ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                             : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                       }`}
                     >
                       {p}
                     </button>
                   );
               } else if (p === currentPage - 2 || p === currentPage + 2) {
                   return <span key={i} className="flex items-end px-1 text-gray-400">...</span>;
               }
               return null;
            })}

            <button 
               disabled={currentPage === totalPages || totalPages === 0}
               onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
               className="p-1.5 rounded hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:hover:border-transparent transition-all"
            >
               <ChevronRight className="w-4 h-4" />
            </button>
         </div>
         
         <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
            <span className="text-xs text-gray-400">跳至</span>
            <input 
               type="number" 
               min="1" 
               max={totalPages}
               value={jumpPage}
               onChange={(e) => setJumpPage(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleJump()}
               className="w-10 h-8 rounded-lg border border-gray-200 text-center text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="text-xs text-gray-400">页</span>
         </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [flightStatusFilter, setFlightStatusFilter] = useState('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [transactionFilter, setTransactionFilter] = useState('all');

  // Data State
  const [flights, setFlights] = useState(INITIAL_FLIGHTS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [gateways, setGateways] = useState(INITIAL_GATEWAYS);
  
  // Settings State
  const [settings, setSettings] = useState({
    siteName: 'SkyLink AI',
    supportEmail: 'support@skylink.com',
    enableNotifications: true,
    maintenanceMode: false,
    allowRegistration: true,
    currency: 'CNY'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Pagination State
  const [flightPage, setFlightPage] = useState(1);
  const FLIGHTS_PER_PAGE = 6;
  
  const [bookingPage, setBookingPage] = useState(1);
  const BOOKINGS_PER_PAGE = 7;
  
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 6;
  
  const [transactionPage, setTransactionPage] = useState(1);
  const TRANSACTIONS_PER_PAGE = 6;

  // Interaction State
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActiveActionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Flight Modal Handlers ---
  const handleOpenCreateFlight = () => {
    setEditingFlight(null); // Null means create mode
    setIsFlightModalOpen(true);
  };

  const handleOpenEditFlight = (flight: any) => {
    setEditingFlight(flight);
    setIsFlightModalOpen(true);
    setActiveActionId(null);
  };

  const handleSaveFlight = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newFlight = {
      id: formData.get('id') as string,
      airline: formData.get('airline') as string,
      route: formData.get('route') as string,
      dep: formData.get('dep') as string,
      arr: formData.get('arr') as string,
      aircraft: formData.get('aircraft') as string,
      price: Number(formData.get('price')),
      seats: Number(formData.get('seats')),
      sold: editingFlight ? editingFlight.sold : 0, // Preserve sold count or init 0
      status: formData.get('status') as FlightStatus,
    };

    if (editingFlight) {
      setFlights(flights.map(f => f.id === editingFlight.id ? newFlight : f));
    } else {
      setFlights([newFlight, ...flights]);
    }
    setIsFlightModalOpen(false);
  };

  const handleDeleteFlight = (id: string) => {
    if (confirm('确定要永久删除该航班记录吗？')) {
      setFlights(flights.filter(f => f.id !== id));
    }
    setActiveActionId(null);
  };

  const handleCancelFlight = (id: string) => {
    if (confirm('确定要取消该航班吗？这将通知所有已预订乘客。')) {
      setFlights(flights.map(f => f.id === id ? { ...f, status: 'cancelled' } : f));
    }
    setActiveActionId(null);
  };

  // --- User Handlers ---
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: any) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
    setActiveActionId(null);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get('username') as string;
    
    const newUser = {
      id: editingUser ? editingUser.id : `U-${Date.now()}`,
      username: username,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      status: formData.get('status') as string,
      lastLogin: editingUser ? editingUser.lastLogin : '从未登录',
      avatar: editingUser ? editingUser.avatar : `https://ui-avatars.com/api/?name=${username}&background=random`
    };

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? newUser : u));
    } else {
      setUsers([newUser, ...users]);
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('确定要删除该用户吗？此操作不可恢复。')) {
      setUsers(users.filter(u => u.id !== id));
    }
    setActiveActionId(null);
  };

  // --- Payment Handlers ---
  const toggleGateway = (id: string) => {
    setGateways(gateways.map(g => g.id === id ? { ...g, status: !g.status } : g));
  };

  // --- Settings Handlers ---
  const handleSaveSettings = () => {
    setIsSavingSettings(true);
    // Simulate API save
    setTimeout(() => {
      setIsSavingSettings(false);
      alert('系统设置已更新');
    }, 1000);
  };

  // --- Pagination Logic ---
  const filteredFlights = flights.filter(f => flightStatusFilter === 'all' || f.status === flightStatusFilter);
  const totalFlightPages = Math.ceil(filteredFlights.length / FLIGHTS_PER_PAGE);
  const paginatedFlights = filteredFlights.slice((flightPage - 1) * FLIGHTS_PER_PAGE, flightPage * FLIGHTS_PER_PAGE);

  const filteredBookings = bookings.filter(b => bookingStatusFilter === 'all' || b.status === bookingStatusFilter);
  const totalBookingPages = Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice((bookingPage - 1) * BOOKINGS_PER_PAGE, bookingPage * BOOKINGS_PER_PAGE);

  const filteredUsers = users.filter(u => userRoleFilter === 'all' || u.role === userRoleFilter);
  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  const filteredTransactions = transactions.filter(t => transactionFilter === 'all' || t.status === transactionFilter);
  const totalTransactionPages = Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice((transactionPage - 1) * TRANSACTIONS_PER_PAGE, transactionPage * TRANSACTIONS_PER_PAGE);

  // --- Render Helpers ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> 计划中</span>;
      case 'delayed': return <span className="flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> 延误</span>;
      case 'cancelled': return <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> 已取消</span>;
      case 'full': return <span className="flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-full"><Users className="w-3 h-3" /> 满员</span>;
      default: return null;
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">已支付</span>;
      case 'pending': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">待支付</span>;
      case 'refunded': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">已退款</span>;
      case 'cancelled': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">已取消</span>;
      default: return null;
    }
  };

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-600 border border-green-100">成功</span>;
      case 'pending': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-50 text-yellow-600 border border-yellow-100">处理中</span>;
      case 'failed': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-100">失败</span>;
      default: return null;
    }
  };

  const getUserRoleBadge = (role: string) => {
    return role === 'admin' 
      ? <span className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-100"><Shield className="w-3 h-3" /> 管理员</span>
      : <span className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md"><Users className="w-3 h-3" /> 用户</span>;
  };

  // --- Modals ---
  const renderFlightModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 text-lg">
            {editingFlight ? '编辑航班信息' : '新建航班计划'}
          </h3>
          <button onClick={() => setIsFlightModalOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSaveFlight} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">航班号</label>
              <input name="id" defaultValue={editingFlight?.id} required placeholder="例如: CA1234" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">航空公司</label>
              <input name="airline" defaultValue={editingFlight?.airline} required placeholder="例如: 中国国航" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          
          <div className="space-y-1">
             <label className="text-xs font-bold text-gray-500">航线 (出发地 - 目的地)</label>
             <input name="route" defaultValue={editingFlight?.route} required placeholder="例如: PEK - SHA" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500">起飞时间</label>
               <input type="time" name="dep" defaultValue={editingFlight?.dep} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500">降落时间</label>
               <input type="time" name="arr" defaultValue={editingFlight?.arr} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500">执飞机型</label>
               <input name="aircraft" defaultValue={editingFlight?.aircraft} required placeholder="例如: A320" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500">基础票价 (¥)</label>
               <input type="number" name="price" defaultValue={editingFlight?.price} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
             </div>
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500">总座位数</label>
               <input type="number" name="seats" defaultValue={editingFlight?.seats || 200} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">当前状态</label>
            <select name="status" defaultValue={editingFlight?.status || 'active'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="active">计划中 (Active)</option>
              <option value="delayed">延误 (Delayed)</option>
              <option value="cancelled">已取消 (Cancelled)</option>
              <option value="full">满员 (Full)</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={() => setIsFlightModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">取消</button>
             <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-colors flex items-center justify-center gap-2">
               <Save className="w-4 h-4" /> 保存航班
             </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderUserModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 text-lg">
            {editingUser ? '编辑用户资料' : '添加新用户'}
          </h3>
          <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">用户名</label>
            <input name="username" defaultValue={editingUser?.username} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">电子邮箱</label>
            <input type="email" name="email" defaultValue={editingUser?.email} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500">角色权限</label>
               <select name="role" defaultValue={editingUser?.role || 'user'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                 <option value="user">普通用户</option>
                 <option value="admin">管理员</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500">账户状态</label>
               <select name="status" defaultValue={editingUser?.status || 'active'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                 <option value="active">正常</option>
                 <option value="inactive">禁用</option>
               </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">取消</button>
             <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-colors flex items-center justify-center gap-2">
               <Save className="w-4 h-4" /> 保存用户
             </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        // Calculate dynamic stats
        const totalRev = bookings.filter(b => b.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
        const totalBookings = bookings.length;
        const activeFlights = flights.filter(f => f.status === 'active').length;
        const totalUsers = users.length;

        // Mock data for charts
        const revenueData = [12000, 15000, 11000, 18000, 22000, 19000, 25000]; // Last 7 days
        const maxRevenue = Math.max(...revenueData);
        
        const flightStatusCounts = {
          active: flights.filter(f => f.status === 'active').length,
          delayed: flights.filter(f => f.status === 'delayed').length,
          cancelled: flights.filter(f => f.status === 'cancelled').length,
          full: flights.filter(f => f.status === 'full').length,
        };
        const totalFlights = flights.length;

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

      case 'flights':
        return (
           <div className="space-y-6 animate-fade-in-up">
             {/* Header Actions */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                 <h2 className="text-2xl font-bold text-gray-800">航班资源管理</h2>
                 <p className="text-sm text-gray-500 mt-1">管理全平台航班排期、座位及状态监控。</p>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => alert('数据已导出至 CSV')} className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors">
                   <Download className="w-4 h-4" /> 导出数据
                 </button>
                 <button onClick={handleOpenCreateFlight} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
                   <Plus className="w-4 h-4" /> 新建航班
                 </button>
               </div>
             </div>

             {/* Filters */}
             <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
               <div className="flex items-center gap-2 w-full md:w-auto">
                 <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="搜索航班号、航线..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                 </button>
               </div>
               <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                 {['all', 'active', 'delayed', 'cancelled'].map(status => (
                   <button 
                    key={status}
                    onClick={() => { setFlightStatusFilter(status); setFlightPage(1); }}
                    className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${flightStatusFilter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     {status === 'all' ? '全部状态' : status}
                   </button>
                 ))}
               </div>
             </div>

             {/* Flights Table */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
               <table className="w-full text-sm text-left">
                 <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                   <tr>
                     <th className="px-6 py-4 font-semibold">航班信息</th>
                     <th className="px-6 py-4 font-semibold">航线 & 时间</th>
                     <th className="px-6 py-4 font-semibold">执飞机型</th>
                     <th className="px-6 py-4 font-semibold">基础票价</th>
                     <th className="px-6 py-4 font-semibold w-48">客座率 (Load Factor)</th>
                     <th className="px-6 py-4 font-semibold">当前状态</th>
                     <th className="px-6 py-4 font-semibold text-right">操作</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 relative">
                   {paginatedFlights.map((flight) => {
                     const loadFactor = Math.round((flight.sold / flight.seats) * 100);
                     let barColor = 'bg-blue-500';
                     if (loadFactor > 90) barColor = 'bg-red-500';
                     else if (loadFactor > 70) barColor = 'bg-green-500';

                     return (
                       <tr key={flight.id} className="hover:bg-gray-50 transition-colors group relative">
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                               {flight.id.substring(0, 2)}
                             </div>
                             <div>
                               <div className="font-bold text-gray-800">{flight.id}</div>
                               <div className="text-xs text-gray-500">{flight.airline}</div>
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="font-medium text-gray-800">{flight.route}</div>
                           <div className="text-xs text-gray-500 mt-0.5 font-mono">{flight.dep} - {flight.arr}</div>
                         </td>
                         <td className="px-6 py-4 text-gray-600">
                           <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{flight.aircraft}</span>
                         </td>
                         <td className="px-6 py-4 font-medium text-gray-800">¥{flight.price}</td>
                         <td className="px-6 py-4">
                           <div className="flex items-center justify-between text-xs mb-1.5">
                             <span className="text-gray-600">{flight.sold}/{flight.seats}</span>
                             <span className="font-bold text-gray-800">{loadFactor}%</span>
                           </div>
                           <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                             <div className={`h-full rounded-full ${barColor}`} style={{ width: `${loadFactor}%` }}></div>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           {getStatusBadge(flight.status)}
                         </td>
                         <td className="px-6 py-4 text-right relative">
                           <button 
                             onClick={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === flight.id ? null : flight.id); }}
                             className={`p-1.5 rounded-lg transition-colors ${activeActionId === flight.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                           >
                             <MoreVertical className="w-4 h-4" />
                           </button>

                           {/* Dropdown Menu */}
                           {activeActionId === flight.id && (
                             <div ref={actionMenuRef} className="absolute right-8 top-8 w-36 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                               <button 
                                 onClick={() => handleOpenEditFlight(flight)}
                                 className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                               >
                                 <Edit2 className="w-3.5 h-3.5 text-blue-500" /> 编辑信息
                               </button>
                               <button 
                                 onClick={() => handleCancelFlight(flight.id)}
                                 className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                               >
                                 <Ban className="w-3.5 h-3.5 text-yellow-500" /> 取消航班
                               </button>
                               <div className="h-px bg-gray-100 my-0"></div>
                               <button 
                                 onClick={() => handleDeleteFlight(flight.id)}
                                 className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                               >
                                 <Trash2 className="w-3.5 h-3.5" /> 删除记录
                               </button>
                             </div>
                           )}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
               
               {/* Unified Pagination */}
               <Pagination currentPage={flightPage} totalPages={totalFlightPages} setPage={setFlightPage} totalItems={filteredFlights.length} itemsPerPage={FLIGHTS_PER_PAGE} />
             </div>
           </div>
        );

      case 'bookings':
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                 <h2 className="text-2xl font-bold text-gray-800">全平台订单管理</h2>
                 <p className="text-sm text-gray-500 mt-1">查看、处理及导出用户预订记录。</p>
               </div>
               <button onClick={() => alert('订单数据已导出')} className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors">
                   <Download className="w-4 h-4" /> 批量导出 Excel
               </button>
            </div>

            {/* Status Tabs */}
            <div className="border-b border-gray-200">
               <nav className="flex space-x-8" aria-label="Tabs">
                 {['all', 'paid', 'pending', 'refunded'].map((status) => (
                   <button
                     key={status}
                     onClick={() => { setBookingStatusFilter(status); setBookingPage(1); }}
                     className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                       bookingStatusFilter === status
                         ? 'border-blue-500 text-blue-600'
                         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                     }`}
                   >
                     {status === 'all' ? '全部订单' : 
                      status === 'paid' ? '已支付' : 
                      status === 'pending' ? '待处理' : '退款/售后'}
                     <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${bookingStatusFilter === status ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'}`}>
                       {status === 'all' ? bookings.length : bookings.filter(b => b.status === status).length}
                     </span>
                   </button>
                 ))}
               </nav>
            </div>

            {/* Booking Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
               <table className="w-full text-sm text-left">
                 <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                   <tr>
                     <th className="px-6 py-4 font-semibold">订单号</th>
                     <th className="px-6 py-4 font-semibold">预订人信息</th>
                     <th className="px-6 py-4 font-semibold">行程详情</th>
                     <th className="px-6 py-4 font-semibold">预订日期</th>
                     <th className="px-6 py-4 font-semibold text-right">总金额</th>
                     <th className="px-6 py-4 font-semibold text-center">状态</th>
                     <th className="px-6 py-4 font-semibold text-right">操作</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 relative">
                   {paginatedBookings.map((order) => (
                     <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                       <td className="px-6 py-4">
                         <div className="text-gray-900 font-medium">{order.customer.name}</div>
                         <div className="text-xs text-gray-400">{order.customer.email}</div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs font-bold">{order.flight}</span>
                             <span className="text-gray-600">{order.route}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                         {order.date}
                       </td>
                       <td className="px-6 py-4 text-right font-bold text-gray-900">
                         ¥{order.amount.toLocaleString()}
                       </td>
                       <td className="px-6 py-4 text-center">
                         {getBookingStatusBadge(order.status)}
                       </td>
                       <td className="px-6 py-4 text-right relative">
                         <button 
                            onClick={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === order.id ? null : order.id); }}
                            className={`p-1.5 rounded-lg transition-colors ${activeActionId === order.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                         >
                            <MoreVertical className="w-4 h-4" />
                         </button>

                         {/* Booking Action Menu */}
                         {activeActionId === order.id && (
                             <div ref={actionMenuRef} className="absolute right-8 top-8 w-36 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                               <button 
                                 onClick={() => { alert('显示订单详情'); setActiveActionId(null); }}
                                 className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                               >
                                 <FileText className="w-3.5 h-3.5 text-blue-500" /> 订单详情
                               </button>
                               {order.status === 'paid' && (
                                   <button 
                                     onClick={() => { if(confirm('确定退款?')) alert('已发起退款'); setActiveActionId(null); }}
                                     className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                   >
                                     <Undo2 className="w-3.5 h-3.5 text-orange-500" /> 申请退款
                                   </button>
                               )}
                               <div className="h-px bg-gray-100 my-0"></div>
                               <button 
                                 onClick={() => { alert('取消订单'); setActiveActionId(null); }}
                                 className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                               >
                                 <X className="w-3.5 h-3.5" /> 取消订单
                               </button>
                             </div>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               
               {/* Empty State */}
               {filteredBookings.length === 0 && (
                  <div className="p-12 text-center text-gray-400">
                     <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                     <p>没有找到相关订单</p>
                  </div>
               )}

               {/* Unified Pagination */}
               <Pagination currentPage={bookingPage} totalPages={totalBookingPages} setPage={setBookingPage} totalItems={filteredBookings.length} itemsPerPage={BOOKINGS_PER_PAGE} />
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                 <h2 className="text-2xl font-bold text-gray-800">用户权限管理</h2>
                 <p className="text-sm text-gray-500 mt-1">管理后台管理员及注册用户信息。</p>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => alert('用户数据导出成功')} className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors">
                   <Download className="w-4 h-4" /> 导出列表
                 </button>
                 <button onClick={handleOpenCreateUser} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
                   <UserPlus className="w-4 h-4" /> 添加用户
                 </button>
               </div>
            </div>

            {/* User Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
               <div className="flex items-center gap-2 w-full md:w-auto">
                 <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="搜索用户名或邮箱..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
               </div>
               <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                 {['all', 'admin', 'user'].map(role => (
                   <button 
                    key={role}
                    onClick={() => setUserRoleFilter(role)}
                    className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${userRoleFilter === role ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     {role === 'all' ? '所有角色' : role === 'admin' ? '管理员' : '普通用户'}
                   </button>
                 ))}
               </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">用户信息</th>
                    <th className="px-6 py-4 font-semibold">角色</th>
                    <th className="px-6 py-4 font-semibold">状态</th>
                    <th className="px-6 py-4 font-semibold">最后登录</th>
                    <th className="px-6 py-4 font-semibold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 relative">
                  {paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors group relative">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt={u.username} className="w-10 h-10 rounded-full border border-gray-200" />
                          <div>
                            <div className="font-bold text-gray-800">{u.username}</div>
                            <div className="text-xs text-gray-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getUserRoleBadge(u.role)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${u.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                           {u.status === 'active' ? '正常' : '禁用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                         {u.lastLogin}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                           onClick={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === u.id ? null : u.id); }}
                           className={`p-1.5 rounded-lg transition-colors ${activeActionId === u.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                        >
                           <MoreVertical className="w-4 h-4" />
                        </button>

                         {/* User Action Menu */}
                         {activeActionId === u.id && (
                             <div ref={actionMenuRef} className="absolute right-8 top-8 w-36 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                               <button 
                                 onClick={() => handleOpenEditUser(u)}
                                 className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                               >
                                 <Edit2 className="w-3.5 h-3.5 text-blue-500" /> 编辑资料
                               </button>
                               <button 
                                 onClick={() => { alert('密码重置邮件已发送'); setActiveActionId(null); }}
                                 className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                               >
                                 <Lock className="w-3.5 h-3.5 text-gray-500" /> 重置密码
                               </button>
                               <div className="h-px bg-gray-100 my-0"></div>
                               <button 
                                 onClick={() => handleDeleteUser(u.id)}
                                 className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                               >
                                 <Trash2 className="w-3.5 h-3.5" /> 删除用户
                               </button>
                             </div>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Unified Pagination */}
              <Pagination currentPage={userPage} totalPages={totalUserPages} setPage={setUserPage} totalItems={filteredUsers.length} itemsPerPage={USERS_PER_PAGE} />
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">支付配置与交易管理</h2>
                <p className="text-sm text-gray-500 mt-1">管理支付接口状态，监控实时交易流水。</p>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => alert('财务报表已导出')} className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors">
                   <Download className="w-4 h-4" /> 导出报表
                 </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                     <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                       <DollarSign className="w-5 h-5" />
                     </div>
                     <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">+12.5%</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">¥128,450</div>
                  <div className="text-xs text-gray-400 mt-1">今日交易总额</div>
               </div>
               <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                     <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                       <Receipt className="w-5 h-5" />
                     </div>
                     <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded">85 笔</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">98.2%</div>
                  <div className="text-xs text-gray-400 mt-1">支付成功率</div>
               </div>
               <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                     <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                       <ArrowRightLeft className="w-5 h-5" />
                     </div>
                     <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">2 笔待处理</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">¥1,560</div>
                  <div className="text-xs text-gray-400 mt-1">退款/争议金额</div>
               </div>
               <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                     <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                       <PieChart className="w-5 h-5" />
                     </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">¥856</div>
                  <div className="text-xs text-gray-400 mt-1">今日预估手续费</div>
               </div>
            </div>

            {/* Payment Gateways Config */}
            <div>
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <Wallet className="w-5 h-5 text-gray-500" /> 支付接口配置
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {gateways.map(gateway => (
                   <div key={gateway.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 transform translate-x-8 -translate-y-8 ${gateway.color}`}></div>
                      <div className="flex justify-between items-start mb-4 relative z-10">
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md ${gateway.color}`}>
                            {gateway.type === 'wallet' ? <Smartphone className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                         </div>
                         <button onClick={() => toggleGateway(gateway.id)} className={`transition-colors ${gateway.status ? 'text-green-500' : 'text-gray-300'}`}>
                           {gateway.status ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                         </button>
                      </div>
                      <h4 className="font-bold text-gray-800">{gateway.name}</h4>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                         <div>
                            <span className="block text-gray-400 scale-90 origin-left">费率</span>
                            <span className="font-mono font-medium">{gateway.fee}</span>
                         </div>
                         <div>
                            <span className="block text-gray-400 scale-90 origin-left">结算周期</span>
                            <span className="font-mono font-medium">{gateway.cycle}</span>
                         </div>
                         <div className="ml-auto">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${gateway.status ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              {gateway.status ? 'Active' : 'Disabled'}
                            </span>
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Transactions Table */}
            <div>
               <div className="flex justify-between items-center mb-4 mt-2">
                 <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   <Receipt className="w-5 h-5 text-gray-500" /> 实时交易流水
                 </h3>
                 <div className="flex bg-white border border-gray-200 p-1 rounded-lg">
                    {['all', 'success', 'pending', 'failed'].map(status => (
                      <button 
                       key={status}
                       onClick={() => setTransactionFilter(status)}
                       className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${transactionFilter === status ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {status === 'all' ? '全部' : status === 'success' ? '成功' : status === 'pending' ? '待处理' : '失败'}
                      </button>
                    ))}
                 </div>
               </div>

               <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
                 <table className="w-full text-sm text-left">
                   <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                     <tr>
                       <th className="px-6 py-4 font-semibold">流水号 / 时间</th>
                       <th className="px-6 py-4 font-semibold">用户</th>
                       <th className="px-6 py-4 font-semibold">交易类型</th>
                       <th className="px-6 py-4 font-semibold">支付方式</th>
                       <th className="px-6 py-4 font-semibold text-right">金额</th>
                       <th className="px-6 py-4 font-semibold text-center">状态</th>
                       <th className="px-6 py-4 font-semibold text-right">操作</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50 relative">
                     {paginatedTransactions.map((txn) => (
                       <tr key={txn.id} className="hover:bg-gray-50 transition-colors group relative">
                         <td className="px-6 py-4">
                           <div className="font-mono font-medium text-gray-900">{txn.id}</div>
                           <div className="text-xs text-gray-400 mt-0.5">{txn.time}</div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">
                               {txn.user.charAt(0).toUpperCase()}
                             </div>
                             <span className="text-gray-700">{txn.user}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`text-xs px-2 py-0.5 rounded border ${txn.type === 'payment' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                             {txn.type === 'payment' ? '支付' : '退款'}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-gray-600">
                              {['alipay', 'wechat'].includes(txn.method) ? <Smartphone className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                              <span className="text-xs capitalize">{txn.method.replace('_', ' ')}</span>
                           </div>
                         </td>
                         <td className={`px-6 py-4 text-right font-mono font-bold ${txn.type === 'refund' ? 'text-red-600' : 'text-gray-900'}`}>
                           {txn.type === 'refund' ? '-' : '+'}¥{txn.amount.toLocaleString()}
                         </td>
                         <td className="px-6 py-4 text-center">
                           {getTransactionStatusBadge(txn.status)}
                         </td>
                         <td className="px-6 py-4 text-right relative">
                           <button 
                             onClick={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === txn.id ? null : txn.id); }}
                             className={`p-1.5 rounded-lg transition-colors ${activeActionId === txn.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                           >
                             <MoreVertical className="w-4 h-4" />
                           </button>

                           {/* Transaction Action Menu */}
                           {activeActionId === txn.id && (
                             <div ref={actionMenuRef} className="absolute right-8 top-8 w-36 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                               <button 
                                 onClick={() => { alert('交易详情'); setActiveActionId(null); }}
                                 className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                               >
                                 <Eye className="w-3.5 h-3.5 text-blue-500" /> 查看详情
                               </button>
                               <button 
                                 onClick={() => { alert('下载凭证'); setActiveActionId(null); }}
                                 className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                               >
                                 <Download className="w-3.5 h-3.5 text-gray-500" /> 下载凭证
                               </button>
                             </div>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {filteredTransactions.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                       <p>暂无相关交易记录</p>
                    </div>
                 )}
                 
                 {/* Unified Pagination */}
                 <Pagination currentPage={transactionPage} totalPages={totalTransactionPages} setPage={setTransactionPage} totalItems={filteredTransactions.length} itemsPerPage={TRANSACTIONS_PER_PAGE} />
               </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-2">
                 <div>
                   <h2 className="text-2xl font-bold text-gray-800">系统设置</h2>
                   <p className="text-sm text-gray-500 mt-1">配置平台全局参数、安全策略及通知服务。</p>
                 </div>
                 <button 
                   onClick={handleSaveSettings} 
                   disabled={isSavingSettings}
                   className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70"
                 >
                   {isSavingSettings ? (
                     <><RefreshCw className="w-4 h-4 animate-spin" /> 保存中...</>
                   ) : (
                     <><Save className="w-4 h-4" /> 保存更改</>
                   )}
                 </button>
             </div>

             <div className="grid grid-cols-1 gap-6">
                {/* General Settings */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                   <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Globe className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-gray-800">通用设置</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">网站名称</label>
                        <input value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">客服邮箱</label>
                        <input value={settings.supportEmail} onChange={(e) => setSettings({...settings, supportEmail: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">默认货币</label>
                        <select value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                          <option value="CNY">CNY (人民币)</option>
                          <option value="USD">USD (美元)</option>
                          <option value="EUR">EUR (欧元)</option>
                        </select>
                      </div>
                   </div>
                </div>

                {/* Notifications & Security */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                          <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Bell className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-gray-800">通知服务</h3>
                      </div>
                      <div className="space-y-4 flex-1">
                         <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <div>
                               <div className="font-bold text-gray-700 text-sm">邮件通知</div>
                               <div className="text-xs text-gray-400">向用户发送订单确认及状态变更邮件</div>
                            </div>
                            <button onClick={() => setSettings({...settings, enableNotifications: !settings.enableNotifications})} className={`transition-colors ${settings.enableNotifications ? 'text-blue-600' : 'text-gray-300'}`}>
                              {settings.enableNotifications ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                            </button>
                         </div>
                      </div>
                   </div>

                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                          <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <Shield className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-gray-800">安全与维护</h3>
                      </div>
                      <div className="space-y-4 flex-1">
                         <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <div>
                               <div className="font-bold text-gray-700 text-sm">系统维护模式</div>
                               <div className="text-xs text-gray-400">开启后仅管理员可访问后台，前台暂停服务</div>
                            </div>
                            <button onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} className={`transition-colors ${settings.maintenanceMode ? 'text-red-600' : 'text-gray-300'}`}>
                              {settings.maintenanceMode ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                            </button>
                         </div>
                         <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <div>
                               <div className="font-bold text-gray-700 text-sm">开放用户注册</div>
                               <div className="text-xs text-gray-400">允许新用户通过前台注册账号</div>
                            </div>
                            <button onClick={() => setSettings({...settings, allowRegistration: !settings.allowRegistration})} className={`transition-colors ${settings.allowRegistration ? 'text-green-600' : 'text-gray-300'}`}>
                              {settings.allowRegistration ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full transition-all z-20 shadow-xl">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
           <div className="bg-blue-600 p-1.5 rounded-lg mr-3">
             <Plane className="w-5 h-5 text-white" />
           </div>
           <span className="font-bold text-white text-lg tracking-wide">SkyLink <span className="text-blue-500">Admin</span></span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">概览</p>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            仪表盘
          </button>
          
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">业务管理</p>
          <button 
             onClick={() => setActiveTab('flights')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'flights' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Plane className="w-5 h-5" />
            航班管理
          </button>
          <button 
             onClick={() => setActiveTab('bookings')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'bookings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <CalendarCheck className="w-5 h-5" />
            订单管理
          </button>
          <button 
             onClick={() => setActiveTab('payments')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'payments' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <CreditCard className="w-5 h-5" />
            支付配置
          </button>
          
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">系统</p>
          <button 
             onClick={() => setActiveTab('users')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Users className="w-5 h-5" />
            用户管理
          </button>
          <button 
             onClick={() => setActiveTab('settings')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings className="w-5 h-5" />
            系统设置
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={user.avatarUrl} alt="Admin" className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600" />
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> 在线
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 rounded-lg text-sm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all text-slate-400"
          >
            <LogOut className="w-4 h-4" /> 退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-w-0 h-screen overflow-hidden bg-gray-50">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
           <div className="flex items-center gap-4">
             <h2 className="text-xl font-bold text-gray-800">
               {activeTab === 'dashboard' && '仪表盘'}
               {activeTab === 'flights' && '航班管理'}
               {activeTab === 'bookings' && '订单管理'}
               {activeTab === 'payments' && '支付管理'}
               {activeTab === 'users' && '用户管理'}
               {activeTab === 'settings' && '系统设置'}
             </h2>
             <span className="text-gray-300 text-sm">|</span>
             <p className="text-sm text-gray-500">欢迎回来，{user.username}。今天是 {new Date().toLocaleDateString('zh-CN')}</p>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="relative hidden md:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
               <input 
                 type="text" 
                 placeholder="搜索订单、用户或航班号..." 
                 className="pl-9 pr-4 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none w-72 transition-all"
               />
             </div>
             <div className="h-6 w-px bg-gray-200 mx-1"></div>
             <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors group">
               <Bell className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
           </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-8">
           {renderContent()}
        </div>
      </main>

      {/* Render Modals if open */}
      {isFlightModalOpen && renderFlightModal()}
      {isUserModalOpen && renderUserModal()}
    </div>
  );
};

export default AdminDashboard;
