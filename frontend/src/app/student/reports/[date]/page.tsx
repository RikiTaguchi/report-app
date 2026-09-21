"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { studentApi, ApiError, resolveFileUrl } from "@/lib/api";
import { convertHeicToJpeg } from "@/lib/image";
import { ListIcon, TargetIcon, PlusIcon, DocumentIcon } from "@/components/icons";
import { useToast } from "@/components/Toast";
import type {
 DailyReportDetailResponse,
 DailyReportSubmitRequest,
 ReportImageResponse,
 SubjectResponse,
 StudentReportItemResponse,
} from "@/lib/types";

const MAX_IMAGES = 5;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayStr(): string {
 return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

interface FormState {
 items: Record<string, { checked?: boolean }>;
 studyTimes: Record<string, number>;
 freeText: string;
}

interface StudyRow {
 key: string;
 subjectId: string;
}

interface PendingImage {
 key: string;
 file: File;
 previewUrl: string;
}

interface ConvertingImage {
 key: string;
}

const EMPTY_FORM_STATE: FormState = { items: {}, studyTimes: {}, freeText: "" };

export default function StudentReportDetail() {
 const params = useParams();
 const router = useRouter();
 const { showToast } = useToast();
 const rawParam = params.date as string;
 const isCreateMode = !DATE_RE.test(rawParam);

 const [selectedDate, setSelectedDate] = useState(() => (isCreateMode ? todayStr() : rawParam));

 const [report, setReport] = useState<DailyReportDetailResponse | null>(null);
 const [itemDefinitions, setItemDefinitions] = useState<StudentReportItemResponse[]>([]);
 const [goalPeriodExists, setGoalPeriodExists] = useState(false);
 const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
 const [images, setImages] = useState<ReportImageResponse[]>([]);
 const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
 const [convertingImages, setConvertingImages] = useState<ConvertingImage[]>([]);
 const [deletingImageIds, setDeletingImageIds] = useState<Set<string>>(new Set());
 const [loading, setLoading] = useState(true);
 const [loadFailed, setLoadFailed] = useState(false);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [saving, setSaving] = useState(false);

 const [formState, setFormState] = useState<FormState>(EMPTY_FORM_STATE);
 const [studyRows, setStudyRows] = useState<StudyRow[]>([]);
 const defaultDateCheckedRef = useRef(false);
 const loadGenerationRef = useRef(0);
 const pendingImagesRef = useRef<PendingImage[]>([]);
 pendingImagesRef.current = pendingImages;

 useEffect(() => {
   (async () => {
     try {
       setSubjects(await studentApi.listSubjects());
     } catch {
       setSubjects([]);
     }
   })();
 }, []);

 useEffect(() => {
   return () => {
     pendingImagesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
   };
 }, []);

 useEffect(() => {
   const generation = ++loadGenerationRef.current;
   const isCurrentLoad = () => loadGenerationRef.current === generation;

   if (isCreateMode && selectedDate === "") {
     setLoading(false);
     setLoadFailed(false);
     setLoadError(null);
     setReport(null);
     setItemDefinitions([]);
     setGoalPeriodExists(false);
     setImages([]);
     pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
     setPendingImages([]);
     setFormState(EMPTY_FORM_STATE);
     setStudyRows([]);
     return;
   }

   setLoading(true);
   setLoadError(null);
   pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
   setPendingImages([]);

   (async () => {
     try {
       const definitionResponse = await studentApi.listItemDefinitions(selectedDate);
       if (!isCurrentLoad()) return;

       setGoalPeriodExists(definitionResponse.goalPeriodExists);
       setItemDefinitions(definitionResponse.items);

       let reportData: DailyReportDetailResponse | null = null;
       try {
         reportData = await studentApi.getReport(selectedDate);
       } catch (err) {
         if (!(err instanceof ApiError && err.status === 404)) {
           throw err;
         }
       }

       if (!isCurrentLoad()) return;

       if (isCreateMode && !defaultDateCheckedRef.current) {
         defaultDateCheckedRef.current = true;
         if (reportData && reportData.submittedAt) {
           // 現在の日付のレポートが既に提出済みの場合、初期値は未入力にする
           setSelectedDate("");
           return;
         }
       }

       setReport(reportData);

       if (isCreateMode) {
         // 新規作成画面では既存データを読み込まず常に空欄のフォームを表示する
         setFormState(EMPTY_FORM_STATE);
         setStudyRows([]);
         setImages([]);
       } else {
         const imagesData = await studentApi.listImages(selectedDate);
         if (!isCurrentLoad()) return;
         setImages(imagesData);

         if (reportData) {
           const itemsMap: Record<string, { checked?: boolean }> = {};
           reportData.items.forEach((item) => {
             itemsMap[item.reportItemDefinitionId] = {
               checked: item.checked ?? undefined,
             };
           });

           const studyTimesMap: Record<string, number> = {};
           reportData.studyTimes.forEach((st) => {
             studyTimesMap[st.subjectId] = st.minutes;
           });

           setFormState({
             items: itemsMap,
             studyTimes: studyTimesMap,
             freeText: reportData.freeText ?? "",
           });
           setStudyRows(
             reportData.studyTimes.map((st) => ({
               key: crypto.randomUUID(),
               subjectId: st.subjectId,
             }))
           );
         } else {
           setFormState(EMPTY_FORM_STATE);
           setStudyRows([]);
         }
       }
     } catch (err) {
       if (!isCurrentLoad()) return;
       setLoadFailed(true);
       if (err instanceof ApiError) {
         setLoadError(err.message);
       } else {
         setLoadError("レポートの読み込みに失敗しました");
       }
     } finally {
       if (isCurrentLoad()) setLoading(false);
     }
   })();
 }, [selectedDate, isCreateMode]);

 const buildSubmitRequest = (): DailyReportSubmitRequest => {
   const items = itemDefinitions.map((def) => ({
     reportItemDefinitionId: def.id,
     checked: formState.items[def.id]?.checked ?? null,
   }));

   const studyTimes = subjects
     .filter((s) => (formState.studyTimes[s.id] ?? 0) > 0)
     .map((s) => ({
       subjectId: s.id,
       minutes: formState.studyTimes[s.id] ?? 0,
     }));

   return {
     items,
     studyTimes,
     freeText: formState.freeText.trim() === "" ? null : formState.freeText,
   };
 };

 const handleAddStudyRow = () => {
   setStudyRows([...studyRows, { key: crypto.randomUUID(), subjectId: "" }]);
 };

 const handleRemoveStudyRow = (key: string) => {
   const row = studyRows.find((r) => r.key === key);
   if (row?.subjectId) {
     const nextStudyTimes = { ...formState.studyTimes };
     delete nextStudyTimes[row.subjectId];
     setFormState({ ...formState, studyTimes: nextStudyTimes });
   }
   setStudyRows(studyRows.filter((r) => r.key !== key));
 };

 const handleStudyRowSubjectChange = (key: string, newSubjectId: string) => {
   const row = studyRows.find((r) => r.key === key);
   if (!row) return;
   const carriedMinutes = row.subjectId ? formState.studyTimes[row.subjectId] ?? 0 : 0;
   const nextStudyTimes = { ...formState.studyTimes };
   if (row.subjectId) delete nextStudyTimes[row.subjectId];
   if (newSubjectId) nextStudyTimes[newSubjectId] = carriedMinutes;
   setFormState({ ...formState, studyTimes: nextStudyTimes });
   setStudyRows(studyRows.map((r) => (r.key === key ? { ...r, subjectId: newSubjectId } : r)));
 };

 const handleStudyRowTimeChange = (subjectId: string, hours: number, minutes: number) => {
   if (!subjectId) return;
   const total = Math.max(0, hours) * 60 + Math.max(0, Math.min(59, minutes));
   setFormState({
     ...formState,
     studyTimes: { ...formState.studyTimes, [subjectId]: total },
   });
 };

 const handleSave = async () => {
   if (!selectedDate) {
     showToast("日付を選択してください", "error");
     return;
   }
   if (isCreateMode && report?.submittedAt) {
     showToast("この日付のレポートは既に提出済みです。別の日付を選択してください。", "error");
     return;
   }
   if (isCreateMode) {
     if (selectedDate > todayStr()) {
       showToast("未来の日付のレポートは提出できません", "error");
       return;
     }
     if (!window.confirm("レポートを提出してよろしいですか？")) return;
   }

   setSaving(true);

   try {
     await studentApi.saveReport(selectedDate, buildSubmitRequest(), isCreateMode);

     if (pendingImages.length > 0) {
       try {
         for (const pending of pendingImages) {
           await studentApi.uploadImage(selectedDate, pending.file);
         }
       } catch (imgErr) {
         const msg = imgErr instanceof ApiError ? imgErr.message : "画像の登録に失敗しました";
         showToast(msg, "error");
       } finally {
         pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
       }
     }

     showToast(isCreateMode ? "レポートを提出しました" : "レポートを更新しました", "success");
     router.push("/student/reports");
   } catch (err) {
     const msg = err instanceof ApiError ? err.message : "保存に失敗しました";
     showToast(msg, "error");
   } finally {
     setSaving(false);
   }
 };

 const handleImageUpload = async (file: File) => {
   if (images.length + pendingImages.length + convertingImages.length >= MAX_IMAGES) {
     showToast(`画像は最大${MAX_IMAGES}枚までです`, "error");
     return;
   }
   const key = crypto.randomUUID();
   setConvertingImages((current) => [...current, { key }]);
   // HEIC はそのままではプレビューできない端末があるため JPEG に変換してから保持
   const converted = await convertHeicToJpeg(file);
   const previewUrl = URL.createObjectURL(converted);
   setPendingImages((current) => [...current, { key, file: converted, previewUrl }]);
   setConvertingImages((current) => current.filter((c) => c.key !== key));
 };

 const handleRemovePendingImage = (key: string) => {
   if (saving) return;
   const pending = pendingImages.find((p) => p.key === key);
   if (pending) URL.revokeObjectURL(pending.previewUrl);
   setPendingImages(pendingImages.filter((p) => p.key !== key));
 };

 const handleDeleteImage = async (imageId: string) => {
   if (!window.confirm("画像を削除してよろしいですか？")) return;

   setDeletingImageIds((current) => new Set(current).add(imageId));
   try {
     await studentApi.deleteImage(selectedDate, imageId);
     setImages(images.filter((img) => img.id !== imageId));
   } catch (err) {
     const msg = err instanceof ApiError ? err.message : "削除に失敗しました";
     showToast(msg, "error");
   } finally {
     setDeletingImageIds((current) => {
       const next = new Set(current);
       next.delete(imageId);
       return next;
     });
   }
 };

 if (loading) {
   return <div className="page"><div className="spinner-page">読み込み中...</div></div>;
 }

 if (loadFailed) {
   return (
     <div className="page">
       <div className="alert alert-error">{loadError}</div>
     </div>
   );
 }

 const isFutureDate = Boolean(selectedDate) && selectedDate > todayStr();
 const noGoalPeriod = isCreateMode && Boolean(selectedDate) && !goalPeriodExists;

 let blockedReason: string | null = null;
 if (isCreateMode) {
   if (isFutureDate) {
     blockedReason = "未来の日付のレポートは提出できません";
   } else if (noGoalPeriod) {
     blockedReason = "この日付を含む期間の目標が設定されていないため、提出できません";
   }
 }

 const subtitleGroups: { subtitleId: string; subtitleLabel: string; items: StudentReportItemResponse[] }[] = [];
 for (const def of itemDefinitions) {
   let group = subtitleGroups.find((g) => g.subtitleId === def.subtitleId);
   if (!group) {
     group = { subtitleId: def.subtitleId, subtitleLabel: def.subtitleLabel, items: [] };
     subtitleGroups.push(group);
   }
   group.items.push(def);
 }

 return (
   <div className="page ig-report-form-page">
     <div className="page-header">
       <div>
         <Link href="/student/reports" className="breadcrumb">
           <span>レポート</span>
           {!isCreateMode && (
             <>
               <span>/</span>
               <span>編集</span>
             </>
           )}
         </Link>
         <input
           type="date"
           className="input"
           style={{ marginTop: "8px" }}
           value={selectedDate}
           max={todayStr()}
           autoComplete="off"
           onChange={(e) => {
             if (!e.target.value) return;
             if (isCreateMode) {
               setSelectedDate(e.target.value);
             } else {
               router.push(`/student/reports/${e.target.value}`);
             }
           }}
           disabled={!isCreateMode}
         />
       </div>
     </div>

     <div className="stack ig-settings-form">
       {subtitleGroups.length === 0 ? (
         <div className="ig-settings-section">
           <div className="ig-settings-header">
             <ListIcon />
             <h2 className="ig-settings-title">振り返り</h2>
           </div>
           <div className="empty-state">
             {!selectedDate
               ? "日付を選択すると入力できます"
               : goalPeriodExists
                 ? "登録されているチェック項目はありません"
                 : "レポート提出期間外の日付が選択されています"}
           </div>
         </div>
       ) : (
       subtitleGroups.map((group) => (
         <div key={group.subtitleId} className="ig-settings-section">
           <div className="ig-settings-header">
             <ListIcon />
             <h2 className="ig-settings-title">{group.subtitleLabel}</h2>
           </div>
           {group.items.map((def) => {
             const itemState = formState.items[def.id] ?? {};
             return (
               <div key={def.id} className="ig-report-item-row">
                 <div className="checkbox-row">
                   <input
                     type="checkbox"
                     className="ig-checkbox"
                     id={`item-${def.id}`}
                     checked={itemState.checked ?? false}
                     onChange={(e) =>
                       setFormState({
                         ...formState,
                         items: {
                           ...formState.items,
                           [def.id]: { checked: e.target.checked },
                         },
                       })
                     }
                   />
                   <label htmlFor={`item-${def.id}`} className="label">
                     {def.label}
                   </label>
                 </div>
               </div>
             );
           })}
         </div>
       ))
       )}

       {subjects.length > 0 && (
         <div className="ig-settings-section">
           <div className="ig-settings-header">
             <TargetIcon />
             <h2 className="ig-settings-title">学習時間記録</h2>
           </div>
           {studyRows.map((row) => {
             const otherSelectedIds = studyRows.filter((r) => r.key !== row.key).map((r) => r.subjectId);
             const options = subjects.filter((s) => s.id === row.subjectId || !otherSelectedIds.includes(s.id));
             const minutesValue = row.subjectId ? formState.studyTimes[row.subjectId] ?? 0 : 0;
             const hours = Math.floor(minutesValue / 60);
             const mins = minutesValue % 60;
             return (
               <div key={row.key} className="ig-study-row">
                 <select
                   className="select"
                   value={row.subjectId}
                   onChange={(e) => handleStudyRowSubjectChange(row.key, e.target.value)}
                 >
                   <option value="">科目を選択</option>
                   {options.map((s) => (
                     <option key={s.id} value={s.id}>
                       {s.name}
                     </option>
                   ))}
                 </select>
                 <input
                   type="number"
                   min="0"
                   className="input ig-time-input"
                   value={hours}
                   disabled={!row.subjectId}
                   onChange={(e) => handleStudyRowTimeChange(row.subjectId, parseInt(e.target.value) || 0, mins)}
                 />
                 <span className="muted">時間</span>
                 <input
                   type="number"
                   min="0"
                   max="59"
                   className="input ig-time-input"
                   value={mins}
                   disabled={!row.subjectId}
                   onChange={(e) => handleStudyRowTimeChange(row.subjectId, hours, parseInt(e.target.value) || 0)}
                 />
                 <span className="muted">分</span>
                 <button
                   type="button"
                   className="ig-study-row-remove"
                   onClick={() => handleRemoveStudyRow(row.key)}
                 >
                   ×
                 </button>
               </div>
             );
           })}
           {studyRows.length < subjects.length && (
             <button type="button" className="ig-add-row-btn" onClick={handleAddStudyRow}>
               <PlusIcon /> 科目を追加
             </button>
           )}
         </div>
       )}

       <div className="ig-settings-section">
         <div className="ig-settings-header">
           <DocumentIcon />
           <h2 className="ig-settings-title">自由記述</h2>
         </div>
         <textarea
           className="textarea"
           value={formState.freeText}
           onChange={(e) => setFormState({ ...formState, freeText: e.target.value })}
           placeholder="何でもOK！自由に書こう。"
         />
       </div>

       <div className="ig-settings-section">
         <div className="ig-settings-header">
           <PlusIcon />
           <h2 className="ig-settings-title">画像</h2>
         </div>
         <div className="field-hint">
           どんな画像でもOK！勉強と関係ない画像も、日記代わりに投稿しよう。
         </div>
         <div className="image-row">
           {images.map((img) => (
             <div key={img.id} className="image-tile">
               <img src={resolveFileUrl(img.imageUrl)} alt="Report image" />
               {deletingImageIds.has(img.id) ? (
                 <div className="image-tile-spinner-overlay">
                   <div className="spinner" />
                 </div>
               ) : (
                 <button
                   className="remove-btn"
                   onClick={() => handleDeleteImage(img.id)}
                   type="button"
                   disabled={saving}
                 >
                   ×
                 </button>
               )}
             </div>
           ))}
           {pendingImages.map((p) => (
             <div key={p.key} className="image-tile">
               <img src={p.previewUrl} alt="Report image" />
               {saving ? (
                 <div className="image-tile-spinner-overlay">
                   <div className="spinner" />
                 </div>
               ) : (
                 <button
                   className="remove-btn"
                   onClick={() => handleRemovePendingImage(p.key)}
                   type="button"
                 >
                   ×
                 </button>
               )}
             </div>
           ))}
           {convertingImages.map((c) => (
             <div key={c.key} className="image-tile image-tile-placeholder">
               <div className="spinner" />
             </div>
           ))}
           {images.length + pendingImages.length + convertingImages.length < MAX_IMAGES && (
             <div className="ig-add-photo-tile">
               <PlusIcon />
               <span>写真を追加</span>
               <input
                 type="file"
                 accept="image/*"
                 disabled={saving}
                 onChange={(e) => {
                   if (e.target.files?.[0]) {
                     void handleImageUpload(e.target.files[0]);
                     e.target.value = "";
                   }
                 }}
               />
             </div>
           )}
         </div>
       </div>

       <div className="row" style={{ marginTop: "8px" }}>
         <button
           className="btn btn-primary"
           onClick={handleSave}
           disabled={saving || (isCreateMode && (isFutureDate || noGoalPeriod))}
         >
           {saving ? "処理中..." : isCreateMode ? "提出する" : "更新する"}
         </button>
         {blockedReason && (
           <span style={{ fontSize: "0.8rem", color: "var(--danger)" }}>{blockedReason}</span>
         )}
       </div>
     </div>
   </div>
 );
}
