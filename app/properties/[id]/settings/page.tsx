"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase'; // 四層路徑
import { ArrowLeft, Save, Loader2, TrendingUp, Wallet, Landmark, FileText, Home } from 'lucide-react';

export default function PropertySettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [businessModel, setBusinessModel] = useState<'OWN' | 'SUBLEASE'>('OWN');
  const [finance, setFinance] = useState({ purchase_price: '0', market_value: '0', loan_balance: '0', monthly_loan_interest: '0', setup_cost: '0', master_lease_rent: '0', prepaid_deposits: '0', monthly_expenses: '0' });

  useEffect(() => {
    async function fetchProperty() {
      const { data } = await supabase.from('properties').select('*').eq('id', params.id).single();
      if (data) {
        setName(data.name || ''); setAddress(data.address || ''); setBusinessModel(data.business_model || 'OWN');
        setFinance({
          purchase_price: data.purchase_price?.toString() || '0', market_value: data.market_value?.toString() || '0',
          loan_balance: data.loan_balance?.toString() || '0', monthly_loan_interest: data.monthly_loan_interest?.toString() || '0',
          setup_cost: data.setup_cost?.toString() || '0', master_lease_rent: data.master_lease_rent?.toString() || '0',
          prepaid_deposits: data.prepaid_deposits?.toString() || '0', monthly_expenses: data.monthly_expenses?.toString() || '0'
        });
      }
      setLoading(false);
    }
    fetchProperty();
  }, [params.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('properties').update({
      name, address, business_model: businessModel,
      purchase_price: Number(finance.purchase_price), market_value: Number(finance.market_value),
      loan_balance: Number(finance.loan_balance), monthly_loan_interest: Number(finance.monthly_loan_interest),
      setup_cost: Number(finance.setup_cost), master_lease_rent: Number(finance.master_lease_rent),
      prepaid_deposits: Number(finance.prepaid_deposits), monthly_expenses: Number(finance.monthly_expenses)
    }).eq('id', params.id);
    setSaving(false);
    alert('設定已更新！');
    router.back();
  };

  if (loading) return <div className="p-20 text-center font-bold text-[#8E7F74]">載入中...</div>;

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#F9F7F5]/80 backdrop-blur z-10"><button onClick={() => router.back()} className="p-2"><ArrowLeft className="w-6 h-6" /></button><h1 className="text-lg font-black text-[#8E7F74]">資產設定</h1><div className="w-10"></div></div>
      <form onSubmit={handleUpdate} className="px-6 py-4 space-y-8">
        <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-4">
          <InputGroup label="專案名稱" value={name} onChange={setName} />
          <InputGroup label="詳細地址" value={address} onChange={setAddress} />
        </div>
        <div className="space-y-4">
          <div className="bg-[#3E342E] py-4 px-6 rounded-2xl flex items-center gap-3"><TrendingUp className="text-[#B5A59B] w-5 h-5" /><h2 className="text-white font-black">詳細財務資料</h2></div>
          <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-6">
            {businessModel === 'OWN' ? (
              <div className="grid grid-cols-1 gap-4"><FinanceInput label="購置總價" value={finance.purchase_price} onChange={(v: string) => setFinance({...finance, purchase_price: v})} /><FinanceInput label="貸款餘額" value={finance.loan_balance} onChange={(v: string) => setFinance({...finance, loan_balance: v})} /></div>
            ) : (
              <div className="grid grid-cols-1 gap-4"><FinanceInput label="裝修成本" value={finance.setup_cost} onChange={(v: string) => setFinance({...finance, setup_cost: v})} /><FinanceInput label="大租金支出" value={finance.master_lease_rent} onChange={(v: string) => setFinance({...finance, master_lease_rent: v})} /></div>
            )}
          </div>
        </div>
        <button disabled={saving} className="w-full h-16 bg-[#3E342E] text-white rounded-[32px] font-black text-lg flex items-center justify-center gap-2 shadow-lg">{saving ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />} 儲存變更</button>
      </form>
    </div>
  );
}

function InputGroup({ label, value, onChange }: any) { return <div className="space-y-1"><label className="text-[10px] font-black text-[#8E7F74]">{label}</label><input value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-12 bg-[#F9F7F5] rounded-xl px-4 text-sm font-bold outline-none" /></div>; }
function FinanceInput({ label, value, onChange }: any) { return <div className="space-y-1"><label className="text-[10px] font-black text-[#8E7F74]">{label}</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#D1C7C0]">NT$</span><input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-12 bg-[#F9F7F5] rounded-xl pl-12 pr-4 text-sm font-bold outline-none" /></div></div>; }