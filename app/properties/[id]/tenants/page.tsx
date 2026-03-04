"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase'; // 四層路徑
import { ArrowLeft, Save, Home, Coins, ShieldCheck, Info, Loader2 } from 'lucide-react';

interface Tenant { id: string; room_number: string; tenant_name: string; rent_amount: number; management_fee: number; space_usage_fee: number; fee_description: string; }

export default function TenantsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<Tenant[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenants() {
      const { data } = await supabase.from('rooms').select('*').eq('property_id', params.id).order('room_number', { ascending: true });
      if (data) {
        setRooms(data.map((r: any) => ({ ...r, rent_amount: Number(r.rent_amount || 0), management_fee: Number(r.management_fee || 0), space_usage_fee: Number(r.space_usage_fee || 0), fee_description: r.fee_description || '含水費、網路' })));
      }
    }
    fetchTenants();
  }, [params.id]);

  const handleSave = async (room: Tenant) => {
    await supabase.from('rooms').update({ rent_amount: room.rent_amount, management_fee: room.management_fee, space_usage_fee: room.space_usage_fee, fee_description: room.fee_description }).eq('id', room.id);
    setEditingId(null);
    alert('費用更新成功！');
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      <div className="px-6 py-6 flex items-center justify-between"><button onClick={() => router.back()} className="p-2"><ArrowLeft className="w-6 h-6" /></button><h1 className="text-lg font-black text-[#8E7F74]">租務管理</h1><div className="w-10"></div></div>
      <div className="px-6 space-y-4">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-[32px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6"><h3 className="font-black text-lg">{room.room_number} 房 - {room.tenant_name || '待出租'}</h3><button onClick={() => setEditingId(editingId === room.id ? null : room.id)} className="text-[10px] font-black text-[#8E7F74] bg-[#F9F7F5] px-4 py-1.5 rounded-full">{editingId === room.id ? '取消' : '編輯'}</button></div>
            {editingId === room.id ? (
              <div className="space-y-4">
                <InputRow label="租金" value={room.rent_amount} onChange={(v: number) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, rent_amount: v} : r))} />
                <InputRow label="管理費" value={room.management_fee} onChange={(v: number) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, management_fee: v} : r))} />
                <InputRow label="空間費" value={room.space_usage_fee} onChange={(v: number) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, space_usage_fee: v} : r))} />
                <div className="space-y-1"><label className="text-[10px] font-black text-[#8E7F74]">費用備註</label><input value={room.fee_description} onChange={(e) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, fee_description: e.target.value} : r))} className="w-full h-12 bg-[#F9F7F5] rounded-xl px-4 text-sm font-bold outline-none" /></div>
                <button onClick={() => handleSave(room)} className="w-full h-14 bg-[#3E342E] text-white rounded-2xl font-black flex justify-center items-center gap-2"><Save className="w-4 h-4" /> 儲存</button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <FeeBox label="租金" val={room.rent_amount} icon={<Home className="w-3 h-3" />} />
                <FeeBox label="管理費" val={room.management_fee} icon={<ShieldCheck className="w-3 h-3" />} />
                <FeeBox label="空間費" val={room.space_usage_fee} icon={<Coins className="w-3 h-3" />} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeeBox({ label, val, icon }: any) { return <div className="bg-[#F9F7F5] p-3 rounded-2xl text-center"><div className="flex items-center justify-center gap-1 text-[#8E7F74] mb-1">{icon} <span className="text-[9px] font-black">{label}</span></div><p className="text-xs font-black">${val.toLocaleString()}</p></div>; }
function InputRow({ label, value, onChange }: any) { return <div className="space-y-1"><label className="text-[10px] font-black text-[#8E7F74]">{label}</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D1C7C0]">NT$</span><input type="number" value={value || ''} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-12 bg-[#F9F7F5] rounded-xl pl-12 pr-4 text-sm font-bold outline-none" /></div></div>; }