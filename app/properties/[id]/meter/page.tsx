"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Zap, Loader2, AlertCircle, DollarSign, RefreshCcw, Calculator, Home } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

const isValidUUID = (id: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

export default function MeterPage() {
  const params = useParams();
  const propertyId = params.id as string; 
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvalidId, setIsInvalidId] = useState(false); 
  
  const [previousReadings, setPreviousReadings] = useState<Record<string, number>>({});
  const [currentInputs, setCurrentInputs] = useState<Record<string, string>>({});
  const [rateInputs, setRateInputs] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [isResetMode, setIsResetMode] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isValidUUID(propertyId)) {
      setIsInvalidId(true);
      setIsLoading(false);
      return;
    }
    fetchRoomsAndReadings();
  }, [propertyId]);

  const fetchRoomsAndReadings = async () => {
    setIsLoading(true);
    try {
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId)
        .order('room_number', { ascending: true });

      if (roomsError) throw roomsError;
      setRooms(roomsData || []);

      const prevReadingsMap: Record<string, number> = {};
      const initialRates: Record<string, string> = {};
      const modeMap: Record<string, boolean> = {};

      for (const room of roomsData || []) {
        initialRates[room.id] = "5"; 

        const { data: latestMeter } = await supabase
          .from('meter_readings')
          .select('current_reading, rate')
          .eq('room_id', room.id)
          .eq('utility_type', '電錶')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestMeter) {
          prevReadingsMap[room.id] = latestMeter.current_reading;
          modeMap[room.id] = false; 
          if (latestMeter.rate) initialRates[room.id] = latestMeter.rate.toString();
        } else {
          prevReadingsMap[room.id] = room.initial_electric_reading || 0;
          modeMap[room.id] = true; 
        }
      }
      setPreviousReadings(prevReadingsMap);
      setRateInputs(initialRates);
      setIsResetMode(modeMap);
    } catch (error: any) {
      console.error('資料讀取失敗:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (roomId: string) => {
    const inputReading = currentInputs[roomId];
    const inputRate = rateInputs[roomId];
    const isReset = isResetMode[roomId];
    
    if (!inputReading || (!isReset && !inputRate)) {
      alert('⚠️ 請填寫完整的度數與費率資訊');
      return;
    }
    
    const currentReadingNum = parseFloat(inputReading);
    const rateNum = parseFloat(inputRate);
    const prevReadingNum = previousReadings[roomId] || 0;

    if (!isReset && currentReadingNum < prevReadingNum) {
      alert('⚠️ 當前讀數不能低於上次的讀數喔！');
      return;
    }

    setSavingStatus(prev => ({ ...prev, [roomId]: true }));

    try {
      let usageVal = 0;
      let costTotal = 0;

      if (!isReset) {
        usageVal = currentReadingNum - prevReadingNum;
        costTotal = usageVal * rateNum;
      }

      const { error: meterError } = await supabase
        .from('meter_readings')
        .insert([{
          property_id: propertyId, 
          room_id: roomId,         
          utility_type: '電錶',
          previous_reading: isReset ? currentReadingNum : prevReadingNum, // ✅ 已恢復為正確的 previous_reading
          current_reading: currentReadingNum,
          usage: usageVal,
          total_cost: costTotal,
          rate: isReset ? 0 : rateNum 
        }]);

      if (meterError) throw meterError;

      if (isReset) {
        await supabase
          .from('rooms')
          .update({ initial_electric_reading: currentReadingNum })
          .eq('id', roomId);
      }
      
      alert(isReset ? '✅ 起始度數設定成功！' : `✅ 抄表成功！本期產生電費：NT$ ${costTotal}`);
      setCurrentInputs(prev => ({ ...prev, [roomId]: '' }));
      fetchRoomsAndReadings();
    } catch (error: any) {
      alert('❌ 儲存失敗：' + error.message);
    } finally {
      setSavingStatus(prev => ({ ...prev, [roomId]: false }));
    }
  };

  if (isInvalidId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9F7F5] p-6 text-center text-[#3E342E]">
        <div className="mb-6 rounded-full bg-[#EFEBE8] p-6 text-[#8E7F74]">
          <AlertCircle size={48} />
        </div>
        <h1 className="mb-2 text-2xl font-bold">找不到該物件</h1>
        <p className="mb-8 text-[#8E7F74]">你可能輸入了錯誤的網址，請回到房產清單重新進入。</p>
        <Link href="/properties" className="flex items-center gap-2 rounded-2xl bg-[#3E342E] px-8 py-4 font-bold text-white hover:bg-black">
          <Home size={20} /> 回到房產清單
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-24 text-[#3E342E]">
      <div className="flex items-center justify-between bg-white p-5 shadow-sm border-b border-[#EFEBE8]">
        <Link href={`/properties/${propertyId}`} className="rounded-full p-2 hover:bg-[#F9F7F5] transition-colors">
          <ArrowLeft size={24} color="#3E342E" />
        </Link>
        <h1 className="text-lg font-black tracking-widest text-[#3E342E]">電錶管理</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#8E7F74]" size={32} /></div>
        ) : rooms.length === 0 ? (
          <div className="py-20 text-center text-[#8E7F74] font-bold">尚未建立任何房間</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map(room => (
              <div key={room.id} className="rounded-[32px] bg-white p-6 shadow-sm border border-[#EFEBE8] hover:shadow-md transition-all">
                {/* 頂部資訊區 */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${isResetMode[room.id] ? 'bg-[#3E342E] text-white' : 'bg-[#F9F7F5] text-[#8E7F74]'}`}>
                      {isResetMode[room.id] ? <RefreshCcw size={20} /> : <Zap size={20} />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black">{room.room_number} <span className="text-sm font-normal text-[#8E7F74]">室</span></h3>
                      <p className="text-[10px] font-bold text-[#8E7F74] uppercase tracking-widest">{room.tenant_name || '待出租'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#8E7F74] tracking-widest">上次結算讀數</p>
                    <p className="text-2xl font-black text-[#3E342E]">{previousReadings[room.id]}</p>
                  </div>
                </div>

                {/* 切換按鈕 (MUJU 質感設計) */}
                <div className="mb-6 flex gap-2 rounded-2xl bg-[#F9F7F5] p-1 border border-[#EFEBE8]">
                  <button 
                    onClick={() => setIsResetMode(prev => ({ ...prev, [room.id]: true }))}
                    className={`flex-1 rounded-xl py-3 text-xs font-bold transition-all ${isResetMode[room.id] ? 'bg-[#3E342E] text-white shadow-md' : 'text-[#8E7F74] hover:bg-[#EFEBE8]'}`}
                  >
                    設定起始度數
                  </button>
                  <button 
                    onClick={() => setIsResetMode(prev => ({ ...prev, [room.id]: false }))}
                    className={`flex-1 rounded-xl py-3 text-xs font-bold transition-all ${!isResetMode[room.id] ? 'bg-[#3E342E] text-white shadow-md' : 'text-[#8E7F74] hover:bg-[#EFEBE8]'}`}
                  >
                    一般計費抄表
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* 費率欄位 */}
                    <div className={`transition-opacity ${isResetMode[room.id] ? 'opacity-30' : 'opacity-100'}`}>
                      <label className="mb-2 block text-[10px] font-black tracking-widest text-[#8E7F74]">每度單價 (元)</label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E7F74]" />
                        <input
                          type="number"
                          disabled={isResetMode[room.id]}
                          value={rateInputs[room.id] || ''}
                          onChange={(e) => setRateInputs(prev => ({ ...prev, [room.id]: e.target.value }))}
                          className="w-full h-12 rounded-xl border border-[#EFEBE8] bg-[#F9F7F5] pl-10 pr-4 font-black text-[#3E342E] outline-none focus:border-[#3E342E] transition-colors"
                        />
                      </div>
                    </div>
                    
                    {/* 度數欄位 */}
                    <div>
                      <label className="mb-2 block text-[10px] font-black tracking-widest text-[#8E7F74]">
                        {isResetMode[room.id] ? '填寫起始度數' : '填寫當前讀數'}
                      </label>
                      <input
                        type="number"
                        value={currentInputs[room.id] || ''}
                        onChange={(e) => setCurrentInputs(prev => ({ ...prev, [room.id]: e.target.value }))}
                        className={`w-full h-12 rounded-xl border px-4 font-black text-[#3E342E] outline-none transition-colors ${
                          isResetMode[room.id] ? 'border-[#D1C7C0] bg-white focus:border-[#3E342E]' : 'border-[#EFEBE8] bg-[#F9F7F5] focus:border-[#3E342E]'
                        }`}
                        placeholder="00000"
                      />
                    </div>
                  </div>

                  {/* 模式說明小提示 */}
                  {isResetMode[room.id] ? (
                    <div className="flex items-center gap-2 rounded-xl bg-[#F9F7F5] border border-[#EFEBE8] p-3 text-[11px] font-bold text-[#8E7F74]">
                      <AlertCircle size={16} className="text-[#3E342E]" /> 
                      <span><strong className="text-[#3E342E]">起始模式：</strong>本次僅設定基準點，不產生帳單。</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-[#EAF3EB] border border-[#C8E6C9] p-3 text-[11px] font-bold text-[#2E7D32]">
                      <Calculator size={16} /> 
                      <span><strong className="text-[#1B5E20]">計費模式：</strong>自動計算本期用量並產出帳單。</span>
                    </div>
                  )}

                  {/* 儲存按鈕 */}
                  <button
                    onClick={() => handleSave(room.id)}
                    disabled={!currentInputs[room.id] || savingStatus[room.id]}
                    className="w-full flex h-14 items-center justify-center rounded-2xl bg-[#3E342E] font-black text-white shadow-lg transition-all hover:scale-[0.98] active:scale-95 disabled:bg-[#EFEBE8] disabled:text-[#B5A59B] disabled:shadow-none disabled:transform-none mt-2"
                  >
                    {savingStatus[room.id] ? <Loader2 className="animate-spin" size={24} /> : (isResetMode[room.id] ? '確認設定' : '完成抄表')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}