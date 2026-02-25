'use client';
import React from 'react';
import {
  PieChart,
  Calculator,
  Megaphone,
  FileText,
  Hammer,
  BarChart,
  Users,
  LayoutGrid,
  Search,
  Bell,
  TrendingUp,
  Globe,
  Wrench,
  Plus,
  Home,
  Briefcase,
  Settings,
} from 'lucide-react';

export default function MujuDashboard() {
  const tools = [
    { label: '資產管家', icon: PieChart, color: '#8E7F74' },
    { label: '投報試算', icon: Calculator, color: '#2196F3' },
    { label: '智能招租', icon: Megaphone, color: '#FF9800' },
    { label: '合約製作', icon: FileText, color: '#4CAF50' },
    { label: '報修派遣', icon: Hammer, color: '#F44336' },
    { label: '現金流', icon: BarChart, color: '#9C27B0' }, // ⚠️ 這裡換成了絕對安全的 BarChart
    { label: '租客管理', icon: Users, color: '#009688' },
    { label: '更多功能', icon: LayoutGrid, color: '#9E9E9E' },
  ];

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-32 text-[#3E342E]">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8B6A6] font-bold text-white">
            M
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">MUJU</h1>
            <p className="text-[10px] text-[#A8998C]">RESIDENCE</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Search size={22} />
          <Bell size={22} />
        </div>
      </div>

      <div className="px-6">
        <h2 className="my-6 text-3xl font-bold leading-tight">
          FEBRUARY 25
          <br />
          早安，Nilson
        </h2>

        {/* 系統連動測試 */}
        <div className="mb-6 rounded-3xl bg-[#2D2621] p-5 shadow-lg">
          <p className="mb-4 text-xs text-white/50">系統連動測試</p>
          <div className="flex gap-3">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-xs font-semibold text-white">
              <Globe size={16} /> 房客 Portal
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D68C8C] py-3 text-xs font-semibold text-white">
              <Wrench size={16} /> 查看報修單
            </button>
          </div>
        </div>

        {/* 實收租金統計 */}
        <div className="mb-8 rounded-3xl bg-[#B5A59B] p-7 shadow-xl">
          <p className="text-xs text-white/80">本月實收租金</p>
          <div className="my-4 flex items-center justify-between">
            <span className="text-4xl font-bold text-white">$142,500</span>
            <div className="rounded-full bg-white/20 p-2 text-white">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 rounded-2xl bg-white/10 p-4">
              <p className="text-[10px] text-white/60">出租率</p>
              <p className="text-lg font-bold text-white">95%</p>
            </div>
            <div className="flex-1 rounded-2xl bg-white/10 p-4">
              <p className="text-[10px] text-white/60">待處理</p>
              <p className="text-lg font-bold text-white">3 件</p>
            </div>
          </div>
        </div>

        {/* 專業工具箱 */}
        <h3 className="mb-5 text-sm font-bold text-[#8E7F74]">專業工具箱</h3>
        <div className="grid grid-cols-4 gap-y-6">
          {tools.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md">
                <item.icon size={24} color={item.color} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 底部懸浮導航 */}
      <div className="fixed bottom-8 left-6 right-6 flex h-16 items-center justify-around rounded-[32px] bg-[#9E8E81] shadow-2xl">
        <Home color="white" size={24} />
        <Users color="rgba(255,255,255,0.5)" size={24} />
        <div className="relative -top-10 flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-[#F9F7F5] bg-[#D1C4BC] shadow-lg">
          <Plus color="white" size={32} />
        </div>
        <Briefcase color="rgba(255,255,255,0.5)" size={24} />
        <Settings color="rgba(255,255,255,0.5)" size={24} />
      </div>
    </div>
  );
}
