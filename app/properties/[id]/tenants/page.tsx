"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, Save, Home, Coins, ShieldCheck, Info, Loader2, Plus, X, Calendar, Phone, PiggyBank } from 'lucide-react';

interface Tenant { 
  id: string; 
  room_number: string; 
  tenant_name: string; 
  phone: string;
  contract_start: string;
  contract_end: string;
  deposit: number;
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
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // 初始化新增表單狀態
  const [newRoom, setNewRoom] = useState({
    room_number: '',
    tenant_name: '',
    phone: '',
    contract_start: '',
    contract_end: '',
    deposit: 0,
    rent_amount: 0,
    management_fee: 0,
    space_usage_fee: 0,
    fee_description: '含水費、網路'
  });

  const fetchTenants = async () => {
    setLoading(true);
    const { data } = await supabase.from('rooms').select('*').eq('property_id', params.id).order('room_number', { ascending: true });
    if (data) {
      setRooms(data.map((r: any) => ({ 
        ...r, 
        phone: r.phone || '',
        contract_start: r.contract_start || '',
        contract_end: r.contract_end || '',
        deposit: Number(r.deposit || 0),
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

  const handleUpdate = async (room: Tenant) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('rooms').update({ 
        tenant_name: room.tenant_name,
        phone: room.phone,
        contract_start: room.contract_start || null, // 避免空字串造成日期格式錯誤
        contract_end: room.contract_end || null,
        deposit: Number(room.deposit),
        rent_amount: Number(room.rent_amount), 
        management_fee: Number(room.management_fee), 
        space_usage_fee: Number(room.space_usage_fee), 
        fee_description: room.fee_description 
      }).eq('id', room.id);
      
      if (error) throw error;
      setEditingId(null);
      alert('資料更新成功！✅');
    } catch (err: any) {
      alert(`更新失敗: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newRoom.room_number.trim()) return alert('「房號」是必填的喔！');
    
    setSaving(true);
    try {
      const payload = {
        property_id: params.id,
        room_number: newRoom.room_number,
        tenant_name: newRoom.tenant_name || '',
        phone: newRoom.phone || '',
        contract_start: newRoom.contract_start || null,
        contract_end: newRoom.contract_end || null,
        deposit: Number(newRoom.deposit) || 0,
        rent_amount: Number(newRoom.rent_amount) || 0,
        management_fee: Number(newRoom.management_fee) || 0,
        space_usage_fee: Number(newRoom.space_usage_fee) || 0,
        fee_description: newRoom.fee_description || '',
        initial_electric_reading: 0
      };

      const { error } = await supabase.from('rooms').insert([payload]);
      if (error) throw error;

      alert('新增租客成功！🎉');
      setIsAdding(false);
      setNewRoom({ room_number: '', tenant_name: '', phone: '', contract_start: '', contract_end: '', deposit: 0, rent_amount: 0, management_fee: 0, space_usage_fee: 0, fee_description: '含水費、網路' });
      fetchTenants();
    } catch (err: any) {
      alert(`新增失敗：${err.message || '未知錯誤'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-[#8E7F74]">載入中...</div>;

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-[#F9F7F5]/90 backdrop-blur z-20">
        <button onClick={() => router.back()} className="p-2 active:scale-90 transition-all"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-black text-[#8E7F74]">租務管理</h1>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-[#3E342E] text-white p-2 rounded-full shadow-md active:scale-90 transition-all">
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      <div className="px-6 space-y-5 pb-10">
        
        {/* ================= 新增表單區塊 ================= */}
        {isAdding && (
          <div className="bg-white rounded-[32px] p-8 shadow-md border-2 border-[#3E342E] animate-in fade-in slide-in-from-top-4 mb-8 space-y-6">
            <h2 className="font-black text-lg text-[#3E342E] flex items-center gap-2"><Plus className="w-5 h-5" /> 新增房間與租客</h2>
            
            {/* 1. 基本資訊 */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-[#8E7F74] uppercase tracking-widest border-b border-[#F9F7F5] pb-2">Tenant Info / 租客資訊</h3>
              <div className="grid grid-cols-2 gap-4">
                <InputText label="房號 *" value={newRoom.room_number} onChange={(v) => setNewRoom({...newRoom, room_number: v})} placeholder="如: 201" />
                <InputText label="租客姓名" value={newRoom.tenant_name} onChange={(v) => setNewRoom({...newRoom, tenant_name: v})} placeholder="如: 王小明" />
              </div>
              <InputText label="聯絡電話" value={newRoom.phone} onChange={(v) => setNewRoom({...newRoom, phone: v})} placeholder="如: 0912-345-678" />
              <div className="grid grid-cols-2 gap-4">
                <InputDate label="起租日" value={newRoom.contract_start} onChange={(v) => setNewRoom({...newRoom, contract_start: v})} />
                <InputDate label="退租日" value={newRoom.contract_end} onChange={(v) => setNewRoom({...newRoom, contract_end: v})} />
              </div>
            </div>

            {/* 2. 財務資訊 */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-[#8E7F74] uppercase tracking-widest border-b border-[#F9F7F5] pb-2 mt-4">Financial Info / 費用設定</h3>
              <div className="grid grid-cols-2 gap-4">
                <InputRow label="押金" value={newRoom.deposit} onChange={(v) => setNewRoom({...newRoom, deposit: v})} />
                <InputRow label="租金" value={newRoom.rent_amount} onChange={(v) => setNewRoom({...newRoom, rent_amount: v})} />
                <InputRow label="管理費" value={newRoom.management_fee} onChange={(v) => setNewRoom({...newRoom, management_fee: v})} />
                <InputRow label="空間費" value={newRoom.space_usage_fee} onChange={(v) => setNewRoom({...newRoom, space_usage_fee: v})} />
              </div>
              <InputText label="費用備註" value={newRoom.fee_description} onChange={(v) => setNewRoom({...newRoom, fee_description: v})} />
            </div>

            <button onClick={handleCreate} disabled={saving} className="w-full h-14 bg-[#3E342E] text-white rounded-2xl font-black flex justify-center items-center gap-2 mt-2 active:scale-95 transition-all">
              {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />} 確認新增
            </button>
          </div>
        )}

        {/* ================= 既有清單區塊 ================= */}
        {rooms.length === 0 && !isAdding ? (
          <div className="text-center py-20 text-[#8E7F74] font-bold">目前沒有任何房間，點擊右上角「+」開始新增！</div>
        ) : (
          rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-[32px] p-6 shadow-sm border border-transparent hover:border-[#EFEBE8] transition-all">
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-[#3E342E] text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm">{room.room_number}</div>
                    <span className="font-black text-lg">{room.tenant_name || '待出租'}</span>
                  </div>
                  {/* 合約狀態小標籤 */}
                  {room.contract_end && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#8E7F74] ml-[52px]">
                      <Calendar className="w-3 h-3" />
                      {room.contract_start ? `${room.contract_start} 至 ${room.contract_end}` : `到期: ${room.contract_end}`}
                    </div>
                  )}
                </div>
                <button onClick={() => setEditingId(editingId === room.id ? null : room.id)} className="text-[10px] font-black text-[#8E7F74] bg-[#F9F7F5] px-4 py-1.5 rounded-full mt-1">
                  {editingId === room.id ? '取消' : '編輯'}
                </button>
              </div>

              {editingId === room.id ? (
                // --- 編輯模式 ---
                <div className="space-y-5 animate-in fade-in pt-4 border-t border-[#F9F7F5]">
                  <div className="grid grid-cols-2 gap-4">
                    <InputText label="租客姓名" value={room.tenant_name} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, tenant_name: v} : r))} />
                    <InputText label="聯絡電話" value={room.phone} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, phone: v} : r))} />
                    <InputDate label="起租日" value={room.contract_start} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, contract_start: v} : r))} />
                    <InputDate label="退租日" value={room.contract_end} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, contract_end: v} : r))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <InputRow label="押金" value={room.deposit} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, deposit: v} : r))} />
                    <InputRow label="租金" value={room.rent_amount} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, rent_amount: v} : r))} />
                    <InputRow label="管理費" value={room.management_fee} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, management_fee: v} : r))} />
                    <InputRow label="空間費" value={room.space_usage_fee} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, space_usage_fee: v} : r))} />
                  </div>
                  <InputText label="費用備註" value={room.fee_description} onChange={(v) => setRooms(prev => prev.map(r => r.id === room.id ? {...r, fee_description: v} : r))} />
                  
                  <button onClick={() => handleUpdate(room)} disabled={saving} className="w-full h-14 bg-[#3E342E] text-white rounded-2xl font-black flex justify-center items-center gap-2">
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} 儲存修改
                  </button>
                </div>
              ) : (
                // --- 顯示模式 ---
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <FeeBox label="租金" val={room.rent_amount} icon={<Home className="w-3 h-3" />} />
                    <FeeBox label="管理費" val={room.management_fee} icon={<ShieldCheck className="w-3 h-3" />} />
                    <FeeBox label="空間費" val={room.space_usage_fee} icon={<Coins className="w-3 h-3" />} />
                  </div>
                  
                  {/* 押金與備註資訊列 */}
                  <div className="flex flex-wrap gap-2">
                    {room.deposit > 0 && (
                      <div className="flex items-center gap-1.5 bg-[#EAF3EB] text-[#2E7D32] px-3 py-2 rounded-xl text-[10px] font-bold">
                        <PiggyBank className="w-3 h-3" /> 押金 ${room.deposit.toLocaleString()}
                      </div>
                    )}
                    {room.phone && (
                      <div className="flex items-center gap-1.5 bg-[#F9F7F5] text-[#8E7F74] px-3 py-2 rounded-xl text-[10px] font-bold">
                        <Phone className="w-3 h-3" /> {room.phone}
                      </div>
                    )}
                    <div className="flex-1 flex items-center gap-1.5 bg-[#F9F7F5] text-[#8E7F74] px-3 py-2 rounded-xl text-[10px] font-bold min-w-[120px]">
                      <Info className="w-3 h-3 min-w-[12px]" /> {room.fee_description}
                    </div>
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
// 輔助組件 (UI 元件庫)
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
        <input type="number" value={value || ''} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-11 bg-[#F9F7F5] rounded-xl pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3E342E] transition-all" />
      </div>
    </div>
  ); 
}

function InputText({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) { 
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-[#8E7F74] uppercase px-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-11 bg-[#F9F7F5] rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3E342E] transition-all" />
    </div>
  ); 
}

function InputDate({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) { 
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-[#8E7F74] uppercase px-1">{label}</label>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-11 bg-[#F9F7F5] rounded-xl px-4 text-sm font-bold outline-none text-[#3E342E] focus:ring-2 focus:ring-[#3E342E] transition-all" />
    </div>
  ); 
}