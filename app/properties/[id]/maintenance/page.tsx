"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, Plus, Wrench, Clock, User, Phone, DollarSign, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface MaintenanceRecord {
  id: string;
  room_number: string;
  title: string;
  record_type: 'repair' | 'routine';
  status: 'pending' | 'completed';
  cost: number;
  technician_name: string;
  technician_phone: string;
  maintenance_date: string;
  cycle_months: number;
}

export default function MaintenancePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'repair' | 'routine'>('repair');
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({
    record_type: 'repair',
    status: 'pending',
    cost: 0,
    cycle_months: 0
  });

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('property_id', params.id)
      .order('maintenance_date', { ascending: true });
    
    if (data) setRecords(data as MaintenanceRecord[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, [params.id]);

  const handleCreate = async () => {
    if (!formData.title) return alert('請填寫報修項目或設備名稱！');
    
    let nextDate = formData.maintenance_date;
    if (formData.record_type === 'routine' && !nextDate) {
      const d = new Date();
      d.setMonth(d.getMonth() + (formData.cycle_months || 0));
      nextDate = d.toISOString().split('T')[0];
    }

    const { error } = await supabase.from('maintenance_records').insert([{
      property_id: params.id,
      ...formData,
      maintenance_date: nextDate || new Date().toISOString().split('T')[0]
    }]);

    if (error) return alert('建立失敗，請確認資料庫已更新');
    
    alert('記錄建立成功！');
    setIsAdding(false);
    setFormData({ record_type: activeTab, status: 'pending', cost: 0, cycle_months: 0 });
    fetchRecords();
  };

  const toggleStatus = async (record: MaintenanceRecord) => {
    const newStatus = record.status === 'completed' ? 'pending' : 'completed';
    let updateData: any = { status: newStatus };
    
    if (record.record_type === 'routine' && newStatus === 'completed') {
       const confirmReset = window.confirm('保養已完成！是否自動將下次保養日延後一個週期？');
       if (confirmReset) {
         const d = new Date();
         d.setMonth(d.getMonth() + record.cycle_months);
         updateData.maintenance_date = d.toISOString().split('T')[0];
         updateData.status = 'pending';
         alert(`已將下次保養日更新至 ${updateData.maintenance_date}`);
       }
    }

    await supabase.from('maintenance_records').update(updateData).eq('id', record.id);
    fetchRecords();
  };

  const repairs = records.filter(r => r.record_type === 'repair');
  const routines = records.filter(r => r.record_type === 'routine');
  const isOverdue = (dateStr: string) => new Date(dateStr) < new Date();

  if (loading) return <div className="p-20 text-center font-bold text-[#8E7F74]">資料載入中...</div>;

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#F9F7F5]/90 backdrop-blur z-20">
        <button onClick={() => router.back()} className="p-2 active:scale-90 transition-all"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-black text-[#8E7F74]">修繕與保養</h1>
        <button onClick={() => { setIsAdding(!isAdding); setFormData({ ...formData, record_type: activeTab }); }} className="bg-[#3E342E] text-white p-2 rounded-full shadow-md active:scale-90 transition-all">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="px-6 space-y-6 pb-10">
        <div className="flex bg-[#EFEBE8] p-1 rounded-2xl">
          <button onClick={() => { setActiveTab('repair'); setIsAdding(false); }} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'repair' ? 'bg-[#3E342E] text-white shadow-md' : 'text-[#8E7F74]'}`}>
            <Wrench className="w-4 h-4" /> 租客報修
          </button>
          <button onClick={() => { setActiveTab('routine'); setIsAdding(false); }} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'routine' ? 'bg-[#3E342E] text-white shadow-md' : 'text-[#8E7F74]'}`}>
            <Clock className="w-4 h-4" /> 定期保養
          </button>
        </div>

        {isAdding && (
          <div className="bg-white rounded-[32px] p-8 shadow-md border-2 border-[#3E342E] animate-in fade-in slide-in-from-top-4 space-y-4">
            <h2 className="font-black text-lg text-[#3E342E] border-b border-[#F9F7F5] pb-2">
              {activeTab === 'repair' ? '新增報修紀錄' : '建立定期保養任務'}
            </h2>
            
            <InputText label={activeTab === 'repair' ? '房號 (公設留空)' : '設備位置/房號'} value={formData.room_number || ''} onChange={(v: string) => setFormData({...formData, room_number: v})} />
            <InputText label={activeTab === 'repair' ? '損壞狀況/項目 *' : '保養項目名稱 (如:第一道濾芯) *'} value={formData.title || ''} onChange={(v: string) => setFormData({...formData, title: v})} />
            
            {activeTab === 'routine' ? (
              <div className="grid grid-cols-2 gap-4">
                <InputRow label="保養週期 (個月)" value={formData.cycle_months || 0} onChange={(v: number) => setFormData({...formData, cycle_months: v})} />
                <InputDate label="下次到期日" value={formData.maintenance_date || ''} onChange={(v: string) => setFormData({...formData, maintenance_date: v})} />
              </div>
            ) : (
              <InputDate label="報修/處理日期" value={formData.maintenance_date || ''} onChange={(v: string) => setFormData({...formData, maintenance_date: v})} />
            )}

            <div className="grid grid-cols-2 gap-4">
              <InputText label="負責師傅/廠商" value={formData.technician_name || ''} onChange={(v: string) => setFormData({...formData, technician_name: v})} />
              <InputText label="師傅電話" value={formData.technician_phone || ''} onChange={(v: string) => setFormData({...formData, technician_phone: v})} />
            </div>
            
            <InputRow label="預估/實際花費" value={formData.cost || 0} onChange={(v: number) => setFormData({...formData, cost: v})} />

            <button onClick={handleCreate} className="w-full h-14 bg-[#3E342E] text-white rounded-2xl font-black mt-2 active:scale-95 transition-all">儲存紀錄</button>
          </div>
        )}

        <div className="space-y-4">
          {(activeTab === 'repair' ? repairs : routines).length === 0 && !isAdding && (
             <div className="text-center py-20 text-[#8E7F74] font-bold">目前沒有紀錄，點擊右上角「+」開始新增。</div>
          )}

          {(activeTab === 'repair' ? repairs : routines).map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col gap-4 border border-transparent hover:border-[#EFEBE8] transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-[#EFEBE8] text-[#3E342E] px-2 py-1 rounded-lg text-[10px] font-black">{record.room_number || '公設'}</span>
                    <h3 className="font-black text-lg">{record.title}</h3>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${record.record_type === 'routine' && record.status === 'pending' && isOverdue(record.maintenance_date) ? 'text-red-500' : 'text-[#8E7F74]'}`}>
                    <Calendar className="w-3 h-3" /> 
                    {record.record_type === 'routine' ? `到期日: ${record.maintenance_date || '未設定'}` : `處理日: ${record.maintenance_date || '未設定'}`}
                    {record.record_type === 'routine' && record.cycle_months > 0 && <span className="ml-2 bg-[#F9F7F5] px-2 py-0.5 rounded-full text-[10px]">每 {record.cycle_months} 個月</span>}
                  </div>
                </div>
                <button onClick={() => toggleStatus(record)} className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${record.status === 'completed' ? 'border-green-500 bg-green-50 text-green-600' : 'border-[#EFEBE8] bg-[#F9F7F5] text-[#8E7F74]'}`}>
                  {record.status === 'completed' ? <CheckCircle2 className="w-6 h-6 mb-1" /> : <AlertCircle className="w-6 h-6 mb-1" />}
                  <span className="text-[9px] font-black uppercase">{record.status === 'completed' ? '已完成' : '待處理'}</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-[#F9F7F5]">
                {record.technician_name && (
                  <div className="flex items-center gap-1.5 bg-[#F9F7F5] text-[#8E7F74] px-3 py-2 rounded-xl text-[10px] font-bold"><User className="w-3 h-3" /> {record.technician_name}</div>
                )}
                {record.technician_phone && (
                  <div className="flex items-center gap-1.5 bg-[#F9F7F5] text-[#8E7F74] px-3 py-2 rounded-xl text-[10px] font-bold"><Phone className="w-3 h-3" /> {record.technician_phone}</div>
                )}
                <div className="flex-1 flex justify-end items-center gap-1 text-[#3E342E] font-black text-sm">
                  <DollarSign className="w-4 h-4 text-[#B5A59B]" /> {record.cost.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 輔助 UI 組件 (已修復 TypeScript 的 any 報錯)
function InputRow({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) { 
  return <div className="space-y-1"><label className="text-[10px] font-black text-[#8E7F74]">{label}</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D1C7C0]">NT$</span><input type="number" value={value || ''} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-11 bg-[#F9F7F5] rounded-xl pl-10 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3E342E]" /></div></div>; 
}
function InputText({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) { 
  return <div className="space-y-1"><label className="text-[10px] font-black text-[#8E7F74]">{label}</label><input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-11 bg-[#F9F7F5] rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3E342E]" /></div>; 
}
function InputDate({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) { 
  return <div className="space-y-1"><label className="text-[10px] font-black text-[#8E7F74]">{label}</label><input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full h-11 bg-[#F9F7F5] rounded-xl px-4 text-sm font-bold outline-none text-[#3E342E] focus:ring-2 focus:ring-[#3E342E]" /></div>; 
}