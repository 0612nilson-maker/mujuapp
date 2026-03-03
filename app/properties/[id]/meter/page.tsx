"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

export default function MeterReadingPage() {
  const params = useParams();
  const propertyId = params.id as string;
  
  // 🌟 新增：房間清單與目前選中的房間 ID
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const [currentReading, setCurrentReading] = useState('');
  const [rate, setRate] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [previousReading, setPreviousReading] = useState(0);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(true);

  // 🌟 載入時，第一步先去抓這棟房產的「所有房間」
  useEffect(() => {
    fetchRooms();
  }, [propertyId]);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId)
        .order('room_number', { ascending: true }); // 照房號排序

      if (error) throw error;
      
      if (data && data.length > 0) {
        setRooms(data);
        setSelectedRoomId(data[0].id); // 預設選中第一間房
      }
    } catch (error) {
      console.error('抓取房間失敗:', error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // 🌟 當「選中的房間」改變時，自動去抓【這間房】的最新度數！
  useEffect(() => {
    if (selectedRoomId) {
      fetchPreviousReading();
    }
  }, [selectedRoomId]);

  const fetchPreviousReading = async () => {
    setIsLoadingPrevious(true);
    try {
      const { data, error } = await supabase
        .from('meter_readings')
        .select('reading_value')
        .eq('room_id', selectedRoomId) // 👈 關鍵：只抓這間房的度數
        .eq('utility_type', '電錶')
        .order('created_at', { ascending: false })
        .limit(1)
        .single(); 

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreviousReading(data.reading_value);
      } else {
        setPreviousReading(0); // 如果這間房還沒抄過表，預設為 0
      }
    } catch (error) {
      console.error('抓取上期度數失敗:', error);
    } finally {
      setIsLoadingPrevious(false);
    }
  };

  // 歸零計算邏輯
  let usage = 0;
  let isRollover = false; 

  if (currentReading !== '') {
    const currentVal = Number(currentReading);
    if (currentVal >= previousReading) {
      usage = currentVal - previousReading;
    } else {
      usage = (100000 - previousReading) + currentVal;
      isRollover = true;
    }
  }

  const estimatedCost = usage > 0 && rate ? Math.round(usage * Number(rate)) : 0;

  const handleSave = async () => {
    if (!currentReading || !rate || !selectedRoomId) return;
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('meter_readings')
        .insert([
          {
            property_id: propertyId, 
            room_id: selectedRoomId, // 🌟 關鍵：把這筆帳單綁定給這間房！
            utility_type: '電錶',
            reading_value: Number(currentReading),
            rate: Number(rate),
            total_cost: estimatedCost,
          }
        ]);

      if (error) throw error;

      alert(`✅ 抄表完成！\n\n💰 本期應繳電費為：NT$ ${estimatedCost}`);
      
      setCurrentReading(''); 
      fetchPreviousReading(); // 重新抓取這間房的最新度數
      
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
        <h1 className="text-lg font-bold text-[#8E7F74]">獨立電表抄寫</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
          <span className="font-bold text-gray-500">選擇房間</span>
          {/* 🌟 魔法下拉選單：從資料庫動態產生 */}
          <select 
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            disabled={isLoadingRooms || rooms.length === 0}
            className="rounded-lg bg-[#F9F7F5] px-4 py-2 font-bold text-[#3E342E] outline-none"
          >
            {isLoadingRooms ? (
              <option>載入中...</option>
            ) : rooms.length === 0 ? (
              <option>尚未建立房間</option>
            ) : (
              rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.room_number} 號房 ({room.tenant_name || '無租客'})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-[#EFEBE8] py-4 font-bold text-[#8E7F74] shadow-sm">
          <Zap size={20} />
          <span>目前正在紀錄：獨立分電表</span>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-md">
          <div className="mb-6 flex justify-between rounded-2xl bg-gray-50 p-4">
            <div className="text-center">
              <p className="text-xs text-gray-400">上期度數</p>
              <p className="mt-1 text-lg font-bold text-gray-400">
                {isLoadingPrevious ? <Loader2 size={16} className="inline animate-spin" /> : previousReading}
              </p>
            </div>
            <div className="flex items-center justify-center"><ArrowLeft size={20} className="rotate-180 text-gray-300" /></div>
            <div className="text-center">
              <p className="text-xs font-bold text-[#8E7F74]">本期用量</p>
              <p className={`mt-1 text-2xl font-bold ${usage > 0 ? 'text-[#3E342E]' : 'text-gray-300'}`}>
                {usage > 0 ? `+${usage}` : '0'}
              </p>
              {isRollover && (
                <p className="mt-1 text-[10px] font-bold text-orange-500">已自動計算電錶歸零</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold text-[#8E7F74]">當期電費費率 (元/度)</label>
            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="例如：5.5"
              className="w-full rounded-2xl border-2 border-[#EFEBE8] bg-[#F9F7F5] p-4 text-xl font-bold tracking-wider text-[#3E342E] outline-none transition-colors focus:border-[#B5A59B]"
            />
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

          {usage > 0 && rate && (
            <div className="mb-6 flex items-center justify-between rounded-2xl bg-[#F9F7F5] p-4 border border-[#EFEBE8]">
              <span className="text-sm font-bold text-[#8E7F74]">本期預估電費</span>
              <span className="text-xl font-black text-[#8E7F74]">NT$ {estimatedCost}</span>
            </div>
          )}

          <button 
            onClick={handleSave}
            disabled={!currentReading || !rate || !selectedRoomId || isSubmitting}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white transition-all ${
              currentReading && rate && selectedRoomId && !isSubmitting ? 'bg-[#3E342E] shadow-lg hover:bg-black' : 'bg-gray-300'
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