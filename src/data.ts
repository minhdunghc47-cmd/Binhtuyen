/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Facility, Task, FundTransaction, Project } from './types';

// Helper to generate IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Vietnamese provinces/streets standard test values
export const VILLAGES = [
  'Thôn Bình Tuyền',
  'Thôn Bình Phú',
  'Thôn Trung Đông',
  'Thôn Tây Bắc',
  'Khu Phố Thượng',
  'Xóm Ngoài Văn'
];

export const ZALO_PHONES: Record<string, string> = {
  "Đ/c Dũng": "0335016599",
  "Đ/c Thiêm": "0987654321",
  "Đ/c Trung": "0912345678",
  "Đ/c Hải": "0900000000"
};

export function getTypeColor(typeStr: string): string {
  if (!typeStr) return 'bg-slate-800 text-slate-300 border-slate-700';
  const t = typeStr.toLowerCase();
  if (t.includes('khách sạn') || t.includes('nhà nghỉ') || t.includes('lưu trú')) return 'bg-purple-950/45 text-purple-400 border-purple-900/40';
  if (t.includes('karaoke') || t.includes('quán hát') || t.includes('bar') || t.includes('vũ trường')) return 'bg-pink-950/45 text-pink-400 border-pink-900/40';
  if (t.includes('chợ') || t.includes('siêu thị') || t.includes('thương mại')) return 'bg-yellow-950/40 text-yellow-500 border-yellow-904/30';
  if (t.includes('công ty') || t.includes('nhà máy') || t.includes('xưởng') || t.includes('sản xuất')) return 'bg-indigo-950/40 text-indigo-400 border-indigo-900/40';
  if (t.includes('trường') || t.includes('giáo dục') || t.includes('mầm non')) return 'bg-teal-950/40 text-teal-400 border-teal-900/40';
  if (t.includes('xăng') || t.includes('gas') || t.includes('hóa chất') || t.includes('vật liệu nổ')) return 'bg-rose-950/40 text-rose-400 border-rose-900/45';
  if (t.includes('bệnh viện') || t.includes('y tế') || t.includes('phòng khám')) return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/45';
  if (t.includes('nhà hàng') || t.includes('quán ăn') || t.includes('cửa hàng') || t.includes('dịch vụ')) return 'bg-orange-950/40 text-orange-400 border-orange-900/40';
  return 'bg-blue-950/40 text-blue-400 border-blue-900/40';
}

export const MANAGERS = ['Đ/c Dũng', 'Đ/c Thiêm', 'Đ/c Trung', 'Đ/c Hải'];

export const INITIAL_FACILITIES: Facility[] = [
  {
    id: 'fac-1',
    name: 'Karaoke Dubai Club',
    group: 'Nhóm 1',
    facilityType: 'Hộ kinh doanh Karaoke/Bar',
    recordNum: 'PCCC-2025/089',
    planNum: 'PA-8032/BT',
    openDate: '2025-01-15',
    village: 'Thôn Bình Tuyền',
    manager: 'Đ/c Dũng',
    pc08Builder: 'Đ/c Dũng',
    pc08Date: '2025-01-20',
    lastInspectionDate: '2025-11-10',
    inspector: 'Đoàn kiểm tra liên ngành Quận/Huyện',
    constructor: 'PCCC Đại Việt',
    notes: 'Khu vực đông người, kiểm tra hệ thống báo cháy tự động kỹ càng.',
    trainingHistory: [
      { id: 't-1', year: 2025, date: '2025-05-12', amount: 1500000 },
      { id: 't-2', year: 2026, date: '2026-04-10', amount: 1800000 }
    ],
    reportStatus: 'danh_sach_chinh',
    recordStatus: 'hien_hanh',
    createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000
  },
  {
    id: 'fac-2',
    name: 'Trạm Xăng Dầu Bình Tuyền S9',
    group: 'Nhóm 1',
    facilityType: 'Kinh doanh xăng dầu, khí đốt',
    recordNum: 'PCCC-2024/012',
    planNum: 'PA-2114/BT',
    openDate: '2024-03-10',
    village: 'Thôn Bình Phú',
    manager: 'Đ/c Thiêm',
    pc08Builder: 'Đ/c Thiêm',
    pc08Date: '2024-03-15',
    lastInspectionDate: '2025-05-20', // Overdue for Nhóm 1 (inspected over 1 year ago relative to target 2026-06-21)
    inspector: 'Công an PCCC vùng Tây',
    constructor: 'Cơ điện Bình Tuyền',
    notes: 'Có cột thu lôi chống sét cần đo định kỳ hàng năm.',
    trainingHistory: [
      { id: 't-3', year: 2025, date: '2025-06-01', amount: 2000000 }
    ],
    reportStatus: 'danh_sach_chinh',
    recordStatus: 'hien_hanh',
    createdAt: Date.now() - 500 * 24 * 60 * 60 * 1000
  },
  {
    id: 'fac-3',
    name: 'Khách Sạn Hoàn Vũ (3 Sao)',
    group: 'Nhóm 2',
    facilityType: 'Lưu trú du lịch, khách sạn',
    recordNum: 'PCCC-2023/110',
    planNum: '', // No plan yet (Alarm/Action Needed!)
    openDate: '2023-08-22',
    village: 'Khu Phố Thượng',
    manager: 'Đ/c Trung',
    pc08Builder: 'Đ/c Trung',
    pc08Date: '2023-09-02',
    lastInspectionDate: '2024-12-05', // Inspected 1.5 year ago (Not overdue yet for Nhóm 2 - 2 years limit, but nearing)
    inspector: 'Đ/c Trung',
    constructor: 'Xây dựng Hòa Bình',
    notes: 'Vừa hoàn thiện thêm 3 phòng tầng thượng, cần bổ sung phương án phụ lục.',
    trainingHistory: [
      { id: 't-4', year: 2024, date: '2024-11-12', amount: 3000000 }
    ],
    reportStatus: 'dua_vao_phan_cap',
    recordStatus: 'hien_hanh',
    createdAt: Date.now() - 800 * 24 * 60 * 60 * 1000
  },
  {
    id: 'fac-4',
    name: 'Xưởng Gỗ Mỹ Nghệ Đạt Phát',
    group: 'Nhóm 1',
    facilityType: 'Cơ sở sản xuất, chế biến lâm sản',
    recordNum: 'PCCC-2025/112',
    planNum: 'PA-2321/DP',
    openDate: '2025-06-01',
    village: 'Thôn Trung Đông',
    manager: 'Đ/c Hải',
    pc08Builder: 'Đ/c Hải',
    pc08Date: '2025-06-05',
    lastInspectionDate: '2025-12-15', // Good
    inspector: 'Đoàn kiểm tra liên ngành',
    constructor: 'Tự trang bị',
    notes: 'Khối lượng gỗ tập kết lớn, dễ cháy lan. Nhắc nhở dọn dẹp lối thoát hiểm thường xuyên.',
    trainingHistory: [],
    reportStatus: 'danh_sach_chinh',
    recordStatus: 'hien_hanh',
    createdAt: Date.now() - 300 * 24 * 60 * 60 * 1000
  },
  {
    id: 'fac-5',
    name: 'Trường Mầm Non Hướng Dương',
    group: 'Nhóm 2',
    facilityType: 'Cơ sở giáo dục, mầm non',
    recordNum: 'PCCC-2023/004',
    planNum: 'PA-0414/HD',
    openDate: '2023-02-12',
    village: 'Thôn Bình Tuyền',
    manager: 'Đ/c Thiêm',
    pc08Builder: 'Đ/c Hải',
    pc08Date: '2023-02-20',
    lastInspectionDate: '2024-04-15', // Overdue for Nhóm 2 (over 2 years ago)
    inspector: 'Đ/c Thiêm & Đ/c Hải',
    constructor: 'PCCC Hải Chân',
    notes: 'Trường học tập trung đông trẻ em nhi đồng. Yêu cầu kiểm tra kỹ kỹ năng thoát nạn và chuông báo.',
    trainingHistory: [
      { id: 't-5', year: 2024, date: '2024-04-12', amount: 1200000 }
    ],
    reportStatus: 'chuyen_ve_xa',
    recordStatus: 'hien_hanh',
    createdAt: Date.now() - 1100 * 24 * 60 * 60 * 1000
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Kiểm tra đột xuất quán Karaoke Dubai Club đột xuất sau phản ánh dân cư',
    assignee: 'Đ/c Dũng',
    deadline: '2026-06-25',
    isCompleted: false,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000
  },
  {
    id: 'task-2',
    title: 'Rà soát hồ sơ kiểm tra PCCC Trạm Xăng Dầu Bình Tuyền S9',
    assignee: 'Đ/c Thiêm',
    deadline: '2026-06-18', // Already Overdue relative to 2026-06-21
    isCompleted: false,
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000
  },
  {
    id: 'task-3',
    title: 'Phối hợp UBND Xã bàn giao hồ sơ Trường Mầm Non Hướng Dương về phân cấp Xã quản lý',
    assignee: 'Đ/c Hải',
    deadline: '2026-06-21',
    isCompleted: true,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000
  },
  {
    id: 'task-4',
    title: 'Lên kế hoạch tập huấn huấn luyện nghiệp vụ cho chủ các cơ sở thuộc diện quản lý mới',
    assignee: 'Đ/c Trung',
    deadline: '2026-06-28',
    isCompleted: false,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000
  }
];

export const INITIAL_FUNDS: FundTransaction[] = [
  {
    id: 'fund-1',
    type: 'thu',
    amount: 15000000,
    desc: 'Thu quỹ đóng góp định kỳ quý I/2026 từ các hội đồng thành viên',
    createdAt: Date.now() - 80 * 24 * 60 * 60 * 1000
  },
  {
    id: 'fund-2',
    type: 'thu',
    amount: 5000000,
    desc: 'Trích lục 30% lợi nhuận từ Dự Án thi công Nhà Xưởng dệt may may Bình Tuyền',
    createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000
  },
  {
    id: 'fund-3',
    type: 'chi',
    amount: 3200000,
    desc: 'Chi mua sắm trang thiết bị bảo hộ, mũ nón, ủng chống nước và vật tư cứu nạn cứu hộ mới',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  },
  {
    id: 'fund-4',
    type: 'chi',
    amount: 2500000,
    desc: 'Chi bồi dưỡng hội thao nghiệp vụ PCCC & CNCH địa bàn cụm công nghiệp Hải Long',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Lắp đặt hệ thống báo cháy & họng tiếp nước Nhà Xưởng May Mặc',
    client: 'Chị Hòa - Cụm CN Bình Tuyền',
    assignee: 'Đ/c Trung',
    value: 120000000, // 120 Millions
    cost: 85000000,   // 85 Millions -> Profit 35M
    status: 'Thi công',
    deadline: '2026-07-15',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  },
  {
    id: 'proj-2',
    name: 'Khảo sát lắp đặt bình chữa cháy xách tay và tủ đựng phương tiện tại chợ tạm',
    client: 'Hội ban quản lý Chợ Bình Tuyền',
    assignee: 'Đ/c Hải',
    value: 24000000,
    cost: 16000000,  // Profit 8M
    status: 'Khảo sát',
    deadline: '2026-06-30',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000
  },
  {
    id: 'proj-3',
    name: 'Thi công cải tạo lối thoát nạn và cầu thang sắt thoát hiểm ngoài trời nhà nghỉ',
    client: 'A Hùng - Thôn Bình Phú',
    assignee: 'Đ/c Thiêm',
    value: 45000000,
    cost: 30000000,  // Profit 15M
    status: 'Nghiệm thu',
    deadline: '2026-06-19',
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000
  }
];

// Local Storage Keys
const STORAGE_KEYS = {
  FACILITIES: 'pccc_facilities_store',
  TASKS: 'pccc_tasks_store',
  FUNDS: 'pccc_funds_store',
  PROJECTS: 'pccc_projects_store'
};

// Pure client-side loading with fallback to seed data
export function loadLocalData<T>(key: string, defaultSeed: T[]): T[] {
  try {
    const dataStr = localStorage.getItem(key);
    if (dataStr) {
      return JSON.parse(dataStr) as T[];
    }
  } catch (err) {
    console.error(`Error loading storage ${key}:`, err);
  }
  // Store default seed initially so other features match
  localStorage.setItem(key, JSON.stringify(defaultSeed));
  return defaultSeed;
}

export function saveLocalData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving storage ${key}:`, err);
  }
}

export function loadAllData() {
  return {
    facilities: loadLocalData<Facility>(STORAGE_KEYS.FACILITIES, INITIAL_FACILITIES),
    tasks: loadLocalData<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS),
    funds: loadLocalData<FundTransaction>(STORAGE_KEYS.FUNDS, INITIAL_FUNDS),
    projects: loadLocalData<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS)
  };
}

export function saveAllData(data: {
  facilities?: Facility[];
  tasks?: Task[];
  funds?: FundTransaction[];
  projects?: Project[];
}) {
  if (data.facilities) saveLocalData(STORAGE_KEYS.FACILITIES, data.facilities);
  if (data.tasks) saveLocalData(STORAGE_KEYS.TASKS, data.tasks);
  if (data.funds) saveLocalData(STORAGE_KEYS.FUNDS, data.funds);
  if (data.projects) saveLocalData(STORAGE_KEYS.PROJECTS, data.projects);
}
