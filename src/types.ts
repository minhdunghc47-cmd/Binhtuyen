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
  lastInspectionDate: string;
  inspector: string;
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

export interface FundTransaction {
  id: string;
  type: 'thu' | 'chi';
  amount: number;
  desc: string;
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
  deadline: string;
  createdAt: number;
}
