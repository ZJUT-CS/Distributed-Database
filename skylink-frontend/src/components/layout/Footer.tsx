
import React from 'react';
import { Plane, Mail, Phone, Github, Twitter, Heart, MapPin, Shield, Star } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 py-12 mt-auto transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-2 rounded-lg shadow-lg shadow-sky-500/20">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">SkyLink</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              您的全球旅行伙伴，提供便捷的航班预订服务和优质的出行体验。
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="ml-1">10,000+ 优质用户评价</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">快速链接</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-all group">
                  <span className="w-1 h-1 bg-sky-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="group-hover:translate-x-1 transition-transform">首页</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-all group">
                  <span className="w-1 h-1 bg-sky-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="group-hover:translate-x-1 transition-transform">航班查询</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-all group">
                  <span className="w-1 h-1 bg-sky-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="group-hover:translate-x-1 transition-transform">我的订单</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-all group">
                  <span className="w-1 h-1 bg-sky-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="group-hover:translate-x-1 transition-transform">帮助中心</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">联系我们</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-500 dark:text-sky-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">客服热线</p>
                  <p className="text-sky-600 dark:text-sky-400">400-888-9999</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-500 dark:text-sky-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">邮箱支持</p>
                  <p className="text-sky-600 dark:text-sky-400">support@skylink.com</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-500 dark:text-sky-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">总部地址</p>
                  <p className="text-gray-600 dark:text-gray-400">北京市朝阳区科技园区</p>
                </div>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">关注我们</h4>
            <div className="flex gap-3 mb-4">
              <a href="#" className="group p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-sky-500 dark:hover:bg-sky-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-sky-500/30">
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" className="group p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-sky-500 dark:hover:bg-sky-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-sky-500/30">
                <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 border border-sky-100 dark:border-sky-800/50">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5" />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  我们致力于保护您的隐私和支付安全，采用行业领先的加密技术。
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-gray-500 dark:text-gray-500">
            © 2025 SkyLink Powered by 熵增架构师.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 dark:text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">隐私政策</a>
            <a href="#" className="text-gray-500 dark:text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">服务条款</a>
            <a href="#" className="text-gray-500 dark:text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Cookie设置</a>
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> for travelers
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
