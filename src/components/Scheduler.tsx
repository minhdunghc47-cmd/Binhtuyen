/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Facility, Task } from '../types';
import { MapPin, CalendarDays, Send, AlertCircle, FileSpreadsheet, Group, RotateCcw, ShieldAlert } from 'lucide-react';
import { MANAGERS, generateId } from '../data';

interface SchedulerProps {
  facilities: Facility[];
  tasks: Task[];
  onAddTasks: (newTasks: Task[]) => void;
}

interface SelectedRow {
  facilityId: string;
  deadline: string;
  assignee: string;
}

export default function Scheduler({ facilities, tasks, onAddTasks }: SchedulerProps) {
  const [selectedInspectors, setSelectedInspectors] = useState<Record<string, string>>({});
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({});
  const [checkedFacilities, setCheckedFacilities] = useState<Record<string, boolean>>({});

  // Filter facilities that are overdue or sắp đến hạn (within 30 days) of their 1-year or 2-year cycle
  const today = new Date();
  
  const isFacilityInPendingTasks = (f: Facility) => {
    return tasks.some((t) => {
      if (t.isCompleted) return false;
      if (t.facilityId === f.id) return true;
      if (t.title && t.title.includes(f.name)) return true;
      return false;
    });
  };

  const dueFacilities = facilities.filter((f) => {
    // If archived, do not schedule
    if (f.recordStatus === 'da_nop_luu') return false;

    // If already scheduled, it is not due
    if (isFacilityInPendingTasks(f)) return false;

    // Only Nhóm 1 and Nhóm 2 have strict inspection cycles
    if (f.group !== 'Nhóm 1' && f.group !== 'Nhóm 2') return false;
    
    const inspectDateStr = f.lastInspectionDate;
    if (!inspectDateStr) return true; // Never inspected (overdue)
    
    const lastInspect = new Date(inspectDateStr);
    const diffTime = Math.abs(today.getTime() - lastInspect.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // We want to alert if they are overdue OR within 30 days of becoming overdue
    const limit = f.group === 'Nhóm 1' ? 365 : 730;
    return diffDays >= (limit - 30);
  });

  // Group due facilities by Hamlet/Village (Gợi ý gom tuyến đường)
  const groupedByVillage = dueFacilities.reduce((acc, f) => {
    const area = f.village || 'Chưa rõ địa bàn';
    if (!acc[area]) acc[area] = [];
    acc[area].push(f);
    return acc;
  }, {} as Record<string, Facility[]>);

  // Default a date for items (7 days from now)
  const defaultFutureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const handleToggleSelectRow = (facId: string) => {
    setCheckedFacilities(prev => ({
      ...prev,
      [facId]: !prev[facId]
    }));
  };

  const handleSelectAreaAll = (areaName: string, items: Facility[]) => {
    const allChecked = items.every(f => checkedFacilities[f.id]);
    const updated = { ...checkedFacilities };
    items.forEach(f => {
      updated[f.id] = !allChecked;
    });
    setCheckedFacilities(updated);
  };

  const handleRowAssigneeChange = (facId: string, val: string) => {
    setSelectedInspectors(prev => ({ ...prev, [facId]: val }));
  };

  const handleRowDateChange = (facId: string, val: string) => {
    setSelectedDates(prev => ({ ...prev, [facId]: val }));
  };

  const handleGenerateTasks = () => {
    const selectedIds = Object.keys(checkedFacilities).filter(id => checkedFacilities[id]);
    if (selectedIds.length === 0) {
      console.error('Vui lòng tích chọn cơ sở để giao việc lên Bảng Kanban!');
      return;
    }

    const createdTasks: Task[] = [];
    selectedIds.forEach(id => {
      const facility = facilities.find(f => f.id === id);
      if (facility) {
        const assignedDate = selectedDates[id] || defaultFutureDate;
        const assignee = selectedInspectors[id] || facility.manager || MANAGERS[0];

        createdTasks.push({
          id: generateId(),
          title: `Kiểm tra an toàn PCCC & CNCH định kỳ tại: ${facility.name} (Địa bàn: ${facility.village})`,
          assignee,
          deadline: assignedDate,
          isCompleted: false,
          facilityId: id,
          createdAt: Date.now()
        });
      }
    });

    onAddTasks(createdTasks);
    // Reset selection checkboxes
    setCheckedFacilities({});
    console.log(`Đã lập lịch kiểm tra và xuất ${createdTasks.length} chỉ lệnh giao việc lên Kanban!`);
  };

  const handleFakeExcelDownload = () => {
    // Generate simple printable view or plain CSV
    const selectedIds = Object.keys(checkedFacilities).filter(id => checkedFacilities[id]);
    const itemsToExport = selectedIds.length > 0 
      ? dueFacilities.filter(f => selectedIds.includes(f.id))
      : dueFacilities;

    const csvHeader = 'Tuyen Duong;Co So can Kiem Tra;Nhom;Ngay KT Gan Nhat;Cai Bien Gap\n';
    let content = '';
    itemsToExport.forEach(f => {
      content += `${f.village};${f.name};${f.group};${f.lastInspectionDate || 'Chưa rõ'};${f.manager}\n`;
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvHeader + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ke_Hoach_Tuyen_KT_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Visual Banner */}
      <div className="bg-orange-950/20 border border-orange-900/40 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 flex-shrink-0">
            <Group className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
              Lập Tuyến Tuần Tra & Lịch Kiểm Tra
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Trợ lý tự động sắp xếp cơ sở quá hạn theo từng cụm **Thôn/Xóm** giúp tối ưu lộ trình di chuyển.
            </p>
          </div>
        </div>

        <div className="flex gap-2 text-xs md:text-sm">
          <button
            onClick={handleFakeExcelDownload}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 rounded-lg font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Xuất Danh Sách KT</span>
          </button>
          
          <button
            onClick={handleGenerateTasks}
            className="px-4 py-2 bg-orange-600/95 hover:bg-orange-655 text-white rounded-lg font-bold flex items-center gap-1.5 shadow"
          >
            <Send className="h-4 w-4" />
            <span>Giao Việc Lên Kanban</span>
          </button>
        </div>
      </div>

      {/* Helper Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-3 text-xs text-slate-400">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <p className="leading-relaxed">
          Bảng dưới liệt kê các cơ sở đã đến hạn hoặc sắp đến hạn bảo trì kiểm tra (trong vòng 30 ngày). 
          Đồng chí hãy <b className="text-slate-200">tích chọn</b> vào hộp kiểm phía trước cơ sở, đặt ngày ấn định kiểm tra và cán bộ đi để tự điện tạo việc nhanh.
        </p>
      </div>

      {/* Main Groups */}
      {dueFacilities.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-16 text-center text-slate-500">
          <ShieldAlert className="h-10 w-10 text-emerald-500 mx-auto mb-3 animate-bounce" />
          <h4 className="text-slate-300 font-bold mb-1">Cơ Bản Tất Cả Các Cơ Sở Đã Được Kiểm Tra</h4>
          <p className="text-xs">Không có hồ sơ nào bị quá hạn chu kỳ.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByVillage).map(([areaName, items]) => {
            const allCheckedInArea = items.every((f) => checkedFacilities[f.id]);
            
            return (
              <div 
                key={areaName} 
                className="bg-slate-900/60 border border-slate-805 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Area Header */}
                <div className="bg-slate-950/40 px-5 py-3.5 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-red-400" />
                    Khu vực tuần tra: {areaName} ({items.length} cơ sở)
                  </h3>
                  <button
                    onClick={() => handleSelectAreaAll(areaName, items)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/45 px-2.5 py-1 rounded transition-colors border border-indigo-900/50"
                  >
                    {allCheckedInArea ? 'Bỏ chọn hết' : 'Tích chọn cả cụm'}
                  </button>
                </div>

                {/* Table details */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-xs md:text-sm">
                    <thead>
                      <tr className="bg-slate-950/20">
                        <th className="px-5 py-2.5 text-center w-12 text-slate-400">Chọn</th>
                        <th className="px-4 py-2.5 text-left text-slate-400">Tên cơ sở cần kiểm tra</th>
                        <th className="px-4 py-2.5 text-left text-slate-400">Phân nhãn / Loại hình</th>
                        <th className="px-4 py-2.5 text-left text-slate-400">Kiểm tra lần trước</th>
                        <th className="px-4 py-2.5 text-left text-slate-400">Định ngày kiểm</th>
                        <th className="px-4 py-2.5 text-left text-slate-400">Cử cán bộ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-transparent">
                      {items.map((f, idx) => {
                        const isChecked = !!checkedFacilities[f.id];
                        const dateVal = selectedDates[f.id] || defaultFutureDate;
                        const specInspect = selectedInspectors[f.id] || f.manager || MANAGERS[0];
                        
                        return (
                          <tr 
                            key={`${f.id}-${idx}`} 
                            className={`transition-colors ${
                              isChecked 
                                ? 'bg-orange-950/5 hover:bg-orange-950/10' 
                                : 'hover:bg-slate-850/20'
                            }`}
                          >
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelectRow(f.id)}
                                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-orange-600 focus:ring-orange-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 font-bold text-slate-200">
                              {f.name}
                            </td>
                            <td className="p-4 text-xs text-slate-400 space-y-0.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-orange-400 bg-orange-950/30 border border-orange-900/30 mr-1.5">
                                {f.group}
                              </span>
                              <span>{f.facilityType}</span>
                            </td>
                            <td className="p-4 text-slate-400 font-mono text-xs font-bold">
                              {f.lastInspectionDate 
                                ? new Date(f.lastInspectionDate).toLocaleDateString('vi-VN') 
                                : '❌ Chưa có dữ liệu'
                              }
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                                <input
                                  type="date"
                                  value={dateVal}
                                  onChange={(e) => handleRowDateChange(f.id, e.target.value)}
                                  className="bg-slate-950 border border-slate-800 rounded p-1 text-xs text-slate-300 focus:outline-none focus:border-red-500 font-bold"
                                />
                              </div>
                            </td>
                            <td className="p-4">
                              <select
                                value={specInspect}
                                onChange={(e) => handleRowAssigneeChange(f.id, e.target.value)}
                                className="bg-slate-950 border border-slate-850 rounded p-1 text-xs text-blue-400 font-bold focus:outline-none cursor-pointer"
                              >
                                {MANAGERS.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
