export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/60 py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 font-bold text-white">
              D
            </div>
            <span className="font-semibold">DroneWork</span>
          </div>
          <p className="text-sm text-slate-600">
            Nền tảng kết nối người tìm việc & người đăng việc trong ngành Drone.
          </p>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">Khám phá</h4>
          <ul className="space-y-1 text-sm text-slate-600">
            <li>
              <a className="hover:underline" href="#jobs">
                Tìm việc
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#post">
                Đăng tuyển dụng
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">Hỗ trợ</h4>
          <ul className="space-y-1 text-sm text-slate-600">
            <li>
              <a className="hover:underline" href="#help">
                Liên hệ
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#guide">
                Hướng dẫn sử dụng
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">Pháp lý</h4>
          <ul className="space-y-1 text-sm text-slate-600">
            <li>
              <a className="hover:underline" href="#privacy">
                Chính sách bảo mật
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#terms">
                Điều khoản sử dụng
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl px-4 text-xs text-slate-500">
        © {new Date().getFullYear()} DroneWork. All rights reserved.
      </div>
    </footer>
  );
}
