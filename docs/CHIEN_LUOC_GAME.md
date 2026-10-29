# CHIẾN 12 CON GIÁP — Chiến lược phát triển game đối kháng 2.5D

> Tài liệu thiết kế tổng thể (Game Design Strategy), phiên bản 0.1.
> Phạm vi: định hướng sản phẩm, hệ thống chiến đấu, thiết kế 12 nhân vật, nguyên tắc cân bằng, đồ họa 2.5D, công nghệ và lộ trình.

---

## 1. Tầm nhìn sản phẩm

| Hạng mục | Nội dung |
|---|---|
| Thể loại | Đối kháng 1 đấu 1 (fighting game), mặt phẳng 2D, đồ họa 3D (2.5D) |
| Ý tưởng cốt lõi | 12 con giáp tái đấu "Cuộc đua Ngọc Hoàng" — lần này bằng võ, không bằng tốc độ |
| Điểm khác biệt | (1) Bản sắc văn hóa Việt (Mão là **Mèo**, không phải Thỏ); (2) mỗi con có **1 cơ chế riêng** lấy từ tập tính thật + truyền thuyết; (3) cân bằng theo "ngân sách chỉ số" – không con nào mạnh tuyệt đối |
| Nền tảng | PC (Steam) trước → Console → Mobile (bản điều khiển đơn giản) |
| Đối tượng | Người chơi phổ thông (chế độ điều khiển đơn giản) + người chơi đối kháng (chế độ cổ điển, xếp hạng) |
| Mô hình kinh doanh | Mua một lần (buy-to-play) + trang phục; **không bán sức mạnh** |

**Ba trụ cột thiết kế:**
1. **Dễ vào – khó giỏi:** 4 nút cơ bản, chiêu đặc biệt ra được bằng 1 nút + hướng.
2. **Mỗi con giáp là một lối chơi:** người chơi nhận ra con giáp qua cách đánh, không chỉ qua ngoại hình.
3. **Mạnh chỗ này – yếu chỗ kia:** mọi ưu thế đều trả giá bằng một nhược điểm rõ ràng.

---

## 2. Hệ thống chiến đấu cốt lõi

### 2.1. Điều khiển

| Nút | Chức năng |
|---|---|
| Nhẹ (L) | Đòn nhanh, khởi đầu combo |
| Trung (M) | Đòn tầm trung, kiểm soát khoảng cách |
| Nặng (H) | Đòn mạnh, chậm, sát thương cao |
| Đặc biệt (S) | Chiêu riêng của con giáp (S, →S, ↓S, ←S) |
| L+M | Ném / vật |
| M+H | **Thế Bản Năng** — kích hoạt cơ chế riêng của con giáp |

- **Chế độ Cổ điển:** chiêu đặc biệt ra bằng lệnh quay cần (↓↘→ + nút), sát thương 100%.
- **Chế độ Đơn giản:** S + hướng, sát thương ~90% để bù lợi thế dễ ra chiêu. *(Tỷ lệ cần thử nghiệm thực tế.)*

### 2.2. Tài nguyên trong trận

| Thanh | Cách nạp | Dùng để |
|---|---|---|
| Máu | — | Hết máu thua hiệp (thắng 2/3 hiệp) |
| **Khí** (3 vạch) | Đánh trúng, đỡ đòn, bị đánh | 1 vạch: chiêu cường hóa (EX); 2 vạch: phản đòn khi đang đỡ; 3 vạch: **Tuyệt kỹ Con Giáp** |
| **Bản Năng** (riêng từng con) | Theo cơ chế mỗi con | Kích hoạt khả năng đặc trưng (mục 3) |

### 2.3. Ngũ hành (cơ chế phụ, tác động nhỏ)
Theo địa chi: Tý, Hợi – **Thủy**; Dần, Mão – **Mộc**; Tỵ, Ngọ – **Hỏa**; Thân, Dậu – **Kim**; Sửu, Thìn, Mùi, Tuất – **Thổ**.

- Hành **khắc** đối thủ: Tuyệt kỹ +5% sát thương. Hành **sinh** cho đối thủ: thanh Khí của đối thủ nạp nhanh hơn 5%.
- Giới hạn ±5% để tạo màu sắc, **không quyết định thắng thua**. Có thể tắt ở chế độ thi đấu.

### 2.4. Lục xung — đối thủ truyền kiếp
6 cặp xung khắc (Tý–Ngọ, Sửu–Mùi, Dần–Thân, Mão–Dậu, Thìn–Tuất, Tỵ–Hợi) dùng cho **cốt truyện, lời thoại mở màn, hoạt cảnh riêng** — *không* cộng chỉ số, tránh tạo thế khắc chế cứng.

---

## 3. Thiết kế 12 nhân vật

### 3.1. Nguyên tắc "Ngân sách chỉ số"
Mỗi con giáp có **tổng 15 điểm** chia cho 5 chỉ số (thang 1–5). Muốn mạnh chỉ số này phải hy sinh chỉ số khác.

| Con giáp | Hành | Lối chơi | Máu | Sát thương | Tốc độ | Tầm đánh | Cơ động | Độ khó |
|---|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Tý – Chuột | Thủy | Lừa lọc, áp sát | 2 | 2 | 5 | 1 | 5 | ★★★★ |
| Sửu – Trâu | Thổ | Xe tăng, giáp cứng | 5 | 4 | 1 | 3 | 2 | ★★ |
| Dần – Hổ | Mộc | Vật lộn, sức mạnh | 4 | 5 | 3 | 2 | 1 | ★★★ |
| Mão – Mèo | Mộc | Linh hoạt trên không | 2 | 3 | 4 | 2 | 4 | ★★★★ |
| Thìn – Rồng | Thổ | Khống chế tầm xa | 3 | 4 | 2 | 5 | 1 | ★★★ |
| Tỵ – Rắn | Hỏa | Độc, gài bẫy | 2 | 3 | 3 | 4 | 3 | ★★★★★ |
| Ngọ – Ngựa | Hỏa | Lao tới, quán tính | 3 | 3 | 5 | 3 | 1 | ★★★ |
| Mùi – Dê | Thổ | Phòng thủ, bền bỉ | 4 | 3 | 2 | 2 | 4 | ★★ |
| Thân – Khỉ | Kim | Bắt chước, dùng gậy | 2 | 3 | 3 | 3 | 4 | ★★★★★ |
| Dậu – Gà | Kim | Phản đòn, đá cựa | 2 | 3 | 4 | 3 | 3 | ★★★ |
| Tuất – Chó | Thổ | Cân bằng, dễ chơi | 3 | 3 | 3 | 3 | 3 | ★ |
| Hợi – Lợn | Thủy | Nặng ký, khó đoán | 5 | 4 | 2 | 2 | 2 | ★★ |

> Ghi chú: *Tốc độ* = tốc độ di chuyển + ra đòn; *Cơ động* = nhảy, né, xoay xở trên không. Độ khó không tính vào ngân sách.

### 3.2. Hồ sơ chi tiết

Mỗi nhân vật gồm: **Cơ sở thực tế** (tập tính sinh học) · **Cơ sở truyền thuyết** · **Cơ chế Bản Năng** · **Chiêu đặc biệt** · **Tuyệt kỹ** · **Điểm yếu cố ý**.

---

#### 🐀 TÝ – CHUỘT "Tiểu Mưu Sư"
- **Thực tế:** nhỏ, nhanh, đào hang, gặm nhấm, sinh sôi đông đúc.
- **Truyền thuyết:** cưỡi lưng Trâu rồi nhảy về đích, giành vị trí số 1 bằng mưu trí.
- **Bản Năng – "Cưỡi Lưng":** nhảy lên lưng đối thủ, bám 3 giây, gặm gây sát thương nhỏ liên tục; đối thủ lắc mạnh (nhấn liên tục) để hất ra.
- **Chiêu:** *Đào Hang* (lặn xuống đất, trồi lên sau lưng) · *Răng Cửa* (lao cắn nhanh) · *Hạt Thóc* (ném hạt làm đối thủ trượt chân).
- **Tuyệt kỹ – "Bầy Chuột Tràn Đồng":** hàng trăm con chuột tràn qua màn hình.
- **Điểm yếu:** máu thấp nhất, tầm đánh ngắn nhất; bị đòn nặng là mất nửa lợi thế.

#### 🐂 SỬU – TRÂU "Thiết Giáp Đồng Quê"
- **Thực tế:** to khỏe, kéo cày bền bỉ, húc sừng.
- **Truyền thuyết:** cần cù, chở Chuột qua sông nhưng bị lừa về thứ 2.
- **Bản Năng – "Bền Bỉ":** các đòn tụ lực có **giáp cứng** (chịu 1 đòn không bị khựng, vẫn mất máu).
- **Chiêu:** *Cày Ruộng* (cúi đầu lao húc, giữ nút để tụ lực) · *Dậm Đất* (sóng chấn động mặt đất) · *Ách Cày* (vật quăng).
- **Tuyệt kỹ – "Ngưu Ma Phá Thành":** húc xuyên màn hình, ép đối thủ vào tường.
- **Điểm yếu:** chậm nhất, nhảy thấp; dễ bị thả diều bằng chiêu tầm xa; giáp cứng không chống được đòn vật.

#### 🐅 DẦN – HỔ "Chúa Sơn Lâm"
- **Thực tế:** săn mồi phục kích, vồ cổ, cú tát móng vuốt cực mạnh.
- **Truyền thuyết:** chúa tể rừng xanh, vượt dòng sông xiết về thứ 3.
- **Bản Năng – "Hổ Gầm":** gầm lớn làm đối thủ **mất ½ vạch Khí** và khựng nhẹ; sau đó hổ được tăng 10% sát thương trong 5 giây.
- **Chiêu:** *Mãnh Hổ Vồ Mồi* (đòn vật tầm xa, nhảy chồm) · *Trảo Kích* (cào 3 nhát) · *Phục Kích* (cúi thấp, né đòn tầm cao rồi bật lên).
- **Tuyệt kỹ – "Hổ Khiếu Sơn Hà":** vồ, ghì xuống, cắn kết liễu.
- **Điểm yếu:** cơ động kém, tầm ngắn; phải liều lĩnh áp sát; bị gầm hụt là hở to.

#### 🐈 MÃO – MÈO "Bóng Đêm"
- **Thực tế:** rơi luôn chạm đất bằng chân, linh hoạt, móng vuốt sắc, đi êm.
- **Truyền thuyết (bản Việt):** Mèo là con giáp thứ 4 thay Thỏ; mối thù với Chuột (hoạt cảnh đặc biệt khi gặp Tý).
- **Bản Năng – "Chín Mạng":** luôn **tiếp đất an toàn** (không bị ngã sóng soài, lăn hồi phục mọi hướng); 1 lần/hiệp được **né miễn phí** một đòn bất kỳ.
- **Chiêu:** *Vồ Chuột* (lao chéo từ trên không) · *Cào Liên Hoàn* · *Leo Tường* (bám mép sân, bật nhảy).
- **Tuyệt kỹ – "Miêu Ảnh Cửu Mệnh":** 9 bóng mèo tấn công từ mọi hướng.
- **Điểm yếu:** máu thấp; đòn yếu ở mặt đất; dễ bị đòn chống không (anti-air) trừng phạt.
- **Phương án quốc tế:** trang phục/biến thể **Thỏ Ngọc** cho thị trường Trung Quốc, Hàn Quốc (cùng bộ chiêu).

#### 🐉 THÌN – RỒNG "Long Vương"
- **Thực tế:** (sinh vật huyền thoại) — tham chiếu rắn, cá sấu: thân dài, quẫy đuôi.
- **Truyền thuyết:** hô mưa gọi gió; dừng lại làm mưa cứu dân nên chỉ về thứ 5.
- **Bản Năng – "Hô Phong Hoán Vũ":** gọi mưa trên sân trong 8 giây — chiêu nước tầm xa mạnh hơn nhưng Rồng **không hồi Khí** trong thời gian đó.
- **Chiêu:** *Long Châu* (cầu nước bay thẳng) · *Thủy Long Quyển* (cột nước chống không) · *Long Vĩ* (quẫy đuôi tầm xa).
- **Tuyệt kỹ – "Cửu Long Giáng Thế":** rồng lớn bay vòng sân, phun sóng nước.
- **Điểm yếu:** cơ động kém nhất, đòn cận chiến khởi động chậm; khi bị áp sát gần như chỉ có thể đỡ.
- **Lý do không mạnh tuyệt đối:** dù là biểu tượng quyền lực, Rồng chỉ thống trị khoảng cách xa — đúng truyền thuyết "về thứ 5".

#### 🐍 TỴ – RẮN "Độc Xà"
- **Thực tế:** nọc độc, quấn siết, lột xác, tấn công bất ngờ.
- **Truyền thuyết:** quấn vào vó Ngựa đi nhờ, đến gần đích thì trườn ra dọa Ngựa.
- **Bản Năng – "Nọc Độc":** đòn trúng cộng dồn độc (tối đa 5 tầng), mỗi tầng mất máu dần; độc không thể hạ gục (dừng ở 1 máu).
- **Chiêu:** *Phun Nọc* (bắn tầm xa, chậm) · *Quấn Siết* (đòn vật giữ lâu) · *Lột Xác* (để lại xác rắn làm bẫy, thân thật dịch chuyển ngắn).
- **Tuyệt kỹ – "Vạn Xà Trận":** sân biến thành hang rắn, mọi tầng độc phát nổ.
- **Điểm yếu:** máu thấp; sát thương trực tiếp thấp, phụ thuộc thời gian; khó chơi nhất nhóm.

#### 🐎 NGỌ – NGỰA "Thiên Lý Mã"
- **Thực tế:** tốc độ, sức bền, đá hậu cực mạnh.
- **Truyền thuyết:** sắp về thứ 6 thì bị Rắn dọa, về thứ 7.
- **Bản Năng – "Đà Phi Nước Đại":** chạy liên tục tích **Đà** (3 cấp); đòn đầu tiên khi có Đà mạnh hơn theo cấp. Bị đánh trúng → mất Đà.
- **Chiêu:** *Phi Mã* (lao tới xuyên qua đối thủ) · *Đá Hậu* (quay lưng đá, rất mạnh, rất hở) · *Chồm Vó* (chống không).
- **Tuyệt kỹ – "Vạn Mã Bôn Đằng":** đàn ngựa phi qua sân.
- **Điểm yếu:** khó dừng lại khi đang có đà (bị trừng phạt nếu đoán sai); cơ động trên không kém.

#### 🐐 MÙI – DÊ "Sơn Dương"
- **Thực tế:** leo vách đá dựng đứng, húc sừng, sống bền bỉ ở vùng khắc nghiệt.
- **Truyền thuyết:** hợp tác với Khỉ và Gà kết bè qua sông.
- **Bản Năng – "Gặm Cỏ":** đứng yên gặm cỏ hồi máu dần (máu tạm – mất nếu bị đánh trúng). Rủi ro cao, phần thưởng cao.
- **Chiêu:** *Lùi Lấy Đà – Húc* (giữ ← rồi →, kiểu "charge") · *Bật Vách* (nhảy từ tường) · *Sừng Chắn* (thế đỡ phản đòn).
- **Tuyệt kỹ – "Đồng Tâm Qua Sông":** gọi Khỉ và Gà hỗ trợ một đòn chung.
- **Điểm yếu:** sát thương trung bình, chậm khi tấn công; thiếu đòn khởi đầu nhanh.

#### 🐒 THÂN – KHỈ "Tề Thiên"
- **Thực tế:** thông minh, bắt chước, dùng công cụ, leo trèo.
- **Truyền thuyết:** hình tượng Tôn Ngộ Không (văn học cổ điển – không vướng bản quyền, nhưng **tạo hình phải tự thiết kế**, không sao chép phim/game hiện đại).
- **Bản Năng – "Học Lỏm":** sao chép **chiêu đặc biệt gần nhất** mà đối thủ dùng, sức mạnh 70%, dùng 1 lần.
- **Chiêu:** *Như Ý Côn* (gậy vươn dài) · *Ném Quả* (trái cây bay theo đường cong) · *Cân Đẩu* (lộn nhào né đòn).
- **Tuyệt kỹ – "Phân Thân Thuật":** nhổ lông hóa nhiều khỉ con.
- **Điểm yếu:** máu thấp; sức mạnh phụ thuộc trình độ người chơi và chiêu của đối thủ.

#### 🐓 DẬU – GÀ "Chiến Kê"
- **Thực tế:** gà chọi Việt Nam: đá cựa, nhảy đá, mổ, phản ứng cực nhanh.
- **Truyền thuyết:** tìm được bè gỗ giúp nhóm Dê – Khỉ qua sông.
- **Bản Năng – "Cựa Sắt":** thế thủ — nếu đối thủ đánh vào đúng lúc, Gà **phản đòn** gây sát thương gấp đôi. Đoán sai thì bị hở.
- **Chiêu:** *Phi Cước* (nhảy đá 2 chân) · *Mổ Liên Hoàn* · *Xòe Cánh* (đẩy lùi đối thủ).
- **Tuyệt kỹ – "Gáy Sáng":** tiếng gáy làm choáng, sau đó chuỗi đá cựa.
- **Điểm yếu:** máu thấp; phụ thuộc đọc vị đối thủ.

#### 🐕 TUẤT – CHÓ "Trung Khuyển"
- **Thực tế:** đánh hơi, trung thành, cắn giữ, chạy bền.
- **Truyền thuyết:** ham tắm sông nên về thứ 11.
- **Bản Năng – "Đánh Hơi":** đánh dấu đối thủ (10 giây) — Chó thấy trước hướng chiêu dịch chuyển/ẩn của đối thủ và +8% sát thương lên mục tiêu.
- **Chiêu:** *Sủa Vang* (sóng âm tầm trung) · *Cắn Giữ* · *Lao Vồ* (chống không).
- **Tuyệt kỹ – "Hộ Chủ":** chuỗi cắn – vồ – quật.
- **Vai trò:** nhân vật **hướng dẫn người mới**, đủ công cụ cho mọi tình huống nhưng không xuất sắc ở đâu.
- **Điểm yếu:** không có điểm mạnh vượt trội; người giỏi sẽ chuyển sang nhân vật chuyên biệt.

#### 🐖 HỢI – LỢN "Dã Trư"
- **Thực tế:** lợn rừng to, da dày, húc ủi mạnh, ăn tạp.
- **Truyền thuyết:** ăn no rồi ngủ nên về chót.
- **Bản Năng – "No Bụng":** ăn đồ vật trên sân để hồi máu và tăng **giáp**; càng no càng chậm (3 cấp). Bị đánh mạnh thì "tiêu" bớt.
- **Chiêu:** *Ủi Đất* (lao húc thấp) · *Lăn Tròn* (cuộn người lăn) · *Ngủ Gật* (thế giả ngủ – nếu bị đánh thì bật dậy phản đòn).
- **Tuyệt kỹ – "Trư Bát Giới Ngã Ngồi":** nhảy cao, đè xuống toàn bộ mặt đất.
- **Điểm yếu:** chậm, tầm ngắn, dễ bị thả diều; ăn đồ giữa trận rất mạo hiểm.

---

## 4. Chiến lược cân bằng — "Không con nào mạnh tuyệt đối"

### 4.1. Tam giác lối chơi (kéo – búa – bao, mức độ nhẹ)

```
        ÁP SÁT (Chuột, Mèo, Ngựa, Gà)
          ↗ thắng thế            ↘ bị khắc nhẹ
TẦM XA (Rồng, Rắn, Khỉ)  ←──  XE TĂNG/VẬT (Trâu, Hổ, Dê, Lợn)
                    thắng thế
        Cân bằng: Chó (không thắng thế, không bị khắc)
```
Áp sát vượt qua tầm xa · Tầm xa thả diều xe tăng · Xe tăng chịu được và vật nhóm áp sát.

### 4.2. Quy tắc bắt buộc

| # | Quy tắc | Chỉ tiêu |
|---|---|---|
| 1 | Tổng chỉ số mỗi con = 15 | Bắt buộc |
| 2 | Không cặp đấu nào nghiêng quá **6–4** (60% thắng) | Đo bằng dữ liệu |
| 3 | Tỷ lệ thắng mỗi con | **47% – 53%** |
| 4 | Tỷ lệ được chọn | Không con nào > 15% hoặc < 4% kéo dài quá 1 mùa |
| 5 | Mọi cơ chế Bản Năng đều có rủi ro khi dùng hụt | Bắt buộc |
| 6 | Không có đòn "vô hạn" (combo lặp vô tận) | Giới hạn combo bằng "trọng lực combo" |

### 4.3. Quy trình cân bằng
1. **Bảng tính khung hình (frame data):** mỗi đòn có khởi động / trúng / hồi phục; quản lý bằng Excel/Google Sheets để cả đội cùng xem.
2. **AI tự đấu:** cho máy đánh 10.000 trận/cặp để phát hiện lỗi cân bằng sớm.
3. **Thử nghiệm kín** với người chơi đối kháng có kinh nghiệm.
4. **Thu thập số liệu sau phát hành:** tỷ lệ thắng theo bậc xếp hạng, tỷ lệ chọn, thời gian trận.
5. **Bản vá cân bằng** mỗi 6–8 tuần, chỉnh nhỏ (±5%) thay vì đập đi làm lại.

---

## 5. Đồ họa 2.5D

### 5.1. Phong cách
- **Mô hình 3D, kết xuất cel-shading** (tô bóng kiểu hoạt hình) + **viền mực**, gợi nét tranh thủy mặc.
- **Bảng màu** lấy cảm hứng tranh **Đông Hồ, sơn mài, gốm Bát Tràng**: đỏ son, vàng nghệ, xanh lam, đen sơn.
- **Nhân hóa vừa phải:** dáng đứng 2 chân, mặc võ phục/giáp mang họa tiết dân tộc, nhưng giữ đặc điểm loài (đuôi, sừng, móng, mõm).
- Mỗi con giáp có **màu chủ đạo theo Ngũ hành** để người xem nhận ra ngay (Thủy – xanh đen, Mộc – xanh lá, Hỏa – đỏ, Kim – trắng bạc, Thổ – vàng nâu).

### 5.2. Tham chiếu kỹ thuật (đã được kiểm chứng ở game thương mại)
| Tham chiếu | Học điều gì |
|---|---|
| Street Fighter IV/V/6 | Mô hình 3D trên mặt phẳng 2D, hiệu ứng mực |
| Guilty Gear Xrd / Strive | Cel-shading giả 2D, hoạt ảnh "giật khung" (limited animation) |
| Okami | Phong cách thủy mặc Á Đông |

### 5.3. Sàn đấu (6 sàn khi ra mắt, mỗi sàn dành cho 2 con giáp)
1. **Bờ sông Ngọc Hoàng** (đích đến cuộc đua) – Tý, Sửu
2. **Rừng đại ngàn** – Dần, Mão
3. **Cửa biển giông bão** – Thìn, Tỵ
4. **Thảo nguyên – đường đua** – Ngọ, Mùi
5. **Núi đá và chùa cổ** – Thân, Dậu
6. **Làng quê đồng lúa** – Tuất, Hợi

Hậu cảnh có chuyển động (người dân, lễ hội, thời tiết), nhưng **không gây nhiễu** vùng chiến đấu.

### 5.4. Ngân sách đồ họa mỗi nhân vật (ước tính, cần kiểm chứng theo nền tảng)
- Mô hình: 40.000–60.000 tam giác (PC), bản rút gọn cho mobile.
- Hoạt ảnh: khoảng 150–200 đoạn mỗi nhân vật.
- 1 trang phục mặc định + 3 bảng màu; trang phục bán thêm làm sau.

---

## 6. Công nghệ — so sánh phương án

| Tiêu chí | **Unity (URP)** | **Unreal Engine 5** | Godot 4 |
|---|---|---|---|
| Đồ họa cel-shading | Tốt, cần tự viết shader | Rất tốt, nhiều mẫu sẵn | Khá |
| Lên mobile | **Tốt nhất** | Nặng | Tốt |
| Chi phí | Phí theo doanh thu/gói thuê bao (cần kiểm tra chính sách hiện hành) | 5% doanh thu vượt ngưỡng | Miễn phí |
| Nhân lực tại Việt Nam | **Đông nhất** | Ít hơn | Ít |
| Mạng đối kháng (rollback) | Có thư viện bên thứ ba | Có thư viện bên thứ ba | Tự làm nhiều |

**Khuyến nghị:** **Unity (URP)** nếu ưu tiên mobile và tuyển người ở Việt Nam; **Unreal** nếu ưu tiên chất lượng hình ảnh PC/console.
> Lưu ý: chính sách phí của Unity và Unreal thay đổi theo thời gian — cần đối chiếu điều khoản hiện hành trước khi quyết định.

**Yêu cầu kỹ thuật bắt buộc:**
- Logic chiến đấu chạy cố định **60 khung hình/giây**, tách biệt với hình ảnh.
- **Mạng rollback** (kiểu GGPO) cho đấu trực tuyến — đây là yếu tố sống còn với game đối kháng.
- Logic tất định (deterministic): cùng đầu vào → cùng kết quả, phục vụ phát lại và chống gian lận.

---

## 7. Chế độ chơi

| Chế độ | Giai đoạn |
|---|---|
| Huấn luyện (hiển thị frame data, hitbox) | Ra mắt |
| Cốt truyện "Cuộc Đua Thứ Hai" (mỗi con 1 nhánh truyện ngắn) | Ra mắt |
| Đấu máy / Đấu 2 người cùng máy | Ra mắt |
| Đấu trực tuyến thường + xếp hạng | Ra mắt |
| Giải đấu "Hội Làng" theo mùa | Sau ra mắt |
| Đồng đội 3v3 (đúng nhóm Tam hợp: Thân–Tý–Thìn, Tỵ–Dậu–Sửu, Dần–Ngọ–Tuất, Hợi–Mão–Mùi) | Mở rộng |

---

## 8. Lộ trình phát triển

| Giai đoạn | Thời lượng (ước tính) | Mục tiêu đầu ra |
|---|---|---|
| 0. Tiền sản xuất | 2–3 tháng | Tài liệu thiết kế, phác thảo 12 nhân vật, chọn công cụ |
| 1. Bản mẫu (prototype) | 3 tháng | **3 nhân vật**: Tuất (cân bằng), Sửu (xe tăng), Tý (áp sát) – hình khối đơn giản, chứng minh "đánh có vui không" |
| 2. Lát cắt dọc (vertical slice) | 4 tháng | 3 nhân vật hoàn thiện đồ họa, 1 sàn đấu, mạng rollback |
| 3. Alpha | 6 tháng | 8 nhân vật, 4 sàn, chế độ xếp hạng thử |
| 4. Beta mở | 3 tháng | Đủ 12 nhân vật, 6 sàn, thu số liệu cân bằng |
| 5. Phát hành + vận hành | Liên tục | Bản vá cân bằng 6–8 tuần, trang phục theo mùa/Tết |

**Tổng ước tính:** khoảng 18–22 tháng với đội 15–25 người.
> Đây là ước tính sơ bộ dựa trên quy mô game đối kháng độc lập tầm trung; **chưa chắc chắn**, cần lập dự toán chi tiết khi có đội cụ thể.

**Gợi ý thời điểm:** ra mắt hoặc mở Beta **dịp Tết Nguyên đán** để tận dụng chủ đề con giáp; mỗi năm làm sự kiện cho con giáp của năm đó.

---

## 9. Rủi ro và cách giảm thiểu

| Rủi ro | Mức độ | Biện pháp |
|---|---|---|
| Mạng trực tuyến giật, lag | Cao | Làm rollback từ giai đoạn lát cắt dọc, không để cuối |
| Mất cân bằng nhân vật | Cao | Ngân sách chỉ số + AI tự đấu + số liệu thực |
| Khối lượng hoạt ảnh lớn (12 nhân vật) | Cao | Dùng chung bộ xương theo nhóm thân hình (bốn chân/hai chân/thân dài) |
| Trùng lặp hình tượng có bản quyền (Tôn Ngộ Không, Trư Bát Giới bản phim…) | Trung bình | Chỉ dựa vào nguyên tác văn học, tự thiết kế tạo hình |
| Nhạy cảm văn hóa giữa các nước (Mèo/Thỏ) | Thấp | Biến thể Thỏ cho thị trường quốc tế |
| Người mới thấy khó | Trung bình | Chế độ Đơn giản + nhân vật Chó dẫn dắt + hướng dẫn từng nhân vật |

---

## 10. Bước tiếp theo đề xuất

1. Duyệt bảng chỉ số và cơ chế Bản Năng của 12 con giáp (mục 3).
2. Phác thảo ý tưởng (concept art) cho 3 nhân vật bản mẫu: **Tuất, Sửu, Tý**.
3. Lập bảng tính frame data mẫu cho 3 nhân vật này.
4. Quyết định công cụ (Unity hay Unreal) theo nền tảng ưu tiên.
5. Dựng bản mẫu hình khối đơn giản, thử nghiệm cảm giác đánh trước khi đầu tư đồ họa.
