"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap } from 'lucide-react';

export default function MeterReadingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-black text-[#8E7F74]">水電抄表</h1>
        <div className="w-10"></div>
      </div>
      <div className="px-6 py-20 text-center">
        <div className="inline-block bg-white p-6 rounded-full shadow-sm mb-4">
          <Zap className="w-12 h-12 text-[#EFEBE8]" />
        </div>
        <h2 className="text-xl font-black mb-2">抄表系統準備中</h2>
        <p className="text-sm font-bold text-[#8E7F74]">即將開放電表登錄與自動計費功能</p>
      </div>
    </div>
  );
}