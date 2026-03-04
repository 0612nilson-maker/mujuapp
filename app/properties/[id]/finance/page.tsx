"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase'; // 四層路徑
import { ArrowLeft, CheckCircle2, DollarSign } from 'lucide-react';

type PaymentStatus = 'paid' | 'unpaid';

interface FinanceRoom { id: string; room_number: string; tenant_name: string; rent_amount: number; management_fee: number; space_usage_fee: number; electricity: number; status: PaymentStatus; }

export default function FinanceReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<FinanceRoom[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('rooms').select('*').eq('property_id', params.id).order('room_number', { ascending: true });
      if (data) {
        setRooms(data.map((r: any) => ({
          id: r.id.toString(), room_number: r.room_number, tenant_name: r.tenant_name || '待出租',
          rent_amount: Number(r.rent_amount || 0), management_fee: Number(r.management_fee || 0), space_usage_fee: Number(r.space_usage_fee || 0),
          electricity: 0, status: 'unpaid' as PaymentStatus
        })));
      }
    }
    fetchData();
  }, [params.id]);

  const total = useMemo(() => rooms.reduce((sum, r) => sum + r.rent_amount + r.management_fee + r.space_usage_fee + r.electricity, 0), [rooms]);

  const handleToggle = (id: string) => { setRooms(prev => prev.map(r => r.id === id ? { ...r, status: (r.status === 'paid' ? 'unpaid' : 'paid') as PaymentStatus } : r)); };

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      <div className="px-6 py-6 flex items-center justify-between"><button onClick={() => router.back()} className="p-2"><ArrowLeft className="w-6 h-6" /></button><h1 className="text-lg font-black text-[#8E7F74]">財務報表</h1><div className="w-10"></div></div>
      <div className="px-6 space-y-6">
        <div className="bg-[#3E342E] p-7 rounded-[32px] shadow-lg text-white relative overflow-hidden">
          <div className="relative z-10"><p className="text-[10px] font-bold opacity-60 uppercase mb-2">Monthly Revenue</p><div className="flex items-baseline gap-1"><span className="text-sm font-black opacity-80">NT$</span><span className="text-3xl font-black">{total.toLocaleString()}</span></div></div>
          <DollarSign className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-5 rotate-12" />
        </div>
        <div className="space-y-3">
          <h2 className="text-xs font-black text-[#8E7F74] px-1">應收明細</h2>
          {rooms.map((room) => (
            <div key={room.id} className="bg-white p-5 rounded-[28px] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${room.status === 'paid' ? 'bg-[#EAF3EB] text-[#2E7D32]' : 'bg-[#F9F7F5] text-[#8E7F74]'}`}>{room.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : room.room_number}</div>
                <div><h3 className="font-black text-base">{room.room_number} 房</h3><p className="text-[11px] font-bold text-[#3E342E]">應收：${(room.rent_amount + room.management_fee + room.space_usage_fee + room.electricity).toLocaleString()}</p></div>
              </div>
              <div onClick={() => handleToggle(room.id)} className="flex flex-col items-end cursor-pointer group">
                <span className={`text-[9px] font-black mb-1 ${room.status === 'paid' ? 'text-green-500' : 'text-[#D1C7C0]'}`}>{room.status === 'paid' ? '已收' : '待收'}</span>
                <div className={`w-10 h-5 rounded-full p-1 transition-all ${room.status === 'paid' ? 'bg-green-500' : 'bg-[#EFEBE8]'}`}><div className={`w-3 h-3 bg-white rounded-full transition-all ${room.status === 'paid' ? 'translate-x-5' : 'translate-x-0'}`} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}