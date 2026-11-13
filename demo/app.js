const $ = (id) => document.getElementById(id);
const audioInput = $("audio-file");
const rawInput = $("raw-files");
const referenceInput = $("reference-file");
let audioUrl = null;
let referenceName = "";
let rawFiles = [];

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3200);
}
function updateSummary() {
  $("summary-audio").textContent = audioInput.files[0]?.name || "غير مضاف";
  $("summary-videos").textContent = rawFiles.length.toLocaleString("ar") + " مقاطع";
  $("summary-script").textContent = $("script-text").value.trim() ? "تمت الإضافة" : "غير مضاف";
  $("summary-reference").textContent = referenceName || "اختياري";
  $("char-count").textContent = $("script-text").value.length.toLocaleString("ar") + " حرف";
}
audioInput.addEventListener("change", () => {
  const file = audioInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("audio/")) { toast("الرجاء اختيار ملف صوتي صحيح"); audioInput.value = ""; return; }
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = URL.createObjectURL(file);
  $("audio-player").src = audioUrl;
  $("audio-player").hidden = false;
  $("audio-info").textContent = file.name + " · " + formatSize(file.size);
  updateSummary();
});
rawInput.addEventListener("change", () => {
  const selected = Array.from(rawInput.files || []);
  const invalid = selected.filter(file => !file.type.startsWith("video/"));
  if (invalid.length) toast("تم تجاهل الملفات التي ليست فيديو");
  rawFiles = selected.filter(file => file.type.startsWith("video/"));
  $("raw-list").replaceChildren();
  if (!rawFiles.length) {
    const empty = document.createElement("span");
    empty.className = "empty-state";
    empty.textContent = "لم تتم إضافة فيديوهات بعد";
    $("raw-list").append(empty);
  } else {
    rawFiles.forEach(file => {
      const item = document.createElement("div");
      item.className = "file-item";
      const name = document.createElement("span");
      name.textContent = file.name;
      const size = document.createElement("small");
      size.textContent = formatSize(file.size);
      item.append(name, size);
      $("raw-list").append(item);
    });
  }
  updateSummary();
});
referenceInput.addEventListener("change", () => {
  const file = referenceInput.files[0];
  if (!file) return;
  if (!file.type.startsWith("video/")) { toast("المرجع يجب أن يكون ملف فيديو"); referenceInput.value = ""; return; }
  referenceName = file.name;
  $("reference-info").textContent = file.name + " · " + formatSize(file.size);
  updateSummary();
});
$("script-text").addEventListener("input", updateSummary);
$("start-button").addEventListener("click", () => {
  if (!audioInput.files[0]) return toast("أضف الملف الصوتي أولاً");
  if (!$("script-text").value.trim()) return toast("أضف النص أو السكريبت أولاً");
  if (!rawFiles.length) return toast("أضف فيديو خام واحداً على الأقل");
  toast("تم التحقق من الملفات محلياً. تنفيذ المونتاج غير مفعّل في النسخة التجريبية بعد.");
});
updateSummary();