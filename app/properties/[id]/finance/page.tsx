"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, DollarSign, Receipt, CreditCard, Loader2, CheckCircle2, AlertCircle, BadgeDollarSign, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

export default function FinancePage() {
  const params = useParams();
  const propertyId = params.id as string;
  
  const [billingList, setBillingList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, [propertyId]);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      // 1. 抓取所有房間 (包含我們新加的 deposit 和 management_fee)
      const { data: rooms, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId)
        .order('room_number', { ascending: true });

      if (roomError) throw roomError;

      // 2. 幫每個房間抓取最新的電費紀錄，並計算總額
      const listWithBills = await Promise.all((rooms || []).map(async (room) => {
        const { data: meter } = await supabase
          .from('meter_readings')
          .select('total_cost, created_at')
          .eq('room_id', room.id)
          .eq('utility_type', '電錶')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const electricBill = meter?.total_cost || 0;
        const rent = room.rent_amount || 0;
        const managerFee = room.management_fee || 0;

        return {
          ...room,
          latest_electric_bill: electricBill,
          // 🌟 核心公式更新：租金 + 電費 + 管理費
          total_due: rent + electricBill + managerFee
        };
      }));

      setBillingList(listWithBills);
    } catch (error: any) {
      console.error('抓取財務資料失敗:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 計算全棟總預計營收
  const totalRevenue = billingList.reduce((sum, item) => sum + item.total_due, 0);

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-24 text-[#3E342E]">
      <div className="flex items-center justify-between bg-white p-5 shadow-sm">
        <Link href={`/properties/${propertyId}`} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={24} color="#3E342E" />
        </Link>
        <h1 className="text-lg font-bold text-[#8E7F74]">財務報表</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6">
        {/* 本月預計營收卡片 */}
        <div className="mb-8 rounded-3xl bg-[#3E342E] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold text-white/60">本月預計總應收 (租金+電費+管理費)</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-sm font-bold">NT$</span>
              <span className="text-4xl font-black">{totalRevenue.toLocaleString()}</span>
            </div>
          </div>
          {/* 背景裝飾 */}
          <DollarSign size={80} className="absolute -right-4 -bottom-4 text-white/5 rotate-12" />
        </div>

        <h2 className="mb-4 text-sm font-bold text-[#8E7F74]">各房應收明細</h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#8E7F74]">
            <Loader2 size={32} className="mb-4 animate-spin" />
            <p className="text-sm font-bold">正在彙整財務數據...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {billingList.map(item => (
              <div key={item.id} className="rounded-3xl bg-white p-5 shadow-sm border border-[#EFEBE8]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F9F7F5] font-black text-[#8E7F74]">
                      {item.room_number}
                    </div>
                    <div>
                      <h3 className="font-bold">{item.tenant_name || '待出租'}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.deposit > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold">
                            押金已收: {item.deposit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Due</p>
                    <p className="text-xl font-black text-[#3E342E]">NT$ {item.total_due.toLocaleString()}</p>
                  </div>
                </div>

                {/* 費用拆解網格 */}
                <div className="grid grid-cols-3 gap-2 border-t border-dashed border-[#EFEBE8] pt-4">
                  <div className="rounded-2xl bg-gray-50 p-2 text-center">
                    <p className="text-[9px] font-bold text-gray-400 mb-1">月租金</p>
                    <p className="text-sm font-bold text-[#8E7F74]">{item.rent_amount || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 p-2 text-center">
                    <p className="text-[9px] font-bold text-blue-400 mb-1">代收電費</p>
                    <p className="text-sm font-bold text-blue-600">{item.latest_electric_bill}</p>
                  </div>
                  <div className="rounded-2xl bg-orange-50/50 p-2 text-center">
                    <p className="text-[9px] font-bold text-orange-400 mb-1">管理費</p>
                    <p className="text-sm font-bold text-orange-600">{item.management_fee || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}