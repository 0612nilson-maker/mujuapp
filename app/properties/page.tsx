"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, ChevronRight, Plus } from 'lucide-react';

export default function PropertiesPage() {
  // 模擬你的房產資料
  const properties = [
    { id: 1, name: 'MUJU 復興館', address: '台中市南區復興路...', units: 12, occupied: 12, status: '滿租', statusColor: 'text-green-600' },
    { id: 2, name: 'MUJU 學府館', address: '台中市南區學府路...', units: 8, occupied: 7, status: '招租中', statusColor: 'text-orange-500' },
    { id: 3, name: 'MUJU 高工館', address: '台中市南區高工路...', units: 5, occupied: 5, status: '滿租', statusColor: 'text-green-600' },
  ];

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-24 text-[#3E342E]">
      {/* 頂部導航列 (包含返回按鈕) */}
      <div className="flex items-center justify-between bg-white p-5 shadow-sm">
        <Link href="/" className="rounded-full p-2 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={24} color="#3E342E" />
        </Link>
        <h1 className="text-lg font-bold text-[#8E7F74]">資產管家</h1>
        <div className="w-10"></div> {/* 佔位符，用來讓標題置中 */}
      </div>

      <div className="p-6">
        {/* 標題與新增按鈕 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">我的房產 ({properties.length})</h2>
          <button className="flex items-center gap-1 rounded-full bg-[#EFEBE8] px-3 py-1.5 text-xs font-bold text-[#8E7F74] transition-colors hover:bg-[#D1C4BC] hover:text-white">
            <Plus size={16} /> 新增
          </button>
        </div>

        {/* 房產列表卡片 */}
        <div className="flex flex-col gap-4">
          {properties.map(prop => (
            // 點擊卡片會跳轉到該房產的詳細頁面 (預留路徑給下一步)
            <Link href={`/properties/${prop.id}`} key={prop.id}>
              <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4">
                  {/* 左側 Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFEBE8]">
                    <Building2 size={24} color="#8E7F74" />
                  </div>
                  {/* 房產資訊 */}
                  <div>
                    <h3 className="text-base font-bold">{prop.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                      <MapPin size={12} /> {prop.address}
                    </div>
                    <div className="mt-1.5 text-[11px] font-semibold text-[#8E7F74]">
                      {prop.occupied} / {prop.units} 間出租 • <span className={prop.statusColor}>{prop.status}</span>
                    </div>
                  </div>
                </div>
                {/* 右側箭頭 */}
                <ChevronRight size={20} color="#D1C4BC" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}