import {
  ClipboardList,
  LockKeyhole,
  Mail,
  MessageCircle,
  Search,
} from "lucide-react";
import { Footer } from "../components/Footer";
import { useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Trang Đăng nhập – Modern UI (TailwindCSS)
 * Phong cách đồng bộ với trang TOP: xanh điện #3B82F6, trắng, xám đậm
 * - Card trung tâm, bo góc lớn, bóng đổ mềm
 * - Typography rõ ràng, nhiều khoảng trắng
 * - Trạng thái hover/focus rõ ràng, accessible
 * - Responsive tốt cho mobile/tablet/desktop
 */

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'seeker') {
        navigate('/seeker/find');
      } else if (user.role === 'poster') {
        navigate('/poster/jobs');
      }
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-20 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="DroneWork logo" className="h-9 w-9 rounded-xl" />
            <span className="text-lg font-semibold tracking-tight">DroneWork</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-16 lg:py-20">
        {/* Panel trái: Brand & lợi ích ngắn */}
        <section className="order-2 lg:order-1">
          <div className="mx-auto max-w-xl">
            <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Chào mừng trở lại 👋</h1>
            <p className="mb-8 text-slate-600">
              Đăng nhập để tiếp tục <span className="font-medium">tìm việc</span> hoặc <span className="font-medium">đăng dự án</span> trong hệ sinh thái DroneWork.
            </p>

            <ul className="space-y-3">
              {[
                { title: "Tìm kiếm việc nhanh chóng", desc: "Bộ lọc thông minh – gợi ý phù hợp", icon: Search },
                { title: "Quản lý hồ sơ dễ dàng", desc: "Lưu dự án yêu thích, theo dõi ứng tuyển", icon: ClipboardList },
                { title: "Nhắn tin trực tiếp", desc: "Trao đổi nhanh với đối tác", icon: MessageCircle },
              ].map((item, i) => (
                <li key={i} className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
                  <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-blue-600/10 ring-1 ring-blue-600/20 group-hover:bg-blue-600/15">
                    <item.icon className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Panel phải: Form đăng nhập */}
        <section className="order-1 lg:order-2">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold tracking-tight">Đăng nhập</h2>
                <p className="mt-1 text-sm text-slate-600">Nhập email và mật khẩu của bạn</p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                aria-labelledby="login-form"
              >
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <label className="block" htmlFor="email">
                  <span className="mb-1 block text-sm font-medium">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 text-[15px] outline-none ring-4 ring-transparent transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
                    />
                  </div>
                </label>

                <label className="block" htmlFor="password">
                  <span className="mb-1 block text-sm font-medium">Mật khẩu</span>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      id="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 text-[15px] outline-none ring-4 ring-transparent transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
                    />
                  </div>
                </label>

                <div className="flex items-center justify-between">
                  <label className="flex select-none items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                    Ghi nhớ đăng nhập
                  </label>
                  <a href="#forgot" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/30"
                >
                  Đăng nhập
                </button>

                <div className="relative py-2 text-center">
                  <span className="bg-white px-2 text-xs text-slate-500">hoặc</span>
                  <div className="absolute inset-x-0 top-1/2 -z-10 h-px -translate-y-1/2 bg-slate-200" />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,35.195,44,30.028,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                    Đăng nhập với Google
                  </button>
                  <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-5 w-5" fill="#0A66C2">
                      <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"/>
                    </svg>
                    Đăng nhập với LinkedIn
                  </button>
                </div>

                <p className="text-center text-sm text-slate-600">
                  Chưa có tài khoản? {" "}
                  <a href="#signup" className="font-semibold text-blue-600 hover:underline">Đăng ký ngay</a>
                </p>
              </form>
            </div>

            {/* Demo credentials */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
              <h4 className="font-semibold">Thông tin đăng nhập Demo</h4>
              <div className="mt-2 space-y-1">
                <div><strong className="font-medium text-slate-800">Seeker:</strong> seeker@email.com / 12345678</div>
                <div><strong className="font-medium text-slate-800">Poster:</strong> poster@email.com / 12345678</div>
              </div>
            </div>

            {/* Liên kết pháp lý */}
            <p className="mt-6 text-center text-xs text-slate-500">
              Khi đăng nhập, bạn đồng ý với <a className="underline hover:no-underline" href="#terms">Điều khoản sử dụng</a> và <a className="underline hover:no-underline" href="#privacy">Chính sách bảo mật</a>.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
