"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, FileText, Wrench, ChevronRight, Bell, DollarSign, PieChart, Home, Loader2, Sparkles } from 'lucide-react';
// 確保路徑指向你的 supabase 設定檔 (退一層)
import { supabase } from '../lib/supabase';

export default function HomePage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    propertyCount: 0,
    roomCount: 0,
    occupiedCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. 抓取所有房間資料 (用來算錢跟出租率)
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('rent_amount, management_fee, tenant_name');

      if (roomsError) throw roomsError;

      // 2. 抓取房產總數
      const { count: propertyCount, error: propError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      if (propError) throw propError;

      // 3. 開始計算大數據
      let revenue = 0;
      let occupied = 0;

      if (rooms) {
        rooms.forEach(room => {
          // 只有「已出租 (有填名字)」的房間才算入營收跟出租率
          if (room.tenant_name) {
            occupied += 1;
            revenue += (room.rent_amount || 0) + (room.management_fee || 0);
          }
        });
      }

      setStats({
        totalRevenue: revenue,
        propertyCount: propertyCount || 0,
        roomCount: rooms ? rooms.length : 0,
        occupiedCount: occupied
      });

    } catch (error: any) {
      console.error('讀取首頁資料失敗:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 計算整體出租率
  const occupancyRate = stats.roomCount > 0 
    ? Math.round((stats.occupiedCount / stats.roomCount) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-24 text-[#3E342E] font-sans">
      {/* 頂部導航與問候 */}
      <div className="flex items-center justify-between px-6 pt-12 pb-6">
        <div>
          <p className="text-sm font-bold text-[#8E7F74]">早安，Nilson</p>
          <h1 className="text-2xl font-black mt-1">MUJU 資產管理</h1>
        </div>
        <button className="relative rounded-full bg-white p-3 shadow-sm transition-transform hover:scale-105 active:scale-95">
          <Bell size={20} color="#3E342E" />
          <span className="absolute right-3 top-3 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-orange-500 ring-2 ring-white"></span>
        </button>
      </div>

      <div className="px-6">
        {/* 🌟 核心戰情儀表板：本月總營收 */}
        <div className="relative mb-6 overflow-hidden rounded-3xl bg-[#3E342E] p-8 text-white shadow-xl shadow-stone-800/20">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/70 mb-2">
              <Sparkles size={16} className="text-orange-300" />
              <p className="text-xs font-bold tracking-widest">本月預期總收 (租金+管理費)</p>
            </div>
            
            {isLoading ? (
              <div className="flex items-center gap-2 mt-2 h-10">
                <Loader2 size={24} className="animate-spin text-white/50" />
                <span className="text-sm text-white/50">精算中...</span>
              </div>
            ) : (
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xl font-bold opacity-80">NT$</span>
                <span className="text-[2.75rem] font-black tracking-tight leading-none">
                  {stats.totalRevenue.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          {/* 背景裝飾 */}
          <DollarSign size={120} className="absolute -right-6 -bottom-8 text-white/5 rotate-12" />
        </div>

        {/* 🌟 大數據統計列 */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#EFEBE8] flex flex-col items-center justify-center text-center">
            <Building2 size={20} className="text-[#8E7F74] mb-2" />
            <p className="text-xl font-black text-[#3E342E]">
              {isLoading ? '-' : stats.propertyCount}
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-gray-400">管理物件</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#EFEBE8] flex flex-col items-center justify-center text-center">
            <Home size={20} className="text-[#8E7F74] mb-2" />
            <p className="text-xl font-black text-[#3E342E]">
              {isLoading ? '-' : stats.occupiedCount}<span className="text-sm text-gray-300">/{stats.roomCount}</span>
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-gray-400">滿租房間</p>
          </div>
          <div className="rounded-2xl bg-[#EFEBE8] p-4 shadow-sm flex flex-col items-center justify-center text-center">
            <PieChart size={20} className="text-[#3E342E] mb-2" />
            <p className="text-xl font-black text-[#3E342E]">
              {isLoading ? '-' : `${occupancyRate}%`}
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-[#8E7F74]">整體出租率</p>
          </div>
        </div>

        <h2 className="mb-4 text-sm font-bold text-[#8E7F74]">快速功能</h2>
        
        {/* 功能區塊 */}
        <div className="flex flex-col gap-3">
          {/* 🌟 核心入口：前往資產管家 */}
          <Link href="/properties">
            <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm transition-all hover:shadow-md active:scale-95 border border-[#EFEBE8]">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9F7F5]">
                  <Building2 size={26} className="text-[#3E342E]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#3E342E]">資產管家</h3>
                  <p className="mt-0.5 text-xs font-semibold text-gray-400">管理房產、房間與租客</p>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F9F7F5]">
                <ChevronRight size={18} className="text-[#8E7F74]" />
              </div>
            </div>
          </Link>

          {/* 其他未開通模組 (裝飾用) */}
          <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm border border-[#EFEBE8] opacity-60">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                <FileText size={26} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#3E342E]">總務報表</h3>
                <p className="mt-0.5 text-xs font-semibold text-gray-400">跨館別收支總覽 (即將推出)</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>

          <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm border border-[#EFEBE8] opacity-60">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                <Wrench size={26} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#3E342E]">派工報修</h3>
                <p className="mt-0.5 text-xs font-semibold text-gray-400">修繕進度追蹤 (即將推出)</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
}