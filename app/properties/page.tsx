"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; // 兩層路徑
import { Building2, ChevronRight, ArrowLeft, Plus } from 'lucide-react';

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
      if (data) setProperties(data);
      setLoading(false);
    }
    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="p-2"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-black text-[#8E7F74]">資產管家</h1>
        <div className="w-10"></div>
      </div>
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black">我的房產 ({properties.length})</h2>
          <button onClick={() => router.push('/properties/create')} className="bg-[#3E342E] text-white p-3 rounded-full shadow-lg hover:scale-105 transition-all">
            <Plus className="w-6 h-6" />
          </button>
        </div>
        {loading ? <div className="text-center py-20 font-bold text-[#8E7F74]">MUJU 載入中...</div> : (
          <div className="grid gap-4">
            {properties.map((item) => (
              <div key={item.id} onClick={() => router.push(`/properties/${item.id}`)} className="bg-white p-6 rounded-[32px] flex items-center justify-between shadow-sm cursor-pointer hover:border-[#EFEBE8] border border-transparent transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-[#F2F0EE] p-4 rounded-2xl"><Building2 className="w-7 h-7 text-[#3E342E]" /></div>
                  <div>
                    <h3 className="font-black text-lg">{item.name}</h3>
                    <p className="text-[#8E7F74] text-xs font-bold uppercase tracking-widest">{item.business_model === 'OWN' ? '購置出租' : '包租代管'}</p>
                  </div>
                </div>
                <ChevronRight className="text-[#EFEBE8]" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}