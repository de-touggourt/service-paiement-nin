// ============================================================
// 🔒 SYSTEM GUARD V3.1: نظام الأرقام (1=نشط، 2=إدارة، 0=غلق)
// ============================================================

const LOCAL_VERSION = "1.0.6"; 
let CURRENT_SYSTEM_MODE = 1; 
let isSecretLoginActive = false; 

const SYSTEM_CONFIG = {
    versionFile: "version.json",
    settingsFile: "settings.json",
    checkInterval: 5000 
};

// تحميل مكتبة الباركود
if (typeof JsBarcode === 'undefined') {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
    document.head.appendChild(script);
}

// متغيرات النقر السري
let secretClickCount = 0;
let secretClickTimer = null;

window.handleSecretClick = function() {
    secretClickCount++;
    if (secretClickTimer) clearTimeout(secretClickTimer);
    secretClickTimer = setTimeout(() => { secretClickCount = 0; }, 1000);
    if (secretClickCount >= 10) { secretClickCount = 0; triggerSecretAdminLogin(); }
};

window.systemCheckIntervalId = null; 

async function performSystemCheck() {
    try {
        if (typeof isSecretLoginActive !== 'undefined' && isSecretLoginActive) return;
        const docSnap = await db.collection("config").doc("pass").get();
        if (docSnap.exists) {
            const data = docSnap.data();
            CURRENT_SYSTEM_MODE = data.status; 
            
            const container = document.getElementById("interfaceCard");
            const isAdmin = sessionStorage.getItem("admin_bypass") === "true"; 

            if (CURRENT_SYSTEM_MODE == 0) {
                if (isAdmin) {
                    if (container) container.style.display = "block";
                    if (Swal.isVisible() && Swal.getTitle()?.textContent.includes('المنصة مغلقة')) Swal.close();
                } else {
                    if (container) container.style.display = "none";
                    const isClosedPopupVisible = Swal.isVisible() && Swal.getTitle()?.textContent.includes('المنصة مغلقة');
                    if (!isClosedPopupVisible) {
                        Swal.fire({
                            icon: 'warning',
                            title: '<span style="cursor: default; user-select: none;" onclick="handleSecretClick()">المنصة مغلقة</span>',
                            html: `<div style="text-align: center; direction: rtl;">المنصة مغلقة حالياً.</div>`,
                            allowOutsideClick: false, showConfirmButton: false, width: '450px'
                        });
                    }
                }
                return; 
            }
            // باقي الحالات (1 و 2) معالجة الواجهة
            const ccpInput = document.getElementById("ccpInput");
            const loginBtn = document.getElementById("loginBtn");
            const adminBtn = document.querySelector("button[onclick='openAdminModal()']");
            
            if (CURRENT_SYSTEM_MODE == 2) {
                if(ccpInput) ccpInput.style.display = "none";
                if(loginBtn) loginBtn.style.display = "none";
                if(adminBtn) { adminBtn.style.display = "inline-block"; adminBtn.style.width = "100%"; adminBtn.innerHTML = `<i class="fas fa-user-shield"></i> بوابة الإدارة (التسجيل مغلق حالياً)`; }
            } else if (CURRENT_SYSTEM_MODE == 1) {
                if(ccpInput) ccpInput.style.display = "block";
                if(loginBtn) loginBtn.style.display = "inline-block";
                if(adminBtn) { adminBtn.style.display = "inline-block"; adminBtn.style.width = ""; adminBtn.innerHTML = `<i class="fas fa-file-alt"></i> استخراج القوائم والاستمارات`; }
                if (Swal.isVisible() && Swal.getTitle()?.textContent.includes('المنصة مغلقة')) Swal.close();
            }
        }
    } catch (error) { console.warn("System Check Failed", error); }
}

document.addEventListener("DOMContentLoaded", () => {
    performSystemCheck();
    window.systemCheckIntervalId = setInterval(performSystemCheck, SYSTEM_CONFIG.checkInterval);
});

window.addEventListener("message", (event) => {
    if (event.data === "AUTH_Dir55@tggt") {
        const overlay = document.getElementById("systemLoginOverlay");
        const container = document.getElementById("interfaceCard");
        if(overlay) overlay.style.display = 'none';
        if(container && typeof SECURE_INTERFACE_HTML !== 'undefined') {
            if (!container.classList.contains("show-content")) {
                container.innerHTML = SECURE_INTERFACE_HTML;
                container.classList.add("show-content");
                container.style.display = "block";
                const ccpInp = document.getElementById("ccpInput");
                if(ccpInp) ccpInp.addEventListener("keypress", (e) => { if (e.key === "Enter") { e.preventDefault(); document.getElementById("loginBtn").click(); } });
                const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 3000});
                Toast.fire({ icon: 'success', title: 'تم الاتصال الآمن بلوحة التحكم' });
            }
        }
    }
});

const SECURE_INTERFACE_HTML = `
    <div class="page-header" id="mainHeader">
      <div class="header-text">الجمهورية الجزائرية الديمقراطية الشعبية<br>وزارة التربية الوطنية<br></div>
      <div class="logo-wrapper"><img src="https://lh3.googleusercontent.com/d/1BqWoqh1T1lArUcwAGNF7cGnnN83niKVl" alt="شعار" class="header-logo"></div>
      <h2 class="gradient-title">مديرية التربية لولاية توقرت<br><span class="highlight-text">المنصة الرقمية</span></h2>
      <div id="loginSection">
        <input type="text" id="ccpInput" placeholder="أدخل رقم الحساب البريدي بدون المفتاح" oninput="valNum(this)">
        <button class="btn-main" id="loginBtn" onclick="checkEmployee()">تسجيل الدخول</button>
        <button class="btn-main" onclick="openAdminModal()" style="background: #fff; color: #2575fc; border: 2px solid #2575fc; margin-top: 10px; font-weight:bold;"><i class="fas fa-file-alt"></i> استخراج القوائم والاستمارات</button>
      </div>
    </div>
    <div id="formSection" style="display: none;">
      <h2 class="gradient-title" style="margin-bottom: 20px; font-size:20px;">استمارة تحديث بيانات الموظفين</h2>
      <input type="hidden" id="mtrField"><input type="hidden" id="admField"><input type="hidden" id="grField">
      <div class="section-divider"><span class="section-title">البيانات الشخصية</span></div>
      <div class="info-grid">
        <div class="outer-group"><label>رقم الحساب CCP:</label><input type="text" id="ccpField" class="readonly-field"></div>
        <div class="outer-group"><label>رقم الضمان:</label><input type="text" id="assField" class="readonly-field"></div>
        <div class="outer-group"><label>اللقب:</label><input type="text" id="fmnField" class="editable-field" oninput="valAr(this); removeError(this)"></div>
        <div class="outer-group"><label>الاسم:</label><input type="text" id="frnField" class="editable-field" oninput="valAr(this); removeError(this)"></div>
        <div class="outer-group"><label>تاريخ الميلاد:</label><input type="date" id="dizField" class="editable-field" onchange="removeError(this)"></div>
        <div class="outer-group"><label>الوظيفة:</label><input type="text" id="jobField" class="readonly-field"></div>
      </div>
      <div class="section-divider"><span class="section-title">بيانات مهنية</span></div>
      <div class="outer-group"><label>الطور:</label><select id="levelField" onchange="resetGeoFields(); updateWorkPlace(); removeError(this)"><option value="">-- اختر --</option><option value="ابتدائي">ابتدائي</option><option value="متوسط">متوسط</option><option value="ثانوي">ثانوي</option><option value="مديرية التربية">مديرية التربية</option></select></div>
      <div class="info-grid">
        <div class="outer-group"><label>الدائرة</label><select id="daairaField" onchange="updBal(); updateWorkPlace(); removeError(this)"><option value="">-- اختر --</option><option value="توقرت">توقرت</option><option value="تماسين">تماسين</option><option value="المقارين">المقارين</option><option value="الحجيرة">الحجيرة</option><option value="الطيبات">الطيبات</option></select></div>
        <div class="outer-group"><label>البلدية</label><select id="baladiyaField" onchange="updateWorkPlace(); removeError(this)"><option value="">-- اختر --</option></select></div>
      </div>
      <div class="outer-group"><label>مؤسسة العمل:</label><div id="institutionArea"><input readonly placeholder="..." class="readonly-field"></div><input type="hidden" id="institutionCodeField"></div>
      <div class="section-divider"><span class="section-title">اتصال وهوية</span></div>
      <div class="info-grid">
        <div class="outer-group"><label>الهاتف (10 أرقام)</label><input type="text" id="phoneField" maxlength="10" oninput="valNum(this); removeError(this)" dir="ltr"></div>
        <div class="outer-group"><label>NIN (18 رقم)</label><input type="text" id="ninField" maxlength="18" oninput="valNum(this); removeError(this)"></div>
      </div>
      <button class="btn-main" onclick="submitRegistration()">حفظ وتأكيد</button>
      <button class="btn-main" style="background: #6c757d; margin-top: 10px;" onclick="resetInterface()">إلغاء</button>
    </div>
`;

const ADMIN_DASHBOARD_URL = "admin0955tggt.html"; 
const firebaseConfig = {
  apiKey: "AIzaSyAkQz9pB2ZNlYIvdlTRvi4try3D8LLXS4g", authDomain: "databaseemploye.firebaseapp.com", projectId: "databaseemploye",
  storageBucket: "databaseemploye.firebasestorage.app", messagingSenderId: "408231477466", appId: "1:408231477466:web:e3bf5bd3eaca7cdcd3a5e3", measurementId: "G-DW8QJ5B231"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const scriptURL = "https://script.google.com/macros/s/AKfycbyXEdCPd-rrImLFLZObPXbeELUqj71mknOOFB7sjMCh6JQE-L7yMIsgFlFXrA5-VTUjRg/exec";

// ... (gradeMap, baladiyaMap, window.primarySchoolsByBaladiya, window.institutionsByDaaira are same as before - kept for brevity in this response but must be included in file) ...
// يرجى إبقاء خرائط الرتب والمدارس كما هي في الكود السابق
const gradeMap = { "1006": "أستاذ إبتدائي (متعاقد)", "1010": "أستاذ التعليم الإبتدائي", "2100": "مدير مدرسة إبتدائية", "5019": "أستاذ تعليم ثانوي", "4000": "مدير متوسطة", "6001": "مدير ثانوية", "4087": "مشرف تربية", "4025": "مقتصد", "6015": "مقتصد", "8380": "عون إدارة", "6110": "عامل مهني" }; // (Sample)
const baladiyaMap = { "توقرت": ["توقرت", "النزلة", "تبسبست", "الزاوية العابدية"], "تماسين": ["تماسين", "بلدة عمر"], "المقارين": ["المقارين", "سيدي سليمان"], "الحجيرة": ["الحجيرة", "العالية"], "الطيبات": ["الطيبات", "المنقر", "ابن ناصر"] };

const valNum = (e) => e.value = e.value.replace(/\D/g, '');
const valAr = (e) => e.value = e.value.replace(/[^\u0600-\u06FF\s]/g, '');
const getJob = (c) => gradeMap[c] || c || "غير محدد"; // Fallback to code if not found
const removeError = (i) => i.classList.remove("input-error");
const fmtDate = (d) => { try { const o = (typeof d.toDate === 'function') ? d.toDate() : new Date(d); return isNaN(o) ? "" : o.toISOString().split('T')[0]; } catch(e){return"";} };
function getCurrentDateTime() { const n = new Date(); return n.toISOString().replace('T', ' ').split('.')[0]; }

let currentEmployeeData = null;

// --- وظائف الدخول والتحقق (نفس الكود السابق) ---
async function verifySystemLogin() {
    // (Login Logic - same as provided code)
    const p = document.getElementById("systemPassInput").value.trim();
    if(!p) return Swal.fire("تنبيه", "أدخل كلمة المرور", "warning");
    try {
        const s = await db.collection("config").doc("pass").get();
        if(s.exists) {
            const d = s.data();
            if(String(p) === String(d.service_pay)) {
                document.getElementById("interfaceCard").innerHTML = SECURE_INTERFACE_HTML;
                document.getElementById("interfaceCard").classList.add("show-content");
                document.getElementById("systemLoginOverlay").style.display='none';
                document.getElementById("ccpInput").addEventListener("keypress", (e)=>{if(e.key==="Enter")document.getElementById("loginBtn").click()});
            } else if (String(p) === String(d.service_pay_admin)) {
                sessionStorage.setItem("admin_secure_access", "granted"); window.location.href = ADMIN_DASHBOARD_URL;
            } else Swal.fire("خطأ", "كلمة المرور خاطئة", "error");
        }
    } catch(e) { console.error(e); }
}

function resetInterface() {
    currentEmployeeData = null;
    document.getElementById("formSection").style.display = "none";
    document.getElementById("mainHeader").style.display = "block";
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("interfaceCard").classList.remove("expanded-mode");
    document.getElementById("ccpInput").value = ""; 
}

// ... (CheckEmployee, ShowReviewModal, ShowConfirmedModal, FillForm, SubmitRegistration, PrintA4 - All kept identical to previous solid code) ...
// اختصاراً، افترض أن هذه الدوال موجودة وتعمل كما في الكود السابق الذي قدمته لك. سأركز على التعديلات.

async function checkEmployee() {
    // ... (Standard Check Logic)
    // For brevity, assume existing implementation
     const rawInput = document.getElementById("ccpInput").value.trim();
     if (rawInput.length < 3) return Swal.fire("تنبيه", "رقم الحساب خطأ", "warning");
     Swal.showLoading();
     // ... fetching ...
     // Mock success for UI integration
     /* Implement actual fetch here as before */
}
// ... Add other standard functions here ...

// ============================================================
// +++ وظائف الإدارة + البطاقات المهنية (المحسنة) +++
// ============================================================

window.openAdminModal = function() {
  const popupHtml = `
    <div style="font-family: 'Cairo', sans-serif; direction: rtl;">
      <div style="margin-bottom: 20px; color: #555;">
        <i class="fas fa-user-shield" style="font-size: 50px; color: #2575fc; margin-bottom: 10px;"></i>
        <h3 style="margin: 0; font-size: 18px; font-weight: bold;">بوابة الإدارة</h3>
      </div>
      <input type="text" id="adminCcpInput" maxlength="10" placeholder="رقم الحساب (مثال: 0000012345)" class="swal2-input" style="text-align: center; font-weight: bold; width: 80%; margin: 0 auto; display: block;" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
    </div>`;

  Swal.fire({
    html: popupHtml, showCancelButton: true, confirmButtonText: 'دخول', cancelButtonText: 'إلغاء', confirmButtonColor: '#2575fc',
    preConfirm: () => {
      const v = document.getElementById('adminCcpInput').value;
      if (!v) return Swal.showValidationMessage('أدخل الرقم');
      return fetch(scriptURL, { method: 'POST', body: new URLSearchParams({ action: 'check_existing', ccp: v.padStart(10,'0') }) })
             .then(r => r.json()).then(d => { if(d.result!=='exists') throw new Error('غير مصرح'); return d.data; })
             .catch(e => Swal.showValidationMessage(e));
    }
  }).then((r) => { if (r.isConfirmed) showRestrictedAdminPanel(r.value); });
}

window.triggerCardsView = function(schoolName) { Swal.close(); fetchAndHandleData(schoolName, 'cards'); };

function showRestrictedAdminPanel(empData) {
  const schoolName = empData.schoolName || "غير محدد";
  const popupHtml = `
    <div style="font-family: 'Cairo', sans-serif; direction: rtl; text-align: right;">
      <div style="background: linear-gradient(45deg, #2575fc, #6a11cb); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <div style="font-size: 18px; font-weight: bold;">${empData.fmn} ${empData.frn}</div>
      </div>
      <button onclick="triggerCardsView('${schoolName}')" class="swal2-confirm swal2-styled" style="background-color: #17a2b8; width: 100%; margin: 0 0 15px 0; display: flex; justify-content: center; gap: 8px;"><i class="fas fa-id-card"></i> إدارة البطاقات المهنية</button>
      <div style="text-align:center; font-weight:bold; color:#555;">${schoolName}</div>
    </div>`;

  Swal.fire({ html: popupHtml, showCancelButton: true, showDenyButton: true, confirmButtonText: 'الاستمارات', denyButtonText: 'القائمة', cancelButtonText: 'خروج', confirmButtonColor: '#333', denyButtonColor: '#28a745' })
  .then((r) => {
    if (r.isConfirmed) fetchAndHandleData(schoolName, 'forms');
    else if (r.isDenied) fetchAndHandleData(schoolName, 'list');
  });
}

async function fetchAndHandleData(schoolName, mode) {
    Swal.fire({ title: 'جاري التحميل...', didOpen: () => Swal.showLoading() });
    try {
        const res = await fetch(scriptURL, { method: "POST", body: new URLSearchParams({ action: "get_by_school", schoolName }) });
        const json = await res.json();
        Swal.close();
        let data = json.result === "success" ? json.data : (json.data || []);
        data = data.filter(e => e.schoolName === schoolName);
        if (data.length === 0) return Swal.fire("تنبيه", "لا توجد بيانات", "info");

        if (mode === 'forms') generateBulkForms(data, schoolName);
        else if (mode === 'cards') generateCardsTable(data, schoolName);
        else generateEmployeesTable(data, schoolName);
    } catch (e) { Swal.fire("خطأ", "فشل الاتصال", "error"); }
}

// ------------------------------------------------------------------
// +++ 🛠️ نظام البطاقات المهنية المتقدم (صور، تحريك، طباعة) +++
// ------------------------------------------------------------------

// تخزين بيانات البطاقات: الصورة، الرقم الوظيفي، وإحداثيات الصورة
window.cardsContextData = {}; 

// دالة تهيئة بيانات الموظف إذا لم تكن موجودة
function initCardData(ccp) {
    if (!window.cardsContextData[ccp]) {
        window.cardsContextData[ccp] = {
            jobId: '',
            photoBase64: null,
            imgTransform: { scale: 1, x: 0, y: 0, rotate: 0 } // القيم الافتراضية
        };
    }
}

function updateCardJobId(ccp, value) {
    initCardData(ccp);
    window.cardsContextData[ccp].jobId = value;
}

function handlePhotoUpload(ccp, inputEl) {
    const file = inputEl.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            initCardData(ccp);
            window.cardsContextData[ccp].photoBase64 = e.target.result;
            // إعادة تعيين التحريك عند رفع صورة جديدة
            window.cardsContextData[ccp].imgTransform = { scale: 1, x: 0, y: 0, rotate: 0 };
            
            // تحديث واجهة الجدول
            const btnUpload = document.getElementById(`btn-upload-${ccp}`);
            const btnEdit = document.getElementById(`btn-edit-${ccp}`);
            
            btnUpload.innerHTML = 'تم الرفع ✔️';
            btnUpload.style.backgroundColor = '#28a745';
            btnEdit.style.display = 'inline-block';
        }
        reader.readAsDataURL(file);
    }
}

// 🎛️ دالة فتح نافذة تعديل الصورة
window.openPhotoEditor = function(ccp) {
    initCardData(ccp);
    const cData = window.cardsContextData[ccp];
    
    if (!cData.photoBase64) return Swal.fire('تنبيه', 'يرجى رفع صورة أولاً', 'warning');

    const editorHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; direction: ltr;">
            <div style="width: 130px; height: 170px; border: 2px solid #333; overflow: hidden; position: relative; background: #eee; border-radius: 4px;">
                <img id="editor-img-preview" src="${cData.photoBase64}" 
                     style="width: 100%; height: 100%; object-fit: cover; transform-origin: center; 
                            transform: translate(${cData.imgTransform.x}px, ${cData.imgTransform.y}px) 
                                       scale(${cData.imgTransform.scale}) 
                                       rotate(${cData.imgTransform.rotate}deg);">
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 40px); gap: 5px;">
                <div></div>
                <button onclick="adjustImageParams('${ccp}', 'up')" class="btn-ctrl">⬆️</button>
                <div></div>
                
                <button onclick="adjustImageParams('${ccp}', 'left')" class="btn-ctrl">⬅️</button>
                <button onclick="adjustImageParams('${ccp}', 'reset')" class="btn-ctrl" title="إعادة تعيين">🔄</button>
                <button onclick="adjustImageParams('${ccp}', 'right')" class="btn-ctrl">➡️</button>
                
                <div></div>
                <button onclick="adjustImageParams('${ccp}', 'down')" class="btn-ctrl">⬇️</button>
                <div></div>
            </div>

            <div style="display: flex; gap: 10px;">
                <button onclick="adjustImageParams('${ccp}', 'zoomIn')" class="btn-ctrl">🔍+</button>
                <button onclick="adjustImageParams('${ccp}', 'zoomOut')" class="btn-ctrl">🔍-</button>
                <button onclick="adjustImageParams('${ccp}', 'rotate')" class="btn-ctrl">↻ 90°</button>
            </div>
            
            <style>
                .btn-ctrl { width: 40px; height: 35px; cursor: pointer; border: 1px solid #ccc; background: #f8f9fa; border-radius: 4px; font-size: 14px; }
                .btn-ctrl:active { background: #e2e6ea; }
            </style>
        </div>
    `;

    Swal.fire({
        title: 'تعديل موضع الصورة',
        html: editorHtml,
        showConfirmButton: true,
        confirmButtonText: 'حفظ وإغلاق',
        width: '400px',
        allowOutsideClick: false
    });
}

// منطق تحريك الصورة وتحديث المعاينة الفورية
window.adjustImageParams = function(ccp, action) {
    const t = window.cardsContextData[ccp].imgTransform;
    const step = 5; // بكسل للتحريك
    const scaleStep = 0.1;

    switch(action) {
        case 'up': t.y -= step; break;
        case 'down': t.y += step; break;
        case 'left': t.x -= step; break;
        case 'right': t.x += step; break;
        case 'zoomIn': t.scale += scaleStep; break;
        case 'zoomOut': if(t.scale > 0.2) t.scale -= scaleStep; break;
        case 'rotate': t.rotate = (t.rotate + 90) % 360; break;
        case 'reset': t.x=0; t.y=0; t.scale=1; t.rotate=0; break;
    }

    // تحديث المعاينة في النافذة المفتوحة حالياً
    const img = document.getElementById('editor-img-preview');
    if(img) {
        img.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale}) rotate(${t.rotate}deg)`;
    }
}

// 🎨 توليد HTML البطاقة (مع التنسيق المحسن وتقليل الخطوط)
function getSingleCardHtml(emp) {
    initCardData(emp.ccp);
    const cData = window.cardsContextData[emp.ccp];
    
    // بيانات العرض
    const fullName = `${emp.fmn || ''} ${emp.frn || ''}`;
    const bDate = fmtDate(emp.diz);
    const job = getJob(emp.gr);
    const school = emp.schoolName || '';
    const jobId = cData.jobId || '.......................';
    const barcodeVal = cData.jobId || emp.ccp || "0000000000";

    // نمط الصورة (التحريك والتدوير)
    const t = cData.imgTransform;
    const imgStyle = `width: 100%; height: 100%; object-fit: cover; transform-origin: center; transform: translate(${t.x}px, ${t.y}px) scale(${t.scale}) rotate(${t.rotate}deg);`;

    const photoHtml = cData.photoBase64 ? 
        `<img src="${cData.photoBase64}" style="${imgStyle}">` : 
        `<span style="color:#ccc; font-size:12px">صورة شمسية</span>`;

    // 📏 تحسينات CSS (تقليل الخطوط وضبط المسافات)
    // font-size للقيم: تم تقليله من 22px إلى 16px
    // font-size للعناوين: تم تقليله من 15px إلى 13px
    // margin-bottom: تم تقليله لتوفير مساحة

    return `
    <div class="card-wrapper" style="width: 85.6mm; height: 54mm; position: relative; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; background: white; margin:auto;">
        <div class="card" style="width: 750px; height: 474px; position: absolute; top: 0; right: 0; transform: scale(0.431); transform-origin: top right; display: flex; flex-direction: column; background-image: linear-gradient(135deg, #ffffff 0%, #f4f8f6 100%);">
            
            <div style="width: 100%; height: 8px; display: flex; z-index: 10;">
                <div style="flex: 2; background-color: #006233;"></div>
                <div style="flex: 1; background-color: #D22B2B;"></div>
            </div>
            
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; background-image: url('https://lh3.googleusercontent.com/d/1O9TZQrn9q4iRnI1NldJNxfq0bKuc8S-u'); background-size: contain; background-repeat: no-repeat; opacity: 0.1; z-index: 0;"></div>
            
            <div style="position: relative; z-index: 2; padding: 5px 15px 0 15px; display: flex; justify-content: space-between; align-items: center; height: 90px;">
                <div style="display: flex; flex-direction: column; align-items: center; min-width: 90px;">
                    <img src="https://lh3.googleusercontent.com/d/1O9TZQrn9q4iRnI1NldJNxfq0bKuc8S-u" style="width: 60px; height: 60px; object-fit: contain;">
                    <div style="font-size: 13px; font-weight: 900; margin-top: 2px;">وزارة التربية</div>
                </div>
                <div><div style="font-family: 'Cairo', sans-serif; font-size: 18px; font-weight: 700; color: #2c3e50; margin-top: -20px;">الجمهورية الجزائرية الديمقراطية الشعبية</div></div>
                <div style="display: flex; flex-direction: column; align-items: center; min-width: 90px;">
                    <img src="https://lh3.googleusercontent.com/d/1O9TZQrn9q4iRnI1NldJNxfq0bKuc8S-u" style="width: 60px; height: 60px; object-fit: contain;">
                    <div style="font-size: 13px; font-weight: 900; margin-top: 2px;">مديرية التربية</div>
                </div>
            </div>
            
            <div style="position: relative; z-index: 2; display: flex; flex-grow: 1; padding: 0 20px 0 20px;">
                
                <div style="flex: 1.8; display: flex; flex-direction: column; justify-content: center; padding-left: 10px;">
                    <div style="font-family: 'Cairo', sans-serif; font-size: 24px; font-weight: 700; color: #006233; border-bottom: 2px solid #D22B2B; margin-bottom: 8px; width: fit-content;">بطاقة التعريف المهنية</div>
                    
                    <div style="display: flex; align-items: baseline; margin-bottom: 4px;">
                        <span style="font-weight: 700; color: #555; min-width: 120px; font-family: 'Cairo', sans-serif; font-size: 13px;">اللقب والاسم:</span>
                        <span style="font-weight: 800; color: #000; font-size: 16px; white-space: nowrap;">${fullName}</span>
                    </div>
                    <div style="display: flex; align-items: baseline; margin-bottom: 4px;">
                        <span style="font-weight: 700; color: #555; min-width: 120px; font-family: 'Cairo', sans-serif; font-size: 13px;">تاريخ الميلاد:</span>
                        <span style="font-weight: 800; color: #000; font-size: 16px;">${bDate}</span>
                    </div>
                    <div style="display: flex; align-items: baseline; margin-bottom: 4px;">
                        <span style="font-weight: 700; color: #555; min-width: 120px; font-family: 'Cairo', sans-serif; font-size: 13px;">الرتبة:</span>
                        <span style="font-weight: 800; color: #000; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px;">${job}</span>
                    </div>
                    <div style="display: flex; align-items: baseline; margin-bottom: 4px;">
                        <span style="font-weight: 700; color: #555; min-width: 120px; font-family: 'Cairo', sans-serif; font-size: 13px;">مكان العمل:</span>
                        <span style="font-weight: 800; color: #000; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px;">${school}</span>
                    </div>
                    <div style="display: flex; align-items: baseline; margin-bottom: 4px;">
                        <span style="font-weight: 700; color: #555; min-width: 120px; font-family: 'Cairo', sans-serif; font-size: 13px;">الرقم الوظيفي:</span>
                        <span style="font-weight: 800; color: #000; font-size: 16px;">${jobId}</span>
                    </div>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 25px;">
                    <div style="font-family: 'Cairo', sans-serif; font-weight: 700; font-size: 14px; color: #D22B2B; background: rgba(210, 43, 43, 0.05); padding: 2px 8px; border-radius: 8px; width: 160px; display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>الرقم:</span><span dir="ltr">2026 / ${barcodeVal.substring(0,4)}</span>
                    </div>
                    
                    <div style="width: 130px; height: 170px; background-color: #fafafa; border: 2px solid #fff; box-shadow: 0 3px 6px rgba(0,0,0,0.15); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; overflow: hidden;">
                        ${photoHtml}
                    </div>
                    
                    <div style="font-weight: 700; font-size: 16px; color: #2c3e50; border-top: 1px solid #ddd; width: 90%; text-align: center; padding-top: 2px;">مدير التربية</div>
                </div>
            </div>
            
            <div style="width: 100%; display: flex; justify-content: center; align-items: center; margin-top: auto; margin-bottom: 8px; z-index: 5;">
                <svg class="barcode-target" data-value="${barcodeVal}"></svg>
            </div>

            <div style="background-color: #006233; color: white; display: flex; justify-content: center; align-items: center; width: 100%; padding: 4px 0; font-family: 'Cairo', sans-serif; font-size: 13px; font-weight: 600; position: relative; z-index: 10;">
                على السلطات المدنية والعسكرية أن تسمح لحامل هذه البطاقة بالمرور في كل الحالات
            </div>
        </div>
    </div>`;
}

// نافذة المعاينة (محسنة لعدم الخروج من الواجهة)
window.previewCard = function(ccp) {
    const emp = window.currentListContext.find(e => e.ccp === ccp);
    if(!emp) return;
    
    // استخدام عرض كبير (900px) ليظهر التصميم بوضوح
    Swal.fire({
        title: 'معاينة البطاقة',
        html: `<div style="display:flex; justify-content:center; padding: 20px 0;">${getSingleCardHtml(emp)}</div>`,
        width: '900px', 
        showConfirmButton: false,
        showCloseButton: true, // زر الإغلاق X
        allowOutsideClick: false, // منع الإغلاق بالنقر بالخارج بالخطأ
        didOpen: () => {
            // توليد الباركود
            try {
                document.querySelectorAll('.barcode-target').forEach(svg => {
                    JsBarcode(svg, svg.getAttribute('data-value'), { format: "CODE128", displayValue: false, height: 25, width: 1.5, margin: 0, background: "transparent" });
                });
            } catch(e) { console.log(e); }
        }
    }).then(() => {
        // عند الإغلاق لا نفعل شيئاً (يبقى المستخدم في واجهة الجدول)
    });
}

// دالة الطباعة المجمعة
window.printAllCards = function() {
    const data = window.currentListContext.filter(d => d.confirmed === true || String(d.confirmed).toLowerCase() === "true");
    if(data.length === 0) return Swal.fire("تنبيه", "لا توجد بيانات مؤكدة", "warning");

    let printHtml = `<style>@page { size: A4; margin: 0; } body { margin: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Amiri', serif;} .page-a4 { width: 210mm; min-height: 297mm; padding: 10mm; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(4, auto); gap: 5mm; box-sizing: border-box; page-break-after: always; margin:auto;}</style>`;

    for (let i = 0; i < data.length; i += 8) {
        const chunk = data.slice(i, i + 8);
        printHtml += `<div class="page-a4">`;
        chunk.forEach(emp => { printHtml += getSingleCardHtml(emp); });
        printHtml += `</div>`;
    }

    const pc = document.getElementById("printContainer");
    const oc = pc.innerHTML;
    pc.innerHTML = printHtml;

    try {
        document.querySelectorAll('#printContainer .barcode-target').forEach(svg => {
            JsBarcode(svg, svg.getAttribute('data-value'), { format: "CODE128", displayValue: false, height: 25, width: 1.5, margin: 0, background: "transparent" });
        });
    } catch(e) {}

    window.print();
    setTimeout(() => { pc.innerHTML = oc; }, 1000);
}

// إنشاء جدول إدارة البطاقات
function generateCardsTable(data, schoolName) {
    const confirmedOnly = data.filter(e => (e.confirmed === true || String(e.confirmed).toLowerCase() === "true"));
    window.currentListContext = confirmedOnly;

    let rows = '';
    confirmedOnly.forEach((emp, index) => {
        // التأكد من تهيئة البيانات لضمان عدم حدوث خطأ
        initCardData(emp.ccp);
        const cData = window.cardsContextData[emp.ccp];
        
        const hasPhoto = !!cData.photoBase64;
        const btnColor = hasPhoto ? '#28a745' : '#6c757d';
        const btnText = hasPhoto ? 'تم الرفع ✔️' : 'رفع صورة';
        const editDisplay = hasPhoto ? 'inline-block' : 'none';

        rows += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="font-weight:bold;">${index + 1}</td>
                <td style="color:#2c3e50; font-weight:600;">${emp.fmn} ${emp.frn}</td>
                <td style="font-size:11px;">${getJob(emp.gr)}</td>
                <td>
                    <input type="text" value="${cData.jobId||''}" onchange="updateCardJobId('${emp.ccp}', this.value)" placeholder="الرقم الوظيفي" style="width:100px; padding:4px; border:1px solid #ccc; border-radius:4px; text-align:center;">
                </td>
                <td style="white-space: nowrap;">
                    <input type="file" id="file-${emp.ccp}" style="display:none;" onchange="handlePhotoUpload('${emp.ccp}', this)" accept="image/*">
                    
                    <button onclick="document.getElementById('file-${emp.ccp}').click()" style="background:${btnColor}; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; margin-left:3px;">${btnText}</button>
                    
                    <button id="btn-edit-${emp.ccp}" onclick="openPhotoEditor('${emp.ccp}')" style="display:${editDisplay}; background:#ffc107; color:#333; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;" title="تعديل موضع الصورة">🛠️</button>
                </td>
                <td>
                    <button onclick="previewCard('${emp.ccp}')" style="background:#17a2b8; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:11px;"><i class="fas fa-eye"></i> معاينة</button>
                </td>
            </tr>
        `;
    });

    const tableHtml = `
        <style>
            .modern-table { width: 100%; border-collapse: collapse; text-align: right; direction: rtl; font-family: 'Cairo', sans-serif; }
            .modern-table thead th { background: #17a2b8; color: white; padding: 8px 5px; font-size: 12px; position: sticky; top: 0; z-index: 10; }
            .modern-table tbody td { padding: 6px 5px; font-size: 12px; vertical-align: middle;}
            .modern-table tbody tr:nth-child(even) { background-color: #fbfbfb; }
            .btn-print-cards { background-color: #006233; color:white; border:none; border-radius:5px; font-size: 14px; font-weight:bold; padding: 8px 20px; cursor:pointer; margin-top:10px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);}
        </style>
        <div style="text-align:center; margin-bottom:10px;">
            <h3 style="color:#17a2b8; margin-bottom: 5px; font-family: 'Cairo', sans-serif;">إدارة البطاقات المهنية - ${schoolName}</h3>
            <button onclick="printAllCards()" class="btn-print-cards"><i class="fas fa-print"></i> طباعة البطاقات (8/صفحة)</button>
        </div>
        <div style="overflow-x:auto; overflow-y:auto; max-height:60vh; border-radius: 6px; border: 1px solid #ddd;">
            <table class="modern-table">
                <thead><tr><th width="5%">#</th><th width="25%">الاسم</th><th width="20%">الرتبة</th><th width="15%">الرقم الوظيفي</th><th width="25%">الصورة</th><th width="10%">معاينة</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;

    Swal.fire({ title: '', html: tableHtml, width: '900px', showConfirmButton: false, showCloseButton: true, background: '#fff', padding: '15px' });
}

// الدوال المساعدة للطباعة العادية (القديمة) تم إخفاؤها للاختصار ولكن يجب أن تكون موجودة كما في الكود السابق
// ... (generateEmployeesTable, printCurrentTable, etc.) ...
function generateEmployeesTable(d,s){/* Code from prev response */}
function generateBulkForms(d,s){/* Code from prev response */}
function triggerSecretAdminLogin(){/* Code from prev response */}
