"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, Save, Home, Coins, ShieldCheck, Info, Loader2, Plus, X, User } from 'lucide-react';

interface Tenant { 
  id: string; 
  room_number: string; 
  tenant_name: string; 
  rent_amount: number; 
  management_fee: number; 
  space_usage_fee: number; 
  fee_description: string; 
}

export default function TenantsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 編輯模式狀態
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 新增模式狀態
  const [isAdding, setIsAdding] = useState(false);
  const [newRoom, setNewRoom] = useState({
    room_number: '',
    tenant_name: '',
    rent_amount: 0,
    management_fee: 0,
    space_usage_fee: 0,
    fee_description: '含水費、網路'
  });

  // 1. 抓取資料庫資料 (獨立成函式方便新增後重新抓取)
  const fetchTenants = async () => {
    setLoading(true);
    const { data } = await supabase.from('rooms').select('*').eq('property_id', params.id).order('room_number', { ascending: true });
    if (data) {
      setRooms(data.map((r: any) => ({ 
        ...r, 
        rent_amount: Number(r.rent_amount || 0), 
        management_fee: Number(r.management_fee || 0), 
        space_usage_fee: Number(r.space_usage_fee || 0), 
        fee_description: r.fee_description || '含水費、網路' 
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, [params.id]);

  // 2. 儲存修改 (既有房間)
  const handleUpdate = async (room: Tenant) => {
    setSaving(true);
    const { error } = await supabase.from('rooms').update({ 
      tenant_name: room.tenant_name,
      rent_amount: room.rent_amount, 
      management_fee: room.management_fee, 
      space_usage_fee: room.space_usage_fee, 
      fee_description: room.fee_description 
    }).eq('id', room.id);
    
    setSaving(false);
    if (error) return alert('更新失敗，請檢查網路');
    
    setEditingId(null);
    alert('資料更新成功！✅');
  };

  // 3. 建立新房間/租客
  const handleCreate = async () => {
    if (!newRoom.room_number.trim()) return alert('「房號」是必填的喔！');
    
    setSaving(true);
    const { error } = await supabase.from('rooms').insert([{
      property_id: params.id,
      room_number: newRoom.room_number,
      tenant_name: newRoom.tenant_name,
      rent_amount: newRoom.rent_amount,
      management_fee: newRoom.management_fee,
      space_usage_fee: newRoom.space_usage_fee,
      fee_description: newRoom.fee_description
    }]);

    setSaving(false);
    if (error) return alert('新增失敗，請檢查資料庫連線');

    alert('新增租客成功！🎉');
    setIsAdding(false);
    // 初始化新增表單
    setNewRoom({ room_number: '', tenant_name: '', rent_amount: 0, management_fee: 0, space_usage_fee: 0, fee_description: '含水費、網路' });
    // 重新抓取列表
    fetchTenants();
  };

  if (loading) return <div className="p-20 text-center font-bold text-[#8E7F74]">載入中...</div>;

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      
      {/* 頂部導航 */}
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-[#F9F7F5]/90 backdrop-blur z-10">
        <button onClick={() => router.back()} className="p-2 active:scale-90 transition-all"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-black text-[#8E7F74]">租務管理</h1>
        {/* 新增按鈕 */}
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-[#3E342E] text-white p-2 rounded-full shadow-md active:scale-90 transition-all"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      <div className="px-6 space-y-4 pb-10">
        
        {/* ================= 新增表單區塊 ================= */}
        {isAdding && (
          <div className="bg-white rounded-[32px] p-8 shadow-md border-2 border-[#3E342E] animate-in fade-in slide-in-from-top-4 mb-8">
            <h2 className="font-black text-lg mb-6 text-[#3E342E] flex items-center gap-2">
              <Plus className="w-5 h-5" /> 新增房間與租客
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputText label="房號 *" value={newRoom.room_number} onChange={(v) => setNewRoom({...newRoom, room_number: v})} placeholder="如: 201" />
                <InputText label="租客姓名" value={newRoom.tenant_name} onChange={(v) => setNewRoom({...newRoom, tenant_name: v})} placeholder="如: 王小明" />
              </div>
              <InputRow label="租金" value={newRoom.rent_amount} onChange={(v) => setNewRoom({...newRoom, rent_amount: v})} />
              <InputRow label="管理費" value={newRoom.management_fee} onChange={(v) => setNewRoom({...newRoom, management_fee: v})} />
              <InputRow label="空間費" value={newRoom.space_usage_fee} onChange={(v) => setNewRoom({...newRoom, space_usage_fee: v})} />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#8E7F74] uppercase px-1">費用備註</label>
                <input 
                  value={newRoom.fee_description} 
                  onChange={(e) => setNewRoom({...newRoom, fee_description: e.target.value})} 
                  className="w-full h-12 bg-[#F9F7F5] rounded-xl px-4 text-sm font-bold outline-none focus:border-[#3E342E] border border-transparent" 
                />
              </div>
              <button onClick={handleCreate} disabled={saving} className="w-full h-14 bg-[#3E342E] text-white rounded-2xl font-black flex justify-center items-center gap-2 mt-4 active:scale-95 transition-all">
                {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />} 確認新增
              </button>
            </div>
          </div>
        )}

        {/* ================= 既有清單區塊 ================= */}
        {rooms.length === 0 && !isAdding ? (
          <div className="text-center py-20 text-[#8E7F74] font-bold">目前沒有任何房間，點擊右上角「+」開始新增！</div>
        ) : (
          rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-transparent hover:border-[#EFEBE8] transition-all">
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-[#3E342E] text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm">
                    {room.room_number}
                  </div>
                  <span className="font-black text-lg">{room.tenant_name || '待出租'}</span>
                </div>
                <button onClick={() => setEditingId(editingId === room.id ? null : room.id)} className="text-[10px] font-black text-[#8E7F74] bg-[#F9F7F5] px-4 py-1.5 rounded-full active:scale-90 transition-all">
                  {editingId === room.id ? '取消' : '編輯資料'}
                </button>
              </div>

              {editingId === room.id ? (
                // 編輯模式
                <div className="space-y-4 animate-in fade-in">
                  <InputText label="租客姓名" value={room.tenant_name} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, tenant_name: v} : r))} placeholder="輸入租客姓名" />
                  <InputRow label="租金" value={room.rent_amount} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, rent_amount: v} : r))} />
                  <InputRow label="管理費" value={room.management_fee} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, management_fee: v} : r))} />
                  <InputRow label="空間費" value={room.space_usage_fee} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, space_usage_fee: v} : r))} />
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#8E7F74] uppercase px-1">費用備註</label>
                    <input value={room.fee_description} onChange={(e) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, fee_description: e.target.value} : r))} className="w-full h-12 bg-[#F9F7F5] rounded-xl px-4 text-sm font-bold outline-none focus:border-[#3E342E] border border-transparent" />
                  </div>
                  <button onClick={() => handleUpdate(room)} disabled={saving} className="w-full h-14 bg-[#3E342E] text-white rounded-2xl font-black flex justify-center items-center gap-2 active:scale-95 transition-all">
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} 儲存修改
                  </button>
                </div>
              ) : (
                // 顯示模式
                <div className="grid grid-cols-3 gap-2">
                  <FeeBox label="租金" val={room.rent_amount} icon={<Home className="w-3 h-3" />} />
                  <FeeBox label="管理費" val={room.management_fee} icon={<ShieldCheck className="w-3 h-3" />} />
                  <FeeBox label="空間費" val={room.space_usage_fee} icon={<Coins className="w-3 h-3" />} />
                  <div className="col-span-3 mt-3 p-3 bg-[#F9F7F5] rounded-2xl flex items-center gap-2 text-[10px] font-bold text-[#8E7F74]">
                    <Info className="w-3 h-3 min-w-[12px]" /> 備註：{room.fee_description}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==========================================
// 輔助組件
// ==========================================

function FeeBox({ label, val, icon }: { label: string, val: number, icon: React.ReactNode }) { 
  return (
    <div className="bg-[#F9F7F5] p-3 rounded-2xl text-center">
      <div className="flex items-center justify-center gap-1 text-[#8E7F74] mb-1">
        {icon} <span className="text-[9px] font-black">{label}</span>
      </div>
      <p className="text-xs font-black">${val.toLocaleString()}</p>
    </div>
  ); 
}

function InputRow({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) { 
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-[#8E7F74] uppercase px-1">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D1C7C0]">NT$</span>
        <input type="number" value={value || ''} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-12 bg-[#F9F7F5] rounded-xl pl-12 pr-4 text-sm font-bold outline-none focus:border-[#3E342E] border border-transparent transition-all" />
      </div>
    </div>
  ); 
}

function InputText({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) { 
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-[#8E7F74] uppercase px-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-12 bg-[#F9F7F5] rounded-xl px-4 text-sm font-bold outline-none focus:border-[#3E342E] border border-transparent transition-all" />
    </div>
  ); 
}