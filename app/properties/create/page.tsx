"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase'; // 三層路徑
import { ArrowLeft, Save, Building2, ArrowRightLeft, Loader2 } from 'lucide-react';

export default function CreatePropertyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [businessModel, setBusinessModel] = useState<'OWN' | 'SUBLEASE'>('OWN');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('請輸入房產名稱');
    setSaving(true);
    try {
      const { error } = await supabase.from('properties').insert([{
        name, business_model: businessModel,
        purchase_price: 0, setup_cost: 0, master_lease_rent: 0, monthly_expenses: 0,
        market_value: 0, loan_balance: 0, monthly_loan_interest: 0, prepaid_deposits: 0, unpaid_bills: 0
      }]);
      if (error) throw error;
      alert('房源建立成功！🎉');
      router.push('/properties');
    } catch (err) {
      alert('建立失敗，請檢查資料庫');
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      <div className="px-6 py-4 flex items-center justify-between"><button onClick={() => router.back()} className="p-2"><ArrowLeft className="w-6 h-6" /></button><h1 className="text-lg font-black text-[#8E7F74]">新增房源</h1><div className="w-10"></div></div>
      <form onSubmit={handleSave} className="px-6 py-4 space-y-6">
        <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#8E7F74] uppercase px-1">房產名稱 *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 bg-[#F9F7F5] rounded-xl px-4 text-sm font-bold outline-none border border-transparent focus:border-[#3E342E]" placeholder="例如：太平區樹德八街" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#8E7F74] uppercase px-1">營運模式</label>
            <div className="flex bg-[#F9F7F5] p-1 rounded-2xl">
              <button type="button" onClick={() => setBusinessModel('OWN')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${businessModel === 'OWN' ? 'bg-[#3E342E] text-white shadow-md' : 'text-[#8E7F74]'}`}><Building2 className="w-4 h-4 inline mr-1"/>購置出租</button>
              <button type="button" onClick={() => setBusinessModel('SUBLEASE')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${businessModel === 'SUBLEASE' ? 'bg-[#3E342E] text-white shadow-md' : 'text-[#8E7F74]'}`}><ArrowRightLeft className="w-4 h-4 inline mr-1"/>包租代管</button>
            </div>
          </div>
        </div>
        <button disabled={saving} className="w-full h-16 bg-[#3E342E] text-white rounded-[32px] font-black text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50">
          {saving ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />} 確認建立
        </button>
      </form>
    </div>
  );
}