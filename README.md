# Chiến 12 Con Giáp

Game đối kháng 2.5D: 12 con giáp theo quan niệm Việt Nam (Mão là Mèo) đấu võ. Chạy trên trình duyệt, máy tính và điện thoại.

## Cách chơi ngay

**Không cần cài gì.** Chọn một trong hai cách:

1. Mở tệp `index.html` bằng Chrome, Edge hoặc Firefox (bấm đúp vào tệp).
2. Nếu trình duyệt chặn, mở cửa sổ dòng lệnh trong thư mục này và chạy một lệnh:
   - Có Python: `python -m http.server 8000`, rồi vào `http://localhost:8000`
   - Có Node.js: `npx serve`

## Điều khiển

| | Người 1 | Người 2 |
|---|---|---|
| Di chuyển / nhảy / ngồi | W A S D | Phím mũi tên |
| Nhẹ / Trung / Nặng | J / K / L | Số 1 / 2 / 3 (bàn phím số) |
| Đặc biệt | U | Số 4 |
| Bản Năng | I | Số 5 |
| Tuyệt kỹ | O | Số 6 |
| Vật | H (hoặc J+K) | Số 0 |
| Tạm dừng | Esc / P | |

- Chiêu đặc biệt: Đặc biệt, → + Đặc biệt, ↓ + Đặc biệt.
- Đỡ đòn: giữ hướng ngược phía đối thủ (ngồi để đỡ đòn thấp).
- Tay cầm Xbox/PS cắm vào là dùng được. Điện thoại: xoay ngang, dùng cần điều khiển và nút trên màn hình.

## Cấu trúc mã

| Tệp | Nội dung |
|---|---|
| `js/data.js` | Chỉ số, chiêu thức 12 con giáp, sàn đấu |
| `js/fighter.js` | Logic võ sĩ (trạng thái, ra chiêu, Bản Năng) |
| `js/game.js` | Luật trận: trúng đòn, đỡ, vật, đạn, hiệp đấu |
| `js/ai.js` | Máy tự đánh, 3 độ khó |
| `js/models.js`, `js/view.js`, `js/stage.js` | Đồ họa 3D (Three.js), hoạt ảnh, 6 sàn đấu |
| `js/input.js`, `js/ui.js`, `js/audio.js` | Điều khiển, giao diện, âm thanh |
| `tools/mo-phong.js` | Cho máy tự đấu để đo cân bằng (`node tools/mo-phong.js 4 kho dmg`) |
| `docs/CHIEN_LUOC_GAME.md` | Tài liệu chiến lược, thiết kế |

Thư viện đồ họa Three.js r128 (giấy phép MIT) đã kèm trong `lib/`.
