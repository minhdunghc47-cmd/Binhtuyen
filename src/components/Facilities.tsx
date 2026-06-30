/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Facility, FacilityGroup, ReportStatus, RecordStatus, TrainingLog } from '../types';
import { 
  Building, 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  Edit2, 
  History, 
  FileCheck, 
  Filter, 
  Eye, 
  GraduationCap, 
  ClipboardCheck, 
  Info,
  CalendarDays
} from 'lucide-react';
import { VILLAGES, MANAGERS, generateId, getTypeColor } from '../data';

interface FacilitiesProps {
  facilities: Facility[];
  onAddFacility: (facility: Facility) => void;
  onUpdateFacility: (facility: Facility) => void;
  onDeleteFacility: (id: string) => void;
  onBulkImport: (items: Omit<Facility, 'id' | 'createdAt' | 'trainingHistory'>[]) => void;
}

export default function Facilities({
  facilities,
  onAddFacility,
  onUpdateFacility,
  onDeleteFacility,
  onBulkImport,
}: FacilitiesProps) {
  // Filters & Sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | FacilityGroup>('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | ReportStatus>('all');
  const [recordStatusFilter, setRecordStatusFilter] = useState<'all_active' | RecordStatus | 'all'>('all_active');
  const [planFilter, setPlanFilter] = useState<'all' | 'has-plan' | 'no-plan'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'>('date-desc');
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'hoso' | 'phuongan' | 'huanluyen' | 'kiemtra'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const today = new Date();
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  // History Detail Popover
  const [historyFacId, setHistoryFacId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [group, setGroup] = useState<FacilityGroup>('Chưa phân loại');
  const [facilityType, setFacilityType] = useState('');
  const [recordNum, setRecordNum] = useState('');
  const [archiveNum, setArchiveNum] = useState('');
  const [planNum, setPlanNum] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [village, setVillage] = useState(VILLAGES[0]);
  const [manager, setManager] = useState(MANAGERS[0]);
  const [pc08Builder, setPc08Builder] = useState('');
  const [pc08Date, setPc08Date] = useState('');
  const [lastInspectionDate, setLastInspectionDate] = useState('');
  const [inspector, setInspector] = useState('');
  const [constructorName, setConstructorName] = useState('');
  const [notes, setNotes] = useState('');
  const [reportStatus, setReportStatus] = useState<ReportStatus>('danh_sach_chinh');
  const [recordStatus, setRecordStatus] = useState<RecordStatus>('chua_dang_ky');
  const [trainingHistory, setTrainingHistory] = useState<TrainingLog[]>([]);

  // Sub-form for training logging
  const [trainDate, setTrainDate] = useState('');
  const [trainAmount, setTrainAmount] = useState('');

  // Handle opening for Create vs Edit
  const openFormModal = (fac: Facility | null = null) => {
    setFormError('');
    if (fac) {
      setEditingFacility(fac);
      setName(fac.name || '');
      setGroup(fac.group || 'Chưa phân loại');
      setFacilityType(fac.facilityType || '');
      setRecordNum(fac.recordNum || '');
      setArchiveNum(fac.archiveNum || '');
      setPlanNum(fac.planNum || '');
      setOpenDate(fac.openDate || '');
      setVillage(fac.village || VILLAGES[0]);
      setManager(fac.manager || MANAGERS[0]);
      setPc08Builder(fac.pc08Builder || '');
      setPc08Date(fac.pc08Date || '');
      setLastInspectionDate(fac.lastInspectionDate || '');
      setInspector(fac.inspector || '');
      setConstructorName(fac.constructor || '');
      setNotes(fac.notes || '');
      setReportStatus(fac.reportStatus || 'danh_sach_chinh');
      setRecordStatus(fac.recordStatus || 'hien_hanh');
      setTrainingHistory(fac.trainingHistory || []);
    } else {
      setEditingFacility(null);
      setName('');
      setGroup('Chưa phân loại');
      setFacilityType('');
      setRecordNum('');
      setArchiveNum('');
      setPlanNum('');
      setOpenDate('');
      setVillage(VILLAGES[0]);
      setManager(MANAGERS[0]);
      setPc08Builder('');
      setPc08Date('');
      setLastInspectionDate('');
      setInspector('');
      setConstructorName('');
      setNotes('');
      setReportStatus('danh_sach_chinh');
      setRecordStatus('chua_dang_ky');
      setTrainingHistory([]);
    }
    setTrainDate('');
    setTrainAmount('');
    setIsModalOpen(true);
  };

  const handleAddTraining = () => {
    setFormError('');
    if (!trainDate) return setFormError('Hãy chọn ngày tập huấn huấn luyện!');
    const year = new Date(trainDate).getFullYear();
    const cost = Number(trainAmount) || 0;
    const newLog: TrainingLog = {
      id: generateId(),
      year,
      date: trainDate,
      amount: cost,
    };
    setTrainingHistory([newLog, ...trainingHistory]);
    setTrainDate('');
    setTrainAmount('');
  };

  const handleRemoveTraining = (logId: string | number) => {
    setTrainingHistory(trainingHistory.filter((t) => t.id !== logId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) return setFormError('Hãy nhập tên cơ sở!');

    if (recordStatus === 'hien_hanh' && !recordNum.trim()) {
      return setFormError('Hồ sơ hiện hành bắt buộc phải có Số hồ sơ!');
    }
    
    if (recordStatus === 'da_nop_luu' && !archiveNum.trim()) {
      return setFormError('Hồ sơ nộp lưu bắt buộc phải có Số nộp lưu!');
    }

    const payload: Facility = {
      id: editingFacility ? editingFacility.id : generateId(),
      name: name.trim(),
      group,
      facilityType: facilityType.trim(),
      recordNum: recordNum.trim(),
      archiveNum: archiveNum.trim(),
      planNum: planNum.trim(),
      openDate,
      village,
      manager,
      pc08Builder: pc08Builder.trim(),
      pc08Date,
      lastInspectionDate,
      inspector: inspector.trim(),
      constructor: constructorName.trim(),
      notes: notes.trim(),
      reportStatus,
      recordStatus,
      trainingHistory,
      createdAt: editingFacility ? editingFacility.createdAt : Date.now(),
    };

    if (editingFacility) {
      onUpdateFacility(payload);
    } else {
      onAddFacility(payload);
    }
    setIsModalOpen(false);
  };

  // Inline direct database save on input blur (Scientific, prevents clicking edit modal)
  const handleInlineUpdate = (id: string, field: keyof Facility, value: any) => {
    const existing = facilities.find((f) => f.id === id);
    if (!existing) return;
    if (existing[field] === value) return; // avoid duplicates

    // Validation for direct updates
    if (field === 'recordStatus') {
      if (value === 'hien_hanh' && !(existing.recordNum && existing.recordNum.trim())) {
        return console.error('Hồ sơ hiện hành bắt buộc phải có Số hồ sơ!');
      }
      if (value === 'da_nop_luu' && !(existing.archiveNum && existing.archiveNum.trim())) {
        return console.error('Hồ sơ nộp lưu bắt buộc phải có Số nộp lưu!');
      }
    }
    if (field === 'recordNum' && existing.recordStatus === 'hien_hanh' && (!value || typeof value === 'string' && !value.trim())) {
      return console.error('Hồ sơ hiện hành bắt buộc phải có Số hồ sơ!');
    }
    if (field === 'archiveNum' && existing.recordStatus === 'da_nop_luu' && (!value || typeof value === 'string' && !value.trim())) {
      return console.error('Hồ sơ nộp lưu bắt buộc phải có Số nộp lưu!');
    }

    onUpdateFacility({
      ...existing,
      [field]: value,
    });
  };

  // CSV Import/Export
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split(/\r?\n/).filter((r) => r.trim() !== '');
        
        if (rows.length < 2) return console.error('File CSV không có dữ liệu!');
        const delimiter = text.includes(';') ? ';' : ',';

        const importedItems: Omit<Facility, 'id' | 'createdAt' | 'trainingHistory'>[] = [];

        // Parse CSV Rows properly supporting quotes
        for (let i = 1; i < rows.length; i++) {
          const rowText = rows[i];
          let values: string[] = [];
          let currentVal = '';
          let inQuotes = false;

          for (let j = 0; j < rowText.length; j++) {
            const char = rowText[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              values.push(currentVal.trim());
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          values.push(currentVal.trim());

          if (values[0]) {
            const parsedRecordNum = (values[3] || '').replace(/^"|"$/g, '');
            importedItems.push({
              name: values[0].replace(/^"|"$/g, ''),
              group: (values[1] === 'Nhóm 1' || values[1] === 'Nhóm 2' ? values[1] : 'Chưa phân loại') as FacilityGroup,
              facilityType: (values[2] || '').replace(/^"|"$/g, ''),
              recordNum: parsedRecordNum,
              planNum: (values[4] || '').replace(/^"|"$/g, ''),
              openDate: (values[5] || ''),
              village: (values[6] || VILLAGES[0]).replace(/^"|"$/g, ''),
              manager: (values[7] || MANAGERS[0]).replace(/^"|"$/g, ''),
              pc08Builder: (values[8] || '').replace(/^"|"$/g, ''),
              pc08Date: (values[9] || ''),
              lastInspectionDate: (values[10] || ''),
              inspector: (values[11] || '').replace(/^"|"$/g, ''),
              constructor: (values[12] || '').replace(/^"|"$/g, ''),
              notes: (values[13] || '').replace(/^"|"$/g, ''),
              reportStatus: 'danh_sach_chinh',
              recordStatus: parsedRecordNum.trim() ? 'hien_hanh' : 'chua_dang_ky',
            });
          }
        }

        if (importedItems.length > 0) {
          onBulkImport(importedItems);
          console.log(`Đã nhập thành công ${importedItems.length} cơ sở từ tập tin CSV!`);
        }
      } catch (err) {
        console.error(err);
        console.error('Có lỗi định dạng xảy ra khi đọc file CSV! Hãy xem kỹ mẫu.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleDownloadTemplate = () => {
    const csvHeader = 'Ten co so;Nhom QL;Loai hinh;So ho so;So phuong an;Ngay mo(YYYY-MM-DD);Thon/Xom;Can bo QL;Nguoi lap PC08;Ngay ky PC08;Ngay KT Gan Nhat(YYYY-MM-DD);Nguoi/Doan KT;Thi cong;Ghi chu\n';
    const csvRow = 'Karaoke Luxury;Nhóm 1;Kinh doanh Giải trí Karaoke;PCCC-2025/001;PA-9011/BT;2025-01-10;Thôn Bình Tuyền;Đ/c Dũng;Đ/c Dũng;2025-01-15;2025-11-20;Đoàn kiểm định;Cơ khí Bình Tuyền;Cần lưu ý phòng hộ phía sau\n';
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvHeader + csvRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Mau_Nhap_Ho_So_PCCC.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvHeader = 'Ten co so;Nhom QL;Loai hinh;So ho so;So phuong an;Ngay mo;Thon/Xom;Can bo QL;Nguoi lap PC08;Ngay ky PC08;Ngay KT Gan Nhat;Nguoi/Doan KT;Thi cong;Ghi chu\n';
    let rowsText = '';
    
    facilities.forEach((f) => {
      const cleanNotes = (f.notes || '').replace(/[\r\n]+/g, ' ');
      const cleanName = (f.name || '').replace(/[\r\n]+/g, ' ');
      const cleanType = (f.facilityType || '').replace(/[\r\n]+/g, ' ');
      const cleanInspector = (f.inspector || '').replace(/[\r\n]+/g, ' ');
      const cleanConst = (f.constructor || '').replace(/[\r\n]+/g, ' ');
      
      const row = [
        cleanName,
        f.group,
        cleanType,
        f.recordNum || '',
        f.planNum || '',
        f.openDate || '',
        f.village || '',
        f.manager || '',
        f.pc08Builder || '',
        f.pc08Date || '',
        f.lastInspectionDate || '',
        cleanInspector,
        cleanConst,
        cleanNotes
      ];
      rowsText += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';') + '\n';
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvHeader + rowsText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `XUAT_TAP_TIN_PCCC_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Search filter and Sort application
  const filteredFacilities = facilities.filter((f) => {
    const matchesSearch = 
      (f.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.facilityType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.manager || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.village || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesGroup = groupFilter === 'all' || f.group === groupFilter;
    const matchesStatus = reportStatusFilter === 'all' || f.reportStatus === reportStatusFilter;
    
    let matchesRecordStatus = true;
    if (recordStatusFilter === 'all_active') {
      matchesRecordStatus = f.recordStatus !== 'da_nop_luu';
    } else if (recordStatusFilter !== 'all') {
      matchesRecordStatus = f.recordStatus === recordStatusFilter;
    }

    const matchesPlan = 
      planFilter === 'all' ||
      (planFilter === 'has-plan' && f.planNum && f.planNum.trim() !== '') ||
      (planFilter === 'no-plan' && (!f.planNum || f.planNum.trim() === ''));

    return matchesSearch && matchesGroup && matchesStatus && matchesRecordStatus && matchesPlan;
  }).sort((a, b) => {
    if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
    if (sortBy === 'date-desc') return (b.openDate || '').localeCompare(a.openDate || '');
    if (sortBy === 'date-asc') return (a.openDate || '').localeCompare(b.openDate || '');
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Search and Action Suite */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Building className="h-5 w-5 text-red-400" />
            Cơ Sở Địa Bàn Quản Lý ({filteredFacilities.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tổng {facilities.length} hồ sơ: {facilities.filter(f => f.recordStatus === 'hien_hanh').length} hiện hành, {facilities.filter(f => f.recordStatus === 'chua_dang_ky').length} chưa cấp số, {facilities.filter(f => f.recordStatus === 'da_nop_luu').length} đã nộp lưu, {facilities.filter(f => f.recordStatus === 'du_kien_nop_luu').length} dự kiến nộp lưu.
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Quick Search */}
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm nhanh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Record Status Filter */}
          <div className="relative">
            <select
              value={recordStatusFilter}
              onChange={(e) => setRecordStatusFilter(e.target.value as any)}
              className="pl-3 pr-8 py-2 text-xs md:text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-red-500 cursor-pointer appearance-none"
            >
              <option value="all_active">✅ Cơ sở đang quản lý</option>
              <option value="all">📁 Tất cả (kể cả nộp lưu)</option>
              <option value="hien_hanh">📄 Hồ sơ hiện hành</option>
              <option value="chua_dang_ky">⚠️ Chưa đăng ký</option>
              <option value="du_kien_nop_luu">⏳ Dự kiến nộp lưu</option>
              <option value="da_nop_luu">📦 Đã nộp lưu</option>
            </select>
          </div>

          {/* Group Filter */}
          <div className="relative">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value as any)}
              className="pl-3 pr-8 py-2 text-xs md:text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-red-500 cursor-pointer appearance-none"
            >
              <option value="all">📁 Tất cả các Nhóm</option>
              <option value="Nhóm 1">Nhóm 1 (KT 1 năm/lần)</option>
              <option value="Nhóm 2">Nhóm 2 (KT 2 năm/lần)</option>
              <option value="Chưa phân loại">Chưa phân loại</option>
            </select>
          </div>

          {/* Plan checklist Filter */}
          <div className="relative">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="pl-3 pr-8 py-2 text-xs bg-slate-900 border border-blue-900/50 text-blue-400 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer appearance-none font-bold"
            >
              <option value="all">📝 Đầy đủ phương án</option>
              <option value="has-plan">✅ Đã cấp số phương án</option>
              <option value="no-plan">🚨 KHUYẾT SỐ PHƯƠNG ÁN</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-3 pr-8 py-2 text-xs md:text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="date-desc">Mở HS (Mới nhất)</option>
              <option value="date-asc">Mở HS (Cũ nhất)</option>
              <option value="name-asc">Tên cơ sở A-Z</option>
              <option value="name-desc">Tên cơ sở Z-A</option>
            </select>
          </div>

          {/* Tools */}
          <button
            onClick={handleDownloadTemplate}
            className="p-2 border border-slate-800 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-850 rounded-lg text-xs flex items-center justify-center"
            title="Tải mẫu CSV"
          >
            <Download className="h-4 w-4" />
          </button>

          <label
            className="p-2 border border-slate-800 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-850 rounded-lg text-xs flex items-center justify-center cursor-pointer"
            title="Import dữ liệu từ file CSV"
          >
            <Upload className="h-4 w-4" />
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </label>

          <button
            onClick={handleExportCSV}
            className="py-2 px-3 border border-slate-800 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-850 rounded-lg text-xs flex items-center gap-1.5"
            title="Xuất file danh sách"
          >
            <FileCheck className="h-4 w-4 text-emerald-400" />
            <span>Xuất</span>
          </button>

          <button
            onClick={() => openFormModal()}
            className="py-2 px-4 bg-red-700/90 hover:bg-red-650 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 shadow"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      {/* Main Grid Card Listing Container */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden">
        {/* Sub-tabs Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/60 custom-scrollbar scrollbar-hide">
          {[
            { id: 'all', label: '🌟 Tổng hợp (Tất cả)' },
            { id: 'hoso', label: '📂 Số hồ sơ' },
            { id: 'phuongan', label: '🔥 Số phương án' },
            { id: 'huanluyen', label: '🎓 Tình trạng huấn luyện' },
            { id: 'kiemtra', label: '🛡️ Tình trạng kiểm tra' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-3 text-[11px] uppercase tracking-wider font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeSubTab === tab.id
                  ? 'bg-slate-800/80 text-blue-400 border-b-2 border-blue-500'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table Tip */}
        <div className="bg-slate-950/20 px-4 py-2 border-b border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-blue-400" />
          <span>Chiến sĩ có thể chỉnh sửa nhanh nhãn/mã/phụ trách trực tiếp bằng cách sửa thẳng nội dung trong cột.</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/40">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase w-10">STT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-1/4">Tên Cơ Sở / Loại hình / Chu kỳ</th>
                
                {activeSubTab === 'all' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Cán bộ QL / Trực thuộc / Thôn</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Hồ sơ & Huấn luyện năm nay</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase text-center">Trạng thái kiểm tra</th>
                  </>
                )}

                {activeSubTab === 'hoso' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-40">Cán bộ QL / Trực thuộc</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-48">Tình trạng Hồ sơ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Số hồ sơ gốc</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Số nộp lưu</th>
                  </>
                )}

                {activeSubTab === 'phuongan' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-40">Cán bộ QL / Trực thuộc</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Số Phương án</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Ghi chú</th>
                  </>
                )}

                {activeSubTab === 'huanluyen' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-40">Cán bộ QL / Trực thuộc</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase text-center w-48">Trạng thái Huấn luyện</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Lịch sử Huấn luyện</th>
                  </>
                )}

                {activeSubTab === 'kiemtra' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-40">Cán bộ QL / Trực thuộc</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase text-center">Chu kỳ / Ngày KT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Trạng thái Kiểm tra</th>
                  </>
                )}

                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-transparent text-xs md:text-sm">
              {filteredFacilities.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500 font-bold italic">
                    Không có cơ sở dữ liệu phù hợp với bộ lọc hiện thời.
                  </td>
                </tr>
              ) : (
                filteredFacilities.map((f, idx) => {
                  const hasInspectDate = f.lastInspectionDate !== '';
                  let isOverdue = false;
                  let inspectMessage = 'Đảm bảo thời hạn';
                  let inspectBadgeColor = 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30';

                  if (f.group === 'Chưa phân loại') {
                    inspectMessage = 'Chưa phân nhóm chu kỳ';
                    inspectBadgeColor = 'text-slate-400 bg-slate-950/30 border-slate-800';
                  } else if (!hasInspectDate) {
                    isOverdue = true;
                    inspectMessage = 'CHƯA TỪNG KIỂM TRA';
                    inspectBadgeColor = 'text-rose-400 bg-rose-950/20 border-rose-900/40 animate-pulse';
                  } else {
                    const lastInspectObj = new Date(f.lastInspectionDate);
                    const diffTime = Math.abs(today.getTime() - lastInspectObj.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const threshold = f.group === 'Nhóm 1' ? 365 : 730;
                    if (diffDays >= threshold) {
                      isOverdue = true;
                      inspectMessage = `⚠️ CHẬM KIỂM TRA (${f.group})`;
                      inspectBadgeColor = 'text-rose-400 bg-rose-950/20 border-rose-900/40 animate-pulse';
                    } else {
                      inspectMessage = `${f.group} (Còn hạn)`;
                    }
                  }

                  const categoryColorStyle = getTypeColor(f.facilityType);

                  return (
                    <tr key={`${f.id}-${idx}`} className="hover:bg-slate-850/35 transition-colors">
                      <td className="px-3 py-4 text-center font-bold text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-4 align-top">
                        {/* Inline editable name */}
                        <input
                          type="text"
                          value={f.name}
                          onChange={(e) => handleInlineUpdate(f.id, 'name', e.target.value)}
                          className="font-bold text-slate-200 bg-transparent border-b border-transparent hover:border-slate-800 focus:border-red-500 focus:outline-none focus:bg-slate-950/40 rounded px-1 py-0.5 w-full transition-all text-xs md:text-sm"
                        />
                        
                        {/* Dynamic colorful tag based on facility type */}
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${categoryColorStyle}`}>
                            {f.facilityType || 'Chưa phân loại'}
                          </span>
                          {f.recordStatus === 'chua_dang_ky' && (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-yellow-900/50 bg-yellow-950/30 text-yellow-500">
                              Chưa cấp số
                            </span>
                          )}
                          {f.recordStatus === 'du_kien_nop_luu' && (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-purple-900/50 bg-purple-950/30 text-purple-400">
                              Dự kiến nộp lưu
                            </span>
                          )}
                          {f.recordStatus === 'da_nop_luu' && (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-slate-700 bg-slate-800 text-slate-400">
                              Đã nộp lưu
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Common Column 2: Manager/Village (reused across multiple tabs) */}
                      {activeSubTab !== 'all' && (
                        <td className="px-4 py-4 align-top">
                          <select
                            value={f.manager}
                            onChange={(e) => handleInlineUpdate(f.id, 'manager', e.target.value)}
                            className="bg-transparent border-none text-blue-400 focus:ring-1 focus:ring-blue-500 rounded font-bold cursor-pointer text-xs focus:outline-none w-full"
                          >
                            {MANAGERS.map((m) => (
                              <option key={m} value={m} className="bg-slate-900 text-slate-300">
                                {m}
                              </option>
                            ))}
                          </select>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center">
                            Thôn: 
                            <input
                              type="text"
                              value={f.village}
                              onChange={(e) => handleInlineUpdate(f.id, 'village', e.target.value)}
                              className="bg-transparent text-slate-300 rounded focus:outline-none px-1 italic text-xs border border-transparent hover:border-slate-800 ml-1 font-semibold focus:border-amber-500 w-full"
                            />
                          </div>
                        </td>
                      )}

                      {/* --- TAB: ALL --- */}
                      {activeSubTab === 'all' && (
                        <>
                          <td className="px-4 py-4 align-top">
                            {/* Assignee select */}
                            <select
                              value={f.manager}
                              onChange={(e) => handleInlineUpdate(f.id, 'manager', e.target.value)}
                              className="bg-transparent border-none text-blue-400 focus:ring-1 focus:ring-blue-500 rounded font-bold cursor-pointer text-xs focus:outline-none"
                            >
                              {MANAGERS.map((m) => (
                                <option key={m} value={m} className="bg-slate-900 text-slate-300">
                                  {m}
                                </option>
                              ))}
                            </select>
                            <div className="text-[11px] text-slate-400 mt-1">
                              Thôn: 
                              <input
                                type="text"
                                value={f.village}
                                onChange={(e) => handleInlineUpdate(f.id, 'village', e.target.value)}
                                className="bg-transparent text-slate-300 rounded focus:outline-none px-1 italic text-xs border border-transparent hover:border-slate-800 ml-1 font-semibold focus:border-amber-500"
                              />
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top space-y-1">
                            <div className="flex items-center text-[11px] text-slate-400 gap-1">
                              <span>HS:</span>
                              <input
                                type="text"
                                value={f.recordNum || ''}
                                onChange={(e) => handleInlineUpdate(f.id, 'recordNum', e.target.value)}
                                placeholder="Số hồ sơ..."
                                className="bg-transparent text-slate-300 rounded focus:outline-none px-1 py-0.5 font-mono text-xs border border-transparent hover:border-slate-800 w-24 focus:border-blue-505"
                              />
                            </div>
                            <div className="flex items-center text-[11px] text-slate-400 gap-1">
                              <span>PA:</span>
                              <input
                                type="text"
                                value={f.planNum || ''}
                                onChange={(e) => handleInlineUpdate(f.id, 'planNum', e.target.value)}
                                placeholder="Chưa có..."
                                className="bg-transparent text-purple-400 rounded focus:outline-none px-1 py-0.5 font-mono text-xs font-bold border border-transparent hover:border-slate-800 w-24 focus:border-purple-500"
                              />
                            </div>
                            {f.recordStatus === 'da_nop_luu' && (
                              <div className="flex items-center text-[11px] text-slate-400 gap-1">
                                <span>Lưu:</span>
                                <input
                                  type="text"
                                  value={f.archiveNum || ''}
                                  onChange={(e) => handleInlineUpdate(f.id, 'archiveNum', e.target.value)}
                                  placeholder="Số lưu..."
                                  className="bg-transparent text-slate-400 rounded focus:outline-none px-1 py-0.5 font-mono text-xs border border-transparent hover:border-slate-800 w-24 focus:border-slate-500"
                                />
                              </div>
                            )}
                            <div className="pt-1.5 flex items-center">
                              <button
                                onClick={() => setHistoryFacId(historyFacId === f.id ? null : f.id)}
                                className="text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                              >
                                <History className="h-3 w-3" />
                                Lịch sử HL ({(f.trainingHistory || []).length})
                              </button>
                            </div>

                            {/* History Detail Drawer directly inline */}
                            {historyFacId === f.id && (
                              <div className="bg-slate-950 p-2 border border-slate-800 rounded-lg mt-2 space-y-1.5 max-w-[240px]">
                                <div className="font-bold text-[10px] text-emerald-400 flex items-center justify-between border-b border-slate-850 pb-1">
                                  <span>LỊCH SỬ HUẤN LUYỆN</span>
                                  <span className="text-[8px] text-slate-500 uppercase">Cơ sở chi trả</span>
                                </div>
                                {(f.trainingHistory || []).length === 0 ? (
                                  <p className="text-[10px] text-slate-500 italic">Chưa huấn luyện năm nay</p>
                                ) : (
                                  <div className="max-h-24 overflow-y-auto space-y-1">
                                    {(f.trainingHistory || []).map((t, idx) => (
                                      <div key={`${t.id}-${idx}`} className="text-[10px] text-slate-400 flex justify-between bg-slate-900 px-1.5 py-0.5 rounded">
                                        <span>Năm {t.year}:</span>
                                        <span className="font-bold text-emerald-400">
                                          {t.amount > 0 ? new Intl.NumberFormat('vi-VN').format(t.amount) : '0'} ₫
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4 align-top text-center">
                            <input
                              type="date"
                              value={f.lastInspectionDate || ''}
                              onChange={(e) => handleInlineUpdate(f.id, 'lastInspectionDate', e.target.value)}
                              className="bg-slate-950/40 text-blue-400 font-bold px-1.5 py-0.5 border border-slate-850 rounded text-[11px] focus:outline-none focus:border-blue-500"
                            />
                            <div className="mt-1.5">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${inspectBadgeColor}`}>
                                {inspectMessage}
                              </span>
                            </div>
                          </td>
                        </>
                      )}

                      {/* --- TAB: HỒ SƠ --- */}
                      {activeSubTab === 'hoso' && (
                        <>
                          <td className="px-4 py-4 align-top">
                            <select
                              value={f.recordStatus}
                              onChange={(e) => handleInlineUpdate(f.id, 'recordStatus', e.target.value)}
                              className={`text-xs font-bold rounded px-2 py-1 focus:outline-none ${
                                f.recordStatus === 'hien_hanh' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50' :
                                f.recordStatus === 'du_kien_nop_luu' ? 'bg-purple-950/30 text-purple-400 border border-purple-900/50' :
                                f.recordStatus === 'da_nop_luu' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                                'bg-yellow-950/30 text-yellow-500 border border-yellow-900/50'
                              }`}
                            >
                              <option value="chua_dang_ky">Chưa cấp số</option>
                              <option value="hien_hanh">Đang hiện hành</option>
                              <option value="du_kien_nop_luu">Dự kiến nộp lưu</option>
                              <option value="da_nop_luu">Đã nộp lưu</option>
                            </select>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <input
                              type="text"
                              value={f.recordNum || ''}
                              onChange={(e) => handleInlineUpdate(f.id, 'recordNum', e.target.value)}
                              placeholder="Số hồ sơ..."
                              className="bg-slate-950/40 text-blue-400 rounded focus:outline-none px-2 py-1 font-mono text-xs font-bold border border-slate-800 w-full focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-4 align-top">
                            <input
                              type="text"
                              value={f.archiveNum || ''}
                              onChange={(e) => handleInlineUpdate(f.id, 'archiveNum', e.target.value)}
                              placeholder="Số lưu..."
                              disabled={f.recordStatus !== 'da_nop_luu'}
                              className="bg-slate-950/40 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded focus:outline-none px-2 py-1 font-mono text-xs border border-slate-800 w-full focus:border-slate-500"
                            />
                          </td>
                        </>
                      )}

                      {/* --- TAB: PHƯƠNG ÁN --- */}
                      {activeSubTab === 'phuongan' && (
                        <>
                          <td className="px-4 py-4 align-top">
                            <input
                              type="text"
                              value={f.planNum || ''}
                              onChange={(e) => handleInlineUpdate(f.id, 'planNum', e.target.value)}
                              placeholder="Nhập số phương án..."
                              className="bg-slate-950/40 text-purple-400 rounded focus:outline-none px-2 py-1 font-mono text-sm font-bold border border-slate-800 w-full focus:border-purple-500"
                            />
                          </td>
                          <td className="px-4 py-4 align-top">
                            <textarea
                              value={f.notes || ''}
                              onChange={(e) => handleInlineUpdate(f.id, 'notes', e.target.value)}
                              placeholder="Ghi chú về phương án..."
                              rows={2}
                              className="bg-slate-950/40 text-slate-300 rounded focus:outline-none px-2 py-1 text-xs border border-slate-800 w-full focus:border-blue-500 resize-none"
                            />
                          </td>
                        </>
                      )}

                      {/* --- TAB: HUẤN LUYỆN --- */}
                      {activeSubTab === 'huanluyen' && (
                        <>
                          <td className="px-4 py-4 align-top text-center">
                            {(f.trainingHistory || []).some(t => t.year === today.getFullYear()) ? (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/30 text-emerald-400 border border-emerald-900/50">
                                Đã huấn luyện {today.getFullYear()}
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-950/30 text-rose-400 border border-rose-900/50 animate-pulse">
                                Chưa huấn luyện {today.getFullYear()}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="bg-slate-950/50 p-2 border border-slate-800/80 rounded-lg space-y-1.5 w-full">
                              {(f.trainingHistory || []).length === 0 ? (
                                <p className="text-[11px] text-slate-500 italic">Chưa có dữ liệu</p>
                              ) : (
                                <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar">
                                  {(f.trainingHistory || []).map((t, idx) => (
                                    <div key={`${t.id}-${idx}`} className="text-[11px] text-slate-400 flex justify-between bg-slate-900 px-2 py-1 rounded">
                                      <span>Năm {t.year} ({new Date(t.date).toLocaleDateString('vi-VN')}):</span>
                                      <span className="font-bold text-emerald-400">
                                        {t.amount > 0 ? new Intl.NumberFormat('vi-VN').format(t.amount) : '0'} ₫
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => openFormModal(f)}
                                className="w-full mt-2 py-1 text-[10px] font-bold text-blue-400 bg-blue-950/20 hover:bg-blue-900/40 rounded transition-colors"
                              >
                                + Thêm/Sửa Lịch sử
                              </button>
                            </div>
                          </td>
                        </>
                      )}

                      {/* --- TAB: KIỂM TRA --- */}
                      {activeSubTab === 'kiemtra' && (
                        <>
                          <td className="px-4 py-4 align-top text-center">
                            <div className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{f.group}</div>
                            <input
                              type="date"
                              value={f.lastInspectionDate || ''}
                              onChange={(e) => handleInlineUpdate(f.id, 'lastInspectionDate', e.target.value)}
                              className="bg-slate-950/60 text-blue-400 font-bold px-2 py-1.5 border border-slate-800 rounded text-xs focus:outline-none focus:border-blue-500 w-full text-center"
                            />
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/50 h-full flex flex-col justify-center">
                              <span className={`inline-block px-3 py-1.5 rounded-md text-xs font-bold border w-full text-center ${inspectBadgeColor}`}>
                                {inspectMessage}
                              </span>
                            </div>
                          </td>
                        </>
                      )}

                      <td className="px-4 py-4 align-top text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openFormModal(f)}
                            className="p-1 px-2 text-slate-400 hover:text-blue-400 hover:bg-blue-950/20 rounded transition"
                            title="Sửa chi tiết"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (deleteConfirmId === f.id) {
                                onDeleteFacility(f.id);
                                setDeleteConfirmId(null);
                              } else {
                                setDeleteConfirmId(f.id);
                                // Tự động tắt sau 3 giây nếu không bấm confirm
                                setTimeout(() => setDeleteConfirmId(null), 3000);
                              }
                            }}
                            className={`p-1 px-2 rounded transition flex items-center gap-1 ${
                              deleteConfirmId === f.id
                                ? 'bg-rose-500 text-white hover:bg-rose-600'
                                : 'text-slate-500 hover:text-rose-400 hover:bg-rose-950/20'
                            }`}
                            title="Xóa hồ sơ"
                          >
                            {deleteConfirmId === f.id ? (
                              <span className="text-[10px] font-bold">Xóa?</span>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED CREATE / EDIT DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full p-6 text-slate-300 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Building className="h-5 w-5 text-red-400" />
                {editingFacility ? 'Cập Nhật Hồ Sơ Cơ Sở' : 'Thêm Cơ Sở Mới Lập Danh Sách'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tên Cơ Sở Gia Trình (*)</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 focus:border-red-500 focus:outline-none"
                    placeholder="Ví dụ: Công ty Gỗ Đại Phát"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-orange-400 mb-1">Nhóm Quản Lý (Chu kỳ)</label>
                  <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value as FacilityGroup)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-orange-300 focus:border-orange-500 focus:outline-none font-bold"
                  >
                    <option value="Chưa phân loại">Chưa thuộc Nhóm</option>
                    <option value="Nhóm 1">Nhóm 1 (KT 1 năm/lần)</option>
                    <option value="Nhóm 2">Nhóm 2 (KT 2 năm/lần)</option>
                  </select>
                </div>
              </div>

              {/* Detailed types */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Loại hình</label>
                  <input
                    type="text"
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 focus:border-red-550 focus:outline-none text-xs"
                    placeholder="Chợ, Sản xuất..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mã Số Hồ sơ</label>
                  <input
                    type="text"
                    value={recordNum}
                    onChange={(e) => setRecordNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 focus:outline-none text-xs"
                    placeholder="PCCC-xxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số lưu</label>
                  <input
                    type="text"
                    value={archiveNum}
                    onChange={(e) => setArchiveNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 focus:outline-none text-xs"
                    placeholder="Lưu-xxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số phương án</label>
                  <input
                    type="text"
                    value={planNum}
                    onChange={(e) => setPlanNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 focus:outline-none text-xs"
                    placeholder="PA-xxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ngày mở HS</label>
                  <input
                    type="date"
                    value={openDate}
                    onChange={(e) => setOpenDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 focus:outline-none text-xs text-slate-350"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Thôn/Địa bàn</label>
                  <select
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 focus:outline-none text-xs text-slate-200 cursor-pointer"
                  >
                    {VILLAGES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Manager & PC08 builder */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Cán bộ phụ trách quản lý</label>
                  <select
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 focus:outline-none text-xs cursor-pointer text-blue-300 font-bold"
                  >
                    {MANAGERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Người lập PC08</label>
                  <input
                    type="text"
                    value={pc08Builder}
                    onChange={(e) => setPc08Builder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs focus:outline-none"
                    placeholder="Tên chiến sĩ vẽ PC08"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ngày ký PC08</label>
                  <input
                    type="date"
                    value={pc08Date}
                    onChange={(e) => setPc08Date(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Trạng thái theo dõi hồ sơ của tổ</label>
                  <select
                    value={reportStatus}
                    onChange={(e) => setReportStatus(e.target.value as ReportStatus)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-blue-400 focus:outline-none font-bold text-xs"
                  >
                    <option value="danh_sach_chinh">✅ Đang quản lý (Chính chủ hoạt động ổn định)</option>
                    <option value="dua_vao_phan_cap">🌟 Cơ sở mới khảo sát, đưa vào diện theo dõi</option>
                    <option value="chuyen_ve_xa">⬇️ Đã chuyển về UBND cấp Xã quản lý</option>
                    <option value="dung_hoat_dong">❌ Đã dừng hoạt động kinh doanh thành lập</option>
                  </select>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Trạng thái hồ sơ PCCC</label>
                  <select
                    value={recordStatus}
                    onChange={(e) => setRecordStatus(e.target.value as RecordStatus)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-orange-400 focus:outline-none font-bold text-xs"
                  >
                    <option value="hien_hanh">📄 Hồ sơ hiện hành (đã cấp số)</option>
                    <option value="chua_dang_ky">⚠️ Hồ sơ chưa đăng ký (chưa cấp số)</option>
                    <option value="du_kien_nop_luu">⏳ Hồ sơ dự kiến kết thúc, nộp lưu</option>
                    <option value="da_nop_luu">📦 Hồ sơ đã nộp lưu (Chỉ để tra cứu)</option>
                  </select>
                </div>
              </div>

              {/* Inspections and Training Panel (Scientific Sub-systems) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                {/* Training Logs */}
                <div className="bg-emerald-950/10 border border-emerald-900/30 p-3.5 rounded-xl space-y-3">
                  <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    Lịch sử tập huấn & huấn luyện
                  </h5>
                  
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={trainDate}
                      onChange={(e) => setTrainDate(e.target.value)}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded p-1 text-xs focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Kinh phí (₫)..."
                      value={trainAmount}
                      onChange={(e) => setTrainAmount(e.target.value)}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded p-1 text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTraining}
                    className="w-full py-1.5 bg-emerald-700/80 hover:bg-emerald-750 text-white font-bold rounded text-xs transition"
                  >
                    Thêm lượt tập huấn
                  </button>

                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {trainingHistory.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic block text-center py-2">
                        Chưa ghi nhận lịch sử huấn luyện
                      </p>
                    ) : (
                      trainingHistory.map((t, idx) => (
                        <div key={`${t.id}-${idx}`} className="flex justify-between items-center bg-slate-950 p-2 rounded text-xs border border-slate-850">
                          <span className="font-medium text-slate-300">
                            [{t.year}] {t.date ? new Date(t.date).toLocaleDateString('vi-VN') : ''}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-400">
                              {t.amount > 0 ? new Intl.NumberFormat('vi-VN').format(t.amount) : '0'} ₫
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTraining(t.id)}
                              className="text-slate-500 hover:text-rose-400 text-xs font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Last Inspections */}
                <div className="bg-blue-950/10 border border-blue-900/30 p-3.5 rounded-xl space-y-3">
                  <h5 className="text-xs font-bold text-blue-400 flex items-center gap-1">
                    <ClipboardCheck className="h-4 w-4" />
                    Đợt khám nghiệm / Kiểm tra
                  </h5>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Ngày kiểm tra gần nhất
                      </label>
                      <input
                        type="date"
                        value={lastInspectionDate}
                        onChange={(e) => setLastInspectionDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs focus:outline-none font-bold text-blue-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Đoàn/Cán bộ thực hiện kiểm tra
                      </label>
                      <input
                        type="text"
                        value={inspector}
                        onChange={(e) => setInspector(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none"
                        placeholder="Ví dụ: Đại úy Dũng & đội quản lý PCCC"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Installer */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Đơn vị thiết kế/thi công thiết bị PCCC</label>
                <input
                  type="text"
                  value={constructorName}
                  onChange={(e) => setConstructorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs focus:outline-none"
                  placeholder="Ví dụ: Công ty Thiết bị PCCC Tràng An"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Ghi chú sự cố, thiết hụt tài sản</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs focus:outline-none"
                  placeholder="Phương án chống chữa khẩn cấp, đặc điểm ngõ xe cứu hỏa..."
                ></textarea>
              </div>

              {formError && (
                <div className="bg-rose-950/40 border border-rose-900 text-rose-400 p-2 rounded text-xs font-semibold text-center">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-5 border border-slate-800 hover:border-slate-700 bg-transparent rounded-lg text-xs md:text-sm"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-red-700 hover:bg-red-650 text-white rounded-lg text-xs md:text-sm font-bold shadow-md"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
