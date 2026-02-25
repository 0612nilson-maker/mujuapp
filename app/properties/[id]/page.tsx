"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Droplets, Users, FileText, Wrench } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function PropertyDetailPage() {
  // 取得網址上的 ID (例如 /properties/1，就會抓到 1)
  const params = useParams();
  const propertyId = params.id;

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-24 text-[#3E342E]">
      {/* 頂部導航列 */}
      <div className="flex items-center justify-between bg-white p-5 shadow-sm">
        <Link href="/properties" className="rounded-full p-2 transition-colors hover:bg-gray-100">
          <ArrowLeft size={24} color="#3E342E" />
        </Link>
        <h1 className="text-lg font-bold text-[#8E7F74]">房產詳情</h1>
        <div className="w-10"></div> {/* 佔位符保持置中 */}
      </div>

      <div className="p-6">
        {/* 房產標頭 */}
        <div className="mb-8 rounded-3xl bg-[#B5A59B] p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">MUJU 館別 (ID: {propertyId})</h2>
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-white/80">
            <MapPin size={14} /> 台中市南區...
          </p>
          <div className="mt-4 flex gap-2">
            <span className="rounded-lg bg-white/20 px-3 py-1 text-xs font-bold text-white">12 間房</span>
            <span className="rounded-lg bg-green-500/80 px-3 py-1 text-xs font-bold text-white">滿租中</span>
          </div>
        </div>

        <h3 className="mb-4 text-sm font-bold text-[#8E7F74]">管理功能</h3>
        
        {/* 功能網格 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 通往昨天的重頭戲：水電抄表 */}
          <Link href={`/properties/${propertyId}/meter`} className="flex flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-sm transition-transform hover:scale-105 active:scale-95">
            <div className="mb-3 rounded-2xl bg-blue-50 p-3">
              <Droplets size={28} className="text-blue-500" />
            </div>
            <span className="font-bold text-[#3E342E]">水電抄表</span>
            <span className="mt-1 text-[10px] text-gray-400">紀錄本月度數</span>
          </Link>

          <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-sm transition-transform hover:scale-105 active:scale-95">
            <div className="mb-3 rounded-2xl bg-orange-50 p-3">
              <Users size={28} className="text-orange-500" />
            </div>
            <span className="font-bold text-[#3E342E]">租客管理</span>
            <span className="mt-1 text-[10px] text-gray-400">查看合約狀態</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-sm transition-transform hover:scale-105 active:scale-95">
            <div className="mb-3 rounded-2xl bg-green-50 p-3">
              <FileText size={28} className="text-green-500" />
            </div>
            <span className="font-bold text-[#3E342E]">財務報表</span>
            <span className="mt-1 text-[10px] text-gray-400">收支明細</span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-sm transition-transform hover:scale-105 active:scale-95">
            <div className="mb-3 rounded-2xl bg-red-50 p-3">
              <Wrench size={28} className="text-red-500" />
            </div>
            <span className="font-bold text-[#3E342E]">報修管理</span>
            <span className="mt-1 text-[10px] text-gray-400">處理修繕單</span>
          </div>
        </div>
      </div>
    </div>
  );
}