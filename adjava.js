import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// --- الكود المخفي (HTML) - مع إضافة فلتر الطور والاحتفاظ بالتنسيق ---
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

      <select id="levelFilter" class="filter-select" onchange="window.applyFilters()">
        <option value="all">كل الأطوار</option>
        <option value="ابتدائي">ابتدائي</option>
        <option value="متوسط">متوسط</option>
        <option value="ثانوي">ثانوي</option>
        <option value="مديرية التربية">مديرية التربية</option>
      </select>

      <select id="statusFilter" class="filter-select" onchange="window.applyFilters()">
        <option value="all">عرض الجميع</option>
        <option value="confirmed">✅ المؤكدة فقط</option>
        <option value="pending">⏳ الغير مؤكدة فقط</option>
      </select>

      <button class="btn btn-add" onclick="window.openDirectRegister()">تسجيل جديد <i class="fas fa-plus"></i></button>
      <button class="btn btn-refresh" onclick="window.loadData()">تحديث <i class="fas fa-sync-alt"></i></button>
      <button class="btn btn-firebase" onclick="window.openFirebaseModal()">إضافة موظف <i class="fas fa-database"></i></button>
      <button class="btn btn-excel" onclick="window.downloadExcel()">تحميل Excel <i class="fas fa-file-excel"></i></button>
      <button class="btn btn-pending-list" style="background-color:#6f42c1; color:white;" onclick="window.openPendingListModal()">قائمة الغير مؤكدة <i class="fas fa-clipboard-list"></i></button>
      <button class="btn" style="background-color:#FF00AA; color:white;" onclick="window.checkNonRegistered()">تقرير التسجيل <i class="fas fa-clipboard-list"></i></button>
      <button class="btn" style="background-color:#0d6efd; color:white;" onclick="window.openBatchPrintModal()">طباعة الاستمارات <i class="fas fa-print"></i></button>
    </div>

    <div style="margin: 0 0 15px 0; display:flex; gap:10px; align-items:center; background:#fff; padding:15px; border-radius:10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        <span style="font-weight:bold; color:#495057; font-size:14px; min-width:80px;"><i class="fas fa-filter"></i> فرز حسب:</span>
        <select id="filter_daaira" class="filter-select" style="flex:1;" onchange="window.updateFilterBaladiya()">
            <option value="">-- كل الدوائر --</option>
            <option value="توقرت">توقرت</option>
            <option value="تماسين">تماسين</option>
            <option value="المقارين">المقارين</option>
            <option value="الحجيرة">الحجيرة</option>
            <option value="الطيبات">الطيبات</option>
        </select>
        <select id="filter_baladiya" class="filter-select" style="flex:1;" onchange="window.updateFilterSchools()">
            <option value="">-- كل البلديات --</option>
        </select>
        <select id="filter_school" class="filter-select" style="flex:2;" onchange="window.applyFilters()">
            <option value="">-- كل المؤسسات --</option>
        </select>
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

// --- المتغيرات العامة وخرائط البيانات (موجودة في ملفك الأصلي) ---
// ... (baladiyaMap, primarySchoolsByBaladiya, institutionsByDaaira تبقى كما هي) ...

// --- الدوال الأساسية ---

window.applyFilters = function() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    const levelFilter = document.getElementById("levelFilter") ? document.getElementById("levelFilter").value : "all";

    const fDaaira = document.getElementById("filter_daaira") ? document.getElementById("filter_daaira").value : "";
    const fBaladiya = document.getElementById("filter_baladiya") ? document.getElementById("filter_baladiya").value : "";
    const fSchool = document.getElementById("filter_school") ? document.getElementById("filter_school").value : "";

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
        if (statusFilter === "confirmed") matchesStatus = isConfirmed;
        else if (statusFilter === "pending") matchesStatus = !isConfirmed;

        let matchesLevel = (levelFilter === "all" || row.level === levelFilter);
        let matchesDaaira = fDaaira === "" || row.daaira === fDaaira;
        let matchesBaladiya = fBaladiya === "" || row.baladiya === fBaladiya;
        let matchesSchool = fSchool === "" || row.schoolName === fSchool;

        return matchesSearch && matchesStatus && matchesLevel && matchesDaaira && matchesBaladiya && matchesSchool;
    });

    currentPage = 1;
    window.renderCurrentPage();
};

// ✅ تعديل دالة renderTable لإعادة التنسيق الأصلي وضغط الصفوف
window.renderTable = function(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  if(data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:15px;">لا توجد سجلات مطابقة</td></tr>';
    return;
  }

  data.forEach((row) => {
    const originalIndex = allData.findIndex(item => item.ccp === row.ccp);
    const isConfirmed = String(row.confirmed).toLowerCase() === "true";
    const statusBadge = isConfirmed 
      ? `<span class="badge badge-confirmed"><i class="fas fa-check"></i> مؤكد</span>` 
      : `<span class="badge badge-pending"><i class="fas fa-clock"></i> غير مؤكد</span>`;

    // تنسيق خلية الرتبة/الوظيفة كما كان
    const gradeJobHtml = `
      <div class="grade-job-cell" style="padding: 2px 0;">
        <span class="job-text" style="font-size: 13px;">${row.job || ''}</span>
        <span class="grade-text" style="font-size: 11px; color: #666;">${row.gr || 'غير محدد'}</span>
      </div>
    `;

    const tr = document.createElement("tr");
    // ✅ ضغط الصفوف عبر تصغير Padding الخلايا
    tr.style.lineHeight = "1.2"; 
    tr.innerHTML = `
      <td style="font-weight:700; padding: 6px 10px;">${row.ccp}</td>
      <td style="padding: 6px 10px;">${row.fmn} ${row.frn}</td>
      <td style="padding: 6px 10px;">${gradeJobHtml}</td>
      <td style="padding: 6px 10px;">${row.schoolName || '-'}</td>
      <td dir="ltr" style="padding: 6px 10px;">${row.phone}</td>
      <td style="padding: 6px 10px;">${statusBadge}</td>
      <td style="font-size:12px; padding: 6px 10px;">${window.fmtDate(row.date_edit)}</td>
      <td style="padding: 6px 10px;">
        <div class="actions-cell" style="display: flex; gap: 5px; justify-content: center;">
          <button class="action-btn btn-view" onclick="window.viewDetails(${originalIndex})" title="عرض التفاصيل"><i class="fas fa-eye"></i></button>
          <button class="action-btn btn-edit" onclick="window.openEditModal(${originalIndex})" title="تعديل"><i class="fas fa-pen-to-square"></i></button>
          <button class="action-btn btn-print" onclick="window.printForm(${originalIndex})" title="طباعة الاستمارة" style="background-color: #6a11cb; color: white; border: none; border-radius: 4px; padding: 5px 8px; cursor: pointer;"><i class="fas fa-file-invoice"></i></button>
          <button class="action-btn btn-delete" onclick="window.deleteUser('${row.ccp}')" title="حذف" style="background-color: #e63946; color: white; border: none; border-radius: 4px; padding: 5px 8px; cursor: pointer;"><i class="fas fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

// ... الإبقاء على كافة الدوال الأخرى كما هي في ملفك المرفق ...
