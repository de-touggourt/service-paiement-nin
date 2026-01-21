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

// --- الكود المخفي (HTML) - تمت إضافة فلتر الطور هنا ---
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
        <option value="all">كل الحالات</option>
        <option value="confirmed">✅ المؤكدة فقط</option>
        <option value="pending">⏳ الغير مؤكدة فقط</option>
      </select>

    <button class="btn btn-add" onclick="window.openDirectRegister()">
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
    
    <button class="btn" style="background-color:#FF00AA; color:white;" onclick="window.checkNonRegistered()">
      تقرير التسجيل <i class="fas fa-clipboard-list"></i>
    </button>

<button class="btn" style="background-color:#0d6efd; color:white;" onclick="window.openBatchPrintModal()">
  طباعة الاستمارات <i class="fas fa-print"></i>
</button>

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

// --- المتغيرات العامة ---
const scriptURL = "https://script.google.com/macros/s/AKfycbypaQgVu16EFOMnxN7fzdFIFtiLiLjPX0xcwxEUjG5gsoeZ8yQJ5OL5IwIlJMgsrAJxwA/exec"; 

let allData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 10;
let nonRegisteredData = []; 

// ✅ خرائط البيانات الكاملة (بدون أي حذف)
const baladiyaMap = { 
    "توقرت": ["توقرت", "النزلة", "تبسبست", "الزاوية العابدية"], 
    "تماسين": ["تماسين", "بلدة عمر"], 
    "المقارين": ["المقارين", "سيدي سليمان"], 
    "الحجيرة": ["الحجيرة", "العالية"], 
    "الطيبات": ["الطيبات", "المنقر", "ابن ناصر"] 
};

const primarySchoolsByBaladiya = {
  "ابن ناصر": [{ name: "إبتدائية عبد الحميد بن باديس - إبن ناصر" }, { name: "إبتدائية العربي التبسي - إبن ناصر" }, { name: "إبتدائية البشير الابراهيمي - إبن ناصر" }, { name: "إبتدائية هواري بومدين - إبن ناصر" }, { name: "إبتدائية المجاهد الصادق خلفاوي - إبن ناصر" }, { name: "إبتدائية المجاهد سراي مسعود ( المر) - إبن ناصر" }, { name: "إبتدائية المجاهد اليمان الطيب - إبن ناصر" }, { name: "إبتدائية المجاهد العقون خليفة - إبن ناصر" }, { name: "إبتدائية المجاهد قحمص محمد بن العيد - إبن ناصر" }, { name: "إبتدائية 13 مارس 1962 - إبن ناصر" }, { name: "إبتدائية اللأمير عبد القادر - إبن ناصر" }, { name: "إبتدائية العقبي الطيب - إبن ناصر" }],
  "الحجيرة": [{ name: "إبتدائية ابن باديس - الحجيرة" }, { name: "إبتدائية dيدوش مراد - الحجيرة" }, { name: "إبتدائية نعام سليمان - الحجيرة" }, { name: "إبتدائية محمد العيد آل خليفة - الحجيرة" }, { name: "إبتدائية العيد بن الشيخ - الحجيرة" }, { name: "إبتدائية البشير الابراهيمي - الحجيرة" }, { name: "إبتدائية مصطفى بن بولعيد - الحجيرة" }, { name: "إبتدائية الشهيد الكاس - الحجيرة" }, { name: "إبتدائية صلاح الدين الأيوبي - الحجيرة" }, { name: "إبتدائية ابن خلدون - الحجيرة" }, { name: "إبتدائية علي عمار - الحجيرة" }, { name: "إبتدائية دومة أحمد - الحجيرة" }, { name: "إبتدائية عمار ياسف - الحجيرة" }, { name: "إبتدائية المجاهد كحول احمد - الحجيرة" }, { name: "إبتدائية كريبع مسعود - الحجيرة - - الحجيرة" }, { name: "إبتدائية المجاهد بالأعور العلمي ( لقراف الجديدة 2) - الحجيرة" }, { name: "إبتدائية مجمع مدرسي حي المير - الحجيرة" }, { name: "إبتدائية خنفر محمد لحسن - الحجيرة" }, { name: "إبتدائية حي بوضياف محمد لقراف - الحجيرة" }, { name: "إبتدائية محدادي العيد - الحجيرة" }],
  "الزاوية العابدية": [{ name: "إبتدائية البحري بن المنور القديمة - الزاوية العابدية" }, { name: "إبتدائية مصطفى بن بولعيد - الزاوية العابدية" }, { name: "إبتدائية بوليفة محمد عمران - الزاوية العابدية" }, { name: "إبتدائية صولي عبد الرحمان ( 5 جويلية) - الزاوية العابدية" }, { name: "إبتدائية بشير كدة - الزاوية العابدية" }, { name: "إبتدائية عبد الرحمان بن نونة - الزاوية العابدية" }, { name: "إبتدائية عقبة بن نافع - الزاوية العابدية" }, { name: "إبتدائية المجاهد محمد الاخضر بن لمنور - الزاوية العابدية" }, { name: "إبتدائية غول محمد الصالح (حي السلام) - الزاوية العابدية" }, { name: "إبتدائية محمد مقداد - الزاوية العابدية" }, { name: "إبتدائية احمد بن لمنور - الزاوية العابدية" }],
  "الطيبات": [{ name: "إبتدائية الاستاذ عمر بن عزة - الطيبات" }, { name: "إبتدائية المجاهد عماري معمر - الطيبات" }, { name: "إبتدائية الشهيد قحمص محمد - الطيبات" }, { name: "إبتدائية العلامة حمداوي محمد بن سليمان(القواشيش) - الطيبات" }, { name: "إبتدائية ميلود تريش(بكار القديمة) - الطيبات" }, { name: "إبتدائية المجاهد زقوني بشير - الطيبات" }, { name: "إبتدائية المجاهد مراد معمر( برحمون) - الطيبات" }, { name: "إبتدائية الشهيد محمد الشين - الطيبات" }, { name: "إبتدائية قعبي علي (بئر العسل) - الطيبات" }, { name: "إبتدائية الشهيد بالطاهر الطيب - الطيبات" }, { name: "إبتدائية المجاهد منصوري مبروك - الطيبات" }, { name: "إبتدائية الشهيد بن قلية عمر - الطيبات" }, { name: "إبتدائية المجاهد رواص أحمد - الطيبات" }, { name: "إبتدائية المجاهد dحدي مسعود - الطيبات" }, { name: "إبتدائية المجاهد خليفة خليفة - الطيبات" }, { name: "إبتدائية المجاهد براهمي براهيم - الطيبات" }, { name: "إبتدائية المجاهد بلخير السعيد - الطيبات" }, { name: "إبتدائية المجاهد لـيـتيم محمد (عثمان بن عفان) - الطيبات" }, { name: "إبتدائية المجاهد بالعجال معمر - الطيبات" }, { name: "إبتدائية المجاهد عماري التجاني الدليعي - الطيبات" }],
  "العالية": [{ name: "إبتدائية الشهيد قوادري لخضر - العالية" }, { name: "إبتدائية قادري أحمد - العالية" }, { name: "إبتدائية الامام الغزالي بالعالية - العالية" }, { name: "إبتدائية الشهيد عبيدلي أحمد - العالية" }, { name: "إبتدائية سيدي عبد المالك - العالية" }, { name: "إبتدائية بن احمد احمد - العالية" }, { name: "إبتدائية طفحي مسعود ( العالية الجديدة ) - العالية" }, { name: "إبتدائية غبائشي بشير - العالية" }, { name: "إبتدائية المجاهد بساسي الطاهر - العالية" }, { name: "إبتدائية حمايمي ميلود - العالية" }, { name: "إبتدائية المجاهد حبي عمار - العالية" }, { name: "إبتدائية المجاهد ربروب محمد - العالية" }],
  "المقارين": [{ name: "إبتدائية أسامة بن زيد - المقارين" }, { name: "إبتدائية بن موسى الطيب - المقارين" }, { name: "إبتدائية العقيد سي الحواس - المقارين" }, { name: "إبتدائية ابو عبيدة بن الجراح - المقارين" }, { name: "إبتدائية بشير خذران - المقارين" }, { name: "إبتدائية محمد شافو - المقارين" }, { name: "إبتدائية بركبية حسين - المقارين" }, { name: "إبتدائية الشهيد الشريف محمد بن عبد الله - المقارين" }, { name: "إبتدائية بابا سعيد حشاني ( المجمع المدرسي الجديد ) - المقارين" }, { name: "إبتدائية المجاهد بن الزاوي السعيد - المقارين" }, { name: "إبتدائية المجاهد جاوي محمد - المقارين" }],
  "المنقر": [{ name: "إبتدائية محمد بوعسرية - المنقر" }, { name: "إبتدائية الشهيد مسماري الاخضر اللويبد - المنقر" }, { name: "إبتدائية الشهيد قبي بلقاسم - المنقر" }, { name: "إبتدائية العلامة بن الصديق علي - المنقر" }, { name: "إبتدائية الشهيد خورارة بشير - المنقر" }, { name: "إبتدائية شوية علي - المنقر" }, { name: "إبتدائية الشهيدبكاري السايح الشابي - المنقر" }, { name: "إبتدائية الشهيد محمد خيراني - المنقر" }, { name: "إبتدائية المجاهد احمد بن الصغير قويدري (البحري) - المنقر" }, { name: "إبتدائية الشلالقة( خورارة محمد) - المنقر" }, { name: "إبتدائية نواري محمد الزروق - المنقر" }, { name: "إبتدائية الشهيد dقعة محمد - المنقر" }, { name: "إبتدائية الشهيد محمد نواري( حي النخيل) - المنقر" }, { name: "إبتدائية محمد مايو - المنقر" }, { name: "إبتدائية غندير العايش - المنقر" }, { name: "إبتدائية الشهيد بله محمد الصغير - المنقر" }],
  "النزلة": [{ name: "إبتدائية بن دلالي علي - النزلة" }, { name: "إبتدائية قادري أحمد سيدي ماضي - النزلة" }, { name: "إبتدائية بن عمر النوي - النزلة" }, { name: "إبتدائية بن طرية لمنور - النزلة" }, { name: "إبتدائية بوليفة محمد عمران - النزلة" }, { name: "إبتدائية تماسيني عبد الرحمن - النزلة" }, { name: "إبتدائية كدة بشير - النزلة" }, { name: "إبتدائية حركات العايش - النزلة" }, { name: "إبتدائية المجاهد طرية مخلوف - النزلة" }, { name: "إبتدائية المجاهد قمو محمد - النزلة" }, { name: "إبتدائية تمرني موسى - النزلة" }, { name: "إبتدائية المجاهد سلامي محمد - النزلة" }, { name: "إبتدائية نقودي محمد - النزلة" }, { name: "إبتدائية المجاهد العيفاوي التجاني - النزلة" }, { name: "إبتدائية المجاهد عقال عبد الحميد - النزلة" }, { name: "إبتدائية المجاهد عشاب محمد العيد - النزلة" }, { name: "إبتدائية المجاهد فرحي بحري - النزلة" }, { name: "إبتدائية الشيخ بوعمامة - النزلة" }, { name: "إبتدائية رحماني محمد بن محمد - النزلة" }, { name: "إبتدائية المجاهد كراش الأخضر - النزلة" }, { name: "إبتدائية بن حميدة علي - النزلة" }, { name: "إبتدائية بن هدية جاب الله ( المستقبل2) - النزلة" }, { name: "إبتدائية المجاهد مشري غزال - النزلة" }, { name: "إبتدائية بن عاشور السبتي - النزلة" }, { name: "إبتدائية علوي حمزة - النزلة" }, { name: "إبتدائية المجاهد قمو محمود - النزلة" }],
  "بلدة عمر": [{ name: "إبتدائية محمد البشير الإبراهيمي - بلدة اعمر" }, { name: "إبتدائية dحماني عبد الرحمان قوق - بلدة اعمر" }, { name: "إبتدائية بديار محمد - بلدة اعمر" }, { name: "إبتدائية المجاهد قادري موسى - بلدة اعمر" }, { name: "إبتدائية المجاهد الاخضري احمد - بلدة اعمر" }, { name: "إبتدائية المجاهد تمرني عمار(حي النهضة) - بلدة اعمر" }, { name: "إبتدائية المجاهد زروقي علي - بلدة اعمر" }, { name: "إبتدائية المجاهد حاجي عمر - بلدة اعمر" }, { name: "إبتدائية الشهيد مصطفى بن بولعيد قوق - بلدة اعمر" }, { name: "إبتدائية المجاهد شاشة محمد الصغير - بلدة اعمر" }],
  "تبسبست": [{ name: "إبتدائية محمد عشبي - تبسبست" }, { name: "إبتدائية زنو عبد الحفيظ - تبسبست" }, { name: "إبتدائية جواد عمر (تبسبست الجنوبية ) - تبسبست" }, { name: "إبتدائية بن علي الاخضر (بني يسود القديمة) - تبسبست" }, { name: "إبتدائية جيلاني كينة - تبسبست" }, { name: "إبتدائية التجاني نصيري - تبسبست" }, { name: "إبتدائية بن دومة محمد الطاهر - تبسبست" }, { name: "إبتدائية جلابية عبد القادر - تبسبست" }, { name: "إبتدائية المجاهد أحمد شاوش - تبسبست" }, { name: "إبتدائية حي الصومام - تبسبست" }, { name: "إبتدائية المجاهد بوغرارة محمد الصالح - تبسبست" }, { name: "إبتدائية الفتح الجديدة (جرو بحري) - تبسبست" }, { name: "إبتدائية المجاهد العياط سعد - تبسبست" }, { name: "إبتدائية أول نوفمبر 1954 - تبسبست" }, { name: "إبتدائية المجاهد رمون جلول حي فرجمون - تبسبست" }],
  "توقرت": [{ name: "مديرية التربية" },{ name: "إبتدائية بن خلدون - تقرت" }, { name: "إبتدائية الخنساء - تقرت" }, { name: "إبتدائية الشيخ الطاهر العبيدي - تقرت" }, { name: "إبتدائية عظامو محمد البحري - تقرت" }, { name: "إبتدائية الطالب بابا - تقرت" }, { name: "إبتدائية الإمام الشافعي - تقرت" }, { name: "إبتدائية الامام مالك - تقرت" }, { name: "إبتدائية عبيدلي أحمد - تقرت" }, { name: "إبتدائية عيادي علي - تقرت" }, { name: "إبتدائية ناصر بشير - تقرت" }, { name: "إبتدائية المجاهد موهوبي سليمان - تقرت" }, { name: "إبتدائية المجاهد احمد بورنان - تقرت" }, { name: "إبتدائية بن الصديق عبد الهادي (الرمال 1) - تقرت" }, { name: "إبتدائية الشهيد زابي عبد العالي - تقرت" }, { name: "إبتدائية الأمير عبد القادر الجديدة - تقرت" }, { name: "إبتدائية ميعادي محمد فخر الدين - تقرت" }, { name: "إبتدائية تاتاي محمد الصادق (الرمال 02) - تقرت" }, { name: "إبتدائية المجاهد كافي عبد الرحيم - تقرت" }, { name: "إبتدائية المجاهد عظامو محمد - تقرت" }, { name: "إبتدائية بولعراس ابراهيم - تقرت" }, { name: "إبتدائية حي النضال مجمع مدرسي حي 1190 مسكن - تقرت" }, { name: "إبتدائية عمان يوسف - تقرت" }, { name: "إبتدائية dباخ أحمد المستقبل الجنوبي 7 - تقرت" }, { name: "إبتدائية بالعيد مشري المستقبل الشمالي - تقرت" }, { name: "إبتدائية dباغ عمر المستقبل الجنوبي 09 - تقرت" }, { name: "إبتدائية تاتاي عبد القادر - تقرت" }, { name: "إبتدائية الشهيد بالطاهر علي المستقبل الشمالي - تقرت" }, { name: "إبتدائية المجاهد قادري علال حي 700 مسكن - تقرت" }],
  "سيدي سليمان": [{ name: "إبتدائية بوسعادة بن dلالي - سيدي سليمان" }, { name: "إبتدائية العربي التبسي - سيدي سليمان" }, { name: "إبتدائية الطيب بوريالة - سيدي سليمان" }, { name: "إبتدائية بركبية محمد بكار - سيدي سليمان" }, { name: "إبتدائية الشهيد بن قطان السايح - سيدي سليمان" }, { name: "إبتدائية باسو السعيد - سيدي سليمان" }],
  "تماسين": [{ name: "إبتدائية مولود فرعون - نماسين" }, { name: "إبتدائية الطالب السعدي بوخندق - نماسين" }, { name: "إبتدائية الشيخ الصغير التجاني - نماسين" }, { name: "إبتدائية الشيخ الصادق التجاني - نماسين" }, { name: "إبتدائية البشيرتاتي - نماسين" }, { name: "إبتدائية المجاهد بكوش محمد العيد - نماسين" }, { name: "إبتدائية المجاهد رزقان احمد - نماسين" }, { name: "إبتدائية المجاهد لبسيس إبراهيم - نماسين" }, { name: "إبتدائية بوبكري بشير - نماسين" }, { name: "إبتدائية بن قانة براهيم (البحور 2) - نماسين" }, { name: "إبتدائية المجاهد تجاني عبد الحق (حي الكودية ) - نماسين" }]
};

const institutionsByDaaira = {
  "توقرت": {
    "متوسط": [{ name: "مديرية التربية" },{ name: "متوسطة سعد بن أبي وقاص – توقرت" }, { name: "متوسطة الإمام علي – توقرت" }, { name: "متوسطة محمد الأمين العمودي – توقرت" }, { name: "متوسطة الشيخ المقراني – تبسبست" }, { name: "متوسطة بن هدية المدني – النزلة" }, { name: "متوسطة عبد الحميد بن باديس – توقرت" }, { name: "متوسطة حمزة بن عبد المطلب – الزاوية العابدية" }, { name: "متوسطة نصرات حشاني – تبسبست" }, { name: "متوسطة عيسات ايدير – البهجة تبسبست" }, { name: "متوسطة تجيني محمد – عين الصحراء النزلة" }, { name: "متوسطة ابن رشد – حي العرقوب توقرت" }, { name: "متوسطة رضا حوحو – الزاوية العابدية" }, { name: "متوسطة ميعادي فخر الدين – النزلة" }, { name: "متوسطة عطالي محمد الصغير – سيدي مهدي النزلة" }, { name: "متوسطة محمد عمران بوليفة – حي الرمال توقرت" }, { name: "متوسطة عبد المؤمن بن علي – النزلة" }, { name: "متوسطة بن الزاوي علي – تبسبست" }, { name: "متوسطة البشير الإبراهيمي – توقرت" }, { name: "متوسطة حي 5 جويلية – الزاوية العابدية" }, { name: "متوسطة بن حيزية عبد الله – عين الصحراء النزلة" }, { name: "متوسطة بن قلية محمد – الزاوية العابدية" }, { name: "متوسطة تمرني محمد – توقرت" }, { name: "متوسطة شاوش محمد – تبسبست" }, { name: "متوسطة المجاهد التجاني الصادق – النزلة" }, { name: "متوسطة خروبي محمد لخضر – النزلة" }, { name: "متوسطة المجاهد سبقاق العيد – توقرت" }, { name: "متوسطة dقعة الطاهر – تبسبست" }, { name: "متوسطة بدودة معمر بن علي – النزلة" }, { name: "متوسطة dاشر الحاج – حي المستقبل توقرت" }, { name: "متوسطة المجاهد رواص محمد – حي المستقبل توقرت" }, { name: "متوسطة المجاهد بوليفة محمد العيد – حي المستقبل توقرت" }, { name: "متوسطة المجاهد عماري السايح – حي المستقبل توقرت" }],
    "ثانوي": [{ name: "مديرية التربية" },{ name: "ثانوية الأمير عبد القادر – توقرت" }, { name: "ثانوية عبد الرحمان الكواكبي – تبسبست" }, { name: "ثانوية الحسن بن الهيثم – النزلة" }, { name: "ثانوية البشير الإبراهيمي – تبسبست" }, { name: "ثانوية هواري بومدين – الزاوية العابدية" }, { name: "ثانوية أبو بكر بلقايد – النزلة" }, { name: "ثانوية لزهاري تونسي – الزاوية العابدية" }, { name: "ثانوية بوخاري عبد المالك – النزلة" }, { name: "ثانوية عبودة علي – حي المستقبل توقرت" }, { name: "ثانوية مسغوني محمد الصالح – حي المستقبل" }]
  },
  "الحجيرة": {
    "متوسط": [{ name: "متوسطة ابن سينا – الحجيرة" }, { name: "متوسطة لخضاري لخضر – العالية" }, { name: "متوسطة زوابري مسعود – لقراف الحجيرة" }, { name: "متوسطة السايح بن عيسى محمد السايح – العالية" }, { name: "متوسطة بن شويحة حمزة – الحجيرة" }, { name: "متوسطة شلغوم بشير – الشقة العالية" }, { name: "متوسطة المجاهد شعيب الأخضر – الحجيرة" }],
    "ثانوي": [{ name: "ثانوية طارق بن زياد – الحجيرة" }, { name: "ثانوية بساسي محمد الصغير – العالية" }, { name: "ثانوية لحسيني محمد – الحجيرة" }, { name: "ثانوية بالضياف محمد – لقراف الحجيرة" }]
  },
  "الطيبات": {
    "متوسط": [{ name: "متوسطة أحمد زبانة – الطيبات" }, { name: "متوسطة موسى بن نصير – المنقر" }, { name: "متوسطة طارق بن زياد – بن ناصر" }, { name: "متوسطة نتاري محمد dليلعي – الطيبات" }, { name: "متوسطة العقون محمد الكبير – الطيبات" }, { name: "متوسطة معمري محمد – بن ناصر" }, { name: "متوسطة العيد زقرير – المنقر" }, { name: "متوسطة بلعجال أحمد – الخبنة الطيبات" }, { name: "متوسطة المجاهد الخذير أحمد – المنقر" }, { name: "متوسطة المجاهد رابحي العيد – المنقر" }, { name: "متوسطة المجاهد بكاري عبد القادر – dليليعي الطيبات" }],
    "ثانوي": [{ name: "ثانوية ابن رشيق القيرواني – الطيبات" }, { name: "ثانوية المنقر – dقعة علي المنقر" }, { name: "ثانوية عبيد أحمد – بن ناصر" }, { name: "ثانوية زقوني الصغير – dليليعي الطيبات" }]
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

// --- الدوال الأساسية ---

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
        } else { Swal.fire('خطأ', 'كلمة المرور غير صحيحة', 'error'); }
    } catch (e) { Swal.fire('خطأ', 'مشكلة في الاتصال', 'error'); }
    finally { btn.innerHTML = oldText; btn.disabled = false; }
};

window.loadData = async function() {
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

// ✅ دالة الفلترة المعدلة لتشمل حقل الطور
window.applyFilters = function() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    
    // جلب قيمة فلتر الطور
    const levelFilter = document.getElementById("levelFilter") ? document.getElementById("levelFilter").value : "all";

    const fDaaira = document.getElementById("filter_daaira") ? document.getElementById("filter_daaira").value : "";
    const fBaladiya = document.getElementById("filter_baladiya") ? document.getElementById("filter_baladiya").value : "";
    const fSchool = document.getElementById("filter_school") ? document.getElementById("filter_school").value : "";

    filteredData = allData.filter(row => {
        // 1. بحث نصي
        const matchesSearch = (
            (row.fmn && row.fmn.includes(query)) ||
            (row.frn && row.frn.includes(query)) ||
            (row.ccp && String(row.ccp).includes(query)) ||
            (row.phone && String(row.phone).replace(/\s/g,'').includes(query)) || 
            (row.schoolName && row.schoolName.includes(query))
        );

        // 2. فلتر الحالة
        let matchesStatus = true;
        const isConfirmed = String(row.confirmed).toLowerCase() === "true";
        if (statusFilter === "confirmed") matchesStatus = isConfirmed;
        else if (statusFilter === "pending") matchesStatus = !isConfirmed;

        // 3. ✅ فلتر الطور
        let matchesLevel = (levelFilter === "all" || row.level === levelFilter);

        // 4. الفلاتر المتقدمة
        let matchesDaaira = fDaaira === "" || row.daaira === fDaaira;
        let matchesBaladiya = fBaladiya === "" || row.baladiya === fBaladiya;
        let matchesSchool = fSchool === "" || row.schoolName === fSchool;

        return matchesSearch && matchesStatus && matchesLevel && matchesDaaira && matchesBaladiya && matchesSchool;
    });

    currentPage = 1;
    window.renderCurrentPage();
};

window.updateFilterBaladiya = function() {
    const d = document.getElementById("filter_daaira").value;
    const b = document.getElementById("filter_baladiya");
    b.innerHTML = '<option value="">-- كل البلديات --</option>';
    if(d && baladiyaMap[d]) {
        baladiyaMap[d].forEach(o => {
            let op = document.createElement("option");
            op.text = o; op.value = o; b.add(op);
        });
    }
    window.updateFilterSchools();
};

window.updateFilterSchools = function() {
    const d = document.getElementById("filter_daaira").value;
    const b = document.getElementById("filter_baladiya").value;
    const s = document.getElementById("filter_school");
    s.innerHTML = '<option value="">-- كل المؤسسات --</option>';
    let schoolsList = [];
    if (b && primarySchoolsByBaladiya[b]) schoolsList = schoolsList.concat(primarySchoolsByBaladiya[b]);
    if (d && institutionsByDaaira[d]) {
        if(institutionsByDaaira[d]["متوسط"]) schoolsList = schoolsList.concat(institutionsByDaaira[d]["متوسط"]);
        if(institutionsByDaaira[d]["ثانوي"]) schoolsList = schoolsList.concat(institutionsByDaaira[d]["ثانوي"]);
    }
    schoolsList.forEach(sch => {
        let op = document.createElement("option");
        op.text = sch.name; op.value = sch.name; s.add(op);
    });
    window.applyFilters();
};

window.renderCurrentPage = function() {
    const start = (currentPage - 1) * rowsPerPage;
    window.renderTable(filteredData.slice(start, start + rowsPerPage));
    window.updatePaginationUI(Math.ceil(filteredData.length / rowsPerPage));
};

window.renderTable = function(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  if(data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">لا توجد سجلات مطابقة</td></tr>';
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
      <td>${window.fmtDate(row.date_edit)}</td>
      <td>
        <button class="action-btn" onclick="window.viewDetails(${originalIndex})"><i class="fas fa-eye"></i></button>
        <button class="action-btn" onclick="window.openEditModal(${originalIndex})"><i class="fas fa-pen"></i></button>
      </td>`;
    tbody.appendChild(tr);
  });
};

window.updateStats = function(data) {
  const total = data.length;
  const confirmed = data.filter(r => String(r.confirmed).toLowerCase() === "true").length;
  document.getElementById("totalCount").innerText = total;
  document.getElementById("confirmedCount").innerText = confirmed;
  document.getElementById("pendingCount").innerText = total - confirmed;
};

window.fmtDate = function(d) {
    if(!d) return "-";
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-GB');
};

// ... الإبقاء على كافة الدوال الأخرى (printForm, deleteUser, checkNonRegistered, openBatchPrintModal إلخ) كما وردت في ملفك الأصلي ...
// [بقية الدوال مطابقة تماماً لما أرسلته في السياق]
