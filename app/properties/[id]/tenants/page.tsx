"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, UserPlus, Phone, Calendar, AlertCircle, CheckCircle2, Loader2, Home, X, Edit, Plus, BadgeDollarSign, ShieldCheck } from 'lucide-react';
// 確保路徑是退四層
import { supabase } from '../../../../lib/supabase';

export default function TenantsPage() {
  const params = useParams();
  const propertyId = params.id as string;
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 租客/合約表單狀態 ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null); 
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    tenant_name: '',
    rent_amount: '',
    deposit: '',      
    management_fee: '', 
    phone: '',
    contract_end: ''
  });

  // --- 新增房間表單狀態 ---
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [isAddingRoom, setIsAddingRoom] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [propertyId]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId)
        .order('room_number', { ascending: true });

      if (error) throw error;
      if (data) setRooms(data);
    } catch (error: any) {
      console.error('讀取租客資料失敗:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (room: any) => {
    setEditingRoom(room);
    setFormData({
      tenant_name: room.tenant_name || '',
      rent_amount: room.rent_amount || '',
      deposit: room.deposit || '',       
      management_fee: room.management_fee || '', 
      phone: room.phone || '',
      contract_end: room.contract_end || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleSave = async () => {
    if (!formData.tenant_name) {
      alert('請輸入租客姓名');
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          tenant_name: formData.tenant_name,
          rent_amount: formData.rent_amount ? Number(formData.rent_amount) : null,
          deposit: formData.deposit ? Number(formData.deposit) : null,             
          management_fee: formData.management_fee ? Number(formData.management_fee) : null, 
          phone: formData.phone,
          contract_end: formData.contract_end || null
        })
        .eq('id', editingRoom.id); 

      if (error) throw error;
      alert('✅ 資料儲存成功！');
      closeModal();
      fetchRooms(); 
    } catch (error: any) {
      alert('❌ 儲存失敗：' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomNumber) {
      alert('請輸入房號');
      return;
    }
    setIsAddingRoom(true);
    try {
      const { error } = await supabase
        .from('rooms')
        .insert([{ 
          property_id: propertyId, 
          room_number: newRoomNumber 
        }]);
        
      if (error) throw error;
      alert(`✅ 成功建立 ${newRoomNumber} 房！`);
      setIsAddRoomModalOpen(false);
      setNewRoomNumber('');
      fetchRooms();
    } catch (error: any) {
      alert('❌ 新增房間失敗：' + error.message);
    } finally {
      setIsAddingRoom(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-24 text-[#3E342E]">
      <div className="flex items-center justify-between bg-white p-5 shadow-sm">
        <Link href={`/properties/${propertyId}`} className="rounded-full p-2">
          <ArrowLeft size={24} color="#3E342E" />
        </Link>
        <h1 className="text-lg font-bold text-[#8E7F74]">租客管理</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#8E7F74]">房間列表</h2>
          <button 
            onClick={() => setIsAddRoomModalOpen(true)} 
            className="flex items-center gap-1 rounded-full bg-[#3E342E] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-black"
          >
            <Plus size={14} /> 新增房間
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#8E7F74]" /></div>
        ) : (
          <div className="flex flex-col gap-4">
            {rooms.map(room => (
              <div key={room.id} className={`overflow-hidden rounded-3xl border-2 transition-all ${room.tenant_name ? 'border-transparent bg-white shadow-sm' : 'border-[#EFEBE8] bg-[#F9F7F5]'}`}>
                <div className="p-5">
                  <div className="flex items-center justify-between border-b border-[#EFEBE8] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFEBE8] font-black text-[#8E7F74]">{room.room_number}</div>
                      <div>
                        <h3 className="text-lg font-bold">{room.tenant_name || '空房招租中'}</h3>
                        {room.tenant_name && <p className="text-xs font-bold text-orange-500">月租 NT$ {room.rent_amount || 0}</p>}
                      </div>
                    </div>
                    {room.tenant_name && (
                      <button onClick={() => openModal(room)} className="text-xs font-bold text-gray-400 hover:text-[#8E7F74] flex items-center gap-1"><Edit size={12}/> 編輯</button>
                    )}
                  </div>
                  {!room.tenant_name ? (
                    <button onClick={() => openModal(room)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-[#D1C4BC] py-2.5 text-sm font-bold text-[#8E7F74]"><UserPlus size={16} /> 新增租客</button>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-500">
                      <div className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-500"/> 押金: {room.deposit || 0}</div>
                      <div className="flex items-center gap-1"><BadgeDollarSign size={14} className="text-blue-500"/> 管理費: {room.management_fee || 0}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">合約資訊 ({editingRoom?.room_number} 房)</h3>
              <button onClick={closeModal} className="rounded-full bg-gray-100 p-2"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#8E7F74]">租客姓名</label>
                <input type="text" value={formData.tenant_name} onChange={(e) => setFormData({...formData, tenant_name: e.target.value})} className="w-full rounded-xl border border-[#EFEBE8] bg-[#F9F7F5] p-3 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#8E7F74]">每月租金</label>
                  <input type="number" value={formData.rent_amount} onChange={(e) => setFormData({...formData, rent_amount: e.target.value})} className="w-full rounded-xl border border-[#EFEBE8] bg-[#F9F7F5] p-3 font-bold" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#8E7F74]">每月管理費</label>
                  <input type="number" value={formData.management_fee} onChange={(e) => setFormData({...formData, management_fee: e.target.value})} className="w-full rounded-xl border border-[#EFEBE8] bg-[#F9F7F5] p-3 font-bold" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#8E7F74]">合約押金</label>
                <input type="number" value={formData.deposit} onChange={(e) => setFormData({...formData, deposit: e.target.value})} className="w-full rounded-xl border border-[#EFEBE8] bg-[#F9F7F5] p-3 font-bold" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#8E7F74]">聯絡電話</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full rounded-xl border border-[#EFEBE8] bg-[#F9F7F5] p-3 font-bold" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#8E7F74]">合約到期日</label>
                <input type="date" value={formData.contract_end} onChange={(e) => setFormData({...formData, contract_end: e.target.value})} className="w-full rounded-xl border border-[#EFEBE8] bg-[#F9F7F5] p-3 font-bold" />
              </div>
            </div>
            <button onClick={handleSave} disabled={isSaving} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3E342E] py-4 font-bold text-white disabled:bg-gray-300">
              {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} 儲存合約資訊
            </button>
          </div>
        </div>
      )}

      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#3E342E]">建立新房間</h3>
              <button onClick={() => setIsAddRoomModalOpen(false)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#8E7F74]">房號 <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="w-full rounded-xl border border-[#EFEBE8] bg-[#F9F7F5] p-4 text-xl font-bold text-[#3E342E] outline-none"
                  placeholder="例如：103"
                />
              </div>
            </div>
            <button 
              onClick={handleAddRoom}
              disabled={isAddingRoom || !newRoomNumber}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3E342E] py-4 font-bold text-white disabled:bg-gray-300"
            >
              {isAddingRoom ? <Loader2 size={20} className="animate-spin" /> : <Home size={20} />}
              {isAddingRoom ? '建立中...' : '確認建立'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}