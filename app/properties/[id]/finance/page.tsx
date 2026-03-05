"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, CheckCircle2, DollarSign, TrendingUp, Wallet, Wrench, PiggyBank, Receipt, PieChart } from 'lucide-react';

type PaymentStatus = 'paid' | 'unpaid';

interface FinanceRoom { id: string; room_number: string; tenant_name: string; rent_amount: number; management_fee: number; space_usage_fee: number; electricity: number; status: PaymentStatus; }

export default function FinanceReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'collection' | 'roi'>('collection');
  
  // 資料狀態
  const [property, setProperty] = useState<any>(null);
  const [rooms, setRooms] = useState<FinanceRoom[]>([]);
  const [maintenanceTotal, setMaintenanceTotal] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // 1. 抓取房產基本設定 (包含成本、房貸、大租金)
        const { data: propData } = await supabase.from('properties').select('*').eq('id', params.id).single();
        if (propData) setProperty(propData);

        // 2. 抓取房間收入
        const { data: roomData } = await supabase.from('rooms').select('*').eq('property_id', params.id).order('room_number', { ascending: true });
        if (roomData) {
          setRooms(roomData.map((r: any) => ({
            id: r.id.toString(), room_number: r.room_number, tenant_name: r.tenant_name || '待出租',
            rent_amount: Number(r.rent_amount || 0), management_fee: Number(r.management_fee || 0), space_usage_fee: Number(r.space_usage_fee || 0),
            electricity: 0, status: 'unpaid' as PaymentStatus
          })));
        }

        // 3. 抓取修繕與保養總花費 (只算已完成的)
        const { data: maintData } = await supabase.from('maintenance_records').select('cost').eq('property_id', params.id).eq('status', 'completed');
        if (maintData) {
          const totalCost = maintData.reduce((sum, record) => sum + Number(record.cost || 0), 0);
          setMaintenanceTotal(totalCost);
        }
      } catch (err) { console.error('抓取資料失敗', err); }
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  // --- 計算財務指標 ---
  // 1. 每月總應收 (租金+管理費+空間費)
  const monthlyRevenue = useMemo(() => rooms.reduce((sum, r) => sum + r.rent_amount + r.management_fee + r.space_usage_fee + r.electricity, 0), [rooms]);
  
  // 2. 每月固定支出 (自有: 房貸利息 + 雜支 | 包租: 大租金 + 雜支)
  const monthlyFixedCost = useMemo(() => {
    if (!property) return 0;
    const baseCost = property.business_model === 'OWN' ? Number(property.monthly_loan_interest || 0) : Number(property.master_lease_rent || 0);
    return baseCost + Number(property.monthly_expenses || 0);
  }, [property]);

  // 3. 每月淨現金流
  const netCashFlow = monthlyRevenue - monthlyFixedCost;

  // 4. 計算投資報酬率 ROI (年化現金流 / 總投入資金)
  const roi = useMemo(() => {
    if (!property) return 0;
    const sunkCost = property.business_model === 'OWN' ? Number(property.purchase_price || 0) : Number(property.setup_cost || 0);
    if (sunkCost === 0) return 0;
    return ((netCashFlow * 12) / sunkCost) * 100;
  }, [property, netCashFlow]);

  // 切換收款狀態
  const handleToggle = (id: string) => { setRooms(prev => prev.map(r => r.id === id ? { ...r, status: (r.status === 'paid' ? 'unpaid' : 'paid') as PaymentStatus } : r)); };

  if (loading) return <div className="p-20 text-center font-bold text-[#8E7F74]">結算財務報表中...</div>;

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      
      {/* 頂部導航 */}
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-[#F9F7F5]/90 backdrop-blur z-20">
        <button onClick={() => router.back()} className="p-2 active:scale-90 transition-all"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-black text-[#8E7F74]">財務總覽</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-6 space-y-6 pb-10">
        
        {/* 雙核心切換標籤 */}
        <div className="flex bg-[#EFEBE8] p-1 rounded-2xl">
          <button onClick={() => setActiveTab('collection')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'collection' ? 'bg-[#3E342E] text-white shadow-md' : 'text-[#8E7F74]'}`}>
            <Receipt className="w-4 h-4" /> 收租管理
          </button>
          <button onClick={() => setActiveTab('roi')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'roi' ? 'bg-[#3E342E] text-white shadow-md' : 'text-[#8E7F74]'}`}>
            <PieChart className="w-4 h-4" /> 投資績效
          </button>
        </div>

        {/* ================= Tab 1: 收租管理 (原本的功能) ================= */}
        {activeTab === 'collection' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-[#3E342E] p-7 rounded-[32px] shadow-lg text-white relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-2">Monthly Revenue / 本月總應收</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black opacity-80">NT$</span>
                  <span className="text-3xl font-black tracking-tight">{monthlyRevenue.toLocaleString()}</span>
                </div>
              </div>
              <DollarSign className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-5 rotate-12" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xs font-black text-[#8E7F74] px-1 uppercase tracking-widest">應收明細清單</h2>
              {rooms.map((room) => (
                <div key={room.id} className="bg-white p-5 rounded-[28px] shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${room.status === 'paid' ? 'bg-[#EAF3EB] text-[#2E7D32]' : 'bg-[#F9F7F5] text-[#8E7F74]'}`}>{room.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : room.room_number}</div>
                    <div>
                      <h3 className="font-black text-base">{room.room_number} 房</h3>
                      <p className="text-[11px] font-bold text-[#3E342E]">總收：${(room.rent_amount + room.management_fee + room.space_usage_fee + room.electricity).toLocaleString()}</p>
                    </div>
                  </div>
                  <div onClick={() => handleToggle(room.id)} className="flex flex-col items-end cursor-pointer group">
                    <span className={`text-[9px] font-black mb-1 tracking-widest uppercase ${room.status === 'paid' ? 'text-green-500' : 'text-[#D1C7C0]'}`}>{room.status === 'paid' ? '已收訖' : '待收款'}</span>
                    <div className={`w-10 h-5 rounded-full p-1 transition-all ${room.status === 'paid' ? 'bg-green-500' : 'bg-[#EFEBE8]'}`}><div className={`w-3 h-3 bg-white rounded-full transition-all ${room.status === 'paid' ? 'translate-x-5' : 'translate-x-0'}`} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= Tab 2: 投資績效 ROI (全新功能) ================= */}
        {activeTab === 'roi' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            
            {/* 核心指標：淨現金流 */}
            <div className={`p-8 rounded-[32px] shadow-lg text-white relative overflow-hidden ${netCashFlow >= 0 ? 'bg-[#2E7D32]' : 'bg-[#C62828]'}`}>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Monthly Net Cash Flow</p>
                  <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> ROI {roi.toFixed(1)}%
                  </div>
                </div>
                <h3 className="text-sm font-bold opacity-90 mb-1">每月預估淨現金流</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black opacity-80">NT$</span>
                  <span className="text-4xl font-black tracking-tight">{netCashFlow.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 收支結構分析 */}
            <h2 className="text-xs font-black text-[#8E7F74] px-1 mt-6 uppercase tracking-widest">損益結構分析 (月計)</h2>
            <div className="bg-white p-6 rounded-[32px] shadow-sm space-y-5">
              
              {/* 收入 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#EAF3EB] p-3 rounded-xl text-[#2E7D32]"><PiggyBank className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs font-black text-[#3E342E]">滿租總收入</p>
                    <p className="text-[10px] font-bold text-[#8E7F74]">租金 + 各項費用</p>
                  </div>
                </div>
                <span className="font-black text-[#2E7D32]">+ ${monthlyRevenue.toLocaleString()}</span>
              </div>

              <div className="h-[1px] bg-[#F9F7F5] w-full" />

              {/* 支出 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 p-3 rounded-xl text-red-500"><Wallet className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs font-black text-[#3E342E]">固定總支出</p>
                    <p className="text-[10px] font-bold text-[#8E7F74]">
                      {property?.business_model === 'OWN' ? '房貸利息 + 雜支' : '大租金 + 雜支'}
                    </p>
                  </div>
                </div>
                <span className="font-black text-red-500">- ${monthlyFixedCost.toLocaleString()}</span>
              </div>
            </div>

            {/* 一次性成本與累積花費 */}
            <h2 className="text-xs font-black text-[#8E7F74] px-1 mt-6 uppercase tracking-widest">資本與修繕花費 (總計)</h2>
            <div className="grid grid-cols-2 gap-4">
              
              {/* 投入資本 */}
              <div className="bg-white p-6 rounded-[28px] shadow-sm flex flex-col justify-center">
                <p className="text-[10px] font-bold text-[#8E7F74] mb-1">
                  {property?.business_model === 'OWN' ? '購置總成本' : '初期裝修投入'}
                </p>
                <p className="font-black text-lg text-[#3E342E]">
                  ${(property?.business_model === 'OWN' ? Number(property?.purchase_price || 0) : Number(property?.setup_cost || 0)).toLocaleString()}
                </p>
              </div>

              {/* 修繕總額 */}
              <div className="bg-white p-6 rounded-[28px] shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-1 mb-1">
                  <Wrench className="w-3 h-3 text-[#8E7F74]" />
                  <p className="text-[10px] font-bold text-[#8E7F74]">累積修繕保養</p>
                </div>
                <p className="font-black text-lg text-orange-500">
                  ${maintenanceTotal.toLocaleString()}
                </p>
              </div>

            </div>
            
            <p className="text-[10px] text-[#8E7F74] font-bold text-center mt-4 bg-[#EFEBE8] p-3 rounded-xl">
              💡 提示：ROI 計算公式為 (每月淨現金流 × 12) ÷ 總投入資本。累積修繕費用不計入每月現金流中。
            </p>

          </div>
        )}

      </div>
    </div>
  );
}