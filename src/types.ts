/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FacilityGroup = 'Nhóm 1' | 'Nhóm 2' | 'Chưa phân loại';

export type ReportStatus = 'danh_sach_chinh' | 'dua_vao_phan_cap' | 'chuyen_ve_xa' | 'dung_hoat_dong';

export interface TrainingLog {
  id: string | number;
  year: number;
  date: string;
  amount: number;
}

export type RecordStatus = 'hien_hanh' | 'chua_dang_ky' | 'du_kien_nop_luu' | 'da_nop_luu';

export interface InspectionLog {
  id: string | number;
  date: string;
  inspector: string;
  isDigitized: boolean;
}

export interface Facility {
  id: string;
  name: string;
  group: FacilityGroup;
  facilityType: string;
  recordNum: string;
  planNum: string;
  archiveNum?: string;
  openDate: string;
  village: string;
  manager: string;
  pc08Builder: string;
  pc08Date: string;
  lastInspectionDate: string; // Keep for backward compatibility / quick access
  inspector: string;          // Keep for backward compatibility / quick access
  inspectionHistory?: InspectionLog[];
  constructor: string;
  notes: string;
  trainingHistory: TrainingLog[];
  reportStatus: ReportStatus;
  recordStatus: RecordStatus;
  report6Months?: boolean;
  reportAnnual?: boolean;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  isCompleted: boolean;
  facilityId?: string;
  createdAt: number;
}

export type FundCategory = 'thu_quy' | 'chi_tieu' | 'tam_ung' | 'hoan_ung';
export type AdvanceStatus = 'dang_ung' | 'da_hoan_ung' | 'da_quyet_toan';

export interface FundTransaction {
  id: string;
  type: 'thu' | 'chi';
  amount: number;
  desc: string;
  createdAt: number;
  category?: FundCategory;
  person?: string; // Tên cán bộ tạm ứng / nộp tiền
  advanceStatus?: AdvanceStatus; // Trạng thái nếu là tạm ứng
  originalAmount?: number; // Số tiền ban đầu khi ứng
  settledAt?: number; // Thời điểm hoàn ứng hoặc quyết toán
  relatedTransactionId?: string;
}

export type SettlementStatus = 'chua_ket_toan' | 'dang_ket_toan' | 'da_ket_toan';

export interface SettlementStage {
  id: string;
  stageName: string;
  amount: number;
  percentage?: number;
  destination: 'quy_to' | 'khac';
  date: string;
  notes?: string;
  fundTransactionId?: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  assignee: string;
  value: number; // Thu nhập
  cost: number;  // Chi phí
  status: 'Khảo sát' | 'Thi công' | 'Nghiệm thu' | 'Đã kết toán';
  settlementStatus?: SettlementStatus; // Trạng thái kết toán quỹ: 'chua_ket_toan' | 'dang_ket_toan' | 'da_ket_toan'
  settlementHistory?: SettlementStage[]; // Lịch sử chi kết toán theo từng giai đoạn
  deadline: string;
  createdAt: number;
}
