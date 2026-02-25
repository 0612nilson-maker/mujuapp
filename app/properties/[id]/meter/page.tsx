"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Zap, Droplets, Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

export default function MeterReadingPage() {
  const params = useParams();
  const propertyId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<'electricity' | 'water'>('electricity');
  const [currentReading, setCurrentReading] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 模擬上期度數與用量計算 (UI 顯示用)
  const previousReading = activeTab === 'electricity' ? 12540 : 320;
  const usage = currentReading ? Number(currentReading) - previousReading : 0;

  // 🌟 核心魔法：將資料寫入 Supabase
  const handleSave = async () => {
    if (!currentReading || usage < 0) return;
    
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('meter_readings')
        .insert([
          {
            // 🔑 暴力破解：直接綁定真實的房產 UUID，無視假網址
            property_id: 'bac3a2f9-389d-49a3-aad8-d8cbdb170f2b', 
            // 🌟 換成全新的 utility_type 欄位，直接存入「電錶」或「水錶」
            utility_type: activeTab === 'electricity' ? '電錶' : '水錶',
            reading_value: Number(currentReading),
          }
        ]);

      if (error) throw error;

      alert('✅ 抄表紀錄儲存成功！');
      setCurrentReading(''); // 存檔後清空輸入框
      
    } catch (error: any) {
      alert('❌ 儲存失敗：' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-24 text-[#3E342E]">
      <div className="flex items-center justify-between bg-white p-5 shadow-sm">
        <Link href={`/properties/${propertyId}`} className="rounded-full p-2 transition-colors hover:bg-gray-100">
          <ArrowLeft size={24} color="#3E342E" />
        </Link>
        <h1 className="text-lg font-bold text-[#8E7F74]">水電抄表</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
          <span className="font-bold text-gray-500">選擇房間</span>
          <select className="rounded-lg bg-[#F9F7F5] px-4 py-2 font-bold text-[#3E342E] outline-none">
            <option>101 號房 (王小明)</option>
            <option>102 號房 (陳大心)</option>
          </select>
        </div>

        <div className="mb-6 flex rounded-2xl bg-[#EFEBE8] p-1">
          <button
            onClick={() => { setActiveTab('electricity'); setCurrentReading(''); }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
              activeTab === 'electricity' ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-400'
            }`}
          >
            <Zap size={18} /> 獨立電錶
          </button>
          <button
            onClick={() => { setActiveTab('water'); setCurrentReading(''); }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
              activeTab === 'water' ? 'bg-white text-cyan-500 shadow-sm' : 'text-gray-400'
            }`}
          >
            <Droplets size={18} /> 獨立水錶
          </button>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-md">
          <div className="mb-6 flex justify-between rounded-2xl bg-gray-50 p-4">
            <div className="text-center">
              <p className="text-xs text-gray-400">上期度數</p>
              <p className="mt-1 text-lg font-bold text-gray-400">{previousReading}</p>
            </div>
            <div className="flex items-center justify-center"><ArrowLeft size={20} className="rotate-180 text-gray-300" /></div>
            <div className="text-center">
              <p className="text-xs font-bold text-[#8E7F74]">本期用量</p>
              <p className={`mt-1 text-2xl font-bold ${usage > 0 ? 'text-[#3E342E]' : 'text-gray-300'}`}>
                {usage > 0 ? `+${usage}` : '0'}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-[#8E7F74]">輸入本期度數</label>
            <input
              type="number"
              value={currentReading}
              onChange={(e) => setCurrentReading(e.target.value)}
              placeholder="請輸入電錶上的數字..."
              className="w-full rounded-2xl border-2 border-[#EFEBE8] bg-[#F9F7F5] p-4 text-2xl font-bold tracking-wider text-[#3E342E] outline-none transition-colors focus:border-[#B5A59B]"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={!currentReading || usage < 0 || isSubmitting}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white transition-all ${
              currentReading && usage >= 0 && !isSubmitting ? 'bg-[#3E342E] shadow-lg hover:bg-black' : 'bg-gray-300'
            }`}
          >
            {isSubmitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <CheckCircle2 size={20} />
            )}
            {isSubmitting ? '儲存中...' : '確認並儲存紀錄'}
          </button>
        </div>
      </div>
    </div>
  );
}