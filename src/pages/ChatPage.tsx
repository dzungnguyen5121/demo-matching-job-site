// App.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "../components/Header";
import { useAuth } from "../contexts/AuthContext";

/* =============================================================================
   Types (rút gọn cho MVP chat)
============================================================================= */
type Role = "seeker" | "poster";
type MsgStatus = "sent" | "delivered" | "read";
type MsgType = "text";

interface Conversation {
  id: string;
  jobId: string;
  jobTitle: string;
  peer: { id: string; name: string; role: Role; avatarUrl?: string; online?: boolean };
  lastMessage: string;
  lastAt: string;       // ISO
  unreadCount: number;
  pinned?: boolean;
  muted?: boolean;
  closed?: boolean;
}

interface Message {
  id: string;
  convId: string;
  senderId: string;
  type: MsgType;
  text: string;
  status: MsgStatus;
  createdAt: string;    // ISO
}

/* =============================================================================
   Mock data
============================================================================= */
const nowISO = () => new Date().toISOString();
const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`);

const MOCK_CONVS: Conversation[] = [
  {
    id: "c1",
    jobId: "JOB-123",
    jobTitle: "Khảo sát mái nhà bằng drone",
    peer: { id: "uPoster1", name: "Dronex Co.", role: "poster", online: true },
    lastMessage: "Hẹn bạn chiều mai nhé?",
    lastAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    unreadCount: 2,
    pinned: true,
  },
  {
    id: "c2",
    jobId: "JOB-207",
    jobTitle: "Lập bản đồ hiện trạng công trường",
    peer: { id: "uPoster2", name: "BuildPro", role: "poster", online: false },
    lastMessage: "Tôi đã nhận tài liệu",
    lastAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    unreadCount: 0,
  },
  {
    id: "c3",
    jobId: "JOB-404",
    jobTitle: "Quay video công trình tiến độ",
    peer: { id: "uPoster3", name: "Vision Studio", role: "poster", online: false },
    lastMessage: "Tôi cần thêm ví dụ video",
    lastAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    unreadCount: 1,
  },
];

const MOCK_MSGS: Message[] = [
  { id: uid(), convId: "c1", senderId: "uPoster1", type: "text", text: "Chào bạn! Dự án mái nhà tuần này OK chứ?", status: "read", createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
  { id: uid(), convId: "c1", senderId: "seeker@email.com",        type: "text", text: "Chào anh, em sẵn sàng ạ!", status: "read", createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString() },
  { id: uid(), convId: "c1", senderId: "uPoster1", type: "text", text: "Hẹn bạn chiều mai nhé?", status: "delivered", createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },

  { id: uid(), convId: "c2", senderId: "seeker@email.com",        type: "text", text: "Đã gửi mẫu DEM/DSM.", status: "read", createdAt: new Date(Date.now() - 1000 * 60 * 190).toISOString() },
  { id: uid(), convId: "c2", senderId: "uPoster2", type: "text", text: "Tôi đã nhận tài liệu", status: "read", createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() },

  { id: uid(), convId: "c3", senderId: "uPoster3", type: "text", text: "Tôi cần thêm ví dụ video", status: "delivered", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString() },
];

/* =============================================================================
   Utils
============================================================================= */
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ`;
  const d = Math.floor(h / 24);
  return `${d} ngày`;
}
function isSameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

/* =============================================================================
   Conversation List (left)
============================================================================= */
function ConversationItem({
  conv, active, onClick,
}: { conv: Conversation; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border ${
        active ? "border-slate-300 bg-white" : "border-transparent hover:bg-white/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-slate-700">
            {conv.peer.avatarUrl ? <img src={conv.peer.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : conv.peer.name.charAt(0)}
          </div>
          {conv.peer.online && <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-semibold">{conv.peer.name}</div>
            <div className="shrink-0 text-xs text-slate-500">{timeAgo(conv.lastAt)}</div>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
            <span className="truncate rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-600/20">
              {conv.jobTitle}
            </span>
            {conv.pinned && <span title="Đã ghim">⭐</span>}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <div className="truncate text-sm text-slate-600">{conv.lastMessage}</div>
            {conv.unreadCount > 0 && (
              <span className="ml-2 grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {conv.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function ConversationList({
  conversations, activeId, setActiveId, onSearch,
}: {
  conversations: Conversation[];
  activeId?: string;
  setActiveId: (id: string) => void;
  onSearch: (q: string) => void;
}) {
  return (
    <aside className="w-full sm:w-80 shrink-0 border-r border-slate-200 bg-slate-50">
      <div className="p-3">
        <div className="relative">
          <input
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Tìm theo tên, job, nội dung…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-4 ring-transparent placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 16rem)" }}>
        {conversations.map((c) => (
          <ConversationItem key={c.id} conv={c} active={c.id === activeId} onClick={() => setActiveId(c.id)} />
        ))}
        {conversations.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Không có hội thoại nào.
          </div>
        )}
      </div>
    </aside>
  );
}

/* =============================================================================
   Thread (right)
============================================================================= */
function Bubble({
  mine, msg,
}: { mine: boolean; msg: Message }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[68%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          mine ? "bg-blue-600 text-white rounded-br-sm" : "bg-white text-slate-800 rounded-bl-sm border border-slate-200"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{msg.text}</div>
        <div className={`mt-1 text-[10px] ${mine ? "text-blue-100" : "text-slate-400"}`}>
          {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}{" "}
          {mine && (msg.status === "read" ? "✓✓" : msg.status === "delivered" ? "✓✓" : "✓")}
        </div>
      </div>
    </div>
  );
}

function DayDivider({ iso }: { iso: string }) {
  const d = new Date(iso);
  const label = d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{label}</div>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function Composer({
  onSend, disabled,
}: { onSend: (text: string) => void; disabled?: boolean }) {
  const [text, setText] = useState("");

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      <div className="flex items-end gap-2">
        {/* Nút đính kèm (chưa xử lý file trong MVP) */}
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" title="Đính kèm" disabled={disabled}>📎</button>
        <textarea
          rows={1}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter để gửi; Shift+Enter xuống dòng
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) {
                onSend(text.trim());
                setText("");
              }
            }
          }}
          placeholder="Viết tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)"
          className="min-h-[40px] max-h-40 flex-1 resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-4 ring-transparent placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20 disabled:bg-slate-100"
        />
        <button
          onClick={() => { if (text.trim()) { onSend(text.trim()); setText(""); } }}
          disabled={disabled || !text.trim()}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}

function ChatThread({
  conversation, messages, onSend, onMarkRead, myRole,
}: {
  conversation?: Conversation;
  messages: Message[];
  onSend: (text: string) => void;
  onMarkRead: () => void;
  myRole: Role;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Cuộn xuống cuối mỗi khi đổi thread hoặc có tin nhắn mới
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
  }, [conversation?.id, messages.length]);

  // Khi mở thread → đánh dấu đã đọc
  useEffect(() => {
    if (!conversation) return;
    if (conversation.unreadCount > 0) onMarkRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]);

  // Group theo ngày để chèn divider
  const items = useMemo(() => {
    const out: (Message | { divider: true; iso: string })[] = [];
    let prev: Message | undefined;
    for (const m of messages) {
      if (!prev || !isSameDay(prev.createdAt, m.createdAt)) out.push({ divider: true, iso: m.createdAt });
      out.push(m);
      prev = m;
    }
    return out;
  }, [messages]);

  if (!conversation) {
    return (
      <section className="flex-1 bg-slate-100">
        <div className="grid h-full place-items-center p-6 text-center text-slate-500">
          <div>
            <div className="mb-2 text-5xl">💬</div>
            <div className="text-sm">Chọn một hội thoại ở bên trái để bắt đầu.</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1">
      {/* Thread header: thông tin đối tác + job pill */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-slate-700">
            {conversation.peer.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold">{conversation.peer.name} <span className="text-xs text-slate-500">({conversation.peer.role})</span></div>
            <div className="mt-0.5 text-xs text-slate-600">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-600/20">{conversation.jobTitle}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">Xem hồ sơ</button>
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">Xem Job</button>
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">More</button>
        </div>
      </div>

      {/* Messages viewport */}
      <div ref={viewportRef} className="h-[calc(100vh-16rem)] overflow-y-auto bg-slate-50 px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-2">
          {items.map((it, idx) => {
            if ("divider" in it) {
              return <DayDivider key={`d-${idx}`} iso={it.iso} />;
            }
            // Simple logic for demo: if senderId is the seeker's email, it's from a seeker.
            const isMessageFromSeeker = it.senderId === 'seeker@email.com';
            // "Mine" is true if my role matches the message's role (seeker vs poster)
            const mine = (myRole === 'seeker') === isMessageFromSeeker;
            return <Bubble key={it.id} mine={mine} msg={it} />;
          })}
        </div>
      </div>

      {/* Composer */}
      <Composer onSend={onSend} />
    </section>
  );
}

/* =============================================================================
   Page – Layout 2 cột: trái (Inbox) / phải (Thread)
============================================================================= */
export default function App() {
  const { user } = useAuth();
  // State hội thoại & tin nhắn (mock)
  const [convs, setConvs] = useState<Conversation[]>(MOCK_CONVS);
  const [msgs, setMsgs] = useState<Message[]>(MOCK_MSGS);

  // Chọn thread hiện tại
  const [activeId, setActiveId] = useState<string | undefined>(convs[0]?.id);

  // Tìm kiếm inbox (lọc theo tên, job, lastMessage)
  const [query, setQuery] = useState("");
  const filteredConvs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = [...convs].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || +new Date(b.lastAt) - +new Date(a.lastAt));
    if (!q) return arr;
    return arr.filter(
      (c) =>
        c.peer.name.toLowerCase().includes(q) ||
        c.jobTitle.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [convs, query]);

  const activeConv = convs.find((c) => c.id === activeId);
  const activeMsgs = msgs.filter((m) => m.convId === activeId);

  // Gửi tin nhắn: thêm message, cập nhật lastMessage/lastAt & reset unread của thread mình
  const handleSend = (text: string) => {
    if (!activeConv || !user) return;
    const newMsg: Message = {
      id: uid(),
      convId: activeConv.id,
      senderId: user.username,
      type: "text",
      text,
      status: "sent",
      createdAt: nowISO(),
    };
    setMsgs((prev) => [...prev, newMsg]);
    setConvs((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? { ...c, lastMessage: text, lastAt: newMsg.createdAt /* người gửi là mình → unread của mình = 0, của họ do server tính */ }
          : c
      )
    );
  };

  // Đánh dấu đã đọc khi mở thread
  const markActiveRead = () => {
    if (!activeConv || !user) return;
    setConvs((prev) => prev.map((c) => (c.id === activeConv.id ? { ...c, unreadCount: 0 } : c)));
    // Đổi trạng thái message gần nhất của họ thành "read" (demo)
    setMsgs((prev) =>
      prev.map((m) => (m.convId === activeConv.id && m.senderId !== user.username ? { ...m, status: "read" } : m))
    );
  };

  if (!user) {
    // Or a loading spinner
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Header variant={user.role} />

      {/* Main 2-cột: trái (Inbox) / phải (Thread) */}
      <main className="mx-auto flex max-w-7xl gap-0 px-0 sm:px-0">
        <ConversationList
          conversations={filteredConvs}
          activeId={activeId}
          setActiveId={setActiveId}
          onSearch={setQuery}
        />
        <ChatThread
          myRole={user.role}
          conversation={activeConv}
          messages={activeMsgs}
          onSend={handleSend}
          onMarkRead={markActiveRead}
        />
      </main>
    </div>
  );
}
