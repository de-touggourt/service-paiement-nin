import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// --- إعدادات المسؤول للمصادقة (جديد) ---
const ADMIN_INFO = {
    name: "مصلحة الرواتب", // الاسم الذي سيظهر عند التأكيد
    phone: "030000000"     // رقم الهاتف الذي سيظهر عند التأكيد
};

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

<button class="btn btn-pending-list" style="background-color:#6f42c1; color:white;" onclick="window.openPendingListModal()">
  قائمة الغير مؤكدة <i class="fas fa-clipboard-list"></i>
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

// ==========================================
// ⬇️⬇️⬇️ خرائط البيانات الكاملة ⬇️⬇️⬇️
// ==========================================

const baladiyaMap = { 
    "توقرت": ["توقرت", "النزلة", "تبسبست", "الزاوية العابدية"], 
    "تماسين": ["تماسين", "بلدة عمر"], 
    "المقارين": ["المقارين", "سيدي سليمان"], 
    "الحجيرة": ["الحجيرة", "العالية"], 
    "الطيبات": ["الطيبات", "المنقر", "ابن ناصر"] 
};

const primarySchoolsByBaladiya = {
  "ابن ناصر": [{ name: "إبتدائية عبد الحميد بن باديس - إبن ناصر" }, { name: "إبتدائية العربي التبسي - إبن ناصر" }, { name: "إبتدائية البشير الابراهيمي - إبن ناصر" }, { name: "إبتدائية هواري بومدين - إبن ناصر" }, { name: "إبتدائية المجاهد الصادق خلفاوي - إبن ناصر" }, { name: "إبتدائية المجاهد سراي مسعود ( المر) - إبن ناصر" }, { name: "إبتدائية المجاهد اليمان الطيب - إبن ناصر" }, { name: "إبتدائية المجاهد العقون خليفة - إبن ناصر" }, { name: "إبتدائية المجاهد قحمص محمد بن العيد - إبن ناصر" }, { name: "إبتدائية 13 مارس 1962 - إبن ناصر" }, { name: "إبتدائية اللأمير عبد القادر - إبن ناصر" }, { name: "إبتدائية العقبي الطيب - إبن ناصر" }],
  "الحجيرة": [{ name: "إبتدائية ابن باديس - الحجيرة" }, { name: "إبتدائية ديدوش مراد - الحجيرة" }, { name: "إبتدائية نعام سليمان - الحجيرة" }, { name: "إبتدائية محمد العيد آل خليفة - الحجيرة" }, { name: "إبتدائية العيد بن الشيخ - الحجيرة" }, { name: "إبتدائية البشير الابراهيمي - الحجيرة" }, { name: "إبتدائية مصطفى بن بولعيد - الحجيرة" }, { name: "إبتدائية الشهيد الكاس - الحجيرة" }, { name: "إبتدائية صلاح الدين الأيوبي - الحجيرة" }, { name: "إبتدائية ابن خلدون - الحجيرة" }, { name: "إبتدائية علي عمار - الحجيرة" }, { name: "إبتدائية دومة أحمد - الحجيرة" }, { name: "إبتدائية عمار ياسف - الحجيرة" }, { name: "إبتدائية المجاهد كحول احمد - الحجيرة" }, { name: "إبتدائية كريبع مسعود - الحجيرة - - الحجيرة" }, { name: "إبتدائية المجاهد بالأعور العلمي ( لقراف الجديدة 2) - الحجيرة" }, { name: "إبتدائية مجمع مدرسي حي المير - الحجيرة" }, { name: "إبتدائية خنفر محمد لحسن - الحجيرة" }, { name: "إبتدائية حي بوضياف محمد لقراف - الحجيرة" }, { name: "إبتدائية محدادي العيد - الحجيرة" }],
  "الزاوية العابدية": [{ name: "إبتدائية البحري بن المنور القديمة - الزاوية العابدية" }, { name: "إبتدائية مصطفى بن بولعيد - الزاوية العابدية" }, { name: "إبتدائية بوليفة محمد عمران - الزاوية العابدية" }, { name: "إبتدائية صولي عبد الرحمان ( 5 جويلية) - الزاوية العابدية" }, { name: "إبتدائية بشير كدة - الزاوية العابدية" }, { name: "إبتدائية عبد الرحمان بن نونة - الزاوية العابدية" }, { name: "إبتدائية عقبة بن نافع - الزاوية العابدية" }, { name: "إبتدائية المجاهد محمد الاخضر بن لمنور - الزاوية العابدية" }, { name: "إبتدائية غول محمد الصالح (حي السلام) - الزاوية العابدية" }, { name: "إبتدائية محمد مقداد - الزاوية العابدية" }, { name: "إبتدائية احمد بن لمنور - الزاوية العابدية" }],
  "الطيبات": [{ name: "إبتدائية الاستاذ عمر بن عزة - الطيبات" }, { name: "إبتدائية المجاهد عماري معمر - الطيبات" }, { name: "إبتدائية الشهيد قحمص محمد - الطيبات" }, { name: "إبتدائية العلامة حمداوي محمد بن سليمان(القواشيش) - الطيبات" }, { name: "إبتدائية ميلود تريش(بكار القديمة) - الطيبات" }, { name: "إبتدائية المجاهد زقوني بشير - الطيبات" }, { name: "إبتدائية المجاهد مراد معمر( برحمون) - الطيبات" }, { name: "إبتدائية الشهيد محمد الشين - الطيبات" }, { name: "إبتدائية قعبي علي (بئر العسل) - الطيبات" }, { name: "إبتدائية الشهيد بالطاهر الطيب - الطيبات" }, { name: "إبتدائية المجاهد منصوري مبروك - الطيبات" }, { name: "إبتدائية الشهيد بن قلية عمر - الطيبات" }, { name: "إبتدائية المجاهد رواص أحمد - الطيبات" }, { name: "إبتدائية المجاهد دحدي مسعود - الطيبات" }, { name: "إبتدائية المجاهد خليفة خليفة - الطيبات" }, { name: "إبتدائية المجاهد براهمي براهيم - الطيبات" }, { name: "إبتدائية المجاهد بلخير السعيد - الطيبات" }, { name: "إبتدائية المجاهد لـيـتيم محمد (عثمان بن عفان) - الطيبات" }, { name: "إبتدائية المجاهد بالعجال معمر - الطيبات" }, { name: "إبتدائية المجاهد عماري التجاني الدليعي - الطيبات" }],
  "العالية": [{ name: "إبتدائية الشهيد قوادري لخضر - العالية" }, { name: "إبتدائية قادري أحمد - العالية" }, { name: "إبتدائية الامام الغزالي بالعالية - العالية" }, { name: "إبتدائية الشهيد عبيدلي أحمد - العالية" }, { name: "إبتدائية سيدي عبد المالك - العالية" }, { name: "إبتدائية بن احمد احمد - العالية" }, { name: "إبتدائية طفحي مسعود ( العالية الجديدة ) - العالية" }, { name: "إبتدائية غبائشي بشير - العالية" }, { name: "إبتدائية المجاهد بساسي الطاهر - العالية" }, { name: "إبتدائية حمايمي ميلود - العالية" }, { name: "إبتدائية المجاهد حبي عمار - العالية" }, { name: "إبتدائية المجاهد ربروب محمد - العالية" }],
  "المقارين": [{ name: "إبتدائية أسامة بن زيد - المقارين" }, { name: "إبتدائية بن موسى الطيب - المقارين" }, { name: "إبتدائية العقيد سي الحواس - المقارين" }, { name: "إبتدائية ابو عبيدة بن الجراح - المقارين" }, { name: "إبتدائية بشير خذران - المقارين" }, { name: "إبتدائية محمد شافو - المقارين" }, { name: "إبتدائية بركبية حسين - المقارين" }, { name: "إبتدائية الشهيد الشريف محمد بن عبد الله - المقارين" }, { name: "إبتدائية بابا سعيد حشاني ( المجمع المدرسي الجديد ) - المقارين" }, { name: "إبتدائية المجاهد بن الزاوي السعيد - المقارين" }, { name: "إبتدائية المجاهد جاوي محمد - المقارين" }],
  "المنقر": [{ name: "إبتدائية محمد بوعسرية - المنقر" }, { name: "إبتدائية الشهيد مسماري الاخضر اللويبد - المنقر" }, { name: "إبتدائية الشهيد قبي بلقاسم - المنقر" }, { name: "إبتدائية العلامة بن الصديق علي - المنقر" }, { name: "إبتدائية الشهيد خورارة بشير - المنقر" }, { name: "إبتدائية شوية علي - المنقر" }, { name: "إبتدائية الشهيدبكاري السايح الشابي - المنقر" }, { name: "إبتدائية الشهيد محمد خيراني - المنقر" }, { name: "إبتدائية المجاهد احمد بن الصغير قويدري (البحري) - المنقر" }, { name: "إبتدائية الشلالقة( خورارة محمد) - المنقر" }, { name: "إبتدائية نواري محمد الزروق - المنقر" }, { name: "إبتدائية الشهيد دقعة محمد - المنقر" }, { name: "إبتدائية الشهيد محمد نواري( حي النخيل) - المنقر" }, { name: "إبتدائية محمد مايو - المنقر" }, { name: "إبتدائية غندير العايش - المنقر" }, { name: "إبتدائية الشهيد بله محمد الصغير - المنقر" }],
  "النزلة": [{ name: "إبتدائية بن دلالي علي - النزلة" }, { name: "إبتدائية قادري أحمد سيدي ماضي - النزلة" }, { name: "إبتدائية بن عمر النوي - النزلة" }, { name: "إبتدائية بن طرية لمنور - النزلة" }, { name: "إبتدائية بوليفة محمد عمران - النزلة" }, { name: "إبتدائية تماسيني عبد الرحمن - النزلة" }, { name: "إبتدائية كدة بشير - النزلة" }, { name: "إبتدائية حركات العايش - النزلة" }, { name: "إبتدائية المجاهد طرية مخلوف - النزلة" }, { name: "إبتدائية المجاهد قمو محمد - النزلة" }, { name: "إبتدائية تمرني موسى - النزلة" }, { name: "إبتدائية المجاهد سلامي محمد - النزلة" }, { name: "إبتدائية نقودي محمد - النزلة" }, { name: "إبتدائية المجاهد العيفاوي التجاني - النزلة" }, { name: "إبتدائية المجاهد عقال عبد الحميد - النزلة" }, { name: "إبتدائية المجاهد عشاب محمد العيد - النزلة" }, { name: "إبتدائية المجاهد فرحي بحري - النزلة" }, { name: "إبتدائية الشيخ بوعمامة - النزلة" }, { name: "إبتدائية رحماني محمد بن محمد - النزلة" }, { name: "إبتدائية المجاهد كراش الأخضر - النزلة" }, { name: "إبتدائية المجاهد بن حميدة علي - النزلة" }, { name: "إبتدائية بن هدية جاب الله ( المستقبل2) - النزلة" }, { name: "إبتدائية المجاهد مشري غزال - النزلة" }, { name: "إبتدائية بن عاشور السبتي - النزلة" }, { name: "إبتدائية علوي حمزة - النزلة" }, { name: "إبتدائية المجاهد قمو محمود - النزلة" }],
  "بلدة عمر": [{ name: "إبتدائية محمد البشير الإبراهيمي - بلدة اعمر" }, { name: "إبتدائية دحماني عبد الرحمان قوق - بلدة اعمر" }, { name: "إبتدائية بديار محمد - بلدة اعمر" }, { name: "إبتدائية المجاهد قادري موسى - بلدة اعمر" }, { name: "إبتدائية المجاهد الاخضري احمد - بلدة اعمر" }, { name: "إبتدائية المجاهد تمرني عمار(حي النهضة) - بلدة اعمر" }, { name: "إبتدائية المجاهد زروقي علي - بلدة اعمر" }, { name: "إبتدائية المجاهد حاجي عمر - بلدة اعمر" }, { name: "إبتدائية الشهيد مصطفى بن بولعيد قوق - بلدة اعمر" }, { name: "إبتدائية المجاهد شاشة محمد الصغير - بلدة اعمر" }],
  "تبسبست": [{ name: "إبتدائية محمد عشبي - تبسبست" }, { name: "إبتدائية زنو عبد الحفيظ - تبسبست" }, { name: "إبتدائية جواد عمر (تبسبست الجنوبية ) - تبسبست" }, { name: "إبتدائية بن علي الاخضر (بني يسود القديمة) - تبسبست" }, { name: "إبتدائية جيلاني كينة - تبسبست" }, { name: "إبتدائية التجاني نصيري - تبسبست" }, { name: "إبتدائية بن دومة محمد الطاهر - تبسبست" }, { name: "إبتدائية جلابية عبد القادر - تبسبست" }, { name: "إبتدائية المجاهد أحمد شاوش - تبسبست" }, { name: "إبتدائية حي الصومام - تبسبست" }, { name: "إبتدائية المجاهد بوغرارة محمد الصالح - تبسبست" }, { name: "إبتدائية الفتح الجديدة (جرو بحري) - تبسبست" }, { name: "إبتدائية المجاهد العياط سعد - تبسبست" }, { name: "إبتدائية أول نوفمبر 1954 - تبسبست" }, { name: "إبتدائية المجاهد رمون جلول حي فرجمون - تبسبست" }],
  "توقرت": [{ name: "مديرية التربية" },{ name: "إبتدائية بن خلدون - تقرت" }, { name: "إبتدائية الخنساء - تقرت" }, { name: "إبتدائية الشيخ الطاهر العبيدي - تقرت" }, { name: "إبتدائية عظامو محمد البحري - تقرت" }, { name: "إبتدائية الطالب بابا - تقرت" }, { name: "إبتدائية الإمام الشافعي - تقرت" }, { name: "إبتدائية الامام مالك - تقرت" }, { name: "إبتدائية عبيدلي أحمد - تقرت" }, { name: "إبتدائية عيادي علي - تقرت" }, { name: "إبتدائية ناصر بشير - تقرت" }, { name: "إبتدائية المجاهد موهوبي سليمان - تقرت" }, { name: "إبتدائية المجاهد احمد بورنان - تقرت" }, { name: "إبتدائية بن الصديق عبد الهادي (الرمال 1) - تقرت" }, { name: "إبتدائية الشهيد زابي عبد العالي - تقرت" }, { name: "إبتدائية الأمير عبد القادر الجديدة - تقرت" }, { name: "إبتدائية ميعادي محمد فخر الدين - تقرت" }, { name: "إبتدائية تاتاي محمد الصادق (الرمال 02) - تقرت" }, { name: "إبتدائية المجاهد كافي عبد الرحيم - تقرت" }, { name: "إبتدائية المجاهد عظامو محمد - تقرت" }, { name: "إبتدائية بولعراس ابراهيم - تقرت" }, { name: "إبتدائية حي النضال مجمع مدرسي حي 1190 مسكن - تقرت" }, { name: "إبتدائية عمان يوسف - تقرت" }, { name: "إبتدائية دباخ أحمد المستقبل الجنوبي 7 - تقرت" }, { name: "إبتدائية بالعيد مشري المستقبل الشمالي - تقرت" }, { name: "إبتدائية دباغ عمر المستقبل الجنوبي 09 - تقرت" }, { name: "إبتدائية تاتاي عبد القادر - تقرت" }, { name: "إبتدائية الشهيد بالطاهر علي المستقبل الشمالي - تقرت" }, { name: "إبتدائية المجاهد قادري علال حي 700 مسكن - تقرت" }],
  "سيدي سليمان": [{ name: "إبتدائية بوسعادة بن دلالي - سيدي سليمان" }, { name: "إبتدائية العربي التبسي - سيدي سليمان" }, { name: "إبتدائية الطيب بوريالة - سيدي سليمان" }, { name: "إبتدائية بركبية محمد بكار - سيدي سليمان" }, { name: "إبتدائية الشهيد بن قطان السايح - سيدي سليمان" }, { name: "إبتدائية باسو السعيد - سيدي سليمان" }],
  "تماسين": [{ name: "إبتدائية مولود فرعون - نماسين" }, { name: "إبتدائية الطالب السعدي بوخندق - نماسين" }, { name: "إبتدائية الشيخ الصغير التجاني - نماسين" }, { name: "إبتدائية الشيخ الصادق التجاني - نماسين" }, { name: "إبتدائية البشيرتاتي - نماسين" }, { name: "إبتدائية المجاهد بكوش محمد العيد - نماسين" }, { name: "إبتدائية المجاهد رزقان احمد - نماسين" }, { name: "إبتدائية المجاهد لبسيس إبراهيم - نماسين" }, { name: "إبتدائية بوبكري بشير - نماسين" }, { name: "إبتدائية بن قانة براهيم (البحور 2) - نماسين" }, { name: "إبتدائية المجاهد تجاني عبد الحق (حي الكودية ) - نماسين" }]
};

const institutionsByDaaira = {
  "توقرت": {
    "متوسط": [{ name: "مديرية التربية" },{ name: "متوسطة سعد بن أبي وقاص – توقرت" }, { name: "متوسطة الإمام علي – توقرت" }, { name: "متوسطة محمد الأمين العمودي – توقرت" }, { name: "متوسطة الشيخ المقراني – تبسبست" }, { name: "متوسطة بن هدية المدني – النزلة" }, { name: "متوسطة عبد الحميد بن باديس – توقرت" }, { name: "متوسطة حمزة بن عبد المطلب – الزاوية العابدية" }, { name: "متوسطة نصرات حشاني – تبسبست" }, { name: "متوسطة عيسات ايدير – البهجة تبسبست" }, { name: "متوسطة تجيني محمد – عين الصحراء النزلة" }, { name: "متوسطة ابن رشد – حي العرقوب توقرت" }, { name: "متوسطة رضا حوحو – الزاوية العابدية" }, { name: "متوسطة ميعادي فخر الدين – النزلة" }, { name: "متوسطة عطالي محمد الصغير – سيدي مهدي النزلة" }, { name: "متوسطة محمد عمران بوليفة – حي الرمال توقرت" }, { name: "متوسطة عبد المؤمن بن علي – النزلة" }, { name: "متوسطة بن الزاوي علي – تبسبست" }, { name: "متوسطة البشير الإبراهيمي – توقرت" }, { name: "متوسطة حي 5 جويلية – الزاوية العابدية" }, { name: "متوسطة بن حيزية عبد الله – عين الصحراء النزلة" }, { name: "متوسطة بن قلية محمد – الزاوية العابدية" }, { name: "متوسطة تمرني محمد – توقرت" }, { name: "متوسطة شاوش محمد – تبسبست" }, { name: "متوسطة المجاهد التجاني الصادق – النزلة" }, { name: "متوسطة خروبي محمد لخضر – النزلة" }, { name: "متوسطة المجاهد سبقاق العيد – توقرت" }, { name: "متوسطة دقعة الطاهر – تبسبست" }, { name: "متوسطة بدودة معمر بن علي – النزلة" }, { name: "متوسطة داشر الحاج – حي المستقبل توقرت" }, { name: "متوسطة المجاهد رواص محمد – حي المستقبل توقرت" }, { name: "متوسطة المجاهد بوليفة محمد العيد – حي المستقبل توقرت" }, { name: "متوسطة المجاهد عماري السايح – حي المستقبل توقرت" }],
    "ثانوي": [{ name: "مديرية التربية" },{ name: "ثانوية الأمير عبد القادر – توقرت" }, { name: "ثانوية عبد الرحمان الكواكبي – تبسبست" }, { name: "ثانوية الحسن بن الهيثم – النزلة" }, { name: "ثانوية البشير الإبراهيمي – تبسبست" }, { name: "ثانوية هواري بومدين – الزاوية العابدية" }, { name: "ثانوية أبو بكر بلقايد – النزلة" }, { name: "ثانوية لزهاري تونسي – الزاوية العابدية" }, { name: "ثانوية بوخاري عبد المالك – النزلة" }, { name: "ثانوية عبودة علي – حي المستقبل توقرت" }, { name: "ثانوية مسغوني محمد الصالح – حي المستقبل" }]
  },
  "الحجيرة": {
    "متوسط": [{ name: "متوسطة ابن سينا – الحجيرة" }, { name: "متوسطة لخضاري لخضر – العالية" }, { name: "متوسطة زوابري مسعود – لقراف الحجيرة" }, { name: "متوسطة السايح بن عيسى محمد السايح – العالية" }, { name: "متوسطة بن شويحة حمزة – الحجيرة" }, { name: "متوسطة شلغوم بشير – الشقة العالية" }, { name: "متوسطة المجاهد شعيب الأخضر – الحجيرة" }],
    "ثانوي": [{ name: "ثانوية طارق بن زياد – الحجيرة" }, { name: "ثانوية بساسي محمد الصغير – العالية" }, { name: "ثانوية لحسيني محمد – الحجيرة" }, { name: "ثانوية بالضياف محمد – لقراف الحجيرة" }]
  },
  "الطيبات": {
    "متوسط": [{ name: "متوسطة أحمد زبانة – الطيبات" }, { name: "متوسطة موسى بن نصير – المنقر" }, { name: "متوسطة طارق بن زياد – بن ناصر" }, { name: "متوسطة نتاري محمد الدليلعي – الطيبات" }, { name: "متوسطة العقون محمد الكبير – الطيبات" }, { name: "متوسطة معمري محمد – بن ناصر" }, { name: "متوسطة العيد زقرير – المنقر" }, { name: "متوسطة بلعجال أحمد – الخبنة الطيبات" }, { name: "متوسطة المجاهد الخذير أحمد – المنقر" }, { name: "متوسطة المجاهد رابحي العيد – المنقر" }, { name: "متوسطة المجاهد بكاري عبد القادر – الدليليعي الطيبات" }],
    "ثانوي": [{ name: "ثانوية ابن رشيق القيرواني – الطيبات" }, { name: "ثانوية المنقر – دقعة علي المنقر" }, { name: "ثانوية عبيد أحمد – بن ناصر" }, { name: "ثانوية زقوني الصغير – الدليليعي الطيبات" }]
  },
  "المقارين": {
    "متوسط": [{ name: "متوسطة الفرابي – المقارين" }, { name: "متوسطة طفحي مسعود – سيدي سليمان" }, { name: "متوسطة بلحارث محمد السايح – سيدي سليمان" }, { name: "متوسطة سوفي الهاشمي – الطيبات" }, { name: "متوسطة الشهيد عبد الرحمان قوتال – القصور المقارين" }, { name: "متوسطة الشهيد أحميدة بوحفص – المقارين" }, { name: "متوسطة بركبية عبد الرزاق – المقارين" }, { name: "متوسطة الشهيد تماسيني عبد الرحمان – لهريهيرة المقارين" }],
    "ثانوي": [{ name: "ثانوية خالد بن الوليد – المقارين" }, { name: "ثانوية بن عمر النوي – سيدي سليمان" }, { name: "ثانوية عميش سعدون – المقارين" }]
  },
  "تماسين": {
    "متوسط": [{ name: "متوسطة عمر بن الخطاب – تماسين" }, { name: "متوسطة مولاتي محمد السايح – بلدة عمر" }, { name: "متوسطة أبو بكر الرازي – البحور تماسين" }, { name: "متوسطة قوني محمد الطيب – سيدي عامر تماسين" }, { name: "متوسطة معركة قرداش – بلدة عمر" }, { name: "متوسطة محمد الصديق بن يحي – حي الكدية تماسين" }, { name: "متوسطة بركة عبد الرزاق – قوق بلدة عمر" }, { name: "متوسطة بدودة السايح – تملاحت تماسين" }, { name: "متوسطة علي بن باديس – قوق بلدة عمر" }],
    "ثانوي": [{ name: "ثانوية مفدي زكريا – تماسين" }, { name: "ثانوية العيد بن الصحراوي – بلدة عمر" }, { name: "ثانوية قويدري محمد العيد – تماسين" }, { name: "ثانوية تجيني محمد لخضر – بلدة عمر" }, { name: "ثانوية مالك بن نبي – قوق" }]
  }
};

// ==========================================
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
      window.applyFilters(); // تطبيق الفلتر الافتراضي عند التحميل
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

// بقية الدوال المساعدة ...
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

// --- دالة منطق التأكيد (جديدة) ---
window.processConfirmationLogic = function(formData) {
    let processedData = { ...formData };
    
    // التحقق من حالة التأكيد (النصية) القادمة من الـ Select
    const isConfirmed = String(processedData.confirmed) === "true";

    if (isConfirmed) {
        // 1. حالة: مؤكد ✅
        const now = new Date();
        const dateStr = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');
        const timeStr = String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0');

        processedData.date_confirm = `${dateStr} ${timeStr}`;
        processedData.confirmed_by = ADMIN_INFO.name;
        processedData.reviewer_phone = ADMIN_INFO.phone;

    } else {
        // 2. حالة: غير مؤكد ⏳ (حذف البيانات)
        processedData.date_confirm = "";
        processedData.confirmed_by = "";
        processedData.reviewer_phone = "";
    }

    return processedData;
};

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
    preConfirm: () => window.getFormDataFromModal()
  }).then((res) => {
    if(res.isConfirmed) {
      window.handleSave(res.value, "register");
    }
  });
};

// --- تحديث دالة التعديل (معدلة) ---
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
      // تطبيق منطق التأكيد الجديد قبل الحفظ
      const finalData = window.processConfirmationLogic(res.value);
      window.handleSave(finalData, "update_admin");
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

// --- (NEW) دالة التحكم في تغيير الطور ---
window.handleLevelChange = function() {
    const level = document.getElementById("inp_level").value;
    const daairaSelect = document.getElementById("inp_daaira");
    const baladiyaSelect = document.getElementById("inp_baladiya");
    
    if (level === "مديرية التربية") {
        daairaSelect.value = "توقرت";
        daairaSelect.disabled = true;
        
        window.updBalAdmin(); 
        
        baladiyaSelect.value = "توقرت";
        baladiyaSelect.disabled = true;
        
        const area = document.getElementById("institutionArea");
        area.innerHTML = `
            <input id="inp_school" value="مديرية التربية لولاية توقرت" readonly 
            style="width:100%; padding:12px; border:1px solid #dee2e6; border-radius:10px; background:#e9ecef; color:#495057; font-weight:bold;">
        `;
    } else {
        daairaSelect.disabled = false;
        baladiyaSelect.disabled = false;
        window.updateWorkPlaceAdmin();
    }
};

// --- (UPDATED) تحديث دالة مكان العمل ---
window.updateWorkPlaceAdmin = function() {
  const l = document.getElementById("inp_level").value;
  
  if (l === "مديرية التربية") return; 

  const d = document.getElementById("inp_daaira").value;
  const b = document.getElementById("inp_baladiya").value;
  const area = document.getElementById("institutionArea");
  
  area.innerHTML = ''; 
  
  const mkSel = (lst) => {
    if (!lst || lst.length === 0) {
        area.innerHTML = '<input id="inp_school" placeholder="لا توجد بيانات متاحة" readonly style="width:100%; padding:12px; border:1px solid #dee2e6; border-radius:10px; background:#fff3cd;">';
        return;
    }
    let s = document.createElement("select");
    s.id = "inp_school";
    s.innerHTML = '<option value="">-- اختر --</option>';
    lst.forEach(i => { let o = document.createElement("option"); o.text = i.name; o.value = i.name; s.add(o); });
    s.style.width = "100%"; s.style.padding = "12px"; s.style.border = "1px solid #dee2e6"; s.style.borderRadius = "10px";
    area.appendChild(s);
  };
  
  // استخدام المتغيرات المملوءة من الملف الآخر
  if(l === 'ابتدائي') {
     if(b && primarySchoolsByBaladiya) mkSel(primarySchoolsByBaladiya[b] || []);
     else area.innerHTML = '<input id="inp_school" placeholder="اختر البلدية أولاً" readonly style="width:100%; padding:12px; border:1px solid #dee2e6; border-radius:10px; background:#e9ecef;">';
  }
  else if(l === 'متوسط' || l === 'ثانوي') {
      if(d && institutionsByDaaira && institutionsByDaaira[d]) mkSel(institutionsByDaaira[d][l] || []);
      else area.innerHTML = '<input id="inp_school" placeholder="اختر الدائرة أولاً" readonly style="width:100%; padding:12px; border:1px solid #dee2e6; border-radius:10px; background:#e9ecef;">';
  }
  else {
      area.innerHTML = '<input id="inp_school" placeholder="اختر الطور والمنطقة أولاً" readonly style="width:100%; padding:12px; border:1px solid #dee2e6; border-radius:10px; background:#e9ecef;">';
  }
};

window.initModalData = function(d) {
    if(!d) return;
    
    if (d.level === "مديرية التربية") {
        window.handleLevelChange();
        return;
    }

    if(d.daaira) {
        window.updBalAdmin();
        setTimeout(() => {
            const balSelect = document.getElementById("inp_baladiya");
            if(balSelect) balSelect.value = d.baladiya;
            
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
                <select id="inp_level" onchange="window.handleLevelChange()">
                    <option value="">-- اختر --</option>
                    <option value="ابتدائي" ${val('level') === 'ابتدائي' ? 'selected' : ''}>ابتدائي</option>
                    <option value="متوسط" ${val('level') === 'متوسط' ? 'selected' : ''}>متوسط</option>
                    <option value="ثانوي" ${val('level') === 'ثانوي' ? 'selected' : ''}>ثانوي</option>
                    <option value="مديرية التربية" ${val('level') === 'مديرية التربية' ? 'selected' : ''}>مديرية التربية</option>
                </select>
            </div>
             <div class="edit-form-group"><label>الدائرة</label>
                <select id="inp_daaira" onchange="window.updBalAdmin(); window.updateWorkPlaceAdmin()">${daairaOptions}</select>
            </div>
            <div class="edit-form-group full-width"><label>البلدية</label>
                <select id="inp_baladiya" onchange="window.updateWorkPlaceAdmin()"><option value="">-- اختر --</option></select>
            </div>
            <div class="edit-form-group full-width"><label>مؤسسة العمل</label>
                <div id="institutionArea"><input id="inp_school" value="${val('schoolName')}" readonly style="width:100%; padding:12px; border:1px solid #dee2e6; border-radius:10px; background:#e9ecef;"></div>
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

// ==========================================
// 🆕 ميزة قائمة الملفات غير المؤكدة (تحديث: إصلاح التاريخ + حذف الرتبة)
// ==========================================

window.openPendingListModal = function() {
    // 1. خريطة الاستنتاج الذكي للمؤكد
    const schoolConfirmerMap = {};
    allData.forEach(row => {
        const isConf = String(row.confirmed).toLowerCase() === "true";
        if (isConf && row.schoolName && row.confirmed_by) {
            schoolConfirmerMap[row.schoolName] = {
                name: row.confirmed_by,
                phone: row.reviewer_phone || ''
            };
        }
    });

    // 2. تصفية (غير المؤكدة فقط)
    let pendingList = allData.filter(row => String(row.confirmed).toLowerCase() !== "true");

    // 3. الترتيب حسب مكان العمل
    pendingList.sort((a, b) => {
        const schoolA = a.schoolName || "";
        const schoolB = b.schoolName || "";
        return schoolA.localeCompare(schoolB, "ar");
    });

    if (pendingList.length === 0) {
        Swal.fire('تنبيه', 'لا توجد ملفات غير مؤكدة حالياً', 'info');
        return;
    }

    // 4. بناء الجدول
    let tableRows = pendingList.map((row, index) => {
        // --- معالجة التاريخ بمرونة ---
        let regDate = '-';
        if (row.date) {
            // محاولة التنسيق
            const formatted = window.fmtDateTime(row.date);
            // إذا نجح التنسيق نستخدمه، وإلا نعرض التاريخ الخام كما جاء من القاعدة
            regDate = (formatted !== '-' && formatted !== 'Invalid Date') ? formatted : row.date;
        }

        const editDate = row.date_edit ? window.fmtDateTime(row.date_edit) : '-';
        
        // --- تعديل: عرض الوظيفة فقط (بدون الرتبة) ---
        const jobInfo = row.job || '<span style="color:#ccc">---</span>';

        // --- منطق المؤكد ---
        let confName = row.confirmed_by;
        let confPhone = row.reviewer_phone;
        let isInferred = false;

        if (!confName && row.schoolName && schoolConfirmerMap[row.schoolName]) {
            confName = schoolConfirmerMap[row.schoolName].name;
            confPhone = schoolConfirmerMap[row.schoolName].phone;
            isInferred = true;
        }

        let confirmerDisplay = '<span style="color:#ccc; font-size:11px;">غير محدد</span>';
        if (confName) {
            const styleColor = isInferred ? 'color:#666; font-style:italic;' : 'color:#000; font-weight:bold;';
            const icon = isInferred ? '<i class="fas fa-magic" title="استنتاج آلي" style="color:#ffc107; margin-left:3px;"></i>' : '';
            confirmerDisplay = `
                <div style="${styleColor}">${icon}${confName}</div>
                <div style="direction:ltr; font-size:11px; color:#555;">${confPhone || ''}</div>
            `;
        }

        return `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px;">${index + 1}</td>
                <td style="padding:10px; font-weight:bold; color:#2b2d42;">${row.fmn} ${row.frn}</td>
                <td style="padding:10px;">${jobInfo}</td> 
                <td style="padding:10px;">${row.schoolName || '-'}</td>
                <td style="padding:10px; direction:ltr; text-align:right;">${row.phone || ''}</td>
                <td style="padding:10px; font-size:12px; direction:ltr;">${regDate}</td>
                <td style="padding:10px; font-size:12px; color:#4361ee; direction:ltr;">${editDate}</td>
                <td style="padding:10px;">${confirmerDisplay}</td>
            </tr>
        `;
    }).join('');

    const modalContent = `
        <div style="text-align:left; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <button onclick="window.printPendingList()" class="btn" style="background-color:#2b2d42; color:white;">
                طباعة القائمة <i class="fas fa-print"></i>
            </button>
        </div>
        <div class="table-responsive" style="max-height:500px; overflow-y:auto; direction:rtl;">
            <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:right;">
                <thead style="background:#f8f9fa; color:#495057; position:sticky; top:0; z-index:10; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                    <tr>
                        <th style="padding:12px;">الرقم</th>
                        <th style="padding:12px;">الاسم واللقب</th>
                        <th style="padding:12px;">الوظيفة</th> <th style="padding:12px;">مكان العمل</th>
                        <th style="padding:12px;">رقم الهاتف</th>
                        <th style="padding:12px;">تاريخ التسجيل</th>
                        <th style="padding:12px;">آخر تعديل</th>
                        <th style="padding:12px;">بيانات المؤكد</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;

    Swal.fire({
        title: '<strong>قائمة الملفات غير المؤكدة</strong>',
        html: modalContent,
        width: '1150px',
        showConfirmButton: false,
        showCloseButton: true,
        customClass: { popup: 'swal-wide' }
    });
};

window.printPendingList = function() {
    const schoolConfirmerMap = {};
    allData.forEach(row => {
        if (String(row.confirmed).toLowerCase() === "true" && row.schoolName && row.confirmed_by) {
            schoolConfirmerMap[row.schoolName] = {
                name: row.confirmed_by,
                phone: row.reviewer_phone || ''
            };
        }
    });

    let listToPrint = allData.filter(row => String(row.confirmed).toLowerCase() !== "true");
    listToPrint.sort((a, b) => (a.schoolName || "").localeCompare((b.schoolName || ""), "ar"));

    const printDate = new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' });
    
    let printRows = listToPrint.map((row, index) => {
        // منطق التاريخ القوي للطباعة
        let regDate = '-';
        if (row.date) {
            const formatted = window.fmtDateTime(row.date);
            regDate = (formatted !== '-' && formatted !== 'Invalid Date') ? formatted : row.date;
        }
        
        const editDate = row.date_edit ? window.fmtDateTime(row.date_edit) : '-';

        let confName = row.confirmed_by;
        let confPhone = row.reviewer_phone;
        
        if (!confName && row.schoolName && schoolConfirmerMap[row.schoolName]) {
            confName = schoolConfirmerMap[row.schoolName].name;
            confPhone = schoolConfirmerMap[row.schoolName].phone;
        }

        const confirmerStr = confName ? `<span style="font-weight:bold;">${confName}</span> <br> <span style="font-size:11px; color:#555;">${confPhone || ''}</span>` : '-';

        // الوظيفة فقط هنا أيضاً
        return `
            <tr>
                <td>${index + 1}</td>
                <td style="font-weight:bold;">${row.fmn} ${row.frn}</td>
                <td>${row.job || ''}</td>
                <td>${row.schoolName || ''}</td>
               <td dir="ltr" style="text-align:center; vertical-align: middle;">${row.phone || ''}</td>

                <td dir="ltr">${regDate}</td>
                <td dir="ltr">${editDate}</td>
                <td>${confirmerStr}</td>
            </tr>
        `;
    }).join('');

    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>قائمة الملفات غير المؤكدة</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                @page { size: landscape; margin: 10mm; }
                body { font-family: 'Cairo', sans-serif; padding: 20px; -webkit-print-color-adjust: exact; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .header h3 { margin: 0; color: #444; }
                .header h2 { margin: 10px 0; text-decoration: underline; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle; }
                th { background-color: #e0e0e0 !important; font-weight: bold; font-size: 13px; }
                .print-btn-container { text-align: center; margin-bottom: 20px; }
                .print-btn { background: #333; color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px; font-family: 'Cairo'; }
                @media print { .print-btn-container { display: none; } body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="print-btn-container">
                <button class="print-btn" onclick="window.print()">🖨️ اضغط هنا للطباعة</button>
            </div>
            <div class="header">
                <h3>الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                <h3>مديرية التربية لولاية توقرت - مصلحة الرواتب</h3>
                <h2>قائمة الملفات غير المؤكدة</h2>
                <p>تاريخ الاستخراج: ${printDate}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th width="4%">الرقم</th>
                        <th width="16%">الاسم واللقب</th>
                        <th width="14%">الوظيفة</th>
                        <th width="20%">مكان العمل</th>
                        <th width="10%">رقم الهاتف</th>
                        <th width="12%">تاريخ التسجيل</th>
                        <th width="12%">آخر تعديل</th>
                        <th width="12%">بيانات المؤكد (إن وجد)</th>
                    </tr>
                </thead>
                <tbody>
                    ${printRows}
                </tbody>
            </table>
            <div style="margin-top:20px; font-size:14px; font-weight:bold;">
                العدد الإجمالي للملفات: ${listToPrint.length}
            </div>
            <script>
                window.onload = function() { setTimeout(function() { window.print(); }, 500); }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};
