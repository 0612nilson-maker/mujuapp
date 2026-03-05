"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Droplets, Users, FileText, Wrench, MapPin, Settings, DollarSign } from 'lucide-react';

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);

  useEffect(() => {
    async function fetchProperty() {
      const { data } = await supabase.from('properties').select('*').eq('id', params.id).single();
      if (data) setProperty(data);
    }
    fetchProperty();
  }, [params.id]);

  // 配置功能矩陣 (包含合約管理)
  const menus = [
    { title: '合約管理', icon: <FileText className="w-6 h-6" />, path: `/properties/${params.id}/contracts`, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: '水電抄表', icon: <Droplets className="w-6 h-6" />, path: `/properties/${params.id}/meter`, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: '租客管理', icon: <Users className="w-6 h-6" />, path: `/properties/${params.id}/tenants`, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: '財務總覽', icon: <DollarSign className="w-6 h-6" />, path: `/properties/${params.id}/finance`, color: 'text-green-500', bg: 'bg-green-50' },
    { title: '報修管理', icon: <Wrench className="w-6 h-6" />, path: `/properties/${params.id}/maintenance`, color: 'text-red-400', bg: 'bg-red-50' }
  ];

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/properties')} className="p-2 active:scale-90 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-[#8E7F74]">房產詳情</h1>
        <button onClick={() => router.push(`/properties/${params.id}/settings`)} className="p-2 active:scale-90 transition-all">
          <Settings className="w-6 h-6 text-[#8E7F74]" />
        </button>
      </div>

      <div className="px-6 space-y-6 pb-10">
        
        {/* 頂部物件資訊卡 */}
        <div className="bg-[#B5A59B] p-8 rounded-[32px] text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1">{property?.name || '載入中...'}</h2>
            <div className="flex items-center gap-1 opacity-80 text-sm">
              <MapPin className="w-3 h-3" />
              <p>{property?.address || '資產管理中心'}</p>
            </div>
          </div>
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full" />
        </div>

        {/* 功能網格 (使用 grid-cols-2 排列) */}
        <div className="grid grid-cols-2 gap-4">
          {menus.map((menu, i) => (
            <div 
              key={i} 
              onClick={() => router.push(menu.path)} 
              className="bg-white p-8 rounded-[32px] flex flex-col items-center justify-center gap-4 shadow-sm cursor-pointer border border-transparent hover:border-[#EFEBE8] transition-all active:scale-95"
            >
              <div className={`${menu.bg} ${menu.color} p-4 rounded-2xl`}>{menu.icon}</div>
              <span className="font-black text-sm">{menu.title}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}