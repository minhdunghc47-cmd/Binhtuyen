#!/usr/bin/env bash
# Script tự động đồng bộ mã nguồn lên GitHub

# Màu sắc giao diện
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0;0m' # No Color

echo -e "${BLUE}=== HỆ THỐNG ĐỒNG BỘ GITHUB TỰ ĐỘNG ===${NC}"

# 1. Kiểm tra Git trên máy
if ! command -v git &> /dev/null
then
    echo -e "${YELLOW}⚠️ Git chưa được kích hoạt. Đang mở hộp thoại cài đặt của macOS...${NC}"
    xcode-select --install
    echo -e "${GREEN}👉 Đồng chí hãy bấm nút 'Cài đặt' (Install) trên cửa sổ vừa xuất hiện.${NC}"
    echo -e "${GREEN}👉 Sau khi macOS cài đặt xong, hãy chạy lại script này.${NC}"
    exit 1
fi

# 2. Kiểm tra xem thư mục đã được khởi tạo Git chưa
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Khởi tạo kho lưu trữ Git cục bộ...${NC}"
    git init
    git branch -M main
fi

# 3. Gom và Commit thay đổi
echo -e "${BLUE}Đang chuẩn bị đóng gói các file sửa đổi...${NC}"
git add .
if [ -z "$1" ]; then
    commit_msg="Cập nhật tự động ứng dụng PCCC [$(date +'%Y-%m-%d %H:%M:%S')]"
else
    commit_msg="$1"
fi
git commit -m "$commit_msg"
echo -e "${GREEN}✓ Đã ghi nhận thay đổi cục bộ thành công!${NC}"

# 4. Đồng bộ lên GitHub
if ! git remote | grep origin &> /dev/null
then
    echo -e "${YELLOW}⚠️ Dự án này chưa được liên kết với kho chứa GitHub nào.${NC}"
    echo -e "${BLUE}👉 Vui lòng dán đường dẫn repository GitHub của đồng chí (Ví dụ: https://github.com/ten-tai-khoan/ten-kho.git):${NC}"
    read -r remote_url
    
    if [ -n "$remote_url" ]; then
        git remote add origin "$remote_url"
        echo -e "${BLUE}Đang thực hiện đẩy mã nguồn lên nhánh chính (main)...${NC}"
        git push -u origin main
    else
        echo -e "${RED}❌ Không nhận được đường dẫn remote. Quá trình đồng bộ tạm dừng.${NC}"
        exit 1
    fi
else
    current_branch=$(git branch --show-current)
    echo -e "${BLUE}Đang đẩy mã nguồn lên GitHub (nhánh: ${current_branch})...${NC}"
    git push origin "$current_branch"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 HOÀN THÀNH ĐỒNG BỘ LÊN GITHUB THÀNH CÔNG!${NC}"
else
    echo -e "${RED}❌ Đẩy code thất bại. Vui lòng kiểm tra quyền truy cập hoặc kết nối mạng.${NC}"
fi
