// HEIC/HEIF 画像をブラウザ側で JPEG に変換するユーティリティ。
// iPhone の写真は拡張子や MIME タイプが端末依存で統一されないため、
// ファイル名・type の両方で判定し、変換失敗時は元ファイルをそのまま返す。

function isHeicLike(file: File): boolean {
 const name = file.name.toLowerCase();
 return (
   name.endsWith(".heic") ||
   name.endsWith(".heif") ||
   file.type === "image/heic" ||
   file.type === "image/heif"
 );
}

export async function convertHeicToJpeg(file: File): Promise<File> {
 if (typeof window === "undefined" || !isHeicLike(file)) {
   return file;
 }
 try {
   const heic2any = (await import("heic2any")).default;
   const converted = await heic2any({
     blob: file,
     toType: "image/jpeg",
     quality: 0.9,
   });
   const blob = Array.isArray(converted) ? converted[0] : converted;
   return new File(
     [blob],
     file.name.replace(/\.(heic|heif)$/i, ".jpeg"),
     { type: "image/jpeg" }
   );
 } catch {
   // 変換に失敗した場合は元のファイルでアップロードを試みる
   return file;
 }
}
