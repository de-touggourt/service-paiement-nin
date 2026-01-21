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

// --- الكود المخفي (HTML) - تم إضافة فلتر الطور في الـ controls-bar ---
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
        <input type="text" id="searchInput" class="search-input" style="padding-right:40px;" placeholder="بحث سريع (اسم، CCP، هاتف)..." onkeyup="window.applyFilters()">
      </div>

      <select id="levelFilter" class="filter-select" onchange="window.applyFilters()">
        <option value="all">كل الأطوار</option>
        <option value="ابتدائي">ابتدائي</option>
        <option value="متوسط">متوسط</option>
        <option value="ثانوي">ثانوي</option>
        <option value="مديرية التربية">مديرية التربية</option>
      </select>

      <select id="statusFilter" class="filter-select" onchange="window.applyFilters()">
        <option value="all">كل الحالات</option>
        <option value="confirmed">✅ المؤكدة فقط</option>
        <option value="pending">⏳ الغير مؤكدة فقط</option>
      </select>

      <button class="btn btn-add" onclick="window.openDirectRegister()">تسجيل جديد <i class="fas fa-plus"></i></button>
      <button class="btn btn-refresh" onclick="window.loadData()">تحديث <i class="fas fa-sync-alt"></i></button>
      <button class="btn btn-firebase" onclick="window.openFirebaseModal()">إضافة موظف <i class="fas fa-database"></i></button>
      <button class="btn btn-excel" onclick="window.downloadExcel()">تحميل Excel <i class="fas fa-file-excel"></i></button>
      <button class="btn btn-pending-list" style="background-color:#6f42c1; color:white;" onclick="window.openPendingListModal()">قائمة غير المؤكدة <i class="fas fa-clipboard-list"></i></button>
      <button class="btn" style="background-color:#FF00AA; color:white;" onclick="window.checkNonRegistered()">تقرير التسجيل <i class="fas fa-clipboard-list"></i></button>
      <button class="btn" style="background-color:#0d6efd; color:white;" onclick="window.openBatchPrintModal()">طباعة الاستمارات <i class="fas fa-print"></i></button>
    </div>

    <div style="margin: 0 0 15px 0; display:flex; gap:10px; align-items:center; background:#fff; padding:15px; border-radius:10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        <span style="font-weight:bold; color:#495057; font-size:14px; min-width:80px;"><i class="fas fa-filter"></i> فرز متقدم:</span>
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

// --- المتغيرات العامة ---
const scriptURL = "https://script.google.com/macros/s/AKfycbypaQgVu16EFOMnxN7fzdFIFtiLiLjPX0xcwxEUjG5gsoeZ8yQJ5OL5IwIlJMgsrAJxwA/exec"; 
let allData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;
let nonRegisteredData = []; 

// --- خرائط البيانات (يرجى إبقاؤها كاملة كما في ملفك الأصلي) ---
const baladiyaMap = { 
    "توقرت": ["توقرت", "النزلة", "تبسبست", "الزاوية العابدية"], 
    "تماسين": ["تماسين", "بلدة عمر"], 
    "المقارين": ["المقارين", "سيدي سليمان"], 
    "الحجيرة": ["الحجيرة", "العالية"], 
    "الطيبات": ["الطيبات", "المنقر", "ابن ناصر"] 
};

// ... هنا تضع خرائط primarySchoolsByBaladiya و institutionsByDaaira من ملفك الأصلي ...
const primarySchoolsByBaladiya = { /* بياناتك هنا */ };
const institutionsByDaaira = { /* بياناتك هنا */ };

// --- 1. دالة التحقق والدخول ---
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
        if (docSnap.exists() && String(passInput) === String(docSnap.data().service_pay_adminn)) {
            const container = document.getElementById("secure-app-root");
            container.innerHTML = SECURE_DASHBOARD_HTML;
            document.getElementById("loginOverlay").style.display = "none";
            container.classList.add("visible");
            window.loadData();
        } else {
            Swal.fire('خطأ', 'كلمة المرور غير صحيحة', 'error');
        }
    } catch (e) { Swal.fire('خطأ', 'مشكلة في الاتصال', 'error'); }
    finally { btn.innerHTML = oldText; btn.disabled = false; }
};

// --- 2. جلب وتصفية البيانات (المعدلة للفلتر الجديد) ---
window.loadData = async function() {
  const tbody = document.getElementById("tableBody");
  if(!tbody) return;
  try {
    const response = await fetch(scriptURL + "?action=read_all");
    const result = await response.json();
    if(result.status === "success") {
      allData = result.data;
      window.updateStats(allData);
      window.applyFilters(); 
    }
  } catch (e) { console.error(e); }
};

window.applyFilters = function() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    // ✅ جلب قيمة فلتر الطور
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

        // ✅ التحقق من الطور
        let matchesLevel = (levelFilter === "all" || row.level === levelFilter);

        let matchesDaaira = fDaaira === "" || row.daaira === fDaaira;
        let matchesBaladiya = fBaladiya === "" || row.baladiya === fBaladiya;
        let matchesSchool = fSchool === "" || row.schoolName === fSchool;

        return matchesSearch && matchesStatus && matchesLevel && matchesDaaira && matchesBaladiya && matchesSchool;
    });

    currentPage = 1;
    window.renderCurrentPage();
};

// --- 3. بقية الدوال التنفيذية (تبقى كما هي) ---
window.renderCurrentPage = function() {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const start = (currentPage - 1) * rowsPerPage;
    window.renderTable(filteredData.slice(start, start + rowsPerPage));
    window.updatePaginationUI(totalPages);
};

window.renderTable = function(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  if(data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">لا توجد سجلات مطابقة</td></tr>';
    return;
  }
  data.forEach((row) => {
    const originalIndex = allData.findIndex(item => item.ccp === row.ccp);
    const isConfirmed = String(row.confirmed).toLowerCase() === "true";
    const statusBadge = isConfirmed ? `<span class="badge badge-confirmed">مؤكد</span>` : `<span class="badge badge-pending">غير مؤكد</span>`;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:700;">${row.ccp}</td>
      <td>${row.fmn} ${row.frn}</td>
      <td>${row.job || row.gr}</td>
      <td>${row.schoolName || '-'}</td>
      <td dir="ltr">${row.phone}</td>
      <td>${statusBadge}</td>
      <td style="font-size:12px;">${window.fmtDate(row.date_edit)}</td>
      <td>
        <button class="action-btn btn-view" onclick="window.viewDetails(${originalIndex})"><i class="fas fa-eye"></i></button>
        <button class="action-btn btn-edit" onclick="window.openEditModal(${originalIndex})"><i class="fas fa-pen"></i></button>
        <button class="action-btn btn-print" onclick="window.printForm(${originalIndex})" style="background:#6a11cb;"><i class="fas fa-file-invoice"></i></button>
        <button class="action-btn btn-delete" onclick="window.deleteUser('${row.ccp}')"><i class="fas fa-trash"></i></button>
      </td>`;
    tbody.appendChild(tr);
  });
};

window.updateStats = function(data) {
  document.getElementById("totalCount").innerText = data.length;
  document.getElementById("confirmedCount").innerText = data.filter(r => String(r.confirmed).toLowerCase() === "true").length;
  document.getElementById("pendingCount").innerText = data.length - parseInt(document.getElementById("confirmedCount").innerText);
};

// استدعاء بقية الدوال المساعدة (fmtDate, openDirectRegister, deleteUser, إلخ) من ملفك الأصلي...
window.fmtDate = function(d) {
    if(!d) return "-";
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-GB');
};

// ... استمر في إضافة بقية الدوال (BatchPrint, NonRegistered, إلخ) بنفس الطريقة ...
