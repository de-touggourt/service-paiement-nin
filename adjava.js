import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// تم تحديث الاستيراد هنا لإضافة collection, query, where, getDocs
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- إعدادات Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAkQz9pB2ZNlYIvdlTRvi4try3D8LLXS4g",
  authDomain: "databaseemploye.firebaseapp.com",
  projectId: "databaseemploye",
  storageBucket: "databaseemploye.firebasestorage.app",
  messagingSenderId: "408231477466",
  appId: "1:408231477466:web:e3bf5bd3eaca7cdcd3a5e3",
  measurementId: "G-DW8QJ5B231"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- الكود المخفي (HTML) ---
const SECURE_DASHBOARD_HTML = `
  <div class="dashboard-container" style="display:block;">
    <div class="header-area">
      <div style="display:flex; align-items:center; gap:15px;">
        <img src="https://lh3.googleusercontent.com/d/1BqWoqh1T1lArUcwAGNF7cGnnN83niKVl" width="70" style="border-radius:50%;">
        <div>
          <h1 class="page-title">لوحة تسيير ملفات موظفي مديرية التربية لولاية توقرت - مصلحة الرواتب</h1>
          <p style="color:#6c757d; font-size:13px; margin-top:2px;">قاعدة بيانات تسيير نفقات المستخدمين 2026</p>
        </div>
      </div>
      <button class="btn logout-btn" onclick="location.reload()">
        خروج <i class="fas fa-sign-out-alt"></i>
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card bg-blue">
        <h3 id="totalCount">0</h3>
        <p><i class="fas fa-users"></i> إجمالي المسجلين</p>
      </div>
      <div class="stat-card bg-green">
        <h3 id="confirmedCount">0</h3>
        <p><i class="fas fa-check-circle"></i> الملفات المؤكدة</p>
      </div>
      <div class="stat-card bg-orange">
        <h3 id="pendingCount">0</h3>
        <p><i class="fas fa-hourglass-half"></i> في انتظار التأكيد</p>
      </div>
    </div>

    <div class="controls-bar">
      <div style="position:relative; flex-grow:1;">
        <i class="fas fa-search" style="position:absolute; top:50%; right:15px; transform:translateY(-50%); color:#adb5bd;"></i>
        <input type="text" id="searchInput" class="search-input" style="padding-right:40px;" placeholder="بحث سريع..." onkeyup="window.applyFilters()">
      </div>

      <select id="statusFilter" class="filter-select" onchange="window.applyFilters()">
        <option value="all">عرض الجميع</option>
        <option value="confirmed">✅ المؤكدة فقط</option>
        <option value="pending">⏳ الغير مؤكدة فقط</option>
      </select>

    <button class="btn btn-add" onclick="window.openAddModal()">
        تسجيل جديد <i class="fas fa-plus"></i>
      </button>

    <button class="btn btn-refresh" onclick="window.loadData()">
        تحديث <i class="fas fa-sync-alt"></i>
      </button>

    <button class="btn btn-firebase" onclick="window.openFirebaseModal()">
      إضافة موظف <i class="fas fa-database"></i>
      </button>
      
      <button class="btn btn-excel" onclick="window.downloadExcel()">
        تحميل Excel <i class="fas fa-file-excel"></i>
      </button>
    </div>

    <div class="table-container">
      <div class="table-responsive">
        <table id="dataTable">
          <thead>
            <tr>
              <th>CCP</th>
              <th>الاسم واللقب</th>
              <th>الرتبة / الوظيفة</th>
              <th>مكان العمل</th>
              <th>رقم الهاتف</th>
              <th>الحالة</th>
              <th>آخر تحديث</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody id="tableBody">
            <tr><td colspan="8" style="text-align:center; padding:30px;">جاري تحميل البيانات...</td></tr>
          </tbody>
        </table>
      </div>
      
      <div class="pagination-container" id="paginationControls" style="display:none;">
        <button class="page-btn" id="prevBtn" onclick="window.changePage(-1)">السابق</button>
        <span class="page-info" id="pageInfo">صفحة 1 من 1</span>
        <button class="page-btn" id="nextBtn" onclick="window.changePage(1)">التالي</button>
      </div>
    </div>
  </div>
`;

// --- المتغيرات العامة ---
const scriptURL = "https://script.google.com/macros/s/AKfycbypaQgVu16EFOMnxN7fzdFIFtiLiLjPX0xcwxEUjG5gsoeZ8yQJ5OL5IwIlJMgsrAJxwA/exec"; 

// متغيرات البيانات والصفحات
let allData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;

const baladiyaMap = { 
    "توقرت": ["توقرت", "النزلة", "تبسبست", "الزاوية العابدية"], 
    "تماسين": ["تماسين", "بلدة عمر"], 
    "المقارين": ["المقارين", "سيدي سليمان"], 
    "الحجيرة": ["الحجيرة", "العالية"], 
    "الطيبات": ["الطيبات", "المنقر", "ابن ناصر"] 
};

const primarySchoolsByBaladiya = {};
const institutionsByDaaira = {};

// 1. دالة التحقق والدخول
window.verifyAdminLogin = async function() {
    const passInput = document.getElementById("adminPass").value;
    const btn = document.querySelector("#loginOverlay button");

    if(!passInput) return Swal.fire('تنبيه', 'يرجى إدخال كلمة المرور', 'warning');

    const oldText = btn.innerHTML;
    btn.innerHTML = 'جاري التحقق...';
    btn.disabled = true;

    try {
        const docRef = doc(db, "config", "pass");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const realPass = docSnap.data().service_pay_adminn; 

            if (String(passInput) === String(realPass)) {
                const container = document.getElementById("secure-app-root");
                container.innerHTML = SECURE_DASHBOARD_HTML;
                
                document.getElementById("loginOverlay").style.opacity = '0';
                setTimeout(() => {
                    document.getElementById("loginOverlay").style.display = "none";
                    container.classList.add("visible");
                    window.loadData();
                }, 500);

                const Toast = Swal.mixin({
                    toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true
                });
                Toast.fire({ icon: 'success', title: 'مرحباً بك أيها المسؤول' });

            } else {
                Swal.fire('خطأ', 'كلمة المرور غير صحيحة', 'error');
                document.getElementById("adminPass").value = '';
            }
        } else {
            Swal.fire('خطأ', 'تعذر العثور على ملف الإعدادات في قاعدة البيانات', 'error');
        }
    } catch (error) {
        console.error(error);
        Swal.fire('خطأ', 'مشكلة في الاتصال: ' + error.message, 'error');
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
};

document.getElementById("adminPass").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        window.verifyAdminLogin();
    }
});

// 2. دوال البيانات والفلترة والصفحات
window.loadData = async function() {
  const tbody = document.getElementById("tableBody");
  if(!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--primary-color);"><i class="fas fa-circle-notch fa-spin fa-2x"></i><br>جاري الاتصال بقاعدة البيانات...</td></tr>';
  
  try {
    const response = await fetch(scriptURL + "?action=read_all");
    const result = await response.json();

    if(result.status === "success") {
      allData = result.data;
      window.updateStats(allData);
      window.applyFilters();
    } else {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">خطأ: ${result.message}</td></tr>`;
    }
  } catch (error) {
    console.error(error);
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">فشل الاتصال بالسيرفر. تأكد من الإنترنت.</td></tr>';
  }
};

window.applyFilters = function() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;

    filteredData = allData.filter(row => {
        const matchesSearch = (
            (row.fmn && row.fmn.includes(query)) ||
            (row.frn && row.frn.includes(query)) ||
            (row.ccp && String(row.ccp).includes(query)) ||
            (row.phone && String(row.phone).replace(/\s/g,'').includes(query)) || 
            (row.schoolName && row.schoolName.includes(query))
        );

        let matchesStatus = true;
        const isConfirmed = String(row.confirmed).toLowerCase() === "true";

        if (statusFilter === "confirmed") {
            matchesStatus = isConfirmed;
        } else if (statusFilter === "pending") {
            matchesStatus = !isConfirmed;
        }

        return matchesSearch && matchesStatus;
    });

    currentPage = 1;
    window.renderCurrentPage();
};

window.renderCurrentPage = function() {
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);

    window.renderTable(pageData);
    window.updatePaginationUI(totalPages);
};

window.changePage = function(direction) {
    currentPage += direction;
    window.renderCurrentPage();
};

window.updatePaginationUI = function(totalPages) {
    const controls = document.getElementById("paginationControls");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const pageInfo = document.getElementById("pageInfo");

    if (totalPages <= 1 && filteredData.length > 0) {
         controls.style.display = "none";
    } else if (filteredData.length === 0) {
         controls.style.display = "none";
    } else {
         controls.style.display = "flex";
    }

    pageInfo.innerText = `صفحة ${currentPage} من ${totalPages || 1}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
};

window.renderTable = function(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  if(data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">لا توجد سجلات مطابقة للبحث</td></tr>';
    return;
  }

  data.forEach((row) => {
    const originalIndex = allData.findIndex(item => item.ccp === row.ccp);

    const isConfirmed = String(row.confirmed).toLowerCase() === "true";
    const statusBadge = isConfirmed 
      ? `<span class="badge badge-confirmed"><i class="fas fa-check"></i> مؤكد</span>` 
      : `<span class="badge badge-pending"><i class="fas fa-clock"></i> غير مؤكد</span>`;

    let dateStr = window.fmtDate(row.date_edit);

    const gradeJobHtml = `
      <div class="grade-job-cell">
        <span class="job-text">${row.job || ''}</span>
        <span class="grade-text">${row.gr || 'غير محدد'}</span>
      </div>
    `;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:700; font-family:'Cairo';">${row.ccp}</td>
      <td>${row.fmn} ${row.frn}</td>
      <td>${gradeJobHtml}</td>
      <td>${row.schoolName || '-'}</td>
      <td style="direction:ltr; text-align:right;">${row.phone}</td>
      <td>${statusBadge}</td>
      <td style="font-size:12px; font-weight:600;">${dateStr}</td>
      <td>
        <div class="actions-cell">
          <button class="action-btn btn-view" onclick="window.viewDetails(${originalIndex})" title="عرض التفاصيل"><i class="fas fa-eye"></i></button>
          <button class="action-btn btn-edit" onclick="window.openEditModal(${originalIndex})" title="تعديل"><i class="fas fa-pen-to-square"></i></button>
          <button class="action-btn btn-delete" onclick="window.deleteUser('${row.ccp}')" title="حذف"><i class="fas fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

window.saveToFirebaseDB = function(formData) {
    Swal.fire({ title: 'جاري الحفظ في Firestore...', didOpen: () => Swal.showLoading() });

    const specificData = {
        adm: formData.adm || "",
        ass: formData.ass || "",
        ccp: formData.ccp || "",
        diz: formData.diz ? new Date(formData.diz) : null,
        fmn: formData.fmn || "",
        frn: formData.frn || "",
        gr: formData.gr || "",
        mtr: formData.mtr || "",
        updated_at: new Date()
    };

    const docRef = doc(db, "employeescompay", formData.ccp);

    setDoc(docRef, specificData)
    .then(() => { Swal.fire('تمت الإضافة', 'تم حفظ البيانات بنجاح في employeescompay', 'success'); })
    .catch((error) => { Swal.fire('خطأ', 'فشل الحفظ: ' + error.message, 'error'); });
};

window.downloadExcel = async function() {
  Swal.fire({
    title: 'جاري تحضير ملف Excel...',
    html: 'يرجى الانتظار، يتم جلب البيانات وتشفير الملف.',
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading(); }
  });

  try {
    const response = await fetch(scriptURL + "?action=export_excel");
    const result = await response.json();

    if (result.status === "success") {
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Swal.fire({icon: 'success', title: 'تم التحميل', timer: 2000, showConfirmButton: false});
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    Swal.fire({icon: 'error', title: 'خطأ', text: 'فشل إنشاء ملف Excel: ' + error.message});
  }
};

window.updateStats = function(data) {
  const total = data.length;
  const confirmed = data.filter(r => String(r.confirmed).toLowerCase() === "true").length;
  document.getElementById("totalCount").innerText = total;
  document.getElementById("confirmedCount").innerText = confirmed;
  document.getElementById("pendingCount").innerText = total - confirmed;
};

window.viewDetails = function(index) {
    const d = allData[index];
    const getDisplayDate = (dateVal) => {
        if (!dateVal) return "---";
        if (typeof dateVal === 'string' && dateVal.includes('T')) return window.fmtDateTime(dateVal);
        if (typeof dateVal === 'string') return dateVal;
        const formatted = window.fmtDateTime(dateVal);
        return formatted !== "-" ? formatted : dateVal;
    };

    const regDate = getDisplayDate(d.date);
    const editDate = getDisplayDate(d.date_edit);
    const isConfirmed = String(d.confirmed).toLowerCase() === "true";
    const confirmDate = isConfirmed ? getDisplayDate(d.date_confirm) : '---';
    const confirmerName = d.confirmed_by ? d.confirmed_by : '---';
    const confirmerPhone = d.reviewer_phone ? d.reviewer_phone : '---';

    const statusHtml = isConfirmed 
        ? '<span style="color:var(--success-color); font-weight:bold;">✅ مؤكد</span>' 
        : '<span style="color:var(--warning-color); font-weight:bold;">⏳ في الانتظار</span>';

    Swal.fire({
        title: '',
        width: '600px',
        html: `
            <div class="info-card-container">
                <div class="info-header">
                    <div class="info-avatar">${d.frn ? d.frn.charAt(0) : '?'}</div>
                    <div class="info-title">
                        <h3>${d.fmn} ${d.frn}</h3>
                        <span>CCP: ${d.ccp}</span>
                    </div>
                    <div style="margin-right:auto;">${statusHtml}</div>
                </div>
                <div class="info-grid">
                    <div class="info-item"><span class="info-label">NIN</span><span class="info-value">${d.nin || '--'}</span></div>
                    <div class="info-item"><span class="info-label">الضمان الاجتماعي</span><span class="info-value">${d.ass || '--'}</span></div>
                    <div class="info-item"><span class="info-label">الميلاد</span><span class="info-value">${String(d.diz).replace(/'/g, '') || '--'}</span></div>
                    <div class="info-item"><span class="info-label">الهاتف</span><span class="info-value" dir="ltr">${d.phone}</span></div>
                </div>
                <div class="info-grid">
                    <div class="info-item full-width"><span class="info-label">الوظيفة</span><span class="info-value">${d.job || ''} - ${d.gr}</span></div>
                    <div class="info-item full-width"><span class="info-label">مكان العمل</span><span class="info-value">${d.schoolName} (${d.daaira}/${d.baladiya})</span></div>
                </div>
                ${isConfirmed ? `
                <div style="margin-top:15px; border-top:1px dashed #ddd; padding-top:10px;">
                    <div style="font-size:12px; font-weight:bold; color:#28a745; margin-bottom:5px;">بيانات المصادقة</div>
                    <div class="info-grid">
                        <div class="info-item"><span class="info-label">اسم المؤكد</span><span class="info-value">${confirmerName}</span></div>
                        <div class="info-item"><span class="info-label">رقم المؤكد</span><span class="info-value" dir="ltr">${confirmerPhone}</span></div>
                    </div>
                </div>` : ''}
                <div class="dates-section">
                    <div class="date-box"><span class="date-label">التسجيل</span><span class="date-val">${regDate}</span></div>
                    <div class="date-box"><span class="date-label">آخر تعديل</span><span class="date-val">${editDate}</span></div>
                    <div class="date-box"><span class="date-label">التأكيد</span><span class="date-val">${confirmDate}</span></div>
                </div>
            </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'إغلاق',
    });
};

window.openFirebaseModal = function() {
  Swal.fire({
    title: 'إضافة موظف لقاعدة البيانات',
    width: '800px',
    customClass: 'swal-wide',
    html: window.getFirebaseFormHtml(),
    showCancelButton: true,
    confirmButtonText: 'إضافة الموظف',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#ffca28',
    focusConfirm: false,
    didOpen: () => {
        document.querySelector('.swal2-confirm').style.color = '#333';
    },
    preConfirm: () => {
        return {
            ccp: document.getElementById('inp_ccp').value,
            ass: document.getElementById('inp_ass').value,
            fmn: document.getElementById('inp_fmn').value,
            frn: document.getElementById('inp_frn').value,
            diz: document.getElementById('inp_diz').value,
            gr: document.getElementById('inp_gr').value,
            mtr: document.getElementById('inp_mtr').value,
            adm: document.getElementById('inp_adm').value
        };
    }
  }).then((res) => {
    if(res.isConfirmed) {
          window.saveToFirebaseDB(res.value);
    }
  });
};

// --- الدالة المعدلة كلياً: تسجيل موظف جديد (مدمج بها منطق injava.js للتحقق) ---
// --- الدالة المعدلة: تسجيل موظف جديد (مع حل مشكلة اختفاء النافذة عند الضغط على Enter) ---
window.openAddModal = function() {
  Swal.fire({
    title: 'تسجيل موظف جديد',
    width: '800px',
    customClass: 'swal-wide',
    html: window.getFormHtml({}, true),
    showCancelButton: true,
    confirmButtonText: 'تسجيل الموظف',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#2a9d8f',
    focusConfirm: false,
    allowEnterKey: false, // 🛑 منع إغلاق النافذة بزر Enter بشكل عام
    
    // كود التحقق وجلب البيانات
    didOpen: () => {
        const ccpInput = document.getElementById('inp_ccp');

        // دالة مساعدة لتعبئة الحقول بأمان
        const safeSetVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) {
                el.value = val;
            }
        };

        // دالة تحويل الرتب
        const getJobFromGrade = (code) => {
            if(!code) return "";
            const mapping = {
                "11": "أستاذ المدرسة الابتدائية", "14": "مدير مدرسة ابتدائية", "12": "مساعد مدير مدرسة ابتدائية",
                "12/1": "أستاذ التعليم المتوسط", "13": "أستاذ رئيسي للتعليم المتوسط", "15": "مستشار التربية", "17": "مدير متوسطة",
                "13/1": "أستاذ التعليم الثانوي", "14/1": "أستاذ رئيسي للتعليم الثانوي", "16": "ناظر ثانوية", "18": "مدير ثانوية",
                "10": "مشرف تربية", "A1": "عامل مهني", "OP1": "عامل مهني", "4087": "مشرف تربية", "5019": "أستاذ تعليم ثانوي"
            };
            return mapping[code] || mapping[code.split('/')[0]] || "";
        };

        // --- دالة البحث المفصلة ---
        const performSearch = async () => {
            const rawInput = ccpInput.value.trim();
            if (!rawInput) return;

            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
            Toast.fire({ icon: 'info', title: 'جاري البحث...' });

            // تنظيف المدخلات
            const cleanInput = rawInput.replace(/\D/g, ''); 
            const baseCCP = cleanInput.replace(/^0+/, ''); 

            // إعداد احتمالات البحث
            const candidates = [
                rawInput,
                cleanInput,
                baseCCP,
                baseCCP.padStart(10, '0')
            ];
            
            if (baseCCP && !isNaN(Number(baseCCP))) {
                candidates.push(Number(baseCCP));
            }
            
            const uniqueCandidates = [...new Set(candidates)];
            console.log("Searching for:", uniqueCandidates);

            let data = null;
            const employeesRef = collection(db, "employeescompay");

            try {
                // المحاولة 1: البحث عن طريق ID
                for (const candidate of uniqueCandidates) {
                    const docRef = doc(db, "employeescompay", String(candidate));
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        console.log("Found by Doc ID:", candidate);
                        data = docSnap.data();
                        break; 
                    }
                }

                // المحاولة 2: البحث داخل الحقول
                if (!data) {
                    for (const candidate of uniqueCandidates) {
                        try {
                            let q = query(employeesRef, where("ccp", "==", candidate));
                            let querySnapshot = await getDocs(q);
                            if (!querySnapshot.empty) {
                                console.log("Found by Field Query:", candidate);
                                data = querySnapshot.docs[0].data();
                                break;
                            }
                        } catch (qErr) {
                            // تجاهل الأخطاء الفردية
                        }
                    }
                }

                // تعبئة البيانات عند العثور عليها
                if (data) {
                    if(data.ass) safeSetVal('inp_ass', data.ass);
                    if(data.fmn) safeSetVal('inp_fmn', data.fmn);
                    if(data.frn) safeSetVal('inp_frn', data.frn);
                    if(data.nin) safeSetVal('inp_nin', data.nin);

                    if(data.gr) {
                        safeSetVal('inp_gr', data.gr);
                        const jobTitle = getJobFromGrade(data.gr);
                        if(jobTitle) safeSetVal('inp_job', jobTitle);
                    }

                    if (data.diz) {
                        let dateObj = data.diz.toDate ? data.diz.toDate() : new Date(data.diz);
                        if (!isNaN(dateObj.getTime())) {
                            safeSetVal('inp_diz', dateObj.toISOString().split('T')[0]);
                        }
                    }
                    Toast.fire({ icon: 'success', title: 'تم العثور على البيانات!' });
                } else {
                    Toast.fire({ icon: 'warning', title: 'لم يتم العثور على الحساب' });
                }

            } catch (error) {
                console.error("Critical Search Error:", error);
                Swal.fire({ icon: 'error', title: 'خطأ تقني', text: error.message });
            }
        };

        // 🛑 التعامل مع زر Enter بشكل خاص لمنع الإغلاق 🛑
        ccpInput.addEventListener('keydown', async function(event) {
            if (event.key === "Enter") {
                event.preventDefault(); // يمنع إغلاق النافذة
                event.stopPropagation();
                await performSearch(); // ينفذ البحث
            }
        });

        // البحث عند الخروج من الحقل أيضاً
        ccpInput.addEventListener('change', performSearch);
    },

    preConfirm: () => window.getFormDataFromModal()
  }).then((res) => {
    if(res.isConfirmed) {
      window.handleSave(res.value, "register");
    }
  });
};

window.openEditModal = function(index) {
  const d = allData[index];
  Swal.fire({
    title: 'تعديل بيانات الموظف',
    width: '800px',
    customClass: 'swal-wide',
    html: window.getFormHtml(d, false), 
    showCancelButton: true,
    confirmButtonText: 'حفظ التعديلات',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#4361ee',
    focusConfirm: false,
    didOpen: () => {
        window.initModalData(d);
    },
    preConfirm: () => window.getFormDataFromModal()
  }).then((res) => {
    if(res.isConfirmed) {
      window.handleSave(res.value, "update_admin");
    }
  });
};

window.deleteUser = function(ccp) {
  Swal.fire({
    title: 'تأكيد الحذف',
    text: `هل أنت متأكد من حذف الحساب ${ccp}؟`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e63946',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'نعم، حذف',
    cancelButtonText: 'إلغاء'
  }).then(async (result) => {
    if (result.isConfirmed) {
      Swal.fire({title: 'جاري الحذف...', didOpen:()=>Swal.showLoading()});
      try {
        const formData = new URLSearchParams();
        formData.append("action", "delete");
        formData.append("ccp", ccp);
        const res = await fetch(scriptURL, { method: "POST", body: formData });
        const json = await res.json();
        if(json.result === "success") {
          Swal.fire("تم الحذف", "تم حذف السجل بنجاح", "success");
          window.loadData();
        } else {
          Swal.fire("خطأ", json.message, "error");
        }
      } catch(e) {
        Swal.fire("خطأ", "فشل الاتصال", "error");
      }
    }
  });
};

window.handleSave = async function(data, actionType) {
    Swal.fire({
        title: 'جاري الحفظ...',
        text: 'يرجى الانتظار بينما يتم معالجة الطلب',
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false
    });

    const p = new URLSearchParams();
    p.append("action", actionType);
    for(let key in data) {
        p.append(key, data[key]);
    }

    try {
        const req = await fetch(scriptURL, { method: "POST", body: p });
        const json = await req.json();
        
        if(json.result === "success") {
            Swal.fire({icon: 'success', title: 'تمت العملية', text: json.message, timer: 2000});
            window.loadData(); 
        } else {
            Swal.fire("خطأ", json.message || "حدث خطأ غير معروف", "error");
        }
    } catch(e) { 
        Swal.fire("خطأ", "فشل الاتصال بالسيرفر", "error"); 
    }
};

window.updBalAdmin = function() {
  const d = document.getElementById("inp_daaira").value;
  const b = document.getElementById("inp_baladiya");
  b.innerHTML = '<option value="">-- اختر --</option>';
  if(d && baladiyaMap[d]) {
    baladiyaMap[d].forEach(o => {
      let op = document.createElement("option");
      op.text = o; op.value = o; b.add(op);
    });
  }
};

window.updateWorkPlaceAdmin = function() {
  const l = document.getElementById("inp_level").value;
  const d = document.getElementById("inp_daaira").value;
  const b = document.getElementById("inp_baladiya").value;
  const area = document.getElementById("institutionArea");
  area.innerHTML = ''; 
  
  const mkSel = (lst) => {
    let s = document.createElement("select");
    s.id = "inp_school";
    s.innerHTML = '<option value="">-- اختر --</option>';
    lst.forEach(i => { let o = document.createElement("option"); o.text = i.name; o.value = i.name; s.add(o); });
    s.style.width = "100%"; s.style.padding = "12px"; s.style.border = "1px solid #dee2e6"; s.style.borderRadius = "10px";
    area.appendChild(s);
  };
  
  if(l === 'ابتدائي' && b && primarySchoolsByBaladiya) mkSel(primarySchoolsByBaladiya[b] || []);
  else if((l === 'متوسط' || l === 'ثانوي') && d && institutionsByDaaira) mkSel(institutionsByDaaira[d][l] || []);
  else area.innerHTML = '<input id="inp_school" placeholder="اختر الطور والمنطقة أولاً" readonly style="width:100%; padding:12px; border:1px solid #dee2e6; border-radius:10px; background:#e9ecef;">';
};

window.initModalData = function(d) {
    if(!d) return;
    if(d.daaira) {
        window.updBalAdmin();
        setTimeout(() => {
            document.getElementById("inp_baladiya").value = d.baladiya;
            window.updateWorkPlaceAdmin();
            setTimeout(() => {
                const schoolSelect = document.getElementById("inp_school");
                if(schoolSelect) schoolSelect.value = d.schoolName;
            }, 50);
        }, 50);
    }
};

window.getFirebaseFormHtml = function() {
  return `
      <div class="edit-form-wrapper">
        <div class="form-section-title"><i class="fas fa-database"></i> بيانات Database المطلوبة</div>
        <div class="edit-form-grid">
            <div class="edit-form-group"><label>رقم الحساب البريدي (CCP)</label><input id="inp_ccp" placeholder="10 أرقام"></div>
            <div class="edit-form-group"><label>رقم الضمان الاجتماعي (ASS)</label><input id="inp_ass" placeholder="12 رقم"></div>
            <div class="edit-form-group"><label>اللقب (FMN)</label><input id="inp_fmn" placeholder="بالعربية"></div>
            <div class="edit-form-group"><label>الاسم (FRN)</label><input id="inp_frn" placeholder="بالعربية"></div>
            <div class="edit-form-group"><label>تاريخ الميلاد (DIZ)</label><input type="date" id="inp_diz"></div>
            <div class="edit-form-group"><label>الرتبة (GR)</label><input id="inp_gr" placeholder="Code"></div>
            <div class="edit-form-group"><label>رمز الإدارة (ADM)</label><input id="inp_adm" value="1" placeholder="أرقام وحروف"></div>
            <div class="edit-form-group"><label>الرقم التسلسلي (MTR)</label><input id="inp_mtr" placeholder="أرقام وحروف"></div>
        </div>
      </div>`;
};

window.getFormHtml = function(d, isAddMode) {
  const val = (k) => d[k] || '';
  const isConfirmed = String(d.confirmed) === "true";
  let daairaOptions = '<option value="">-- اختر --</option>';
  ["توقرت", "تماسين", "المقارين", "الحجيرة", "الطيبات"].forEach(daaira => {
     daairaOptions += `<option value="${daaira}" ${val('daaira') === daaira ? 'selected' : ''}>${daaira}</option>`;
  });

  return `
      <div class="edit-form-wrapper">
        <div class="form-section-title"><i class="fas fa-address-card"></i> بيانات الهوية</div>
        <div class="edit-form-grid">
            <div class="edit-form-group"><label>رقم الحساب البريدي (CCP)</label><input id="inp_ccp" value="${val('ccp')}" ${!isAddMode ? 'readonly class="readonly-input"' : ''} placeholder="أدخل رقم CCP"></div>
            <div class="edit-form-group"><label>رقم الضمان الاجتماعي</label><input id="inp_ass" value="${val('ass')}" placeholder="SSN"></div>
            <div class="edit-form-group"><label>اللقب (بالعربية)</label><input id="inp_fmn" value="${val('fmn')}" placeholder="اللقب"></div>
            <div class="edit-form-group"><label>الاسم (بالعربية)</label><input id="inp_frn" value="${val('frn')}" placeholder="الاسم"></div>
            <div class="edit-form-group"><label>تاريخ الميلاد</label><input type="date" id="inp_diz" value="${window.formatDateForInput(val('diz'))}"></div>
            <div class="edit-form-group"><label>رقم التعريف الوطني (NIN)</label><input id="inp_nin" value="${val('nin')}" maxlength="18" placeholder="18 رقم"></div>
        </div>

        <div class="form-section-title"><i class="fas fa-briefcase"></i> المعلومات المهنية</div>
        <div class="edit-form-grid">
            <div class="edit-form-group"><label>الوظيفة</label><input id="inp_job" value="${val('job')}" placeholder="مثال: أستاذ..."></div>
            <div class="edit-form-group"><label>الرتبة (الكود)</label><input id="inp_gr" value="${val('gr')}" placeholder="مثال: 12/2"></div>
            <div class="edit-form-group"><label>الطور</label>
                <select id="inp_level" onchange="window.updateWorkPlaceAdmin()">
                    <option value="">-- اختر --</option>
                    <option value="ابتدائي" ${val('level') === 'ابتدائي' ? 'selected' : ''}>ابتدائي</option>
                    <option value="متوسط" ${val('level') === 'متوسط' ? 'selected' : ''}>متوسط</option>
                    <option value="ثانوي" ${val('level') === 'ثانوي' ? 'selected' : ''}>ثانوي</option>
                </select>
            </div>
             <div class="edit-form-group"><label>الدائرة</label>
                <select id="inp_daaira" onchange="window.updBalAdmin(); window.updateWorkPlaceAdmin()">${daairaOptions}</select>
            </div>
            <div class="edit-form-group full-width"><label>البلدية</label>
                <select id="inp_baladiya" onchange="window.updateWorkPlaceAdmin()"><option value="">-- اختر --</option></select>
            </div>
            <div class="edit-form-group full-width"><label>مؤسسة العمل</label>
                <div id="institutionArea"><select id="inp_school"><option value="">-- اختر الطور والدائرة أولاً --</option></select></div>
            </div>
        </div>

        <div class="form-section-title"><i class="fas fa-phone-volume"></i> الاتصال والحالة</div>
        <div class="edit-form-grid">
            <div class="edit-form-group"><label>رقم الهاتف</label><input id="inp_phone" value="${val('phone')}" dir="ltr" placeholder="06xxxxxxxx"></div>
            <div class="edit-form-group"><label>حالة الملف</label>
                <select id="inp_confirmed" style="background:${isConfirmed?'#e8f5e9':'#fff3e0'}">
                    <option value="true" ${isConfirmed ? "selected" : ""}>مؤكد ✅</option>
                    <option value="false" ${!isConfirmed ? "selected" : ""}>غير مؤكد ⏳</option>
                </select>
            </div>
        </div>
      </div>`;
};

window.getFormDataFromModal = function() {
    return {
        ccp: document.getElementById('inp_ccp').value,
        ass: document.getElementById('inp_ass').value,
        fmn: document.getElementById('inp_fmn').value,
        frn: document.getElementById('inp_frn').value,
        diz: document.getElementById('inp_diz').value,
        nin: document.getElementById('inp_nin').value,
        gr: document.getElementById('inp_gr').value,
        job: document.getElementById('inp_job').value,
        level: document.getElementById('inp_level').value,
        daaira: document.getElementById('inp_daaira').value,
        baladiya: document.getElementById('inp_baladiya').value,
        schoolName: document.getElementById('inp_school').value,
        phone: document.getElementById('inp_phone').value,
        confirmed: document.getElementById('inp_confirmed').value
    };
};

window.fmtDate = function(d) {
    if(!d) return "-";
    const date = new Date(d);
    if(isNaN(date.getTime())) return "-";
    return date.toLocaleDateString('en-GB'); 
};

window.fmtDateTime = function(d) {
    if(!d) return "-";
    const date = new Date(d);
    if(isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${h}:${m}:${s}`;
};

window.formatDateForInput = function(d) {
    if (!d) return "";
    try {
        const date = new Date(d);
        if(isNaN(date)) return "";
        return date.toISOString().split('T')[0];
    } catch(e) { return ""; }
};



