import React from 'react';
import { X, Gamepad2, Keyboard, Sparkles, Shield, Flame, Crosshair, Phone, Layers, Trophy } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrigger30Lives: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
  onTrigger30Lives,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-900 border-2 border-red-600 rounded-xl p-6 text-white shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-arcade text-lg">CONTRA ARCADE</span>
            <span className="text-zinc-400 text-xs font-arcade">CẨM NANG CHIẾN ĐẤU</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-5 text-sm">
          {/* Creator Introduction Card Requested by User */}
          <div className="bg-gradient-to-r from-red-950/70 via-amber-950/60 to-zinc-900 border-2 border-amber-500/70 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-400 font-arcade text-xs font-bold">
                <span className="px-2 py-0.5 bg-amber-500/30 rounded border border-amber-400/50">TÁC GIẢ</span>
                <span>GIỚI THIỆU BY HẢI HOÀNG</span>
              </div>
              <div className="text-lg font-bold text-white font-arcade tracking-wider">
                HẢI HOÀNG • <span className="text-amber-300">0918001944</span>
              </div>
              <p className="text-xs text-zinc-300 max-w-md">
                Phiên bản Contra Arcade Remastered với 4 vòng đấu hoàn chỉnh, 4 đại trùm cuối độc đáo, đồ họa Pixel art cổ điển sắc nét và tinh chỉnh tốc độ di chuyển cân bằng.
              </p>
            </div>
            <a
              href="tel:0918001944"
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-arcade text-xs font-bold rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Phone className="w-4 h-4" />
              GỌI / ZALO: 0918001944
            </a>
          </div>

          {/* 4 Campaign Stages & 4 Bosses Overview */}
          <div>
            <h3 className="text-xs font-arcade text-yellow-400 mb-2.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> CHIẾN DỊCH 4 VÒNG ĐẤU & 4 ĐẠI TRÙM CUỐI
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-emerald-950/40 border border-emerald-600/50 p-3 rounded-lg">
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="text-emerald-400 font-arcade">VÒNG 1: ĐẢO NHIỆT ĐỚI</span>
                  <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-200">JUNGLE</span>
                </div>
                <p className="text-zinc-300 text-[11px] mb-1">Chiến đấu qua rừng rậm, vượt hào nước và cầu gỗ phát nổ.</p>
                <div className="text-[11px] text-amber-300 font-semibold">
                  ⚔️ Trùm: Pháo Đài Bức Tường (Defense Wall)
                </div>
              </div>

              <div className="bg-sky-950/40 border border-sky-600/50 p-3 rounded-lg">
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="text-sky-400 font-arcade">VÒNG 2: HẺM THÁC NƯỚC</span>
                  <span className="text-[10px] bg-sky-900/60 px-1.5 py-0.5 rounded text-sky-200">WATERFALL</span>
                </div>
                <p className="text-zinc-300 text-[11px] mb-1">Leo vách đá cheo leo, né hòn đá lăn và lính bắn tỉa ẩn nấp.</p>
                <div className="text-[11px] text-amber-300 font-semibold">
                  ⚔️ Trùm: Rồng Cơ Khí (Bima Alien Dragon)
                </div>
              </div>

              <div className="bg-indigo-950/40 border border-indigo-600/50 p-3 rounded-lg">
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="text-indigo-400 font-arcade">VÒNG 3: BĂNG TUYẾT BẮC CỰC</span>
                  <span className="text-[10px] bg-indigo-900/60 px-1.5 py-0.5 rounded text-indigo-200">SNOW FIELD</span>
                </div>
                <p className="text-zinc-300 text-[11px] mb-1">Bão tuyết mịt mù, công sự kiên cố và tháp pháo laser xoay.</p>
                <div className="text-[11px] text-amber-300 font-semibold">
                  ⚔️ Trùm: Xe Tăng Thiết Giáp (Armored Tank)
                </div>
              </div>

              <div className="bg-red-950/40 border border-red-600/50 p-3 rounded-lg">
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="text-red-400 font-arcade">VÒNG 4: HANG Ổ QUÁI VẬT</span>
                  <span className="text-[10px] bg-red-900/60 px-1.5 py-0.5 rounded text-red-200">FINAL BOSS</span>
                </div>
                <p className="text-zinc-300 text-[11px] mb-1">Đột nhập căn cứ sinh học ngoài hành tinh Red Falcon.</p>
                <div className="text-[11px] text-yellow-300 font-semibold">
                  👑 Trùm Cuối: Hoàng Đế Java (Emperor Alien Heart)
                </div>
              </div>
            </div>
          </div>

          {/* Konami Code Banner */}
          <div className="bg-gradient-to-r from-yellow-950/80 to-amber-950/80 border border-yellow-500/80 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-yellow-400 font-arcade text-xs">
                <Sparkles className="w-4 h-4" />
                MÃ BẢO BỐI KONAMI (30 MẠNG)
              </div>
              <div className="font-arcade text-xs text-white tracking-widest bg-black/60 px-2 py-1 rounded inline-block">
                ↑ ↑ ↓ ↓ ← → ← → B A
              </div>
              <p className="text-xs text-zinc-300">
                Nhập chuỗi phím trên bàn phím lúc chơi hoặc bấm nút kích hoạt ngay:
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onTrigger30Lives();
                onClose();
              }}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-arcade text-xs font-bold rounded shadow-lg active:scale-95 transition-transform whitespace-nowrap"
            >
              KÍCH HOẠT 30 MẠNG
            </button>
          </div>

          {/* Controls Table */}
          <div>
            <h3 className="text-xs font-arcade text-sky-400 mb-2 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4" /> PHÍM ĐIỀU KHIỂN (KEYBOARD & GAMEPAD)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-800/60 p-3 rounded-lg border border-zinc-700">
                <span className="text-sky-300 font-bold block mb-1">NGƯỜI CHƠI 1 (BILL - Áo Xanh)</span>
                <ul className="space-y-1 text-zinc-300">
                  <li><strong className="text-white">Di chuyển:</strong> Phím mũi tên (Arrow Keys) hoặc WASD</li>
                  <li><strong className="text-white">Bắn (Fire):</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">J</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">Z</kbd></li>
                  <li><strong className="text-white">Nhảy (Jump):</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">K</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">X</kbd></li>
                  <li><strong className="text-white">Nằm / Ngồi / Lặn:</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded">↓</kbd> (Down / S)</li>
                  <li><strong className="text-white">Nhảy tụt tầng:</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded">↓</kbd> + <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded">Nhảy</kbd></li>
                </ul>
              </div>

              <div className="bg-zinc-800/60 p-3 rounded-lg border border-zinc-700">
                <span className="text-red-300 font-bold block mb-1">NGƯỜI CHƠI 2 (LANCE - Áo Đỏ)</span>
                <ul className="space-y-1 text-zinc-300">
                  <li><strong className="text-white">Di chuyển:</strong> Numpad 8 4 5 6 hoặc I J K L</li>
                  <li><strong className="text-white">Bắn (Fire):</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">U</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">Num 1</kbd></li>
                  <li><strong className="text-white">Nhảy (Jump):</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">I</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-amber-300 font-bold">Num 2</kbd></li>
                  <li><strong className="text-white">Tạm dừng (Pause):</strong> Phím <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded">P</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded">ESC</kbd></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Weapon Power-Ups */}
          <div>
            <h3 className="text-xs font-arcade text-red-400 mb-2 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4" /> KHO VŨ KHÍ & VẬT PHẨM
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-red-950/40 border border-red-600/50 p-2.5 rounded flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-red-600 font-arcade text-white flex items-center justify-center font-bold text-xs shrink-0">S</span>
                <div>
                  <strong className="text-white block">Spread Gun</strong>
                  <span className="text-[11px] text-zinc-300">Đạn chùm 5 tia cực mạnh</span>
                </div>
              </div>

              <div className="bg-amber-950/40 border border-amber-600/50 p-2.5 rounded flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-amber-600 font-arcade text-white flex items-center justify-center font-bold text-xs shrink-0">M</span>
                <div>
                  <strong className="text-white block">Machine Gun</strong>
                  <span className="text-[11px] text-zinc-300">Súng liên thanh tốc độ cao</span>
                </div>
              </div>

              <div className="bg-cyan-950/40 border border-cyan-600/50 p-2.5 rounded flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-cyan-600 font-arcade text-white flex items-center justify-center font-bold text-xs shrink-0">L</span>
                <div>
                  <strong className="text-white block">Laser Gun</strong>
                  <span className="text-[11px] text-zinc-300">Tia laser xuyên mục tiêu</span>
                </div>
              </div>

              <div className="bg-orange-950/40 border border-orange-600/50 p-2.5 rounded flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-orange-600 font-arcade text-white flex items-center justify-center font-bold text-xs shrink-0">F</span>
                <div>
                  <strong className="text-white block">Flame Gun</strong>
                  <span className="text-[11px] text-zinc-300">Cầu lửa xoáy sát thương lớn</span>
                </div>
              </div>

              <div className="bg-sky-950/40 border border-sky-600/50 p-2.5 rounded flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-sky-600 font-arcade text-white flex items-center justify-center font-bold text-xs shrink-0">B</span>
                <div>
                  <strong className="text-white block">Barrier</strong>
                  <span className="text-[11px] text-zinc-300">Khiên hộ thể bất tử 15 giây</span>
                </div>
              </div>

              <div className="bg-yellow-950/40 border border-yellow-600/50 p-2.5 rounded flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-yellow-600 font-arcade text-white flex items-center justify-center font-bold text-xs shrink-0">!</span>
                <div>
                  <strong className="text-white block">Bomb Capsule</strong>
                  <span className="text-[11px] text-zinc-300">Quét sạch toàn bộ kẻ địch</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Tips */}
          <div className="bg-zinc-800/40 border border-zinc-700/60 p-3 rounded-lg text-xs text-zinc-300 space-y-1">
            <strong className="text-yellow-400 block font-arcade text-[10px]">MẸO CHIẾN ĐẤU CỔ ĐIỂN & RUNG PHẢN HỒI:</strong>
            <p>• Khi xuống nước, bạn có thể nằm rạp người (<kbd className="px-1 bg-zinc-700 rounded">↓</kbd>) để lặn xuống né đạn bay ngang của kẻ thù.</p>
            <p>• Bắn các phi thuyền quả bóng bay (Capsule) trên bầu trời hoặc các ổ cảm biến trên vách đá để nhặt đạn súng mới.</p>
            <p>• Cầu trên sông sẽ phát nổ sau vài giây khi bạn bước lên — hãy nhảy vượt qua thật nhanh!</p>
            <p>• <strong className="text-amber-300">Rung phản hồi (Haptic):</strong> Máy rung giật khi bị trúng đạn/mất mạng và rung dồn dập liên tục khi tiêu diệt trùm cuối mỗi vòng. Bạn có thể bấm biểu tượng Rung trên thanh công cụ để bật/tắt bất kỳ lúc nào.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-[11px] text-zinc-400 font-arcade">
            Phát triển bởi <span className="text-amber-400 font-bold">Hải Hoàng (0918001944)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 font-arcade text-xs text-white rounded shadow"
          >
            ĐÃ HIỂU, VÀO TRẬN!
          </button>
        </div>
      </div>
    </div>
  );
};
