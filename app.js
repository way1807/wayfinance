/* ==========================================================================
   WAYFINANCE PREMIUM BUSINESS LOGIC & INTERACTIVE ENGINE
   ========================================================================== */

const KODE_LISENSI_RAHASIA = "WAY-PREMIUM-2026";

let statusUserPremium = true; // Premium 100% Gratis & Terbuka secara Default
let daftarTransaksi = [];
let daftarWishlist = [];
let daftarTagihan = [];
let daftarPiutang = [];
let daftarCatatan = [];
let sembunyikanSaldoMode = false;
let idTransaksiDiedit = null;
let fungsiAksiModal = null;
let objekChartGlobal = null;
let objekChartLineGlobal = null;

// Premium status features
let themeAktif = 'slate';
let sakuFilterAktif = null;
let chatbotTerbuka = false;

// Multi-profil logic
let profilAktif = localStorage.getItem('way_finance_active_profile') || 'pribadi';

function dapatkanKunciProfil(kunciDasar) {
    if (profilAktif === 'pribadi') {
        return kunciDasar;
    }
    return `${kunciDasar}_${profilAktif}`;
}

function dapatkanTanggalLokalHariIni(objekTanggal = new Date()) {
    const tahun = objekTanggal.getFullYear();
    const bulan = String(objekTanggal.getMonth() + 1).padStart(2, '0');
    const tanggal = String(objekTanggal.getDate()).padStart(2, '0');
    return `${tahun}-${bulan}-${tanggal}`;
}

// Budget settings
let petaLimitBudget = {
    makanan: 0,
    transportasi: 0,
    hiburan: 0,
    tagihan: 0,
    belanja: 0,
    kustom: 0
};
let globalBudgetWarningThreshold = 2500000;
const GLOBAL_BUDGET_WARNING_KEY = 'way_finance_global_budget_threshold';

const kamusTeksKategori = {
    "makanan": "☕ Lambung Sejahtera",
    "transportasi": "🚗 Jalan-Jalan Mulu",
    "hiburan": "🎮 Senang-Senang Sesaat",
    "tagihan": "💸 Beban Rutin",
    "belanja": "🛍️ Lapar Mata",
    "gaji": "💰 Gaji Keringat Sendiri",
    "investasi": "📈 Pos Investasi Seksi",
    "transfer": "🔄 Mutasi Antar Saku",
    "kustom": "🔮 Kategori Bebas Lo"
};

const kamusIkon = {
    "makanan": "fa-solid fa-utensils",
    "transportasi": "fa-solid fa-car",
    "hiburan": "fa-solid fa-gamepad",
    "tagihan": "fa-solid fa-file-invoice-dollar",
    "belanja": "fa-solid fa-bag-shopping",
    "gaji": "fa-solid fa-money-check-dollar",
    "investasi": "fa-solid fa-chart-line",
    "transfer": "fa-solid fa-arrows-rotate",
    "kustom": "fa-solid fa-wand-magic-sparkles"
};

/* --- LIVE RUPIAH SPELLER helper ("TERBILANG" LOGIC) --- */
function spelledRupiah(angka) {
    angka = Math.floor(Math.abs(angka));
    if (angka === 0) return "Nol";
    
    const kata = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let hasil = "";
    
    if (angka < 12) {
        hasil = kata[angka];
    } else if (angka < 20) {
        hasil = spelledRupiah(angka - 10) + " Belas";
    } else if (angka < 100) {
        hasil = kata[Math.floor(angka / 10)] + " Puluh " + kata[angka % 10];
    } else if (angka < 200) {
        hasil = "Seratus " + spelledRupiah(angka - 100);
    } else if (angka < 1000) {
        hasil = kata[Math.floor(angka / 100)] + " Ratus " + spelledRupiah(angka % 100);
    } else if (angka < 2000) {
        hasil = "Seribu " + spelledRupiah(angka - 1000);
    } else if (angka < 1000000) {
        hasil = spelledRupiah(Math.floor(angka / 1000)) + " Ribu " + spelledRupiah(angka % 1000);
    } else if (angka < 1000000000) {
        hasil = spelledRupiah(Math.floor(angka / 1000000)) + " Juta " + spelledRupiah(angka % 1000000);
    } else if (angka < 1000000000000) {
        hasil = spelledRupiah(Math.floor(angka / 1000000000)) + " Miliar " + spelledRupiah(angka % 1000000000);
    } else if (angka < 1000000000000000) {
        hasil = spelledRupiah(Math.floor(angka / 1000000000000)) + " Triliun " + spelledRupiah(angka % 1000000000000);
    }
    
    return hasil.trim();
}

function updateRupiahSpell(inputVal, outputId) {
    const textSpelled = document.getElementById(outputId);
    if (!textSpelled) return;
    
    // Clean formatting to get pure integer value
    const cleanVal = parseFloat(inputVal.replace(/\./g, ''));
    if (!isNaN(cleanVal) && cleanVal > 0) {
        textSpelled.innerHTML = `<i class="fa-solid fa-quote-left"></i> ${spelledRupiah(cleanVal)} Rupiah <i class="fa-solid fa-quote-right"></i>`;
        textSpelled.style.display = "block";
    } else {
        textSpelled.style.display = "none";
    }
}

/* --- QUICK DATE PRESET SELECTOR --- */
function setDatePreset(preset, inputId) {
    const dateInput = document.getElementById(inputId);
    if (!dateInput) return;
    
    const d = new Date();
    if (preset === 'yesterday') {
        d.setDate(d.getDate() - 1);
    }
    
    dateInput.value = dapatkanTanggalLokalHariIni(d);
    
    // Toggle active state classes for UI feedback
    if (inputId === 'tanggal-transaksi') {
        const btnToday = document.getElementById('btn-date-today');
        const btnYesterday = document.getElementById('btn-date-yesterday');
        if (btnToday) btnToday.classList.toggle('active', preset === 'today');
        if (btnYesterday) btnYesterday.classList.toggle('active', preset === 'yesterday');
    }
}

// --- LOGIKA DROPDOWN KUSTOM ---
function initCustomSelects() {
    const selects = ['jenis-transaksi', 'wallet-pilihan', 'wallet-tujuan', 'kategori-transaksi'];
    selects.forEach(id => {
        const selectEl = document.getElementById(id);
        if (!selectEl) return;

        selectEl.style.display = 'none';

        let customContainer = document.getElementById('custom-select-container-' + id);
        if (customContainer) {
            updateCustomSelectOptions(id);
            return;
        }

        customContainer = document.createElement('div');
        customContainer.className = 'custom-select';
        customContainer.id = 'custom-select-container-' + id;

        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        trigger.innerHTML = `<span></span><i class="fa-solid fa-chevron-down select-chevron"></i>`;
        customContainer.appendChild(trigger);

        const dropdown = document.createElement('div');
        dropdown.className = 'custom-select-dropdown';
        customContainer.appendChild(dropdown);

        selectEl.parentNode.insertBefore(customContainer, selectEl.nextSibling);

        trigger.onclick = function (e) {
            e.stopPropagation();
            document.querySelectorAll('.custom-select').forEach(el => {
                if (el !== customContainer) el.classList.remove('active');
            });
            customContainer.classList.toggle('active');
        };

        updateCustomSelectOptions(id);
    });

    document.addEventListener('click', function () {
        document.querySelectorAll('.custom-select').forEach(el => {
            el.classList.remove('active');
        });
    });
}

function updateCustomSelectOptions(id) {
    const selectEl = document.getElementById(id);
    const customContainer = document.getElementById('custom-select-container-' + id);
    if (!selectEl || !customContainer) return;

    const triggerText = customContainer.querySelector('.custom-select-trigger span');
    const dropdown = customContainer.querySelector('.custom-select-dropdown');
    dropdown.innerHTML = '';

    const options = selectEl.options;
    for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        const optDiv = document.createElement('div');
        optDiv.className = 'custom-select-option';
        if (opt.value === selectEl.value) {
            optDiv.classList.add('selected');
            triggerText.innerHTML = opt.text;
        }
        optDiv.innerText = opt.text;
        optDiv.setAttribute('data-value', opt.value);

        optDiv.onclick = function (e) {
            e.stopPropagation();
            selectEl.value = opt.value;
            selectEl.dispatchEvent(new Event('change'));
            syncCustomSelect(id);
            customContainer.classList.remove('active');
        };
        dropdown.appendChild(optDiv);
    }
}

function syncCustomSelect(id) {
    const selectEl = document.getElementById(id);
    const customContainer = document.getElementById('custom-select-container-' + id);
    if (!selectEl || !customContainer) return;

    const triggerText = customContainer.querySelector('.custom-select-trigger span');
    const optionsDivs = customContainer.querySelectorAll('.custom-select-option');

    let selectedText = "";
    optionsDivs.forEach(div => {
        if (div.getAttribute('data-value') === selectEl.value) {
            div.classList.add('selected');
            selectedText = div.innerText;
        } else {
            div.classList.remove('selected');
        }
    });

    if (selectedText) {
        triggerText.innerHTML = selectedText;
    } else if (selectEl.options[selectEl.selectedIndex]) {
        triggerText.innerHTML = selectEl.options[selectEl.selectedIndex].text;
    }
}

function syncSemuaCustomSelect() {
    const selects = ['jenis-transaksi', 'wallet-pilihan', 'wallet-tujuan', 'kategori-transaksi'];
    selects.forEach(id => {
        syncCustomSelect(id);
    });
}

// --- PREMIUM TEMA VISUAL ---
function gantiTemaVisual(namaTema, updateData = true) {
    themeAktif = namaTema;
    localStorage.setItem('way_finance_selected_theme', namaTema);

    const bodyEl = document.body;
    if (!bodyEl) return;

    // Remove previous theme classes while preserving workflow classes like tema-pemasukan/tema-pengeluaran
    bodyEl.classList.remove('theme-slate', 'theme-cyberpunk', 'theme-emerald', 'theme-royal', 'theme-dracula');
    if (namaTema !== 'slate') {
        bodyEl.classList.add('theme-' + namaTema);
    }

    // Update active theme buttons classes
    document.querySelectorAll('.btn-theme-pill').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector('.theme-btn-' + namaTema);
    if (activeBtn) activeBtn.classList.add('active');

    if (updateData) {
        tampilkanData();
    }
}

function toggleFilterSaku(kodeSaku) {
    sakuFilterAktif = sakuFilterAktif === kodeSaku ? null : kodeSaku;
    tampilkanData();
}

function initCardTiltEffects() {
    const cards = document.querySelectorAll('.wallet-card-premium');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            const dx = x - xc;
            const dy = y - yc;

            const tiltX = -(dy / yc) * 12;
            const tiltY = (dx / xc) * 12;

            card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });
}

function toggleChatbot() {
    const chatWin = document.getElementById('chatbot-window');
    if (chatWin) {
        chatbotTerbuka = !chatbotTerbuka;
        chatWin.style.display = chatbotTerbuka ? 'flex' : 'none';
        if (chatbotTerbuka) {
            document.getElementById('chatbot-input').focus();
            
            // Auto scroll to bottom
            const messagesContainer = document.getElementById('chatbot-messages');
            if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
}

function tanyaMbahTobat(query) {
    const inputEl = document.getElementById('chatbot-input');
    if (!inputEl) return;
    inputEl.value = query;
    kirimPesanChatbot();
}

function kirimPesanChatbot() {
    const inputEl = document.getElementById('chatbot-input');
    const messagesContainer = document.getElementById('chatbot-messages');
    if (!inputEl || !messagesContainer || !inputEl.value.trim()) return;

    const userText = inputEl.value.trim();
    inputEl.value = "";

    // Render user bubble
    messagesContainer.insertAdjacentHTML('beforeend', `
        <div class="chat-bubble user">${html_escape_tag(userText)}</div>
    `);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Simple delay to make it feel organic
    setTimeout(() => {
        const responBot = prosesPesanChatbot(userText);
        messagesContainer.insertAdjacentHTML('beforeend', `
            <div class="chat-bubble bot">${responBot}</div>
        `);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 450);
}

function prosesPesanChatbot(teks) {
    const lowText = teks.toLowerCase();

    // Calculate saku totals dynamically
    let saldoCash = 0, saldoDana = 0, saldoOvo = 0, saldoGopay = 0, saldoGlobal = 0;
    let saldoBca = 0, saldoMandiri = 0, saldoBni = 0, saldoBri = 0, saldoLain = 0;

    daftarTransaksi.forEach(item => {
        const src = item.wallet || "dana";
        const dest = item.walletTujuan;
        const nom = item.nominal;

        if (item.jenis === "pemasukan") {
            saldoGlobal += nom;
            if (src === "cash") saldoCash += nom;
            if (src === "dana") saldoDana += nom;
            if (src === "ovo") saldoOvo += nom;
            if (src === "gopay") saldoGopay += nom;
            if (src === "bca") saldoBca += nom;
            if (src === "mandiri") saldoMandiri += nom;
            if (src === "bni") saldoBni += nom;
            if (src === "bri") saldoBri += nom;
            if (src === "bank_lain") saldoLain += nom;
        }
        else if (item.jenis === "pengeluaran") {
            saldoGlobal -= nom;
            if (src === "cash") saldoCash -= nom;
            if (src === "dana") saldoDana -= nom;
            if (src === "ovo") saldoOvo -= nom;
            if (src === "gopay") saldoGopay -= nom;
            if (src === "bca") saldoBca -= nom;
            if (src === "mandiri") saldoMandiri -= nom;
            if (src === "bni") saldoBni -= nom;
            if (src === "bri") saldoBri -= nom;
            if (src === "bank_lain") saldoLain -= nom;
        }
        else if (item.jenis === "transfer") {
            if (src === "cash") saldoCash -= nom;
            if (src === "dana") saldoDana -= nom;
            if (src === "ovo") saldoOvo -= nom;
            if (src === "gopay") saldoGopay -= nom;
            if (src === "bca") saldoBca -= nom;
            if (src === "mandiri") saldoMandiri -= nom;
            if (src === "bni") saldoBni -= nom;
            if (src === "bri") saldoBri -= nom;
            if (src === "bank_lain") saldoLain -= nom;

            if (dest === "cash") saldoCash += nom;
            if (dest === "dana") saldoDana += nom;
            if (dest === "ovo") saldoOvo += nom;
            if (dest === "gopay") saldoGopay += nom;
            if (dest === "bca") saldoBca += nom;
            if (dest === "mandiri") saldoMandiri += nom;
            if (dest === "bni") saldoBni += nom;
            if (dest === "bri") saldoBri += nom;
            if (dest === "bank_lain") saldoLain += nom;
        }
    });

    if (lowText.includes('saldo bca')) {
        return `Saldo <strong>BCA</strong> lo saat ini: <strong>Rp ${saldoBca.toLocaleString('id-ID')}</strong>. ` +
            (saldoBca > 1000000 ? "Mantap, masih tebel! Hati-hati kepancing diskon Shopee ya, Cuy! 🛍️" : "Sekarat banget, Cuy! Buruan tobat nongkrong di kafe mahal! 😭");
    }
    if (lowText.includes('saldo mandiri')) {
        return `Saldo <strong>Mandiri</strong> lo saat ini: <strong>Rp ${saldoMandiri.toLocaleString('id-ID')}</strong>. ` +
            (saldoMandiri > 1000000 ? "Alhamdulillah aman, jangan lupa sedekah biar tambah barokah!" : "Tinggal remah-remah kuaci nih saldo Mandiri lo.");
    }
    if (lowText.includes('saldo bni')) {
        return `Saldo <strong>BNI</strong> lo saat ini: <strong>Rp ${saldoBni.toLocaleString('id-ID')}</strong>.`;
    }
    if (lowText.includes('saldo bri')) {
        return `Saldo <strong>BRI</strong> lo saat ini: <strong>Rp ${saldoBri.toLocaleString('id-ID')}</strong>.`;
    }
    if (lowText.includes('saldo dana')) {
        return `Saldo <strong>DANA</strong> lo saat ini: <strong>Rp ${saldoDana.toLocaleString('id-ID')}</strong>. ` +
            (saldoDana > 500000 ? "Awas kepakai buat top up game / jajan seblak tidak berfaedah! 🎮" : "Saldo DANA krisis, kasihan banget deh dompet digital lo.");
    }
    if (lowText.includes('saldo gopay')) {
        return `Saldo <strong>GoPay</strong> lo saat ini: <strong>Rp ${saldoGopay.toLocaleString('id-ID')}</strong>. ` +
            (saldoGopay > 500000 ? "GoPay aman, mau go-food lagi lo? Mentang-mentang diskon!" : "Driver ojol bakal nangis liat saku GoPay lo sesedikit ini.");
    }
    if (lowText.includes('saldo ovo')) {
        return `Saldo <strong>OVO</strong> lo saat ini: <strong>Rp ${saldoOvo.toLocaleString('id-ID')}</strong>.`;
    }
    if (lowText.includes('saldo cash') || lowText.includes('saldo dompet') || lowText.includes('cash')) {
        return `Duit <strong>Cash</strong> di kantong lo tinggal: <strong>Rp ${saldoCash.toLocaleString('id-ID')}</strong>. ` +
            (saldoCash > 200000 ? "Simpan baik-baik di dompet biar gak lenyap secara misterius pas dicuci." : "Sisa recehan doang, besok-besok bawa bekel nasi aja!");
    }

    if (lowText.includes('saldo') || lowText.includes('sisa uang') || lowText.includes('sisa duit')) {
        return `Total sisa uang hidup lo dari seluruh saku gabungan: <strong>Rp ${saldoGlobal.toLocaleString('id-ID')}</strong>.<br/><br/>` +
            (saldoGlobal > 5000000 ? "Status: <strong>Sultan Pondok Indah 👑</strong>. Tapi inget, roda kehidupan berputar, Cuy!" :
                saldoGlobal > 1500000 ? "Status: <strong>Rakyat Jelata Aman 👍</strong>. Masih bisa makan ayam penyet tanpa pusing." :
                    saldoGlobal > 500000 ? "Status: <strong>Pecinta Mie Instan 🍜</strong>. Mode bertahan hidup kudu dinyalain!" :
                        "Status: <strong>Kritis UGD 💀💥</strong>. Mending lo matiin HP terus bertapa di goa, Cuy! Jangan belanja!");
    }

    if (lowText.includes('roast') || lowText.includes('sindir') || lowText.includes('dosa') || lowText.includes('kritik')) {
        let totalPengeluaran = 0;
        let totalKategori = {};
        let itemTermahal = { nominal: 0, nama: "-" };

        daftarTransaksi.forEach(t => {
            if (t.jenis === "pengeluaran") {
                totalPengeluaran += t.nominal;
                totalKategori[t.kategori] = (totalKategori[t.kategori] || 0) + t.nominal;
                if (t.nominal > itemTermahal.nominal) {
                    itemTermahal = { nominal: t.nominal, nama: t.nama };
                }
            }
        });

        if (totalPengeluaran === 0) {
            return "Gak ada riwayat pengeluaran sama sekali. Mbah heran, lo gak jajan apa emang gak punya duit buat dibelanjain? 🤔";
        }

        let kategoriTerboros = "";
        let nominalTerboros = 0;
        for (const [kat, nom] of Object.entries(totalKategori)) {
            if (nom > nominalTerboros) {
                nominalTerboros = nom;
                kategoriTerboros = kat;
            }
        }

        const namaIndoKat = kamusTeksKategori[kategoriTerboros] || kategoriTerboros;
        
        // Himpunan kalimat nyinyir Mbah Tobat
        const mbahBacotan = [
            `Nafsu lo gede banget buat belanja, tapi saldo lo cilik kayak dompet anak TK. Tobat, Cuy! Kurangin beli barang ga penting sebelum ginjal lo yang melayang!`,
            `Si paling self-reward berkedok healing. Padahal tabungan lo yang butuh di-healing di UGD karena lo boros gak ngotak!`,
            `Menyala Abangku! Duit ludes dalam sekejap buat jajan ga jelas. Besok-besok makannya nasi putih lauk garam campur doa aja biar hemat.`,
            `Gaya elit, ekonomi sulit! Belanjaan lo buat '${itemTermahal.nama}' udah cukup bikin saldo lo menangis lirih di pojokan.`
        ];
        const randomBacot = mbahBacotan[Math.floor(Math.random() * mbahBacotan.length)];

        return `🔥 <strong>ROASTING KILAT MBAH TOBAT:</strong><br/>
                Total belanja lo bulan ini udah tembus <strong>Rp ${totalPengeluaran.toLocaleString('id-ID')}</strong>! <br/>
                Sekte alokasi paling khilaf adalah <strong>${namaIndoKat}</strong> dengan total Rp ${nominalTerboros.toLocaleString('id-ID')}.<br/>
                Bahkan transaksi termahal lo buat beli <strong>'${itemTermahal.nama}'</strong> (Rp ${itemTermahal.nominal.toLocaleString('id-ID')}).<br/><br/>
                <em>"${randomBacot}"</em>`;
    }

    if (lowText.includes('tips') || lowText.includes('hemat') || lowText.includes('saran') || lowText.includes('nasihat')) {
        const tipsArray = [
            "<strong>Tips Hemat 1:</strong> Sebelum beli barang, diemin dulu di keranjang 3 hari. Kalau hari ke-4 lo lupa, berarti emang gak butuh-butuh amat.",
            "<strong>Tips Hemat 2:</strong> Jangan nongkrong pas weekend. Bilang aja ke temen lo kalau lo lagi kena wamil / isolasi mandiri demi kelangsungan saku.",
            "<strong>Tips Hemat 3:</strong> Uninstal aplikasi M-Banking dan e-commerce. Kembali ke zaman purba pakai uang cash biar berasa pedihnya pas ngeluarin lembaran duit.",
            "<strong>Tips Hemat 4:</strong> Kalau mau jajan kopi 50 ribu, konversikan ke mie instan. 50 ribu = 15 bungkus mie instan, cukup buat nyambung nyawa setengah bulan!",
            "<strong>Tips Hemat 5:</strong> Cari temen kaya yang suka traktir. Itu adalah investasi sosial terbaik saat ini. 😂"
        ];
        return tipsArray[Math.floor(Math.random() * tipsArray.length)] + "<br/><br/>Ada yang mau ditanyain lagi?";
    }

    if (lowText.includes('wishlist') || lowText.includes('impian') || lowText.includes('celengan') || lowText.includes('goals')) {
        if (daftarWishlist.length === 0) {
            return "Lo gak punya target barang impian di Wishlist saat ini. Bagus deh, tandanya selera belanja lo lagi mati suri.";
        }
        let listWish = "🎯 <strong>STATUS WISHLIST IMPIAN LO:</strong><br/>";
        daftarWishlist.forEach((item, idx) => {
            let persen = Math.min(Math.round((item.terkumpul / item.hargaTarget) * 100), 100) || 0;
            listWish += `${idx + 1}. <strong>${item.nama}</strong>: ${persen}% (Rp ${item.terkumpul.toLocaleString('id-ID')} / Rp ${item.hargaTarget.toLocaleString('id-ID')})<br/>`;
        });
        return listWish + "<br/>Gas terus isi celengannya biar cepet kebeli, Cuy! 🚀";
    }

    return "Mbah gak ngerti bahasa manusia yang itu, Cuy. Coba tanya hal-hal seputar:<br/>" +
        "• <code>saldo bca</code> (atau saku lainnya)<br/>" +
        "• <code>saldo</code> (sisa uang gabungan)<br/>" +
        "• <code>roast gua</code> (sindiran pedas pengeluaran)<br/>" +
        "• <code>tips hemat</code> (nasihat finansial)<br/>" +
        "• <code>wishlist</code> (cek celengan barang impian)";
}

// Register new premium functions
window.gantiTemaVisual = gantiTemaVisual;
window.toggleFilterSaku = toggleFilterSaku;
window.toggleChatbot = toggleChatbot;
window.kirimPesanChatbot = kirimPesanChatbot;
window.tanyaMbahTobat = tanyaMbahTobat;

window.addEventListener('DOMContentLoaded', () => {
    statusUserPremium = true;

    // Load theme choice from localStorage
    themeAktif = localStorage.getItem('way_finance_selected_theme') || 'slate';
    gantiTemaVisual(themeAktif, false);

    // Set active class on profile switcher buttons based on loaded profile
    profilAktif = localStorage.getItem('way_finance_active_profile') || 'pribadi';
    if (profilAktif === 'bisnis') {
        profilAktif = 'simulasi';
        localStorage.setItem('way_finance_active_profile', 'simulasi');
    }
    const pribBtn = document.getElementById('profile-btn-pribadi');
    const simBtn = document.getElementById('profile-btn-simulasi');
    if (pribBtn) pribBtn.classList.remove('active');
    if (simBtn) simBtn.classList.remove('active');
    if (profilAktif === 'pribadi' && pribBtn) {
        pribBtn.classList.add('active');
    } else if (simBtn) {
        simBtn.classList.add('active');
    }

    sembunyikanSaldoMode = localStorage.getItem('way_finance_hide_balance_status') === 'true';
    const supportClosed = localStorage.getItem('way_finance_support_closed') === 'true';
    toggleSupportCard(!supportClosed);

    muatDataLokalLego();
    muatBatasBudgetGlobal();

    const waktuSekarang = new Date();
    const tanggalHariIniLokal = dapatkanTanggalLokalHariIni(waktuSekarang);
    document.getElementById('filter-bulan').value = String(waktuSekarang.getMonth() + 1).padStart(2, '0');
    document.getElementById('tanggal-transaksi').value = tanggalHariIniLokal;
    document.getElementById('bill-tanggal-input').value = tanggalHariIniLokal;
    if (document.getElementById('debt-due-input')) {
        document.getElementById('debt-due-input').value = tanggalHariIniLokal;
    }

    perbaruiOpsiKategori();
    initCustomSelects();
    perbaruiTampilanTombolPremium();
    tampilkanData();

    periksaWelcomeModeInput();

    // Event delegation untuk kalkulator cepat di kolom nominal & rupiah spelling helper
    document.addEventListener('blur', function (event) {
        if (event.target && (event.target.id === 'nominal' ||
            event.target.id === 'bill-nominal-input' ||
            event.target.id === 'wishlist-harga-input' ||
            event.target.id === 'debt-nominal-input' ||
            event.target.id.startsWith('input-limit-') ||
            event.target.id.startsWith('input-budget-'))) {
            window.evaluasiKalkulatorNominal(event.target);
        }
    }, true);

    document.addEventListener('keyup', function (event) {
        if (event.target) {
            if (event.target.id === 'nominal') {
                updateRupiahSpell(event.target.value, 'nominal-spell');
            } else if (event.target.id === 'bill-nominal-input') {
                updateRupiahSpell(event.target.value, 'bill-nominal-spell');
            } else if (event.target.id === 'wishlist-harga-input') {
                updateRupiahSpell(event.target.value, 'wishlist-nominal-spell');
            } else if (event.target.id === 'debt-nominal-input') {
                updateRupiahSpell(event.target.value, 'debt-nominal-spell');
            }
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && event.target &&
            (event.target.id === 'nominal' ||
                event.target.id === 'bill-nominal-input' ||
                event.target.id === 'wishlist-harga-input' ||
                event.target.id === 'debt-nominal-input' ||
                event.target.id.startsWith('input-limit-') ||
                event.target.id.startsWith('input-budget-'))) {
            window.evaluasiKalkulatorNominal(event.target);
            window.formatInputRupiah(event.target);
            
            // Trigger final spell update on Enter
            if (event.target.id === 'nominal') updateRupiahSpell(event.target.value, 'nominal-spell');
            else if (event.target.id === 'bill-nominal-input') updateRupiahSpell(event.target.value, 'bill-nominal-spell');
            else if (event.target.id === 'wishlist-harga-input') updateRupiahSpell(event.target.value, 'wishlist-nominal-spell');
            else if (event.target.id === 'debt-nominal-input') updateRupiahSpell(event.target.value, 'debt-nominal-spell');
        }
    });

    if (window.innerWidth <= 820) { window.addEventListener('scroll', deteksiScrollSectionHP); }

    document.querySelectorAll('.collapsible-section').forEach(section => {
        section.classList.add('active');
    });
});

function perbaruiTampilanTombolPremium() {
    const btnEkspor = document.getElementById('btn-premium-ekspor');
    const btnRestore = document.getElementById('btn-premium-restore') || document.getElementById('btn-premium-grafik');
    const btnCsv = document.getElementById('btn-premium-csv');
    const btnCsvRestore = document.getElementById('btn-premium-csv-restore');
    const icon1 = document.getElementById('lock-icon-1');
    const icon2 = document.getElementById('lock-icon-2');
    const icon3 = document.getElementById('lock-icon-3');
    const icon4 = document.getElementById('lock-icon-4');

    if (statusUserPremium) {
        if (btnEkspor) btnEkspor.classList.add('unlocked');
        if (btnRestore) btnRestore.classList.add('unlocked');
        if (btnCsv) btnCsv.classList.add('unlocked');
        if (btnCsvRestore) btnCsvRestore.classList.add('unlocked');
        if (icon1) icon1.className = "fa-solid fa-file-arrow-down";
        if (icon2) icon2.className = "fa-solid fa-file-arrow-up";
        if (icon3) icon3.className = "fa-solid fa-file-excel";
        if (icon4) icon4.className = "fa-solid fa-file-import";
    } else {
        if (btnEkspor) btnEkspor.classList.remove('unlocked');
        if (btnRestore) btnRestore.classList.remove('unlocked');
        if (btnCsv) btnCsv.classList.remove('unlocked');
        if (btnCsvRestore) btnCsvRestore.classList.remove('unlocked');
        if (icon1) icon1.className = "fa-solid fa-lock";
        if (icon2) icon2.className = "fa-solid fa-lock";
        if (icon3) icon3.className = "fa-solid fa-lock";
        if (icon4) icon4.className = "fa-solid fa-lock";
    }
}

function tanyaSuntikData() {
    panggilCustomModal(
        'Simulasi Keuangan? 🧮',
        'Apakah kamu mau menambahkan simulasi transaksi realistis dengan pemasukan, pengeluaran, dan mutasi agar total sisa uang hidup terlihat lebih masuk akal?',
        function () {
            triggerCheatDataGaib();
        },
        'confirm'
    );
}

function bukaModalPenjelasanDev() {
    if (statusUserPremium) {
        panggilCustomModal(
            'Kamu Sudah Premium! 😎',
            `Kunci lisensi premium kamu sudah aktif di device ini.\n\nSemua fitur ekspor/import file backup JSON, unduh CSV, dan generator data gaib bebas kamu pakai sepuasnya selamanya, Cuy!`,
            function () {
                triggerCheatDataGaib();
            },
            "success"
        );
        const fieldArea = document.getElementById('modal-custom-field-area');
        fieldArea.innerHTML = `
            <button class="modal-btn" style="background: linear-gradient(135deg, #2c3e50, #c0392b); color: white; border: none; padding: 10px; width: 100%; border-radius: 12px; font-weight: 600; cursor: pointer; margin-top: 15px; font-size: 0.85rem;" onclick="window.keluarDariPremium()">
                <i class="fa-solid fa-arrow-right-from-bracket"></i> Keluar dari Mode Premium 🚪
            </button>
        `;
        document.getElementById('modal-confirm-btn').innerText = "Simulasi Suntik Data Gaib 🎯";
        document.getElementById('modal-cancel-btn').style.display = "inline-block";
        document.getElementById('modal-cancel-btn').innerText = "Tutup";
    } else {
        panggilCustomModal(
            'Buka Fitur WAY Premium? 💎',
            `Keunggulan Fitur WAY Premium yang akan terbuka:\n
            1. 💾 Backup & Restore JSON: Amankan data riwayat agar tidak hilang saat ganti HP.
            2. 📊 Ekspor CSV: Unduh data transaksi langsung ke format Excel untuk laporan detail.
            3. 🛑 Budget Limit Warning: Notifikasi otomatis jika pengeluaran bulanan lo melampaui batas sehat (Rp2.500.000).
            4. 🗓️ Kalender Tagihan Rutin: Pengingat jadwal bayar beban rutin (kost, wifi, dll.) beserta tombol autodeduksi saku.
            5. 👁️ Sembunyikan Saldo: Amankan privasi dari mata-mata teman nongkrong lo.
            6. ⚡ Shortcut Nominal Cepat: Isi formulir secepat kilat sekali tap.
            7. 📋 Smart Paste Mutasi: Copy-paste teks SMS/notifikasi M-banking, nominal langsung terisi otomatis secara ajaib!
            8. 📈 Line Chart Tren Kekayaan: Analisis pergerakan naik turun kekayaan lo dari waktu ke waktu.
            9. 🔄 Transfer via Catatan: Pindahkan saldo antar saku secara otomatis via kalimat harian.\n
            Masukkan "Kunci Lisensi" resmi dari Wahyu Kurniawan di bawah ini untuk membuka akses permanen sepuasnya!`,
            function () {
                const kodeInput = document.getElementById('input-kode-premium-field').value;
                if (kodeInput && kodeInput.trim() === KODE_LISENSI_RAHASIA) {
                    statusUserPremium = true;
                    localStorage.setItem('way_finance_premium_status', 'true');
                    perbaruiTampilanTombolPremium();
                    tampilkanData();
                    panggilCustomModal('Aktivasi Sukses! 🎉', 'Selamat! Semua fitur gembok premium berhasil dibuka permanen, Bos Devoloper!', null, 'success');
                } else {
                    panggilCustomModal('Aktivasi Gagal ❌', 'Kunci Lisensi yang kamu masukkan salah/tidak valid! Hubungi Wahyu buat beli kodenya, Cuy.', null, 'exclamation');
                }
            },
            "developer_login"
        );
    }
}

function validasiKodePremiumLangsung() {
    const inputEl = document.getElementById('input-kode-premium-field');
    if (!inputEl) return;
    const kodeInput = inputEl.value;
    if (kodeInput && kodeInput.trim() === KODE_LISENSI_RAHASIA) {
        statusUserPremium = true;
        localStorage.setItem('way_finance_premium_status', 'true');
        perbaruiTampilanTombolPremium();
        tampilkanData();
        tutupCustomModal();
        panggilCustomModal('Aktivasi Sukses! 🎉', 'Selamat! Semua fitur gembok premium berhasil dibuka permanen, Bos Devoloper!', null, 'success');
    } else {
        panggilCustomModal('Aktivasi Gagal ❌', 'Kunci Lisensi yang kamu masukkan salah/tidak valid! Hubungi Wahyu buat beli kodenya, Cuy.', null, 'exclamation');
    }
}

function pemicuBackupPremium() {
    eksekusiBackupJSON();
}

function pemicuRestorePremium() {
    document.getElementById('json-restore-file').click();
}

function pemicuExportCSV() {
    eksekusiExportCSV();
}

function bukaPaywallPremium(namaFitur) {
    panggilCustomModal(
        'Eits, Fitur Ini Dikunci Dulu, Cuy! 💎',
        `Fitur "${namaFitur}" ini cuma terbuka buat pengguna versi Premium.\n\nCukup bayar Rp10.000 (sekali bayar seumur hidup) ke pengembang, lo bisa amankan seluruh riwayat keuangan lo dalam bentuk file biar gak takut hilang pas ganti HP!\n\nKlik tombol di bawah buat chat Wahyu via WA sekarang, otomatis dapet Kunci Aktivasi Lisensinya!`,
        function () {
            window.open("https://wa.me/6283832883308?text=Halo%20Bang%20Wahyu,%20gua%20mau%20beli%20Kunci%20Lisensi%20Premium%20WAYFinance%20Rp10k%20dong!", "_blank");
        },
        "premium"
    );
}

function toggleSembunyikanSaldo() {
    sembunyikanSaldoMode = !sembunyikanSaldoMode;
    localStorage.setItem('way_finance_hide_balance_status', sembunyikanSaldoMode ? 'true' : 'false');
    tampilkanData();
}

function pemicuShortcutNominal(nilaiString) {
    const inputNom = document.getElementById('nominal');
    let nilaiSekarang = parseFloat(inputNom.value.replace(/\./g, '')) || 0;
    let nilaiTambah = parseFloat(nilaiString.replace(/\./g, '')) || 0;
    inputNom.value = nilaiSekarang + nilaiTambah;
    formatInputRupiah(inputNom);
    
    // Update live spell helper
    updateRupiahSpell(inputNom.value, 'nominal-spell');
}

// --- SMART PASTE MUTASI AUTOMATIC DETECTION ---
function eksekusiSmartPaste() {
    const stringTeks = document.getElementById('smart-paste-box').value;
    if (!stringTeks || !stringTeks.trim()) {
        panggilCustomModal('Kotak Kosong ❌', 'Ketik atau paste dulu teks mutasi lo di dalam box, Cuy!', null, 'exclamation');
        return;
    }

    const deteksiAngka = stringTeks.replace(/[^,\d]/g, '').match(/\d+/);
    const nominalParsed = deteksiAngka ? parseFloat(deteksiAngka[0]) : null;

    if (nominalParsed) {
        const inputFormNominal = document.getElementById('nominal');
        inputFormNominal.value = nominalParsed;
        formatInputRupiah(inputFormNominal);
        updateRupiahSpell(inputFormNominal.value, 'nominal-spell');

        const lowerTeks = stringTeks.toLowerCase();
        const sakuSelect = document.getElementById('wallet-pilihan');
        if (lowerTeks.includes('bca')) sakuSelect.value = 'bca';
        else if (lowerTeks.includes('mandiri')) sakuSelect.value = 'mandiri';
        else if (lowerTeks.includes('dana')) sakuSelect.value = 'dana';
        else if (lowerTeks.includes('gopay')) sakuSelect.value = 'gopay';
        else if (lowerTeks.includes('ovo')) sakuSelect.value = 'ovo';

        const aliranSelect = document.getElementById('jenis-transaksi');
        if (lowerTeks.includes('transfer') || lowerTeks.includes('keluar') || lowerTeks.includes('debit') || lowerTeks.includes('payment')) {
            aliranSelect.value = 'pengeluaran';
        } else if (lowerTeks.includes('masuk') || lowerTeks.includes('credit') || lowerTeks.includes('cair')) {
            aliranSelect.value = 'pemasukan';
        }
        ubahTemaWarna();

        panggilCustomModal('Analisis Sukses! ⚡', `Berhasil mendeteksi nominal Rp ${nominalParsed.toLocaleString('id-ID')}!\nSilakan lengkapi nama transaksi lalu klik Simpan.`, null, 'success');
    } else {
        panggilCustomModal('Gagal Ekstrak ❌', 'Sistem gak nemu angka nominal transaksi di teks lo. Coba cek lagi, Cuy!', null, 'exclamation');
    }
}

function eksekusiCetakPDFLaporan() {
    window.print();
}

function tambahTagihanBaru() {
    const nama = document.getElementById('bill-nama-input').value;
    const nominal = document.getElementById('bill-nominal-input').value;
    const tanggal = document.getElementById('bill-tanggal-input').value;

    if (!nama || nama.trim() === "" || !nominal || !tanggal) return;
    const nominalMurni = parseFloat(nominal.replace(/\./g, ''));
    if (isNaN(nominalMurni) || nominalMurni <= 0) return;

    daftarTagihan.push({ id: +new Date(), nama: nama.trim(), nominal: nominalMurni, tanggal: tanggal });
    document.getElementById('bill-nama-input').value = "";
    document.getElementById('bill-nominal-input').value = "";
    document.getElementById('bill-nominal-spell').style.display = "none";

    simpanDataKeLokal();
    tampilkanData();
}

function bayarTagihanOtomatis(idBill, walletValue) {
    const target = daftarTagihan.find(t => t.id === idBill);
    if (!target) return;

    daftarTransaksi.unshift({
        id: +new Date(),
        nama: `Bayar: ${target.nama}`,
        jenis: "pengeluaran",
        wallet: walletValue,
        kategori: "tagihan",
        nominal: target.nominal,
        tanggalCetak: new Date(target.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        bulan: String(new Date(target.tanggal).getMonth() + 1).padStart(2, '0'),
        tanggalMentah: target.tanggal
    });

    daftarTagihan = daftarTagihan.filter(t => t.id !== idBill);
    simpanDataKeLokal();
    tampilkanData();
    panggilCustomModal('Tagihan Lunas! 💸', `Sukses mendebet saldo ${walletValue.toUpperCase()} untuk ${target.nama}.`, null, 'success');
}

function hapusTagihan(idBill) {
    daftarTagihan = daftarTagihan.filter(t => t.id !== idBill);
    simpanDataKeLokal();
    tampilkanData();
}

function triggerCheatDataGaib() {
    const sekarang = new Date();
    const tahunSekarang = sekarang.getFullYear();
    const bulanSekarang = sekarang.getMonth() + 1;
    const tanggalSekarang = sekarang.getDate();
    const bulanLabel = String(bulanSekarang).padStart(2, '0');

    const templates = [
        { nama: 'Gaji Bulan Ini', jenis: 'pemasukan', wallet: 'bca', kategori: 'gaji', nominal: 6500000, bulan: bulanLabel, hariTaksiran: 1 },
        { nama: 'Bayar Sewa Kost', jenis: 'pengeluaran', wallet: 'cash', kategori: 'tagihan', nominal: 1400000, bulan: bulanLabel, hariTaksiran: 3 },
        { nama: 'Belanja Kebutuhan', jenis: 'pengeluaran', wallet: 'gopay', kategori: 'makanan', nominal: 420000, bulan: bulanLabel, hariTaksiran: 5 },
        { nama: 'Top Up Dana', jenis: 'transfer', wallet: 'bca', walletTujuan: 'dana', kategori: 'transfer', nominal: 250000, bulan: bulanLabel, hariTaksiran: 6 },
        { nama: 'Transport & Bensin', jenis: 'pengeluaran', wallet: 'bca', kategori: 'transportasi', nominal: 180000, bulan: bulanLabel, hariTaksiran: 8 },
        { nama: 'Bonus Cepat', jenis: 'pemasukan', wallet: 'mandiri', kategori: 'kustom', nominal: 700000, bulan: bulanLabel, hariTaksiran: 12 },
        { nama: 'Transfer ke Cash', jenis: 'transfer', wallet: 'bca', walletTujuan: 'cash', kategori: 'transfer', nominal: 400000, bulan: bulanLabel, hariTaksiran: 14 },
        { nama: 'Makan Siang', jenis: 'pengeluaran', wallet: 'gopay', kategori: 'makanan', nominal: 80000, bulan: bulanLabel, hariTaksiran: 16 },
        { nama: 'Hadiah Kecil', jenis: 'pemasukan', wallet: 'ovo', kategori: 'kustom', nominal: 300000, bulan: bulanLabel, hariTaksiran: 20 }
    ];

    const injected = [];
    templates.forEach(t => {
        const blnNum = parseInt(t.bulan, 10);

        if (blnNum === bulanSekarang && t.hariTaksiran <= tanggalSekarang) {
            let hariPilihan = t.hariTaksiran + (Math.floor(Math.random() * 3) - 1);
            if (hariPilihan < 1) hariPilihan = 1;
            if (hariPilihan > 28) hariPilihan = 28;

            const persenRandom = (Math.random() * 0.08) - 0.04;
            const selisihNominal = Math.round((t.nominal * persenRandom) / 10000) * 10000;
            const nominalAkhir = t.nominal + selisihNominal;

            const objekTanggal = new Date(tahunSekarang, blnNum - 1, hariPilihan, 10, 0, 0);
            const tanggalMentahStr = dapatkanTanggalLokalHariIni(objekTanggal);
            const tanggalCetakStr = objekTanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            const txId = objekTanggal.getTime() + Math.floor(Math.random() * 1000000);

            injected.push({
                id: txId,
                nama: t.nama,
                jenis: t.jenis,
                wallet: t.wallet,
                walletTujuan: t.walletTujuan,
                kategori: t.kategori,
                nominal: nominalAkhir,
                tanggalCetak: tanggalCetakStr,
                bulan: t.bulan,
                tanggalMentah: tanggalMentahStr
            });
        }
    });

    if (injected.length === 0) {
        panggilCustomModal('Info ℹ️', 'Simulasi belum bisa dibuat karena belum ada transaksi yang jatuh tempo di bulan ini.', null, 'exclamation');
        return;
    }

    const totalPemasukan = injected.filter(item => item.jenis === 'pemasukan').reduce((sum, item) => sum + item.nominal, 0);
    const totalPengeluaran = injected.filter(item => item.jenis === 'pengeluaran').reduce((sum, item) => sum + item.nominal, 0);
    const totalTransfer = injected.filter(item => item.jenis === 'transfer').reduce((sum, item) => sum + item.nominal, 0);
    const saldoBersih = totalPemasukan - totalPengeluaran - totalTransfer;

    daftarTransaksi = [...injected, ...daftarTransaksi];
    daftarTransaksi.sort((a, b) => b.id - a.id);

    simpanDataKeLokal();
    tampilkanData();
    panggilCustomModal(
        'Simulasi Selesai! 🧮',
        `Simulasi dibuat dengan ${injected.length} transaksi realistis: pemasukan Rp ${totalPemasukan.toLocaleString('id-ID')}, pengeluaran Rp ${totalPengeluaran.toLocaleString('id-ID')}, mutasi Rp ${totalTransfer.toLocaleString('id-ID')}. Sisa kas estimasinya sekitar Rp ${saldoBersih.toLocaleString('id-ID')}.`,
        null,
        'success'
    );
}

function gantiProfilKeuangan(profil) {
    if (profilAktif === profil) return;
    profilAktif = profil;
    localStorage.setItem('way_finance_active_profile', profil);

    const notesHelperTitle = document.getElementById('notes-helper-title');
    const notesHelperContent = document.getElementById('notes-helper-content');
    const notesHelperIcon = document.getElementById('notes-helper-icon');
    const notesHelperBox = document.getElementById('notes-helper-box');
    const notesInputLabel = document.getElementById('notes-input-label');
    const btnSaveNotes = document.getElementById('btn-save-notes');
    const notesHistoryLabel = document.getElementById('notes-history-label');

    if (profil === 'simulasi') {
        document.body.classList.add('mode-simulasi-aktif');
        if (typeof setModeInput === 'function') setModeInput('simpel');

        // Ganti teks & skema warna ke Mode Simulasi (Sandbox Ungu Lavender)
        if (notesHelperBox) {
            notesHelperBox.style.background = "rgba(142, 68, 173, 0.08)";
            notesHelperBox.style.borderColor = "rgba(142, 68, 173, 0.3)";
            notesHelperBox.style.color = "#8e44ad";
        }
        if (notesHelperIcon) notesHelperIcon.className = "fa-solid fa-circle-info";
        if (notesHelperTitle) {
            notesHelperTitle.style.color = "#8e44ad";
        }
        if (notesHelperContent) {
            notesHelperContent.innerHTML = `<span id="notes-helper-title" style="font-weight: 600; display: block; margin-bottom: 4px; color: #8e44ad;">💡 Info Sandbox Simulasi:</span>
            Mode ini digunakan untuk mensimulasikan / merencanakan pengeluaran atau pemasukan Anda di bulan depan atau masa mendatang agar Anda mengetahui estimasi hasil akhir saldo Anda, tanpa merusak data asli di profil Pribadi!<br>
            • Pola catat: <strong>[kegiatan] [nominal] [saku]</strong>.<br>
            • Contoh: <em>Sewa kost bulan depan 1.5jt bca</em>`;
        }
        if (notesInputLabel) {
            notesInputLabel.style.color = "#2c3e50";
            notesInputLabel.innerText = "Tulis Coretan Rencana Simulasi Lo di Sini, Cuy:";
        }
        if (btnSaveNotes) {
            btnSaveNotes.style.background = "linear-gradient(135deg, #2c3e50, #8e44ad)";
            btnSaveNotes.innerHTML = '<i class="fa-solid fa-calculator"></i> Proses & Masukkan Rencana Simulasi ⚡';
        }
        if (notesHistoryLabel) {
            notesHistoryLabel.style.color = "#2c3e50";
            notesHistoryLabel.innerText = "Daftar Rencana Catatan Simulasi 🧮";
        }
    } else {
        document.body.classList.remove('mode-simulasi-aktif');
        const savedMode = localStorage.getItem('way_finance_input_mode') || 'manual';
        if (typeof setModeInput === 'function') setModeInput(savedMode);

        // Kembalikan ke Mode Pribadi (Teks Oranye Original)
        if (notesHelperBox) {
            notesHelperBox.style.background = "rgba(243, 156, 18, 0.05)";
            notesHelperBox.style.borderColor = "rgba(243, 156, 18, 0.25)";
            notesHelperBox.style.color = "#f39c12";
        }
        if (notesHelperIcon) notesHelperIcon.className = "fa-solid fa-lightbulb";
        if (notesHelperTitle) {
            notesHelperTitle.style.color = "#ffffff";
        }
        if (notesHelperContent) {
            notesHelperContent.innerHTML = `<span id="notes-helper-title" style="font-weight: 600; display: block; margin-bottom: 2px; color: #ffffff;">Tips Menulis Catatan:</span>
            Gunakan pola sederhana: <strong>[kegiatan] [nominal] [saku]</strong>.<br />
            • Contoh: <em>Makan mie 20k cash</em><br />
            • Contoh: <em>Gaji freelance 2jt bca</em><br />
            • Contoh: <em>Pindah 50k bca ke gopay</em>`;
        }
        if (notesInputLabel) {
            notesInputLabel.style.color = "var(--text-muted)";
            notesInputLabel.innerText = "Tulis Catatan Harian Lo di Sini, Cuy:";
        }
        if (btnSaveNotes) {
            btnSaveNotes.style.background = "linear-gradient(135deg, #1f252e, #f39c12)";
            btnSaveNotes.innerHTML = '<i class="fa-solid fa-circle-plus"></i> Simpan & Sinkronkan Catatan ⚡';
        }
        if (notesHistoryLabel) {
            notesHistoryLabel.style.color = "#ffffff";
            notesHistoryLabel.innerText = "Riwayat Catatan Harian 📝";
        }
    }

    // Perbarui class active tombol
    document.querySelectorAll('.profile-switch-btn').forEach(btn => btn.classList.remove('active'));
    if (profil === 'pribadi') {
        document.getElementById('profile-btn-pribadi').classList.add('active');
    } else {
        const btnSim = document.getElementById('profile-btn-simulasi');
        if (btnSim) btnSim.classList.add('active');
    }

    // Muat data profil baru & tampilkan
    muatDataLokalLego();
    tampilkanData();
    if (typeof ubahTemaWarna === 'function') ubahTemaWarna();

    panggilCustomModal('Profil Diganti! 👥', `Berhasil beralih ke profil <strong>${profil === 'pribadi' ? 'Pribadi 🏠' : 'Simulasi 🧮'}</strong>.`, null, 'success');
}

function muatDataLokalLego() {
    const dataLokal = localStorage.getItem(dapatkanKunciProfil('transaksiKeuangan'));
    daftarTransaksi = dataLokal ? JSON.parse(dataLokal) : [];
    const dataWishlistLokal = localStorage.getItem(dapatkanKunciProfil('wishlistBarangAnakMuda'));
    daftarWishlist = dataWishlistLokal ? JSON.parse(dataWishlistLokal) : [];
    const dataTagihanLokal = localStorage.getItem(dapatkanKunciProfil('way_finance_tagihan_reminders'));
    daftarTagihan = dataTagihanLokal ? JSON.parse(dataTagihanLokal) : [];
    const dataPiutangLokal = localStorage.getItem(dapatkanKunciProfil('way_finance_debts'));
    daftarPiutang = dataPiutangLokal ? JSON.parse(dataPiutangLokal) : [];
    const dataCatatanLokal = localStorage.getItem(dapatkanKunciProfil('way_finance_notes'));
    daftarCatatan = dataCatatanLokal ? JSON.parse(dataCatatanLokal) : [];

    // Muat limit budget per profil
    const dataLimitLokal = localStorage.getItem(dapatkanKunciProfil('way_finance_budget_limits'));
    petaLimitBudget = dataLimitLokal ? JSON.parse(dataLimitLokal) : {
        makanan: 0,
        transportasi: 0,
        hiburan: 0,
        tagihan: 0,
        belanja: 0,
        kustom: 0
    };
}

function simpanDataKeLokal() {
    localStorage.setItem(dapatkanKunciProfil('transaksiKeuangan'), JSON.stringify(daftarTransaksi));
    localStorage.setItem(dapatkanKunciProfil('wishlistBarangAnakMuda'), JSON.stringify(daftarWishlist));
    localStorage.setItem(dapatkanKunciProfil('way_finance_tagihan_reminders'), JSON.stringify(daftarTagihan));
    localStorage.setItem(dapatkanKunciProfil('way_finance_debts'), JSON.stringify(daftarPiutang));
    localStorage.setItem(dapatkanKunciProfil('way_finance_notes'), JSON.stringify(daftarCatatan));
    localStorage.setItem(dapatkanKunciProfil('way_finance_budget_limits'), JSON.stringify(petaLimitBudget));
}

function eksekusiBackupJSON() {
    const dataPaket = { aplikasi: "WAYFinance_Backup", waktuEkspor: new Date().toISOString(), transaksi: daftarTransaksi, wishlist: daftarWishlist, tagihan: daftarTagihan, piutang: daftarPiutang, catatan: daftarCatatan };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataPaket));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `WAYFinance_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function eksekusiRestoreJSON(inputElemen) {
    const file = inputElemen.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const objekData = JSON.parse(e.target.result);
            if (objekData.aplikasi === "WAYFinance_Backup") {
                daftarTransaksi = objekData.transaksi || [];
                daftarWishlist = objekData.wishlist || [];
                daftarTagihan = objekData.tagihan || [];
                daftarPiutang = objekData.piutang || [];
                daftarCatatan = objekData.catatan || [];
                simpanDataKeLokal();
                tampilkanData();
                panggilCustomModal('Restore Berhasil! 🎉', 'Semua data berhasil dikembalikan!', null, 'success');
            } else {
                panggilCustomModal('Format Salah ❌', 'File cadangan tidak valid!', null, 'exclamation');
            }
        } catch (err) {
            panggilCustomModal('Eror File ❌', 'File JSON rusak!', null, 'exclamation');
        }
    };
    reader.readAsText(file);
    inputElemen.value = "";
}

function eksekusiExportCSV() {
    if (daftarTransaksi.length === 0 && daftarWishlist.length === 0 && daftarTagihan.length === 0 && daftarPiutang.length === 0 && daftarCatatan.length === 0) {
        panggilCustomModal('Data Kosong ❌', 'Belum ada data untuk diekspor!', null, 'exclamation');
        return;
    }
    let barisCsv = [];

    // Seksi Transaksi
    barisCsv.push("=== WAYFINANCE TRANSAKSI ===");
    barisCsv.push("ID,Nama Transaksi,Aliran Dana,Asal Saku,Target Saku,Kategori,Nominal,Tanggal");
    daftarTransaksi.forEach(item => {
        barisCsv.push(`"${item.id}","${item.nama.replace(/"/g, '""')}","${item.jenis}","${item.wallet}","${item.walletTujuan || '-'}","${item.kategori}",${item.nominal},"${item.tanggalCetak}"`);
    });
    barisCsv.push("");

    // Seksi Wishlist (Financial Goals)
    barisCsv.push("=== WAYFINANCE WISHLIST ===");
    barisCsv.push("ID,Nama Barang,Harga Target,Terkumpul");
    daftarWishlist.forEach(item => {
        barisCsv.push(`"${item.id}","${item.nama.replace(/"/g, '""')}",${item.hargaTarget},${item.terkumpul}`);
    });
    barisCsv.push("");

    // Seksi Tagihan (Kalender Pengingat)
    barisCsv.push("=== WAYFINANCE TAGIHAN ===");
    barisCsv.push("ID,Nama Tagihan,Nominal,Tanggal Jatuh Tempo");
    daftarTagihan.forEach(item => {
        barisCsv.push(`"${item.id}","${item.nama.replace(/"/g, '""')}",${item.nominal},"${item.tanggal}"`);
    });
    barisCsv.push("");

    // Seksi Piutang (Buku Hitam)
    barisCsv.push("=== WAYFINANCE PIUTANG ===");
    barisCsv.push("ID,Nama Teman,Nominal,Catatan");
    daftarPiutang.forEach(item => {
        barisCsv.push(`"${item.id}","${item.nama.replace(/"/g, '""')}",${item.nominal},"${item.catatan.replace(/"/g, '""')}"`);
    });
    barisCsv.push("");

    // Seksi Catatan Harian
    barisCsv.push("=== WAYFINANCE CATATAN ===");
    barisCsv.push("ID,Isi Catatan,Tanggal");
    daftarCatatan.forEach(item => {
        barisCsv.push(`"${item.id}","${item.teks.replace(/"/g, '""')}","${item.tanggal}"`);
    });

    const kontenCsv = "\uFEFF" + barisCsv.join("\n");
    const blobData = new Blob([kontenCsv], { type: 'text/csv;charset=utf-8;' });
    const linkDownload = document.createElement("a");
    const urlBlob = URL.createObjectURL(blobData);
    linkDownload.setAttribute("href", urlBlob);
    linkDownload.setAttribute("download", `WAYFinance_Backup_${new Date().toISOString().split('T')[0]}.csv`);
    linkDownload.style.visibility = 'hidden';
    document.body.appendChild(linkDownload);
    linkDownload.click();
    document.body.removeChild(linkDownload);
}

function html_escape_tag(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function panggilCustomModal(judul, pesan, callbackAksi, tipeIcon = "exclamation") {
    const modalOverlay = document.getElementById('custom-confirm-modal');
    const iconElemen = document.querySelector('#custom-confirm-modal i');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const fieldArea = document.getElementById('modal-custom-field-area');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');

    if (!modalOverlay || !iconElemen || !confirmBtn || !cancelBtn || !fieldArea || !modalTitle || !modalMessage) {
        return;
    }

    modalTitle.innerText = judul;
    document.getElementById('modal-message').innerText = pesan;
    fieldArea.innerHTML = '';
    
    // Set standard displays
    confirmBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";
    cancelBtn.innerText = "Batal";
    confirmBtn.innerText = "Iya, Eksekusi";
    confirmBtn.className = "modal-btn modal-btn-confirm";

    if (tipeIcon === "exclamation") {
        iconElemen.className = "fa-solid fa-circle-exclamation";
        iconElemen.style.color = "#ff4d4d";
    } else if (tipeIcon === "premium") {
        iconElemen.className = "fa-solid fa-gem";
        iconElemen.style.color = "#ffb300";
        confirmBtn.innerText = "Beli Premium (WhatsApp)";
        confirmBtn.className = "modal-btn modal-btn-premium";
    } else if (tipeIcon === "developer_login") {
        iconElemen.className = "fa-solid fa-key";
        iconElemen.style.color = "#00e676";
        fieldArea.innerHTML = `
            <div style="margin-top: 15px;">
                <input type="text" id="input-kode-premium-field" class="modal-code-input" style="margin-bottom: 5px; margin-top: 0;" placeholder="Ketik Kunci Lisensi Di Sini...">
                <button id="modal-inline-validate-btn" class="modal-btn modal-btn-dev-auth" style="width: 100%; margin-bottom: 10px;" onclick="window.validasiKodePremiumLangsung()">Validasi Kunci 🔓</button>
            </div>
        `;
        confirmBtn.style.display = "none";
    } else if (tipeIcon === "success") {
        iconElemen.className = "fa-solid fa-circle-check";
        iconElemen.style.color = "#2ecc71";
        confirmBtn.innerText = "Oke Siap";
        confirmBtn.className = "modal-btn modal-btn-success";
        cancelBtn.style.display = "none";
    } else if (tipeIcon === "welcome_selection") {
        iconElemen.className = "fa-solid fa-hand-holding-dollar";
        iconElemen.style.color = "#ffb300";
        confirmBtn.style.display = "none";
        cancelBtn.style.display = "none";
        fieldArea.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px; text-align: left;">
                <button class="modal-btn" style="background: var(--primary-gradient); color: white; padding: 14px; text-align: left; display: flex; align-items: center; gap: 12px; border-radius: 14px; border: none; width: 100%; cursor: pointer;" onclick="window.setModeInput('manual'); window.tutupCustomModal();">
                    <i class="fa-solid fa-keyboard" style="font-size: 1.5rem;"></i>
                    <div>
                        <strong style="display: block; font-size: 0.9rem; color: #fff;">Mode Manual (Form Lengkap) 📝</strong>
                        <span style="font-size: 0.72rem; color: #cbd5e1; font-weight: normal;">Isi data secara lengkap dan terstruktur via formulir</span>
                    </div>
                </button>
                <button class="modal-btn" style="background: linear-gradient(135deg, #28303d, #ffb300); color: white; padding: 14px; text-align: left; display: flex; align-items: center; gap: 12px; border-radius: 14px; border: none; width: 100%; cursor: pointer;" onclick="window.setModeInput('simpel'); window.tutupCustomModal();">
                    <i class="fa-solid fa-pen-nib" style="font-size: 1.5rem;"></i>
                    <div>
                        <strong style="display: block; font-size: 0.9rem; color: #fff;">Mode Simpel (Tulis Catatan) ✍️</strong>
                        <span style="font-size: 0.72rem; color: #cbd5e1; font-weight: normal;">Tinggal tulis kalimat bebas, transaksi terdeteksi otomatis!</span>
                    </div>
                </button>
            </div>
        `;
    } else {
        iconElemen.className = "fa-solid fa-circle-exclamation";
        iconElemen.style.color = "#ff4d4d";
        confirmBtn.innerText = "Iya, Eksekusi";
        confirmBtn.className = "modal-btn modal-btn-confirm";
    }

    modalOverlay.classList.add('active');
    fungsiAksiModal = callbackAksi;

    confirmBtn.onclick = function () {
        if (fungsiAksiModal) fungsiAksiModal();
        tutupCustomModal();
    };
}

function tutupCustomModal() {
    const modalOverlay = document.getElementById('custom-confirm-modal');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
    }
    fungsiAksiModal = null;
}

function lompatSectionHP(idTarget, idTombol) {
    const elemen = document.getElementById(idTarget);
    if (elemen) {
        if (elemen.classList.contains('collapsible-section') && !elemen.classList.contains('active')) {
            elemen.classList.add('active');
        }
        elemen.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.querySelectorAll('.float-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(idTombol).classList.add('active');
    }
}

function deteksiScrollSectionHP() {
    const scrollPos = window.scrollY + 100;
    const historiTop = document.getElementById('panel-histori').offsetTop;
    const goalsTop = document.getElementById('panel-goals').offsetTop;
    document.querySelectorAll('.float-btn').forEach(btn => btn.classList.remove('active'));
    if (scrollPos >= goalsTop) { document.getElementById('f-btn-goals').classList.add('active'); }
    else if (scrollPos >= historiTop) { document.getElementById('f-btn-histori').classList.add('active'); }
    else { document.getElementById('f-btn-input').classList.add('active'); }
}

function formatInputRupiah(elemen) {
    let val = elemen.value;
    if (/[\+\-\*\/]/.test(val)) {
        return; 
    }
    let nilaiBersih = val.replace(/[^,\d]/g, '').toString();
    let sisa = nilaiBersih.length % 3;
    let rupiah = nilaiBersih.substr(0, sisa);
    let ribuan = nilaiBersih.substr(sisa).match(/\d{3}/gi);
    if (ribuan) { let separator = sisa ? '.' : ''; rupiah += separator + ribuan.join('.'); }
    elemen.value = rupiah;
}

function evaluasiKalkulatorNominal(elemen) {
    let val = elemen.value.trim();
    if (/[\+\-\*\/]/.test(val)) {
        try {
            let ekspresiBersih = val
                .replace(/\./g, '')
                .replace(/,/g, '.');

            if (/^[0-9\+\-\*\/\(\)\. ]+$/.test(ekspresiBersih)) {
                let hasil = new Function(`return (${ekspresiBersih})`)();
                if (typeof hasil === 'number' && !isNaN(hasil) && isFinite(hasil)) {
                    hasil = Math.round(hasil);
                    elemen.value = hasil.toLocaleString('id-ID').replace(/,/g, '.');
                }
            }
        } catch (e) {
            // Keep original val on error
        }
    }
}

function formatNumbersInText(text) {
    const dateRegex = /\b(\d{1,2}\.\d{1,2}\.\d{4}|\d{4}\.\d{1,2}\.\d{1,2})\b/g;
    let tempText = text.replace(dateRegex, (dateMatch) => {
        return dateMatch.replace(/\./g, '___DOT___');
    });

    tempText = tempText.replace(/(\d)\.(\d)/g, '$1$2');

    tempText = tempText.replace(/\b([1-9]\d{3,})\b/g, (match, offset, fullText) => {
        const prevChar = fullText[offset - 1];
        const nextChar = fullText[offset + match.length];

        if (prevChar === '-' || prevChar === '/' || prevChar === ':' ||
            nextChar === '-' || nextChar === '/' || nextChar === ':') {
            return match;
        }

        return match.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    });

    return tempText.replace(/___DOT___/g, '.');
}

function formatNotesInput(element) {
    const originalValue = element.value;
    const cursor = element.selectionStart;

    const formattedValue = formatNumbersInText(originalValue);

    if (originalValue === formattedValue) return;

    let nonDotCount = 0;
    for (let i = 0; i < cursor; i++) {
        if (originalValue[i] !== '.') {
            nonDotCount++;
        }
    }

    element.value = formattedValue;

    let newCursor = 0;
    let currentNonDotCount = 0;
    while (newCursor < formattedValue.length && currentNonDotCount < nonDotCount) {
        if (formattedValue[newCursor] !== '.') {
            currentNonDotCount++;
        }
        newCursor++;
    }

    element.setSelectionRange(newCursor, newCursor);
}

function cekKategoriKustom() {
    const kat = document.getElementById('kategori-transaksi').value;
    document.getElementById('kustom-kategori-group').style.display = (kat === "kustom") ? "block" : "none";
}

function perbaruiOpsiKategori() {
    const jenis = document.getElementById('jenis-transaksi').value;
    const kategoriSelect = document.getElementById('kategori-transaksi');
    const groupKategori = document.getElementById('group-kategori-sekte');

    if (jenis === "transfer") {
        groupKategori.style.display = "none";
        document.getElementById('kustom-kategori-group').style.display = "none";
        return;
    }

    groupKategori.style.display = "block";
    if (jenis === "pemasukan") {
        kategoriSelect.innerHTML = `<option value="gaji">Gaji Hasil Nguli</option><option value="investasi">Pos Investasi Seksi</option><option value="kustom">Bebas Isi Sendiri (Kustom)...</option>`;
    } else {
        kategoriSelect.innerHTML = `<option value="makanan">Lambung Sejahtera (Makanan)</option><option value="transportasi">Jalan-Jalan Mulu (Bensin/Ojek)</option><option value="hiburan">Senang Sesaat (Hobi/Game)</option><option value="tagihan">Beban Rutin (Kost/Wifi)</option><option value="belanja">Lapar Mata (Self Reward Berkedok)</option><option value="kustom">Bebas Isi Sendiri (Kustom)...</option>`;
    }
    cekKategoriKustom();
    if (typeof updateCustomSelectOptions === 'function') {
        updateCustomSelectOptions('kategori-transaksi');
    }
}

function ubahTemaWarna() {
    if (idTransaksiDiedit !== null) return;
    const jenisInput = document.getElementById('jenis-transaksi').value;
    const tombolAksi = document.getElementById('btn-aksi');
    const groupTujuan = document.getElementById('group-wallet-tujuan');
    const bodyEl = document.body;

    perbaruiOpsiKategori();

    if (bodyEl) {
        bodyEl.classList.remove('tema-pemasukan', 'tema-pengeluaran', 'tema-transfer', 'tema-edit');
    }

    if (jenisInput === "transfer") {
        if (bodyEl) bodyEl.classList.add('tema-transfer');
        document.getElementById('label-nama-transaksi').innerText = "Catatan Mutasi / Keterangan Transfer:";
        document.getElementById('label-wallet-pilihan').innerText = "Kirim Uang Dari Saku Mana?";
        groupTujuan.style.display = "block";
        tombolAksi.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Luncurkan Pindah Saldo 🚀';
        tombolAksi.className = "btn-hitung btn-transfer-mode";
    } else if (jenisInput === "pengeluaran") {
        if (bodyEl) bodyEl.classList.add('tema-pengeluaran');
        document.getElementById('label-nama-transaksi').innerText = "Beli apaan lagi lo?";
        document.getElementById('label-wallet-pilihan').innerText = "Duit Keluar Dari Mana?";
        groupTujuan.style.display = "none";
        tombolAksi.innerHTML = '<i class="fa-solid fa-minus-circle"></i> Ikhlaskan Duit Ini 💸';
        tombolAksi.className = "btn-hitung btn-pengeluaran";
    } else {
        if (bodyEl) bodyEl.classList.add('tema-pemasukan');
        document.getElementById('label-nama-transaksi').innerText = "Dapet rezeki dari mana lo?";
        document.getElementById('label-wallet-pilihan').innerText = "Masuk Duit Via Apa, Cuy?";
        groupTujuan.style.display = "none";
        tombolAksi.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Asik Tambah Kekayaan 🤑';
        tombolAksi.className = "btn-hitung btn-pemasukan";
    }
    
    // Maintain the visually selected premium theme background overrides
    gantiTemaVisual(themeAktif, false);

    if (typeof syncSemuaCustomSelect === 'function') {
        syncSemuaCustomSelect();
    }
}

function tambahTransaksi() {
    const namaInput = document.getElementById('nama-transaksi').value;
    const jenisInput = document.getElementById('jenis-transaksi').value;
    const walletInput = document.getElementById('wallet-pilihan').value;
    const walletTujuanInput = document.getElementById('wallet-tujuan').value;
    let kategoriInput = document.getElementById('kategori-transaksi').value;
    const nominalInput = document.getElementById('nominal').value;
    const tanggalInput = document.getElementById('tanggal-transaksi').value;

    if (jenisInput === "transfer") {
        kategoriInput = "transfer";
        if (walletInput === walletTujuanInput) {
            panggilCustomModal('Gagal Mutasi ❌', 'Asal dan tujuan saku gak boleh sama, kocak! 🤣', null, 'exclamation');
            return;
        }
    } else {
        if (kategoriInput === "kustom") {
            const teksKustom = document.getElementById('kategori-kustom-input').value;
            kategoriInput = teksKustom && teksKustom.trim() !== "" ? teksKustom.trim() : "Kustom Bebas";
        }
    }

    if (!namaInput || namaInput.trim() === "" || !nominalInput || !tanggalInput) { return; }

    const nominalAngkaMurni = parseFloat(nominalInput.replace(/\./g, ''));
    if (isNaN(nominalAngkaMurni) || nominalAngkaMurni <= 0) { return; }

    const objekWaktu = new Date(tanggalInput);
    const tanggalTeks = objekWaktu.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const kodeBulan = String(objekWaktu.getMonth() + 1).padStart(2, '0');

    if (idTransaksiDiedit !== null) {
        daftarTransaksi = daftarTransaksi.map(item => {
            if (item.id === idTransaksiDiedit) {
                return { ...item, nama: namaInput.trim(), jenis: jenisInput, wallet: walletInput, walletTujuan: (jenisInput === "transfer" ? walletTujuanInput : undefined), kategori: kategoriInput, nominal: nominalAngkaMurni, tanggalCetak: tanggalTeks, bulan: kodeBulan, tanggalMentah: tanggalInput };
            }
            return item;
        });
        idTransaksiDiedit = null;
    } else {
        daftarTransaksi.unshift({ id: +new Date(), nama: namaInput.trim(), jenis: jenisInput, wallet: walletInput, walletTujuan: (jenisInput === "transfer" ? walletTujuanInput : undefined), kategori: kategoriInput, nominal: nominalAngkaMurni, tanggalCetak: tanggalTeks, bulan: kodeBulan, tanggalMentah: tanggalInput });
    }

    simpanDataKeLokal();
    document.getElementById('nama-transaksi').value = "";
    document.getElementById('nominal').value = "";
    document.getElementById('kategori-kustom-input').value = "";
    document.getElementById('smart-paste-box').value = "";
    
    // Hide spell display
    document.getElementById('nominal-spell').style.display = "none";
    
    // Reset date buttons
    setDatePreset('today', 'tanggal-transaksi');

    ubahTemaWarna();
    tampilkanData();
}

function aktifkanModeEdit(idTransaksi) {
    const targetData = daftarTransaksi.find(item => item.id === idTransaksi);
    if (!targetData) return;
    idTransaksiDiedit = idTransaksi;
    if (window.innerWidth <= 820) { lompatSectionHP('panel-input', 'f-btn-input'); }

    const bodyEl = document.body;

    document.getElementById('nama-transaksi').value = targetData.nama;
    document.getElementById('jenis-transaksi').value = targetData.jenis;
    document.getElementById('wallet-pilihan').value = targetData.wallet || "dana";
    if (targetData.jenis === "transfer") {
        document.getElementById('wallet-tujuan').value = targetData.walletTujuan || "mandiri";
    }
    document.getElementById('tanggal-transaksi').value = targetData.tanggalMentah || "";

    perbaruiOpsiKategori();

    if (targetData.jenis !== "transfer") {
        if (document.querySelector("#kategori-transaksi option[value='" + targetData.kategori + "']")) {
            document.getElementById('kategori-transaksi').value = targetData.kategori;
        } else {
            document.getElementById('kategori-transaksi').value = "kustom";
            document.getElementById('kustom-kategori-group').style.display = "block";
            document.getElementById('kategori-kustom-input').value = targetData.kategori;
        }
    }

    const inputNominal = document.getElementById('nominal');
    inputNominal.value = targetData.nominal;
    formatInputRupiah(inputNominal);
    updateRupiahSpell(inputNominal.value, 'nominal-spell');

    if (bodyEl) {
        bodyEl.classList.remove('tema-pemasukan', 'tema-pengeluaran', 'tema-transfer', 'tema-edit');
        bodyEl.classList.add('tema-edit');
    }
    document.getElementById('label-nama-transaksi').innerText = "Plin plan lo! Mau benerin data apaan?";
    document.getElementById('group-wallet-tujuan').style.display = (targetData.jenis === "transfer") ? "block" : "none";
    document.getElementById('btn-aksi').className = "btn-hitung btn-edit-mode";
    document.getElementById('btn-aksi').innerHTML = '<i class="fa-solid fa-wrench"></i> Benerin Dosa Finansial 🛠️';

    // Maintain background layout theme variables
    gantiTemaVisual(themeAktif, false);

    if (typeof syncSemuaCustomSelect === 'function') {
        syncSemuaCustomSelect();
    }
}

function hapusSatuTransaksi(idTransaksi) {
    panggilCustomModal('Hapus Dosa Finansial', 'Mau hapus catatan dosa finansial yang ini aja, Cuy? 🤔', () => {
        daftarTransaksi = daftarTransaksi.filter(item => item.id !== idTransaksi);
        simpanDataKeLokal();
        tampilkanData();
    });
}

function eksekusiResetSemuaData() {
    const judul = profilAktif === 'simulasi' ? 'Reset Rencana Simulasi 🧹' : 'Format Ulang Seluruh Data 🧹';
    const pesan = profilAktif === 'simulasi' 
        ? 'Yakin mau menghapus semua rencana transaksi di Mode Simulasi ini, Cuy? Catatan simulasi lo bakal dikosongkan bersih tanpa mempengaruhi data Pribadi asli! 💥' 
        : 'Yakin banget mau hapus seluruh riwayat & wishlist dari awal, Cuy? Seluruh data utama di memori lokal lo bakal terhapus bersih total! 💥';

    panggilCustomModal(judul, pesan, () => {
        daftarTransaksi = [];
        daftarWishlist = [];
        daftarTagihan = [];
        daftarPiutang = [];
        daftarCatatan = [];
        simpanDataKeLokal();

        if (objekChartGlobal) { objekChartGlobal.destroy(); objekChartGlobal = null; }
        if (objekChartLineGlobal) { objekChartLineGlobal.destroy(); objekChartLineGlobal = null; }

        tampilkanData();
        panggilCustomModal(
            profilAktif === 'simulasi' ? 'Simulasi Direset! 🧹' : 'Sukses Format!', 
            profilAktif === 'simulasi' ? 'Semua rencana transaksi simulasi berhasil dihapus bersih.' : 'Aplikasi WAYFinance lo sekarang bersih total dari nol kembali!', 
            null, 
            'success'
        );
    });
}

function tambahWishlistBaru() {
    const namaInput = document.getElementById('wishlist-nama-input').value;
    const hargaInput = document.getElementById('wishlist-harga-input').value;
    if (!namaInput || namaInput.trim() === "" || !hargaInput) return;
    const hargaAngkaMurni = parseFloat(hargaInput.replace(/\./g, ''));
    if (isNaN(hargaAngkaMurni) || hargaAngkaMurni <= 0) return;

    daftarWishlist.push({ id: +new Date(), nama: namaInput.trim(), hargaTarget: hargaAngkaMurni, terkumpul: 0 });
    document.getElementById('wishlist-nama-input').value = "";
    document.getElementById('wishlist-harga-input').value = "";
    document.getElementById('wishlist-nominal-spell').style.display = "none";
    simpanDataKeLokal();
    tampilkanData();
}

function isiCelenganInline(idWishlist) {
    const inputElemen = document.getElementById('input-budget-' + idWishlist);
    const dompetPilihanElemen = document.getElementById('select-wallet-goals-' + idWishlist);
    const nominalIsi = inputElemen.value;
    if (!nominalIsi || nominalIsi.trim() === "") return;
    const angkaIsi = parseFloat(nominalIsi.replace(/\./g, ''));
    if (isNaN(angkaIsi) || angkaIsi <= 0) return;

    const targetWishlist = daftarWishlist.find(item => item.id === idWishlist);
    if (!targetWishlist) return;

    const sisaKebutuhan = targetWishlist.hargaTarget - targetWishlist.terkumpul;
    const jumlahPotongSaldo = Math.min(angkaIsi, sisaKebutuhan);
    if (jumlahPotongSaldo <= 0) return;

    let walletValue = dompetPilihanElemen.value;

    daftarTransaksi.unshift({
        id: +new Date(),
        nama: `Celengan: ${targetWishlist.nama}`,
        jenis: "pengeluaran",
        wallet: walletValue,
        kategori: "belanja",
        nominal: jumlahPotongSaldo,
        tanggalCetak: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        bulan: String(new Date().getMonth() + 1).padStart(2, '0'),
        tanggalMentah: dapatkanTanggalLokalHariIni()
    });

    daftarWishlist = daftarWishlist.map(item => (item.id === idWishlist) ? { ...item, terkumpul: item.terkumpul + jumlahPotongSaldo } : item);

    simpanDataKeLokal();
    tampilkanData();
}

function hapusWishlist(idWishlist) {
    panggilCustomModal('Membatalkan Wishlist', 'Gajadi pengen beli barang ini, Cuy? 🎯', () => {
        daftarWishlist = daftarWishlist.filter(item => item.id !== idWishlist);
        simpanDataKeLokal();
        tampilkanData();
    });
}

function kalkulasiStatusBacot(saldo) {
    const wadahTeks = document.getElementById('status-bacot');
    if (!wadahTeks) return;
    if (daftarTransaksi.length === 0) { wadahTeks.innerText = "Belum ada duit dicatat nih..."; return; }
    if (idTransaksiDiedit !== null) return;

    let arrayKalimat = [];
    if (saldo > 5000000) {
        arrayKalimat = [
            "Asik orang kaya baru, gaya elit ekonomi elit! 😎",
            "Gaya lo sultan bener, inget besok siklus bayar tagihan! 💸",
            "Wah tabungan tebel, aman lah ya buat gacha tipis-tipis? 🎮"
        ];
    } else if (saldo > 1000000) {
        arrayKalimat = [
            "Aman, tapi jangan sok ngide beli boba tiap hari ya. ☕",
            "Duit segini masih bisa makan enak, tapi batasi nongkrong lo! 🛍️",
            "Cukup buat hidup tegak, awas khilaf belanja online! 🛒"
        ];
    } else if (saldo > 100000) {
        arrayKalimat = [
            "Mode bertahan hidup aktif, tgl tua menangis lirih... 💸",
            "Dompet mulai menipis, mending masak mie instan di kosan. 🍜",
            "Dompet lo mangap tuh, tobat khilaf sebelum terlambat! 🛑"
        ];
    } else if (saldo >= 0) {
        arrayKalimat = [
            "DOMPET LO SEKARAT WOY! Makan promag aja sana! 😭",
            "Sisa uang segini cuma cukup buat bayar parkir seminggu! 🚗",
            "Kritis! Status keuangan lo masuk zona merah bahaya kelaparan! ⚠️"
        ];
    } else {
        arrayKalimat = [
            "MINUS!! Fix gali lubang tutup lubang, beban bumi! 💀💥",
            "Utang di mana-mana, lo pelihara jin apa gimana? 👻",
            "Nangis di pojokan, saldo minus tandanya lo gagal hemat! 📉"
        ];
    }

    const teksAcak = arrayKalimat[Math.floor(Math.random() * arrayKalimat.length)];
    wadahTeks.innerText = teksAcak;
}

function regenerasiLineChartTren(petaDataTren) {
    const chartLineEl = document.getElementById('canvasChartLineTren');
    if (!chartLineEl) return;

    const ctxLine = chartLineEl.getContext('2d');
    if (!ctxLine) return;
    if (objekChartLineGlobal) { objekChartLineGlobal.destroy(); }

    const labelBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const datasetGaris = [];
    let akumulasiSaldoGaris = 0;

    for (let i = 1; i <= 12; i++) {
        const kode = String(i).padStart(2, '0');
        const masuk = petaDataTren.masuk[kode] || 0;
        const keluar = petaDataTren.keluar[kode] || 0;
        akumulasiSaldoGaris += (masuk - keluar);
        datasetGaris.push(akumulasiSaldoGaris);
    }

    // Dynamic theme colors for line chart
    let strokeColor = '#2ecc71';
    let fillColor = 'rgba(46, 204, 113, 0.1)';
    if (themeAktif === 'cyberpunk') {
        strokeColor = '#00f0ff';
        fillColor = 'rgba(0, 240, 255, 0.15)';
    } else if (themeAktif === 'emerald') {
        strokeColor = '#2ecc71';
        fillColor = 'rgba(46, 204, 113, 0.1)';
    } else if (themeAktif === 'royal') {
        strokeColor = '#d4af37';
        fillColor = 'rgba(212, 175, 55, 0.1)';
    } else if (themeAktif === 'dracula') {
        strokeColor = '#bd93f9';
        fillColor = 'rgba(189, 147, 249, 0.15)';
    }

    objekChartLineGlobal = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: labelBulan,
            datasets: [{
                label: 'Sisa Saldo Kumulatif',
                data: datasetGaris,
                borderColor: strokeColor,
                backgroundColor: fillColor,
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#94a3b8', font: { family: 'Poppins', size: 9 } }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8', font: { family: 'Poppins', size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

function regenerasiVisualChart(totalMasuk, totalKeluar, totalTransfer) {
    const chartEl = document.getElementById('canvasChartKeuangan');
    if (!chartEl) return;

    const ctx = chartEl.getContext('2d');
    if (!ctx) return;
    if (objekChartGlobal) { objekChartGlobal.destroy(); }

    let labelData = ['Masuk', 'Keluar', 'Transfer'];
    let barisDataset = [totalMasuk, totalKeluar, totalTransfer];

    // Dynamic theme colors for doughnut chart
    let skemaWarna = ['#2ecc71', '#e74c3c', '#0081b4']; // Default Slate
    if (themeAktif === 'cyberpunk') {
        skemaWarna = ['#39ff14', '#ff007f', '#00f0ff'];
    } else if (themeAktif === 'emerald') {
        skemaWarna = ['#2ecc71', '#e67e22', '#1abc9c'];
    } else if (themeAktif === 'royal') {
        skemaWarna = ['#d4af37', '#c0392b', '#b8860b'];
    } else if (themeAktif === 'dracula') {
        skemaWarna = ['#50fa7b', '#ff5555', '#ffb86c'];
    }

    if (totalMasuk === 0 && totalKeluar === 0 && totalTransfer === 0) {
        labelData = ['Belum Ada Data'];
        barisDataset = [1];
        skemaWarna = ['#3b4758'];
    }

    objekChartGlobal = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labelData,
            datasets: [{
                data: barisDataset,
                backgroundColor: skemaWarna,
                borderWidth: 1,
                borderColor: '#242c39'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#f8fafc', font: { family: 'Poppins', size: 11 } } }
            }
        }
    });
}

function tampilkanData() {
    const listContainer = document.getElementById('list-transaksi');
    const bulanDipilih = document.getElementById('filter-bulan').value;
    const kataKunciSearch = document.getElementById('search-transaksi').value.toLowerCase().trim();

    listContainer.innerHTML = "";

    let saldoCash = 0, saldoDana = 0, saldoOvo = 0, saldoGopay = 0, saldoGlobal = 0;
    let saldoBca = 0, saldoMandiri = 0, saldoBni = 0, saldoBri = 0, saldoLain = 0;
    let pemasukanBulanIni = 0, pengeluaranBulanIni = 0, transferBulanIni = 0;

    const petaDataTren = {
        masuk: { "01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0 },
        keluar: { "01": 0, "02": 0, "03": 0, "04": 0, "05": 0, "06": 0, "07": 0, "08": 0, "09": 0, "10": 0, "11": 0, "12": 0 }
    };

    const reverseData = [...daftarTransaksi].reverse();
    reverseData.forEach(item => {
        const src = item.wallet || "dana";
        const dest = item.walletTujuan;
        const nom = item.nominal;

        if (item.jenis === "pemasukan") {
            saldoGlobal += nom;
            if (src === "cash") saldoCash += nom;
            if (src === "dana") saldoDana += nom;
            if (src === "ovo") saldoOvo += nom;
            if (src === "gopay") saldoGopay += nom;
            if (src === "bca") saldoBca += nom;
            if (src === "mandiri") saldoMandiri += nom;
            if (src === "bni") saldoBni += nom;
            if (src === "bri") saldoBri += nom;
            if (src === "bank_lain") saldoLain += nom;

            if (item.bulan) petaDataTren.masuk[item.bulan] += nom;
        }
        else if (item.jenis === "pengeluaran") {
            saldoGlobal -= nom;
            if (src === "cash") saldoCash -= nom;
            if (src === "dana") saldoDana -= nom;
            if (src === "ovo") saldoOvo -= nom;
            if (src === "gopay") saldoGopay -= nom;
            if (src === "bca") saldoBca -= nom;
            if (src === "mandiri") saldoMandiri -= nom;
            if (src === "bni") saldoBni -= nom;
            if (src === "bri") saldoBri -= nom;
            if (src === "bank_lain") saldoLain -= nom;

            if (item.bulan) petaDataTren.keluar[item.bulan] += nom;
        }
        else if (item.jenis === "transfer") {
            if (src === "cash") saldoCash -= nom;
            if (src === "dana") saldoDana -= nom;
            if (src === "ovo") saldoOvo -= nom;
            if (src === "gopay") saldoGopay -= nom;
            if (src === "bca") saldoBca -= nom;
            if (src === "mandiri") saldoMandiri -= nom;
            if (src === "bni") saldoBni -= nom;
            if (src === "bri") saldoBri -= nom;
            if (src === "bank_lain") saldoLain -= nom;

            if (dest === "cash") saldoCash += nom;
            if (dest === "dana") saldoDana += nom;
            if (dest === "ovo") saldoOvo += nom;
            if (dest === "gopay") saldoGopay += nom;
            if (dest === "bca") saldoBca += nom;
            if (dest === "mandiri") saldoMandiri += nom;
            if (dest === "bni") saldoBni += nom;
            if (dest === "bri") saldoBri += nom;
            if (dest === "bank_lain") saldoLain += nom;
        }
    });

    let totalPengeluaranKategori = {};
    let totalPengeluaranItem = {};
    let totalHariKhilaf = {
        "Senin": { nominal: 0, count: 0 },
        "Selasa": { nominal: 0, count: 0 },
        "Rabu": { nominal: 0, count: 0 },
        "Kamis": { nominal: 0, count: 0 },
        "Jumat": { nominal: 0, count: 0 },
        "Sabtu": { nominal: 0, count: 0 },
        "Minggu": { nominal: 0, count: 0 }
    };
    let pengeluaranTermahal = { nominal: 0, nama: "-", saku: "-" };
    let pengeluaranTerkecil = { nominal: Infinity, nama: "-", saku: "-" };
    let pemasukanTerbesar = { nominal: 0, nama: "-", saku: "-" };

    daftarTransaksi.forEach(item => {
        const cocokBulan = (bulanDipilih === "ALL" || item.bulan === bulanDipilih);
        const cocokSearch = (kataKunciSearch === "" || item.nama.toLowerCase().includes(kataKunciSearch) || item.kategori.toLowerCase().includes(kataKunciSearch));
        const cocokSaku = (!sakuFilterAktif || item.wallet === sakuFilterAktif || (item.jenis === "transfer" && item.walletTujuan === sakuFilterAktif));

        if (cocokBulan && cocokSearch && cocokSaku) {
            let kelasItem = "pemasukan-item";
            let kelasNominal = "nominal-pemasukan";
            let tandaKarakter = "+";

            if (item.jenis === "pemasukan") {
                pemasukanBulanIni += item.nominal;
                if (item.nominal > pemasukanTerbesar.nominal) {
                    pemasukanTerbesar = { nominal: item.nominal, nama: item.nama, saku: item.wallet.toUpperCase() };
                }
            } else if (item.jenis === "pengeluaran") {
                kelasItem = "pengeluaran-item";
                kelasNominal = "nominal-pengeluaran";
                tandaKarakter = "-";
                pengeluaranBulanIni += item.nominal;

                // Akumulasikan stats pengeluaran
                const kat = item.kategori;
                totalPengeluaranKategori[kat] = (totalPengeluaranKategori[kat] || 0) + item.nominal;

                const namaClean = item.nama.trim().toLowerCase();
                if (!totalPengeluaranItem[namaClean]) {
                    totalPengeluaranItem[namaClean] = { nominal: 0, count: 0, namaAsli: item.nama.trim() };
                }
                totalPengeluaranItem[namaClean].nominal += item.nominal;
                totalPengeluaranItem[namaClean].count += 1;

                if (item.nominal > pengeluaranTermahal.nominal) {
                    pengeluaranTermahal = { nominal: item.nominal, nama: item.nama, saku: item.wallet.toUpperCase() };
                }
                if (item.nominal < pengeluaranTerkecil.nominal) {
                    pengeluaranTerkecil = { nominal: item.nominal, nama: item.nama, saku: item.wallet.toUpperCase() };
                }

                // Akumulasikan hari terkelam
                if (item.tanggalMentah) {
                    const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
                    const objekTanggal = new Date(item.tanggalMentah);
                    const hariIndex = objekTanggal.getDay();
                    if (!isNaN(hariIndex)) {
                        const hariNama = namaHari[hariIndex];
                        totalHariKhilaf[hariNama].nominal += item.nominal;
                        totalHariKhilaf[hariNama].count += 1;
                    }
                }
            } else if (item.jenis === "transfer") {
                kelasItem = "transfer-item";
                kelasNominal = "nominal-transfer";
                tandaKarakter = "🔄";
                transferBulanIni += item.nominal;
            }

            let labelSaku = (item.jenis === "transfer")
                ? `${item.wallet.toUpperCase()} ➔ ${item.walletTujuan.toUpperCase()}`
                : item.wallet.toUpperCase();

            listContainer.insertAdjacentHTML('beforeend', `
                <li class="item-transaksi ${kelasItem}">
                    <div class="item-kiri"><div class="icon-bulet"><i class="${kamusIkon[item.kategori] || 'fa-solid fa-wand-magic-sparkles'}"></i></div>
                    <div class="item-detail"><span class="item-nama">${html_escape_tag(item.nama)}</span><span class="item-kategori-tag">${kamusTeksKategori[item.kategori] || '🔮 ' + html_escape_tag(item.kategori)}</span><span class="item-wallet-tag"><i class="fa-solid fa-credit-card"></i> SAKU: ${labelSaku}</span><span class="item-tanggal">${item.tanggalCetak}</span></div></div>
                    <div class="item-kanan"><span class="${kelasNominal}">${tandaKarakter} Rp ${item.nominal.toLocaleString('id-ID')}</span>
                    <div class="item-actions">
                        <button class="btn-aksi-item btn-edit-item" onclick="window.aktifkanModeEdit(${item.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn-aksi-item btn-hapus-item" onclick="window.hapusSatuTransaksi(${item.id})"><i class="fa-regular fa-trash-can"></i></button>
                    </div></div>
                </li>
            `);
        }
    });

    // Warning budget banner logic
    const warningBanner = document.getElementById('budget-warning');
    if (warningBanner) {
        if (statusUserPremium && globalBudgetWarningThreshold > 0 && pengeluaranBulanIni > globalBudgetWarningThreshold) {
            warningBanner.style.display = "flex";
        } else {
            warningBanner.style.display = "none";
        }
    }

    // Hitung dan tampilkan kategori terboros, barang terboros, & transaksi terbesar
    let kategoriTerboros = null;
    let nominalTerboros = 0;
    for (const [katKey, totalNom] of Object.entries(totalPengeluaranKategori)) {
        if (totalNom > nominalTerboros) {
            nominalTerboros = totalNom;
            kategoriTerboros = katKey;
        }
    }

    let itemTerborosStats = { nominal: 0, count: 0, namaAsli: "-" };
    for (const [itemKey, stats] of Object.entries(totalPengeluaranItem)) {
        if (stats.count > itemTerborosStats.count) {
            itemTerborosStats = stats;
        } else if (stats.count === itemTerborosStats.count && stats.nominal > itemTerborosStats.nominal) {
            itemTerborosStats = stats;
        }
    }

    let hariTerkelam = null;
    let hariTerkelamStats = { nominal: 0, count: 0 };
    for (const [hari, stats] of Object.entries(totalHariKhilaf)) {
        if (stats.nominal > hariTerkelamStats.nominal) {
            hariTerkelamStats = stats;
            hariTerkelam = hari;
        }
    }

    const containerTerboros = document.getElementById('info-terboros-container');
    if (containerTerboros) {
        if (kategoriTerboros && nominalTerboros > 0) {
            const namaKategoriIndo = kamusTeksKategori[kategoriTerboros] || ('🔮 ' + kategoriTerboros);
            document.getElementById('kategori-terbanyak-val').innerText = `${namaKategoriIndo} (Total Rp ${nominalTerboros.toLocaleString('id-ID')})`;
            document.getElementById('item-terbanyak-val').innerText = `${itemTerborosStats.namaAsli} (${itemTerborosStats.count}x, Total Rp ${itemTerborosStats.nominal.toLocaleString('id-ID')})`;
            document.getElementById('item-termahal-val').innerText = `${pengeluaranTermahal.nama} (Rp ${pengeluaranTermahal.nominal.toLocaleString('id-ID')} via Saku ${pengeluaranTermahal.saku})`;

            if (hariTerkelam && hariTerkelamStats.nominal > 0) {
                document.getElementById('hari-terkelam-val').innerText = `${hariTerkelam} (Total Ludes Rp ${hariTerkelamStats.nominal.toLocaleString('id-ID')} dalam ${hariTerkelamStats.count}x transaksi)`;
            } else {
                document.getElementById('hari-terkelam-val').innerText = "-";
            }

            // Logika Roasting Dinamis Jenaka
            const barangNama = itemTerborosStats.namaAsli;
            const hariNama = hariTerkelam || "hari tertentu";
            const kalimatRoast = `Nasihat Khilaf: Hari ${hariNama} besok mending lo bertapa aja di kamar, Cuy. Belanjaan lo buat '${barangNama}' udah bikin dompet lo kritis!`;
            document.getElementById('roast-dinamis-val').innerText = kalimatRoast;

            containerTerboros.style.display = "block";
        } else {
            containerTerboros.style.display = "none";
        }
    }

    // Hitung dan tampilkan Prestasi Keuangan (Lawan Khilaf)
    let kategoriTerhemat = null;
    let nominalTerhemat = Infinity;
    for (const [katKey, totalNom] of Object.entries(totalPengeluaranKategori)) {
        if (totalNom > 0 && totalNom < nominalTerhemat) {
            nominalTerhemat = totalNom;
            kategoriTerhemat = katKey;
        }
    }

    let hariTerhemat = null;
    let hariTerhematStats = { nominal: Infinity, count: 0 };
    for (const [hari, stats] of Object.entries(totalHariKhilaf)) {
        if (stats.nominal > 0 && stats.nominal < hariTerhematStats.nominal) {
            hariTerhematStats = stats;
            hariTerhemat = hari;
        }
    }

    const containerPrestasi = document.getElementById('info-prestasi-container');
    if (containerPrestasi) {
        if (pemasukanTerbesar.nominal > 0 || (kategoriTerhemat && nominalTerhemat < Infinity)) {
            if (pemasukanTerbesar.nominal > 0) {
                document.getElementById('income-terbesar-val').innerText = `${pemasukanTerbesar.nama} (Rp ${pemasukanTerbesar.nominal.toLocaleString('id-ID')} ke Saku ${pemasukanTerbesar.saku})`;
            } else {
                document.getElementById('income-terbesar-val').innerText = "-";
            }

            if (kategoriTerhemat && nominalTerhemat < Infinity) {
                const namaKategoriIndo = kamusTeksKategori[kategoriTerhemat] || ('🔮 ' + kategoriTerhemat);
                document.getElementById('kategori-terhemat-val').innerText = `${namaKategoriIndo} (Total Rp ${nominalTerhemat.toLocaleString('id-ID')})`;
            } else {
                document.getElementById('kategori-terhemat-val').innerText = "-";
            }

            if (pengeluaranTerkecil.nominal < Infinity) {
                document.getElementById('item-terkecil-val').innerText = `${pengeluaranTerkecil.nama} (Rp ${pengeluaranTerkecil.nominal.toLocaleString('id-ID')} via Saku ${pengeluaranTerkecil.saku})`;
            } else {
                document.getElementById('item-terkecil-val').innerText = "-";
            }

            if (hariTerhemat && hariTerhematStats.nominal < Infinity) {
                document.getElementById('hari-terhemat-val').innerText = `${hariTerhemat} (Total Ludes Rp ${hariTerhematStats.nominal.toLocaleString('id-ID')} dalam ${hariTerhematStats.count}x transaksi)`;
            } else {
                document.getElementById('hari-terhemat-val').innerText = "-";
            }

            // Rasio Menabung (Savings Rate)
            let savingsRateText = "-";
            if (pemasukanBulanIni > 0) {
                let rate = Math.round(((pemasukanBulanIni - pengeluaranBulanIni) / pemasukanBulanIni) * 100);
                if (rate >= 0) {
                    savingsRateText = `${rate}% (Mantap! Lo berhasil ngamanin sebagian hasil nguli bulan ini! 💰)`;
                } else {
                    savingsRateText = `Defisit ${rate}% (Bahaya! Lebih gede pasak daripada tiang, Cuy! 🚨)`;
                }
            } else if (pengeluaranBulanIni > 0) {
                savingsRateText = "Defisit -100% (Gak ada pemasukan tapi belanja mulu lo! 🚨)";
            }
            document.getElementById('savings-rate-val').innerText = savingsRateText;

            containerPrestasi.style.display = "block";
        } else {
            containerPrestasi.style.display = "none";
        }
    }

    let totalSaldoBank = saldoBca + saldoMandiri + saldoBni + saldoBri + saldoLain;
    const randerSaldo = (nominal) => (statusUserPremium && sembunyikanSaldoMode) ? "🙈 *******" : 'Rp ' + nominal.toLocaleString('id-ID');
    
    const eyeIcon = document.getElementById('eye-icon');
    if (eyeIcon) {
        eyeIcon.className = (statusUserPremium && sembunyikanSaldoMode) ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
    }

    // Render Premium Glassmorphism Saku Cards Carousel
    const containerSaku = document.getElementById('saku-cards-container');
    if (containerSaku) {
        containerSaku.innerHTML = "";

        const dataSaku = [
            { nama: "Uang Cash", kode: "cash", saldo: saldoCash, visualNo: "8888 7777 6666 0001" },
            { nama: "DANA", kode: "dana", saldo: saldoDana, visualNo: "8888 7777 6666 0002" },
            { nama: "OVO", kode: "ovo", saldo: saldoOvo, visualNo: "8888 7777 6666 0003" },
            { nama: "GoPay", kode: "gopay", saldo: saldoGopay, visualNo: "8888 7777 6666 0004" },
            { nama: "Bank BCA", kode: "bca", saldo: saldoBca, visualNo: "1234 5678 9012 3456" },
            { nama: "Bank Mandiri", kode: "mandiri", saldo: saldoMandiri, visualNo: "9876 5432 1098 7654" },
            { nama: "Bank BNI", kode: "bni", saldo: saldoBni, visualNo: "5555 4444 3333 2222" },
            { nama: "Bank BRI", kode: "bri", saldo: saldoBri, visualNo: "1111 2222 3333 4444" },
            { nama: "Bank Lainnya", kode: "bank_lain", saldo: saldoLain, visualNo: "0000 9999 8888 7777" }
        ];

        dataSaku.forEach(saku => {
            const isDimmed = sakuFilterAktif && sakuFilterAktif !== saku.kode;
            const isActive = sakuFilterAktif === saku.kode;
            const classCard = `wallet-card-premium saku-${saku.kode} ${isActive ? 'card-active' : ''} ${isDimmed ? 'card-dimmed' : ''}`;
            const formattedSaldo = randerSaldo(saku.saldo);

            containerSaku.insertAdjacentHTML('beforeend', `
                <div class="${classCard}" onclick="window.toggleFilterSaku('${saku.kode}')">
                    <div class="card-header-row">
                        <span class="card-bank-name">${saku.nama}</span>
                        <i class="fa-solid fa-microchip card-chip"></i>
                    </div>
                    <div class="card-body-row">
                        <div class="card-balance-label">Saku Balance</div>
                        <div class="card-balance-value">${formattedSaldo}</div>
                    </div>
                    <div class="card-footer-row">
                        <div class="card-number">•••• •••• •••• ${saku.visualNo.slice(-4)}</div>
                        <i class="fa-solid fa-wifi card-contactless"></i>
                    </div>
                </div>
            `);
        });

        initCardTiltEffects();
    }

    document.getElementById('total-saldo').innerText = randerSaldo(saldoGlobal);
    document.getElementById('bulan-masuk').innerText = 'Rp ' + pemasukanBulanIni.toLocaleString('id-ID');
    document.getElementById('bulan-keluar').innerText = 'Rp ' + pengeluaranBulanIni.toLocaleString('id-ID');
    document.getElementById('bulan-transfer').innerText = 'Rp ' + transferBulanIni.toLocaleString('id-ID');

    kalkulasiStatusBacot(saldoGlobal);
    renderBillVisual();
    renderWishlistVisual();
    kalkulasiRoastDanSurvival(saldoGlobal, pemasukanBulanIni, pengeluaranBulanIni);
    renderDebtVisual();
    renderNotesVisual();
    regenerasiVisualChart(pemasukanBulanIni, pengeluaranBulanIni, transferBulanIni);
    regenerasiLineChartTren(petaDataTren);
    renderBudgetLimits(totalPengeluaranKategori);

    const panelDailyExpenses = document.getElementById('panel-daily-expenses');
    const hariIniBox = document.getElementById('hari-ini-box');
    if (profilAktif === 'pribadi') {
        if (panelDailyExpenses) panelDailyExpenses.style.display = 'block';
        if (hariIniBox) hariIniBox.style.display = 'inline-flex';
        renderDailyExpenses();
    } else {
        if (panelDailyExpenses) panelDailyExpenses.style.display = 'none';
        if (hariIniBox) hariIniBox.style.display = 'none';
    }
}

function renderBillVisual() {
    const container = document.getElementById('bill-container');
    container.innerHTML = daftarTagihan.length === 0 ? `<small style="color: var(--text-muted); text-align: center; font-style: italic; display: block; padding: 10px;">Bersih, belum ada tagihan rutin terpasang...</small>` : "";
    daftarTagihan.forEach(item => {
        container.insertAdjacentHTML('beforeend', `
            <div class="bill-card">
                <div class="bill-info">
                    <h5>📌 ${html_escape_tag(item.nama)}</h5>
                    <p>Nominal: Rp ${item.nominal.toLocaleString('id-ID')} | Jatuh Tempo: ${item.tanggal}</p>
                </div>
                <div class="bill-actions">
                    <select id="select-wallet-bill-${item.id}" style="padding: 6px; border-radius: 8px; background: #1a202c; color: white; border: 1px solid #3b4758; font-size: 0.75rem; outline:none;"><option value="cash">CASH</option><option value="dana">DANA</option><option value="ovo">OVO</option><option value="gopay">GOPAY</option><option value="bca">BCA</option></select>
                    <button class="btn-celengan-mini" onclick="window.bayarTagihanOtomatis(${item.id}, document.getElementById('select-wallet-bill-${item.id}').value)">Bayar ✔</button>
                    <button class="btn-hapus-wishlist" onclick="window.hapusTagihan(${item.id})"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
        `);
    });
}

function renderWishlistVisual() {
    const container = document.getElementById('wishlist-container');
    container.innerHTML = daftarWishlist.length === 0 ? `<small style="color: var(--text-muted); text-align: center; font-style: italic; display: block; padding: 10px;">Belum ada target barang impian nih, Cuy...</small>` : "";
    daftarWishlist.forEach(item => {
        let persen = Math.min(Math.round((item.terkumpul / item.hargaTarget) * 100), 100) || 0;
        let teksStatus = persen === 100 ? "WAKWAK LU LULUS! BURUAN BELI SEKARANG JUGA! 🤘💥" : `Kurang Rp ${(item.hargaTarget - item.terkumpul).toLocaleString('id-ID')} lagi, Cuy.`;
        container.insertAdjacentHTML('beforeend', `
            <div class="wishlist-card">
                <div class="wishlist-meta"><span>🎯 ${html_escape_tag(item.nama)}</span><span>Rp ${item.terkumpul.toLocaleString('id-ID')} / Rp ${item.hargaTarget.toLocaleString('id-ID')}</span></div>
                <div class="wishlist-bar-bg"><div class="wishlist-bar-fill" style="width: ${persen}%"></div></div>
                <div class="wishlist-footer-actions"><span class="wishlist-status-teks">${teksStatus} (${persen}%)</span>
                <div class="wishlist-inline-form" style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; width:100%;">
                    <select id="select-wallet-goals-${item.id}" style="padding: 6px; border-radius: 8px; background: #1a202c; color: white; border: 1px solid #3b4758; font-size: 0.75rem; flex: 1; min-width: 75px; outline:none;"><option value="cash">CASH</option><option value="dana">DANA</option><option value="ovo">OVO</option><option value="gopay">GOPAY</option><option value="bca">BCA</option><option value="mandiri">MANDIRI</option><option value="bni">BNI</option><option value="bri">BRI</option></select>
                    <input type="text" id="input-budget-${item.id}" placeholder="Isi Rp..." onkeyup="window.formatInputRupiah(this)" style="padding: 6px; border-radius: 8px; background: #1a202c; color: white; border: 1px solid #3b4758; font-size: 0.75rem; flex: 1; min-width: 75px; outline:none;">
                    <button class="btn-celengan-mini" onclick="window.isiCelenganInline(${item.id})">Gas 💰</button><button class="btn-hapus-wishlist" onclick="window.hapusWishlist(${item.id})"><i class="fa-solid fa-xmark"></i></button>
                </div></div>
            </div>
        `);
    });
}

function renderDebtVisual() {
    const container = document.getElementById('debt-container');
    container.innerHTML = daftarPiutang.length === 0 ? `<small style="color: var(--text-muted); text-align: center; font-style: italic; display: block; padding: 10px;">Buku Hitam bersih, gak ada temen yang ngutang... (Aman/Tobat)</small>` : "";
    daftarPiutang.forEach(item => {
        // Calculate due status dynamically (NEW FEATURE)
        let dueHtml = "";
        if (item.tempo) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const due = new Date(item.tempo);
            due.setHours(0,0,0,0);
            const diffTime = due.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                dueHtml = `<span class="debt-due-badge overdue"><i class="fa-solid fa-clock"></i> Telat ${Math.abs(diffDays)} Hari!</span>`;
            } else if (diffDays === 0) {
                dueHtml = `<span class="debt-due-badge overdue"><i class="fa-solid fa-triangle-exclamation"></i> Jatuh Tempo Hari Ini!</span>`;
            } else {
                dueHtml = `<span class="debt-due-badge pending"><i class="fa-regular fa-clock"></i> Sisa ${diffDays} Hari</span>`;
            }
        }

        container.insertAdjacentHTML('beforeend', `
            <div class="debt-card">
                <div class="debt-info">
                    <h5>💀 ${html_escape_tag(item.nama)}</h5>
                    <p>Nominal: <strong>Rp ${item.nominal.toLocaleString('id-ID')}</strong></p>
                    <p style="font-size:0.65rem; color:#f39c12; margin-top:2px;">Catatan: "${html_escape_tag(item.catatan)}"</p>
                    ${dueHtml}
                </div>
                <div class="debt-actions">
                    <select id="select-wallet-debt-${item.id}" style="padding: 6px; border-radius: 8px; background: #1a202c; color: white; border: 1px solid #3b4758; font-size: 0.72rem; outline:none; max-width:85px;"><option value="cash">CASH</option><option value="dana">DANA</option><option value="ovo">OVO</option><option value="gopay">GOPAY</option><option value="bca">BCA</option><option value="mandiri">MANDIRI</option></select>
                    <button class="btn-lunas-piutang" onclick="window.tandaiPiutangLunas(${item.id}, document.getElementById('select-wallet-debt-${item.id}').value)">Lunas ✔</button>
                    <button class="btn-wa-tagih" onclick="window.kirimReminderWA(${item.id})"><i class="fa-brands fa-whatsapp"></i> Tagih</button>
                    <button class="btn-hapus-wishlist" onclick="window.hapusPiutang(${item.id})"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
        `);
    });
}

function tambahPiutangBaru() {
    const nama = document.getElementById('debt-nama-input').value;
    const nominal = document.getElementById('debt-nominal-input').value;
    const catatan = document.getElementById('debt-catatan-input').value;
    const tempo = document.getElementById('debt-due-input') ? document.getElementById('debt-due-input').value : '';

    if (!nama || nama.trim() === "" || !nominal) return;
    const nominalMurni = parseFloat(nominal.replace(/\./g, ''));
    if (isNaN(nominalMurni) || nominalMurni <= 0) return;

    daftarPiutang.push({
        id: +new Date(),
        nama: nama.trim(),
        nominal: nominalMurni,
        catatan: (catatan && catatan.trim() !== "") ? catatan.trim() : "Jajan Temen",
        tempo: tempo
    });

    document.getElementById('debt-nama-input').value = "";
    document.getElementById('debt-nominal-input').value = "";
    document.getElementById('debt-catatan-input').value = "";
    document.getElementById('debt-nominal-spell').style.display = "none";
    if (document.getElementById('debt-due-input')) {
        document.getElementById('debt-due-input').value = dapatkanTanggalLokalHariIni();
    }

    simpanDataKeLokal();
    tampilkanData();
    panggilCustomModal('Catatan Ditambahkan 💀', `Berhasil memasukkan ${nama.trim()} ke Buku Hitam Piutang!`, null, 'success');
}

function hapusPiutang(idDebt) {
    panggilCustomModal('Hapus Piutang 💀', 'Mau hapus catatan piutang ini secara ikhlas tanpa ditagih? 🤔', () => {
        daftarPiutang = daftarPiutang.filter(d => d.id !== idDebt);
        simpanDataKeLokal();
        tampilkanData();
    });
}

function tandaiPiutangLunas(idDebt, walletValue) {
    const target = daftarPiutang.find(d => d.id === idDebt);
    if (!target) return;

    daftarTransaksi.unshift({
        id: +new Date(),
        nama: `Lunas Utang: ${target.nama}`,
        jenis: "pemasukan",
        wallet: walletValue,
        kategori: "kustom",
        nominal: target.nominal,
        tanggalCetak: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        bulan: String(new Date().getMonth() + 1).padStart(2, '0'),
        tanggalMentah: dapatkanTanggalLokalHariIni()
    });

    daftarPiutang = daftarPiutang.filter(d => d.id !== idDebt);
    simpanDataKeLokal();
    tampilkanData();
    panggilCustomModal('Piutang Lunas! 🎉', `${target.nama} akhirnya sadar diri dan bayar utangnya! Saldo ${walletValue.toUpperCase()} lo bertambah.`, null, 'success');
}

function kirimReminderWA(idDebt) {
    const target = daftarPiutang.find(d => d.id === idDebt);
    if (!target) return;

    const pesan = `Halo ${target.nama}, cuma ngingetin utang lo yang Rp ${target.nominal.toLocaleString('id-ID')} buat "${target.catatan}" belum lunas nih. Udah jatuh tempo cuy, buruan bayar ya sebelum saku gua ikutan sekarat! 💸`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`;
    window.open(url, '_blank');
}

function kalkulasiRoastDanSurvival(saldo, masuk, keluar) {
    const roastContainer = document.getElementById('roast-container');
    if (!roastContainer) return;

    let bubbleClass = "status-aman";
    let teksRoast = "";
    let emojiSurvival = "🍱";
    let tingkatSurvival = "Aman Sentosa";
    let rekomendasiKuliner = "";

    // Roast Analyzer
    if (daftarTransaksi.length === 0) {
        teksRoast = "Masih suci tanpa catatan dosa finansial bulan ini. Keren, pertahankan keheningan saku lo! 🕊️";
        bubbleClass = "status-aman";
    } else if (masuk === 0 && keluar > 0) {
        teksRoast = "WADUH! Gak ada pemasukan sama sekali tapi belanjanya ngegas terus. Lo miara tuyul atau ngepet di mana, Cuy?! 👻💸";
        bubbleClass = "status-kritis";
    } else if (keluar > masuk) {
        teksRoast = "Pengeluaran lebih gede dari pemasukan! Selamat, lo resmi jadi beban masa depan lo sendiri. Tobat woy! 💀🔥";
        bubbleClass = "status-kritis";
    } else if (keluar > masuk * 0.8) {
        teksRoast = "Gaya hidup lo elit tapi tabungan lo pailit! Dikit lagi masuk jurang kemiskinan ekstrem kalau gak rem belanja. 🛒📈";
        bubbleClass = "status-waspada";
    } else if (keluar > masuk * 0.5) {
        teksRoast = "Borosnya standar anak muda jaman sekarang. Setengah duit ludes buat self-reward berkedok gengsi. 🛍️☕";
        bubbleClass = "status-waspada";
    } else {
        teksRoast = "Wah, tumben pinter nyimpen duit! Kerasukan malaikat hemat dari mana lo? Pertahankan, Cuy! 😎💎";
        bubbleClass = "status-aman";
    }

    // Survival Kuliner Level
    if (saldo < 0) {
        emojiSurvival = "💀";
        tingkatSurvival = "Darurat Bencana Kelaparan (Minus!)";
        rekomendasiKuliner = "Sangat Kritis! Disarankan puasa senin-kamis berturut-turut, numpang makan gratis di rumah temen (pura-pura main), atau cari sisa kembalian di kolong meja.";
    } else if (saldo < 100000) {
        emojiSurvival = "🍜";
        tingkatSurvival = "Survival Level Ekstrem";
        rekomendasiKuliner = "Mie instan mentah (biar hemat gas), Promag 3x sehari sebelum lapar melanda, atau nasi putih lauk kuah warteg gratisan campur garam.";
    } else if (saldo < 500000) {
        emojiSurvival = "🍛";
        tingkatSurvival = "Survival Level Sedang";
        rekomendasiKuliner = "Nasi Padang lauk kuah doang + kerupuk kulit, nasi goreng pinggir jalan porsi kuli dibagi dua, atau gorengan Rp 5.000 + es teh anget.";
    } else if (saldo < 2000000) {
        emojiSurvival = "🍗";
        tingkatSurvival = "Aman Terkendali";
        rekomendasiKuliner = "Pecel lele pinggir jalan, sate ayam Madura lewat depan kosan, atau makan warteg mewah pakai lauk ayam + telur + sayur lengkap.";
    } else {
        emojiSurvival = "🥩";
        tingkatSurvival = "Sultan Bebas Khilaf";
        rekomendasiKuliner = "Bebas pilih! Mau All You Can Eat premium, ganti menu Starbucks harian, atau nongkrong cantik di cafe elit. Tapi inget besok bayar kostan, Bos!";
    }

    roastContainer.innerHTML = `
        <div class="roast-card">
            <div class="roast-bubble ${bubbleClass}">
                <i class="fa-solid fa-comment-dots"></i> <strong>Bacot AI Analisis:</strong><br>
                "${teksRoast}"
            </div>
            <div class="survival-box">
                <div class="survival-icon">${emojiSurvival}</div>
                <div class="survival-detail">
                    <h6>Status Survival Uang Hidup</h6>
                    <p>${tingkatSurvival}</p>
                    <p style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal; margin-top: 4px; line-height: 1.4;">
                        <strong>Rekomendasi Menu:</strong> ${rekomendasiKuliner}
                    </p>
                </div>
            </div>
        </div>
    `;
}

function simpanLimitKategori(kat) {
    const inputVal = document.getElementById(`input-limit-${kat}`).value.trim();
    const nominal = parseInt(inputVal.replace(/\./g, '')) || 0;
    petaLimitBudget[kat] = nominal;
    localStorage.setItem(dapatkanKunciProfil('way_finance_budget_limits'), JSON.stringify(petaLimitBudget));
    tampilkanData();
    if (nominal === 0) {
        panggilCustomModal('Limit Dihapus! ⚠️', `Limit untuk kategori ${kamusTeksKategori[kat] || kat} telah dihapus (tidak terbatas).`, null, 'success');
    } else {
        panggilCustomModal('Limit Disimpan! ⚠️', `Limit untuk kategori ${kamusTeksKategori[kat] || kat} telah diatur menjadi Rp ${nominal.toLocaleString('id-ID')}.`, null, 'success');
    }
}

function simpanBatasBudgetGlobal() {
    const inputEl = document.getElementById('global-budget-threshold-input');
    if (!inputEl) return;
    const nominal = parseInt(inputEl.value.replace(/\./g, '')) || 0;
    globalBudgetWarningThreshold = nominal;
    localStorage.setItem(GLOBAL_BUDGET_WARNING_KEY, String(globalBudgetWarningThreshold));
    tampilkanData();

    if (nominal === 0) {
        panggilCustomModal('Peringatan Dimatikan', 'Banner peringatan global kini nonaktif. Anda tidak akan menerima notifikasi batas pengeluaran.', null, 'success');
    } else {
        panggilCustomModal('Batas Peringatan Disimpan', `Banner peringatan global akan muncul setelah pengeluaran bulan ini melewati Rp ${nominal.toLocaleString('id-ID')}.`, null, 'success');
    }
}

function muatBatasBudgetGlobal() {
    const storedThreshold = localStorage.getItem(GLOBAL_BUDGET_WARNING_KEY);
    if (storedThreshold !== null) {
        globalBudgetWarningThreshold = parseInt(storedThreshold, 10) || 0;
    }
    const inputEl = document.getElementById('global-budget-threshold-input');
    if (inputEl) {
        inputEl.value = globalBudgetWarningThreshold > 0 ? globalBudgetWarningThreshold.toLocaleString('id-ID') : '';
    }
}

function renderBudgetLimits(totalSpent = {}) {
    const container = document.getElementById('budget-limit-list-container');
    if (!container) return;

    container.innerHTML = "";

    const kategoriList = ["makanan", "transportasi", "hiburan", "belanja", "tagihan", "kustom"];
    let globalLimit = 0;
    let globalSpent = 0;

    kategoriList.forEach(kat => {
        const namaKat = kamusTeksKategori[kat] || kat;
        const spent = totalSpent[kat] || 0;
        const limit = petaLimitBudget[kat] || 0;

        globalLimit += limit;
        if (limit > 0) {
            globalSpent += spent;
        }

        let persen = 0;
        let statusLabel = "";
        let barColor = "linear-gradient(90deg, #2ecc71, #27ae60)";

        if (limit > 0) {
            persen = Math.round((spent / limit) * 100);
            if (persen >= 100) {
                statusLabel = " ⚠️ JEBOL WOY! LIMIT LEWAT!";
                barColor = "linear-gradient(90deg, #e74c3c, #c0392b)";
            } else if (persen >= 80) {
                statusLabel = " ⚠️ Siaga! Dikit lagi habis!";
                barColor = "linear-gradient(90deg, #f39c12, #d35400)";
            }
        }

        const limitValDisplay = limit > 0 ? `Rp ${limit.toLocaleString('id-ID')}` : "Tidak Terbatas ♾️";
        const inputVal = limit > 0 ? limit.toLocaleString('id-ID') : "";

        container.insertAdjacentHTML('beforeend', `
            <div class="budget-limit-card" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); padding: 14px 18px; border-radius: 16px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 5px;">
                    <span style="font-size: 0.85rem; font-weight: 600; color: #fff;"><i class="${kamusIkon[kat] || 'fa-solid fa-folder'}"></i> ${namaKat}</span>
                    <span style="font-size: 0.78rem; color: ${persen >= 100 ? '#e74c3c' : 'var(--text-muted)'}; font-weight: 500;">
                        Limit: <strong>${limitValDisplay}</strong>${statusLabel}
                    </span>
                </div>
                <div style="display: flex; gap: 8px; width: 100%; align-items: center;">
                    <input type="text" id="input-limit-${kat}" placeholder="Set Limit Rp..." value="${inputVal}" onkeyup="window.formatInputRupiah(this)" style="padding: 8px 12px; border-radius: 10px; font-size: 0.8rem; background: var(--dark-card) !important; border: 1px solid rgba(255,255,255,0.08); color: white !important; flex: 1; outline:none; box-sizing: border-box;">
                    <button onclick="window.simpanLimitKategori('${kat}')" style="background: var(--bg-transfer); border:none; color:white; padding: 8px 14px; border-radius: 10px; font-size: 0.78rem; cursor:pointer; font-weight:600; transition: all 0.2s; white-space: nowrap; flex-shrink: 0;">Pasang ✔</button>
                </div>
                <!-- Progress bar -->
                <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; margin-top: 4px;">
                    <div style="width: ${Math.min(persen, 100)}%; height: 100%; background: ${barColor}; border-radius: 4px; transition: width 0.3s;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); font-weight:500;">
                    <span>Terpakai: Rp ${spent.toLocaleString('id-ID')}</span>
                    <span>${limit > 0 ? persen + '%' : '-'}</span>
                </div>
            </div>
        `);
    });

    // Update global budget summary card
    const globalCard = document.getElementById('global-budget-summary');
    if (globalCard) {
        if (globalLimit > 0) {
            document.getElementById('global-limit-val').innerText = `Rp ${globalLimit.toLocaleString('id-ID')}`;
            document.getElementById('global-spent-val').innerText = `Rp ${globalSpent.toLocaleString('id-ID')}`;

            const globalPercent = Math.round((globalSpent / globalLimit) * 100);
            const remaining = globalLimit - globalSpent;

            document.getElementById('global-budget-bar').style.width = `${Math.min(globalPercent, 100)}%`;

            let globalBarColor = "linear-gradient(90deg, #3498db, #2980b9)";
            if (globalPercent >= 100) {
                globalBarColor = "linear-gradient(90deg, #e74c3c, #c0392b)";
                document.getElementById('global-budget-remaining').innerText = `Sisa Anggaran: Overlimit Rp ${Math.abs(remaining).toLocaleString('id-ID')} 🚨`;
            } else {
                if (globalPercent >= 80) {
                    globalBarColor = "linear-gradient(90deg, #f39c12, #d35400)";
                }
                document.getElementById('global-budget-remaining').innerText = `Sisa Anggaran Aman: Rp ${remaining.toLocaleString('id-ID')}`;
            }
            document.getElementById('global-budget-bar').style.background = globalBarColor;
            document.getElementById('global-budget-percent').innerText = `${globalPercent}%`;
            globalCard.style.display = "block";
        } else {
            globalCard.style.display = "none";
        }
    }
}

// --- DIARY/CATATAN PARSING SYSTEM ---
function parseCatatanKeTransaksi(teksBaris) {
    if (!teksBaris || !teksBaris.trim()) return null;

    const lower = teksBaris.toLowerCase().trim();

    // Regex to detect Rupiah formatting / numbers
    const nominalRegex = /(?:rp\.?\s*)?(\d+(?:[.,]\d{3})*(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta|mio|m)?\b/gi;
    let match;
    let nominal = 0;
    let nominalText = "";

    while ((match = nominalRegex.exec(lower)) !== null) {
        let numStr = match[1].replace(/,/g, '.');
        const parts = numStr.split('.');
        if (parts.length > 2) {
            numStr = numStr.replace(/\./g, '');
        } else if (parts.length === 2) {
            if (parts[1].length === 3) {
                numStr = numStr.replace(/\./g, '');
            }
        }

        let parsedNum = parseFloat(numStr);
        if (isNaN(parsedNum)) continue;

        let multiplier = match[2] ? match[2].toLowerCase() : "";
        if (multiplier === "k" || multiplier === "rb" || multiplier === "ribu") {
            parsedNum *= 1000;
        } else if (multiplier === "jt" || multiplier === "juta") {
            parsedNum *= 1000000;
        }

        let hasRpPrefix = /^\s*rp/i.test(match[0]);
        let hasMultiplier = !!match[2];
        let isLargeNumber = parsedNum >= 100;

        if (parsedNum > 0 && (hasRpPrefix || hasMultiplier || isLargeNumber)) {
            nominal = parsedNum;
            nominalText = match[0];
            break;
        }
    }

    if (nominal <= 0) return null;

    // Detect saku keywords
    let wallet = "cash";
    let walletTujuan = undefined;
    let jenis = "pengeluaran";

    const walletsFound = [];
    const walletKeywords = {
        cash: ["cash", "dompet", "fisik", "tunai", "kantong"],
        dana: ["dana"],
        ovo: ["ovo"],
        gopay: ["gopay", "go-pay", "gojek"],
        bca: ["bca"],
        mandiri: ["mandiri"],
        bni: ["bni"],
        bri: ["bri"],
        bank_lain: ["bank", "atm", "rekening", "lainnya", "lain"]
    };

    Object.keys(walletKeywords).forEach(wKey => {
        walletKeywords[wKey].forEach(kw => {
            let index = lower.indexOf(kw);
            if (index !== -1) {
                walletsFound.push({ key: wKey, index: index });
            }
        });
    });

    walletsFound.sort((a, b) => a.index - b.index);

    // Detect flows
    const isTransfer = lower.includes("transfer") || lower.includes("pindah") || lower.includes("kirim") || lower.includes("mutasi") || lower.includes("ke saku");
    const isPemasukan = lower.includes("masuk") || lower.includes("terima") || lower.includes("gajian") || lower.includes("gaji") || lower.includes("bonus") || lower.includes("dapat") || lower.includes("dapet") || lower.includes("cair") || lower.includes("untung") || lower.includes("+");

    if (isTransfer && walletsFound.length >= 2) {
        jenis = "transfer";
        wallet = walletsFound[0].key;
        walletTujuan = walletsFound[1].key;
    } else if (isPemasukan) {
        jenis = "pemasukan";
        wallet = walletsFound.length > 0 ? walletsFound[0].key : "cash";
    } else {
        jenis = "pengeluaran";
        wallet = walletsFound.length > 0 ? walletsFound[0].key : "cash";
    }

    // Detect Category
    let kategori = "kustom";
    const categoryKeywords = {
        makanan: ["makan", "minum", "kopi", "boba", "starbucks", "resto", "warteg", "kuliner", "jajan", "seblak", "bakso", "nasi", "burger", "pizza", "roti", "cafe"],
        transportasi: ["ojek", "grab", "gojek", "bensin", "pertalite", "pertamax", "gokar", "transport", "busway", "kereta", "tiket", "parkir", "motor", "mobil", "toll", "tol"],
        hiburan: ["game", "gacha", "nonton", "bioskop", "cinema", "netflix", "konser", "spotify", "hobi", "main", "healing", "wisata", "karoke", "steam", "topup"],
        tagihan: ["kost", "kosan", "wifi", "indihome", "listrik", "pln", "token", "air", "pdam", "kontrakan", "tagihan", "rutin", "pulsa", "kuota", "bpjs"],
        belanja: ["belanja", "baju", "sepatu", "skincare", "makeup", "tas", "tokopedia", "shopee", "lazada", "mall", "reward", "shirt", "celana", "jaket"],
        gaji: ["gaji", "nguli", "upah", "gajian", "dividen", "side", "freelance"],
        investasi: ["investasi", "reksadana", "saham", "crypto", "emas", "bibit"]
    };

    Object.keys(categoryKeywords).forEach(catKey => {
        categoryKeywords[catKey].forEach(kw => {
            if (lower.includes(kw)) {
                kategori = catKey;
            }
        });
    });

    if (jenis === "transfer") {
        kategori = "transfer";
    }

    // Clean description text
    let cleanName = teksBaris;
    cleanName = cleanName.replace(new RegExp(nominalText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'), '');

    Object.values(walletKeywords).flat().forEach(kw => {
        cleanName = cleanName.replace(new RegExp('\\b' + kw + '\\b', 'gi'), '');
    });

    const stopWords = ["beli", "bayar", "dapet", "dapat", "terima", "gajian", "masuk", "keluar", "pindah", "kirim", "ke", "dari", "via", "pakai", "pake", "untuk", "buat", "habis", "sebesar", "nominal", "rp", "-", "+", ":"];
    stopWords.forEach(sw => {
        const escapedSw = sw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regexStr = /^[a-zA-Z0-9]+$/.test(sw) ? '\\b' + escapedSw + '\\b' : escapedSw;
        cleanName = cleanName.replace(new RegExp(regexStr, 'gi'), '');
    });

    cleanName = cleanName.replace(/[^a-zA-Z0-9\s]/g, '');
    cleanName = cleanName.replace(/\s+/g, ' ').trim();

    if (cleanName.length > 0) {
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    } else {
        if (jenis === "pemasukan") cleanName = "Pemasukan Catatan";
        else if (jenis === "pengeluaran") cleanName = "Pengeluaran Catatan";
        else cleanName = "Transfer Catatan";
    }

    return {
        nama: cleanName,
        jenis: jenis,
        wallet: wallet,
        walletTujuan: walletTujuan,
        kategori: kategori,
        nominal: nominal
    };
}

function tambahCatatanBaru() {
    const inputEl = document.getElementById('notes-text-input');
    let teks = inputEl.value;
    if (!teks || !teks.trim()) return;

    const lines = teks.split('\n');
    const parsedTransactions = [];
    const createdTxIds = [];
    const waktuSekarang = new Date();
    const tanggalTeks = waktuSekarang.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const kodeBulan = String(waktuSekarang.getMonth() + 1).padStart(2, '0');
    const tanggalInput = dapatkanTanggalLokalHariIni(waktuSekarang);

    lines.forEach(line => {
        const parsed = parseCatatanKeTransaksi(line);
        if (parsed) {
            const txId = +new Date() + Math.floor(Math.random() * 1000);
            const txObj = {
                id: txId,
                nama: parsed.nama,
                jenis: parsed.jenis,
                wallet: parsed.wallet,
                walletTujuan: parsed.walletTujuan,
                kategori: parsed.kategori,
                nominal: parsed.nominal,
                tanggalCetak: tanggalTeks,
                bulan: kodeBulan,
                tanggalMentah: tanggalInput
            };
            daftarTransaksi.unshift(txObj);
            createdTxIds.push(txId);
            parsedTransactions.push(parsed);
        }
    });

    if (parsedTransactions.length === 0) {
        panggilCustomModal(
            'Tidak Ada Transaksi Terdeteksi ❌',
            'Sistem tidak menemukan nominal atau informasi transaksi yang valid dari catatan lo, Cuy! Coba cek formatnya lagi.',
            null,
            'exclamation'
        );
        return;
    }

    const catatanId = +new Date();
    daftarCatatan.push({
        id: catatanId,
        teks: teks.trim(),
        tanggal: waktuSekarang.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        createdTxIds: createdTxIds,
        parsedTransactions: parsedTransactions
    });

    inputEl.value = "";
    simpanDataKeLokal();
    tampilkanData();

    panggilCustomModal(
        'Catatan Berhasil Disinkronkan! 🎉',
        `Berhasil memproses catatan dan menambahkan ${parsedTransactions.length} transaksi baru ke WAYFinance!`,
        null,
        'success'
    );
}

function hapusCatatan(catatanId) {
    const targetNote = daftarCatatan.find(c => c.id === catatanId);
    if (!targetNote) return;

    const existingTxIds = targetNote.createdTxIds.filter(txId =>
        daftarTransaksi.some(tx => tx.id === txId)
    );

    if (existingTxIds.length > 0) {
        panggilCustomModal(
            'Hapus Catatan & Transaksi? 🗑️',
            `Catatan ini terhubung dengan ${existingTxIds.length} transaksi aktif.\n\nApakah kamu juga ingin menghapus seluruh transaksi tersebut dari WAYFinance?`,
            function () {
                daftarTransaksi = daftarTransaksi.filter(tx => !existingTxIds.includes(tx.id));
                daftarCatatan = daftarCatatan.filter(c => c.id !== catatanId);
                simpanDataKeLokal();
                tampilkanData();
                panggilCustomModal('Terhapus Bersih! 🧹', 'Catatan dan transaksi terkait berhasil dihapus.', null, 'success');
            },
            'confirm'
        );

        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        confirmBtn.innerText = "Hapus Keduanya 💥";
        cancelBtn.innerText = "Catatannya Saja 📝";
        
        cancelBtn.onclick = function () {
            daftarCatatan = daftarCatatan.filter(c => c.id !== catatanId);
            simpanDataKeLokal();
            tampilkanData();
            tutupCustomModal();
            panggilCustomModal('Terhapus! 📝', 'Hanya catatan yang dihapus. Transaksi tetap tersimpan.', null, 'success');
        };
    } else {
        panggilCustomModal(
            'Hapus Catatan',
            'Apakah kamu yakin ingin menghapus catatan ini?',
            function () {
                daftarCatatan = daftarCatatan.filter(c => c.id !== catatanId);
                simpanDataKeLokal();
                tampilkanData();
            }
        );
    }
}

function renderNotesVisual() {
    const container = document.getElementById('notes-container');
    if (!container) return;

    if (daftarCatatan.length === 0) {
        container.innerHTML = `<small style="color: var(--text-muted); text-align: center; font-style: italic; display: block; padding: 10px;">Belum ada catatan harian tersimpan...</small>`;
        return;
    }

    container.innerHTML = "";
    daftarCatatan.forEach(item => {
        let badgeHtml = "";
        item.parsedTransactions.forEach(tx => {
            let flowClass = tx.jenis;
            let prefixSymbol = "-";
            let label = "";

            if (tx.jenis === "pemasukan") {
                prefixSymbol = "+";
                label = `${tx.wallet.toUpperCase()}`;
            } else if (tx.jenis === "pengeluaran") {
                prefixSymbol = "-";
                label = `${tx.wallet.toUpperCase()}`;
            } else if (tx.jenis === "transfer") {
                prefixSymbol = "🔄";
                label = `${tx.wallet.toUpperCase()} ➔ ${tx.walletTujuan.toUpperCase()}`;
            }

            badgeHtml += `
                <div class="parsed-badge ${flowClass}">
                    <span>${prefixSymbol} Rp ${tx.nominal.toLocaleString('id-ID')}</span>
                    <small>(${label})</small>
                </div>
            `;
        });

        container.insertAdjacentHTML('beforeend', `
            <div class="notes-card">
                <div class="notes-info">
                    <span class="notes-date"><i class="fa-regular fa-clock"></i> ${item.tanggal}</span>
                    <p class="notes-text">${html_escape_tag(item.teks)}</p>
                    <div class="notes-parsed-transactions">
                        ${badgeHtml}
                    </div>
                </div>
                <div class="notes-actions">
                    <button class="btn-hapus-wishlist" onclick="window.hapusCatatan(${item.id})"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
        `);
    });
}

function setModeInput(mode) {
    const btnManual = document.getElementById('btn-mode-manual');
    const btnSimpel = document.getElementById('btn-mode-simpel');
    const wrapperManual = document.getElementById('wrapper-input-manual');
    const wrapperSimpel = document.getElementById('wrapper-input-simpel');

    if (!btnManual || !btnSimpel || !wrapperManual || !wrapperSimpel) return;

    if (mode === 'simpel') {
        btnManual.classList.remove('active');
        btnSimpel.classList.add('active');
        wrapperManual.style.display = 'none';
        wrapperSimpel.style.display = 'block';
        localStorage.setItem('way_finance_input_mode', 'simpel');
    } else {
        btnManual.classList.add('active');
        btnSimpel.classList.remove('active');
        wrapperManual.style.display = 'block';
        wrapperSimpel.style.display = 'none';
        localStorage.setItem('way_finance_input_mode', 'manual');
    }
}

function periksaWelcomeModeInput() {
    const savedMode = localStorage.getItem('way_finance_input_mode');
    if (!savedMode) {
        panggilCustomModal(
            'Pilih Mode Catat Keuangan! 🎯',
            'Halo Cuy! Selamat datang di WAYFinance. Mau pakai mode apa buat catat pemasukan/pengeluaran lo?',
            null,
            'welcome_selection'
        );
    } else {
        setModeInput(savedMode);
    }
}

function toggleSupportCard(show) {
    const card = document.getElementById('support-card');
    const badge = document.getElementById('support-badge');
    if (!card || !badge) return;
    if (show) {
        card.style.display = 'flex';
        badge.style.display = 'none';
        localStorage.setItem('way_finance_support_closed', 'false');
    } else {
        card.style.display = 'none';
        badge.style.display = 'flex';
        localStorage.setItem('way_finance_support_closed', 'true');
    }
}

function toggleSectionCollapse(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const isActive = section.classList.contains('active');
    document.querySelectorAll('.collapsible-section').forEach(item => {
        item.classList.remove('active');
    });

    if (!isActive) {
        section.classList.add('active');
    }
}

function keluarDariPremium() {
    statusUserPremium = true;
    localStorage.setItem('way_finance_premium_status', 'true');
    perbaruiTampilanTombolPremium();
    tampilkanData();
    tutupCustomModal();
    panggilCustomModal(
        'Kembali Ke Versi Biasa 🚪',
        'Kamu telah keluar dari mode premium dan kembali ke versi standar non-premium, Cuy!',
        null,
        'success'
    );
}

// Bind methods to window for HTML accessibility
window.ubahTemaWarna = ubahTemaWarna;
window.cekKategoriKustom = cekKategoriKustom;
window.tambahTransaksi = tambahTransaksi;
window.aktifkanModeEdit = aktifkanModeEdit;
window.hapusSatuTransaksi = hapusSatuTransaksi;
window.eksekusiResetSemuaData = eksekusiResetSemuaData;
window.tambahWishlistBaru = tambahWishlistBaru;
window.isiCelenganInline = isiCelenganInline;
window.hapusWishlist = hapusWishlist;
window.tampilkanData = tampilkanData;
window.tutupCustomModal = tutupCustomModal;
window.lompatSectionHP = lompatSectionHP;
window.formatInputRupiah = formatInputRupiah;
window.evaluasiKalkulatorNominal = evaluasiKalkulatorNominal;
window.bukaModalPenjelasanDev = bukaModalPenjelasanDev;
window.tanyaSuntikData = tanyaSuntikData;
window.pemicuBackupPremium = pemicuBackupPremium;
window.pemicuRestorePremium = pemicuRestorePremium;
window.eksekusiRestoreJSON = eksekusiRestoreJSON;
window.pemicuExportCSV = pemicuExportCSV;
window.toggleSembunyikanSaldo = toggleSembunyikanSaldo;
window.pemicuShortcutNominal = pemicuShortcutNominal;
window.tambahTagihanBaru = tambahTagihanBaru;
window.bayarTagihanOtomatis = bayarTagihanOtomatis;
window.hapusTagihan = hapusTagihan;
window.eksekusiSmartPaste = eksekusiSmartPaste;
window.eksekusiCetakPDFLaporan = eksekusiCetakPDFLaporan;
window.tambahPiutangBaru = tambahPiutangBaru;
window.hapusPiutang = hapusPiutang;
window.tandaiPiutangLunas = tandaiPiutangLunas;
window.kirimReminderWA = kirimReminderWA;
window.renderDebtVisual = renderDebtVisual;
window.kalkulasiRoastDanSurvival = kalkulasiRoastDanSurvival;
window.tambahCatatanBaru = tambahCatatanBaru;
window.hapusCatatan = hapusCatatan;
window.setModeInput = setModeInput;
window.periksaWelcomeModeInput = periksaWelcomeModeInput;
window.validasiKodePremiumLangsung = validasiKodePremiumLangsung;
window.formatNotesInput = formatNotesInput;
window.simpanLimitKategori = simpanLimitKategori;
window.gantiProfilKeuangan = gantiProfilKeuangan;
window.dapatkanTanggalLokalHariIni = dapatkanTanggalLokalHariIni;
window.toggleSupportCard = toggleSupportCard;
window.toggleSectionCollapse = toggleSectionCollapse;
window.keluarDariPremium = keluarDariPremium;
window.simpanBatasBudgetGlobal = simpanBatasBudgetGlobal;
window.setDatePreset = setDatePreset;

// --- LOGIKA PENGELUARAN HARIAN & RIWAYAT ---
function renderDailyExpenses() {
    const container = document.getElementById('daily-expenses-container');
    const totalHariIniEl = document.getElementById('hari-ini-keluar');
    if (!container) return;

    const tanggalHariIni = dapatkanTanggalLokalHariIni();
    let totalHariIni = 0;
    const petaPengeluaranHarian = {};
    
    daftarTransaksi.forEach(item => {
        if (item.jenis === 'pengeluaran') {
            const tgl = item.tanggalMentah || dapatkanTanggalLokalHariIni();
            if (tgl === tanggalHariIni) {
                totalHariIni += item.nominal;
            }
            if (!petaPengeluaranHarian[tgl]) {
                petaPengeluaranHarian[tgl] = {
                    total: 0,
                    items: []
                };
            }
            petaPengeluaranHarian[tgl].total += item.nominal;
            petaPengeluaranHarian[tgl].items.push(item);
        }
    });

    if (totalHariIniEl) {
        totalHariIniEl.innerText = (statusUserPremium && sembunyikanSaldoMode) ? "🙈 *******" : 'Rp ' + totalHariIni.toLocaleString('id-ID');
    }

    container.innerHTML = "";
    const daftarTanggal = Object.keys(petaPengeluaranHarian).sort((a, b) => new Date(b) - new Date(a));

    if (daftarTanggal.length === 0) {
        container.innerHTML = `<small style="color: var(--text-muted); text-align: center; font-style: italic; display: block; padding: 10px;">Belum ada riwayat pengeluaran harian, Cuy...</small>`;
        return;
    }

    daftarTanggal.forEach(tgl => {
        const dataHariIni = petaPengeluaranHarian[tgl];
        let namaHariTanggal = tgl;
        try {
            const objekTgl = new Date(tgl);
            if (!isNaN(objekTgl.getTime())) {
                namaHariTanggal = objekTgl.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                const kemaren = new Date();
                kemaren.setDate(kemaren.getDate() - 1);
                const tglKemarenStr = dapatkanTanggalLokalHariIni(kemaren);
                if (tgl === tanggalHariIni) {
                    namaHariTanggal = `Hari Ini (${namaHariTanggal})`;
                } else if (tgl === tglKemarenStr) {
                    namaHariTanggal = `Kemarin (${namaHariTanggal})`;
                }
            }
        } catch(e) {}

        let htmlItems = "";
        dataHariIni.items.forEach(item => {
            htmlItems += `
                <div class="daily-expense-item">
                    <span>☕ ${html_escape_tag(item.nama)} (${item.wallet.toUpperCase()})</span>
                    <strong>Rp ${item.nominal.toLocaleString('id-ID')}</strong>
                </div>
            `;
        });

        container.insertAdjacentHTML('beforeend', `
            <div class="daily-expense-card">
                <div class="daily-expense-header">
                    <span class="daily-expense-date">${namaHariTanggal}</span>
                    <span class="daily-expense-total">Rp ${dataHariIni.total.toLocaleString('id-ID')}</span>
                </div>
                <div class="daily-expense-items-list">
                    ${htmlItems}
                </div>
                <div class="daily-expense-actions">
                    <button onclick="window.tambahTransaksiDiTanggal('${tgl}')">
                        <i class="fa-solid fa-plus"></i> Tambah Transaksi di Tanggal Ini
                    </button>
                    <button onclick="window.duplikatTransaksiHariIni('${tgl}')">
                        <i class="fa-solid fa-copy"></i> Salin ke Hari Ini
                    </button>
                </div>
            </div>
        `);
    });
}

function tambahTransaksiDiTanggal(tgl) {
    document.getElementById('tanggal-transaksi').value = tgl;
    document.getElementById('jenis-transaksi').value = 'pengeluaran';
    if (typeof ubahTemaWarna === 'function') ubahTemaWarna();
    
    const panelInput = document.getElementById('panel-input');
    if (panelInput) {
        panelInput.scrollIntoView({ behavior: 'smooth' });
    }
    
    panggilCustomModal('Tanggal Input Disetel 📅', `Tanggal pencatatan disetel ke <strong>${tgl}</strong> dengan tipe <strong>Pengeluaran</strong>. Silakan isi form di sebelah kiri untuk menambah transaksi!`, null, 'success');
}

function duplikatTransaksiHariIni(tgl) {
    const transaksiDicopas = daftarTransaksi.filter(item => item.jenis === 'pengeluaran' && item.tanggalMentah === tgl);
    if (transaksiDicopas.length === 0) {
        panggilCustomModal('Tidak Ada Pengeluaran ❌', 'Tidak ada transaksi pengeluaran di tanggal tersebut untuk disalin.', null, 'exclamation');
        return;
    }

    panggilCustomModal(
        'Salin Pengeluaran 📋', 
        `Apakah kamu mau menduplikasi <strong>${transaksiDicopas.length} transaksi pengeluaran</strong> dari tanggal <strong>${tgl}</strong> ke <strong>Hari Ini</strong>?`, 
        () => {
            const hariIniMentah = dapatkanTanggalLokalHariIni();
            const objekWaktu = new Date();
            const tanggalTeks = objekWaktu.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            const kodeBulan = String(objekWaktu.getMonth() + 1).padStart(2, '0');

            transaksiDicopas.forEach((item, index) => {
                daftarTransaksi.unshift({
                    id: +new Date() + index,
                    nama: item.nama,
                    jenis: item.jenis,
                    wallet: item.wallet,
                    walletTujuan: item.walletTujuan,
                    kategori: item.kategori,
                    nominal: item.nominal,
                    tanggalCetak: tanggalTeks,
                    bulan: kodeBulan,
                    tanggalMentah: hariIniMentah
                });
            });

            simpanDataKeLokal();
            tampilkanData();
            panggilCustomModal('Penyalinan Berhasil! 📋', `Berhasil menyalin ${transaksiDicopas.length} pengeluaran ke Hari Ini.`, null, 'success');
        }
    );
}

// Bind methods ke window
window.renderDailyExpenses = renderDailyExpenses;
window.tambahTransaksiDiTanggal = tambahTransaksiDiTanggal;
window.duplikatTransaksiHariIni = duplikatTransaksiHariIni;

function pemicuRestoreCSV() {
    if (!statusUserPremium) { bukaPaywallPremium('Restore Data (.csv)'); return; }
    const fileInput = document.getElementById('csv-restore-file');
    if (fileInput) fileInput.click();
}

function parseCSV(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const next = text[i+1];

        if (c === '"') {
            if (inQuotes && next === '"') {
                row[row.length - 1] += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            row.push('');
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') {
                i++;
            }
            lines.push(row);
            row = [''];
        } else {
            row[row.length - 1] += c;
        }
    }
    if (row.length > 1 || row[0] !== '') {
        lines.push(row);
    }
    return lines;
}

function parseTanggalIndo(tanggalCetakStr) {
    const bulanMap = {
        "januari": "01", "februari": "02", "maret": "03", "april": "04",
        "mei": "05", "juni": "06", "juli": "07", "agustus": "08",
        "september": "09", "oktober": "10", "november": "11", "desember": "12"
    };
    try {
        const parts = tanggalCetakStr.trim().split(/\s+/);
        if (parts.length === 3) {
            const hari = parts[0].padStart(2, '0');
            const namaBulan = parts[1].toLowerCase();
            const tahun = parts[2];
            const kodeBulan = bulanMap[namaBulan] || "01";
            const tanggalMentah = `${tahun}-${kodeBulan}-${hari}`;
            return { tanggalMentah, kodeBulan };
        }
    } catch (e) {
        console.error("Error parsing date: ", e);
    }
    const hariIni = dapatkanTanggalLokalHariIni();
    return {
        tanggalMentah: hariIni,
        kodeBulan: String(new Date().getMonth() + 1).padStart(2, '0')
    };
}

function eksekusiRestoreCSV(inputElemen) {
    const file = inputElemen.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const rawText = e.target.result;
            const lines = parseCSV(rawText);
            if (lines.length === 0) {
                panggilCustomModal('File Kosong ❌', 'File CSV tidak berisi data!', null, 'exclamation');
                return;
            }

            const parsedTransaksi = [];
            const parsedWishlist = [];
            const parsedTagihan = [];
            const parsedPiutang = [];
            const parsedCatatan = [];

            let activeSection = null;
            let header = null;

            for (let i = 0; i < lines.length; i++) {
                const row = lines[i];
                if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;

                const firstVal = row[0].trim();
                
                if (firstVal.startsWith("===")) {
                    if (firstVal.includes("TRANSAKSI")) {
                        activeSection = "transaksi";
                    } else if (firstVal.includes("WISHLIST")) {
                        activeSection = "wishlist";
                    } else if (firstVal.includes("TAGIHAN")) {
                        activeSection = "tagihan";
                    } else if (firstVal.includes("PIUTANG")) {
                        activeSection = "piutang";
                    } else if (firstVal.includes("CATATAN")) {
                        activeSection = "catatan";
                    } else {
                        activeSection = null;
                    }
                    header = null;
                    continue;
                }

                if (activeSection && !header) {
                    header = row.map(h => h.trim().toLowerCase());
                    continue;
                }

                if (activeSection === "transaksi") {
                    const colId = header.indexOf('id');
                    const colNama = header.indexOf('nama transaksi');
                    const colAliran = header.indexOf('aliran dana');
                    const colAsal = header.indexOf('asal saku');
                    const colTarget = header.indexOf('target saku');
                    const colKategori = header.indexOf('kategori');
                    const colNominal = header.indexOf('nominal');
                    const colTanggal = header.indexOf('tanggal');

                    if (colNama !== -1 && colAliran !== -1 && colNominal !== -1) {
                        const idStr = colId !== -1 ? row[colId] : "";
                        const nama = row[colNama] || "";
                        const jenis = colAliran !== -1 ? (row[colAliran] || "pengeluaran").toLowerCase().trim() : "pengeluaran";
                        const wallet = colAsal !== -1 ? (row[colAsal] || "dana").toLowerCase().trim() : "dana";
                        const walletTujuanRaw = colTarget !== -1 ? (row[colTarget] || "").trim() : "";
                        const walletTujuan = (jenis === "transfer" && walletTujuanRaw !== "-") ? walletTujuanRaw.toLowerCase() : undefined;
                        const kategori = colKategori !== -1 ? (row[colKategori] || "kustom").trim() : "kustom";
                        const nominalVal = colNominal !== -1 ? parseFloat(row[colNominal]) : 0;
                        const tanggalCetak = colTanggal !== -1 ? (row[colTanggal] || "").trim() : "";

                        if (nama && !isNaN(nominalVal) && nominalVal > 0) {
                            const parsedDate = parseTanggalIndo(tanggalCetak);
                            parsedTransaksi.push({
                                id: idStr ? parseFloat(idStr) : (+new Date() + i),
                                nama: nama.trim(),
                                jenis: jenis,
                                wallet: wallet,
                                walletTujuan: walletTujuan,
                                kategori: kategori,
                                nominal: nominalVal,
                                tanggalCetak: tanggalCetak,
                                bulan: parsedDate.kodeBulan,
                                tanggalMentah: parsedDate.tanggalMentah
                            });
                        }
                    }
                } else if (activeSection === "wishlist") {
                    const colId = header.indexOf('id');
                    const colNama = header.indexOf('nama barang');
                    const colHarga = header.indexOf('harga target');
                    const colTerkumpul = header.indexOf('terkumpul');

                    if (colNama !== -1 && colHarga !== -1) {
                        const idStr = colId !== -1 ? row[colId] : "";
                        const nama = row[colNama] || "";
                        const hargaTarget = parseFloat(row[colHarga]) || 0;
                        const terkumpul = colTerkumpul !== -1 ? (parseFloat(row[colTerkumpul]) || 0) : 0;

                        if (nama && hargaTarget > 0) {
                            parsedWishlist.push({
                                id: idStr ? parseFloat(idStr) : (+new Date() + i),
                                nama: nama.trim(),
                                hargaTarget: hargaTarget,
                                terkumpul: terkumpul
                            });
                        }
                    }
                } else if (activeSection === "tagihan") {
                    const colId = header.indexOf('id');
                    const colNama = header.indexOf('nama tagihan');
                    const colNominal = header.indexOf('nominal');
                    const colTanggal = header.indexOf('tanggal jatuh tempo');

                    if (colNama !== -1 && colNominal !== -1) {
                        const idStr = colId !== -1 ? row[colId] : "";
                        const nama = row[colNama] || "";
                        const nominal = parseFloat(row[colNominal]) || 0;
                        const tanggal = colTanggal !== -1 ? (row[colTanggal] || "").trim() : "";

                        if (nama && nominal > 0) {
                            parsedTagihan.push({
                                id: idStr ? parseFloat(idStr) : (+new Date() + i),
                                nama: nama.trim(),
                                nominal: nominal,
                                tanggal: tanggal
                            });
                        }
                    }
                } else if (activeSection === "piutang") {
                    const colId = header.indexOf('id');
                    const colNama = header.indexOf('nama teman');
                    const colNominal = header.indexOf('nominal');
                    const colCatatan = header.indexOf('catatan');

                    if (colNama !== -1 && colNominal !== -1) {
                        const idStr = colId !== -1 ? row[colId] : "";
                        const nama = row[colNama] || "";
                        const nominal = parseFloat(row[colNominal]) || 0;
                        const catatan = colCatatan !== -1 ? (row[colCatatan] || "").trim() : "Khilaf Gak Jelas";

                        if (nama && nominal > 0) {
                            parsedPiutang.push({
                                id: idStr ? parseFloat(idStr) : (+new Date() + i),
                                nama: nama.trim(),
                                nominal: nominal,
                                catatan: catatan
                            });
                        }
                    }
                } else if (activeSection === "catatan") {
                    const colId = header.indexOf('id');
                    const colIsi = header.indexOf('isi catatan');
                    const colTanggal = header.indexOf('tanggal');

                    if (colIsi !== -1) {
                        const idStr = colId !== -1 ? row[colId] : "";
                        const teks = row[colIsi] || "";
                        const tanggal = colTanggal !== -1 ? (row[colTanggal] || "").trim() : "";

                        if (teks) {
                            parsedCatatan.push({
                                id: idStr ? parseFloat(idStr) : (+new Date() + i),
                                teks: teks.trim(),
                                tanggal: tanggal,
                                createdTxIds: [],
                                parsedTransactions: []
                            });
                        }
                    }
                }
            }

            if (parsedTransaksi.length === 0 && parsedWishlist.length === 0 && parsedTagihan.length === 0 && parsedPiutang.length === 0 && parsedCatatan.length === 0) {
                const header = lines[0].map(h => h.trim().toLowerCase());
                const colId = header.indexOf('id');
                const colNama = header.indexOf('nama transaksi');
                const colAliran = header.indexOf('aliran dana');
                const colAsal = header.indexOf('asal saku');
                const colTarget = header.indexOf('target saku');
                const colKategori = header.indexOf('kategori');
                const colNominal = header.indexOf('nominal');
                const colTanggal = header.indexOf('tanggal');

                if (colNama !== -1 && colAliran !== -1 && colNominal !== -1) {
                    for (let i = 1; i < lines.length; i++) {
                        const row = lines[i];
                        if (row.length < 4 || (row.length === 1 && row[0] === "")) continue;

                        const idStr = colId !== -1 ? row[colId] : "";
                        const nama = row[colNama] || "";
                        const jenis = colAliran !== -1 ? (row[colAliran] || "pengeluaran").toLowerCase().trim() : "pengeluaran";
                        const wallet = colAsal !== -1 ? (row[colAsal] || "dana").toLowerCase().trim() : "dana";
                        const walletTujuanRaw = colTarget !== -1 ? (row[colTarget] || "").trim() : "";
                        const walletTujuan = (jenis === "transfer" && walletTujuanRaw !== "-") ? walletTujuanRaw.toLowerCase() : undefined;
                        const kategori = colKategori !== -1 ? (row[colKategori] || "kustom").trim() : "kustom";
                        const nominalVal = colNominal !== -1 ? parseFloat(row[colNominal]) : 0;
                        const tanggalCetak = colTanggal !== -1 ? (row[colTanggal] || "").trim() : "";

                        if (nama && !isNaN(nominalVal) && nominalVal > 0) {
                            const parsedDate = parseTanggalIndo(tanggalCetak);
                            parsedTransaksi.push({
                                id: idStr ? parseFloat(idStr) : (+new Date() + i),
                                nama: nama.trim(),
                                jenis: jenis,
                                wallet: wallet,
                                walletTujuan: walletTujuan,
                                kategori: kategori,
                                nominal: nominalVal,
                                tanggalCetak: tanggalCetak,
                                bulan: parsedDate.kodeBulan,
                                tanggalMentah: parsedDate.tanggalMentah
                            });
                        }
                    }
                }
            }

            const totalItemRead = parsedTransaksi.length + parsedWishlist.length + parsedTagihan.length + parsedPiutang.length + parsedCatatan.length;

            if (totalItemRead > 0) {
                panggilCustomModal(
                    'Pilih Aksi Impor CSV 📊',
                    `Berhasil membaca data dari CSV:<br>
                     • ${parsedTransaksi.length} Transaksi<br>
                     • ${parsedWishlist.length} Wishlist/Goals<br>
                     • ${parsedTagihan.length} Tagihan<br>
                     • ${parsedPiutang.length} Piutang/Buku Hitam<br>
                     • ${parsedCatatan.length} Catatan Harian<br><br>
                     Mau menimpa data saat ini atau menggabungkannya?`,
                    function () {
                        const txIdSet = new Set(daftarTransaksi.map(t => t.id));
                        parsedTransaksi.forEach(item => { if (!txIdSet.has(item.id)) daftarTransaksi.push(item); });
                        daftarTransaksi.sort((a, b) => b.id - a.id);

                        const wlIdSet = new Set(daftarWishlist.map(w => w.id));
                        parsedWishlist.forEach(item => { if (!wlIdSet.has(item.id)) daftarWishlist.push(item); });

                        const tgIdSet = new Set(daftarTagihan.map(t => t.id));
                        parsedTagihan.forEach(item => { if (!tgIdSet.has(item.id)) daftarTagihan.push(item); });

                        const ptIdSet = new Set(daftarPiutang.map(p => p.id));
                        parsedPiutang.forEach(item => { if (!ptIdSet.has(item.id)) daftarPiutang.push(item); });

                        const ctIdSet = new Set(daftarCatatan.map(c => c.id));
                        parsedCatatan.forEach(item => { if (!ctIdSet.has(item.id)) daftarCatatan.push(item); });

                        simpanDataKeLokal();
                        tampilkanData();
                        panggilCustomModal('Impor Berhasil! 🎉', 'Data CSV berhasil digabungkan dengan data saat ini!', null, 'success');
                    },
                    'confirm'
                );

                document.getElementById('modal-confirm-btn').innerText = "Gabungkan (Merge) ➕";
                document.getElementById('modal-cancel-btn').style.display = "inline-block";
                document.getElementById('modal-cancel-btn').innerText = "Batal ❌";

                const dataRestorasi = {
                    transaksi: parsedTransaksi,
                    wishlist: parsedWishlist,
                    tagihan: parsedTagihan,
                    piutang: parsedPiutang,
                    catatan: parsedCatatan
                };

                const areaTombol = document.getElementById('modal-custom-field-area');
                if (areaTombol) {
                    areaTombol.innerHTML = `
                        <button class="modal-btn" style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; width: 100%; border: none; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; margin-top: 10px; font-size: 0.85rem;" onclick="window.eksekusiOverwriteCSV(${JSON.stringify(dataRestorasi).replace(/"/g, '&quot;')})">
                            <i class="fa-solid fa-trash-can"></i> Timpa Data Saat Ini (Overwrite) ⚠️
                        </button>
                    `;
                }
            } else {
                panggilCustomModal('Impor Gagal ❌', 'Tidak ada data valid yang berhasil dibaca dari berkas CSV!', null, 'exclamation');
            }
        } catch (err) {
            console.error(err);
            panggilCustomModal('Eror File ❌', 'File CSV rusak atau format salah!', null, 'exclamation');
        }
    };
    reader.readAsText(file);
    inputElemen.value = "";
}

function eksekusiOverwriteCSV(dataRestorasi) {
    daftarTransaksi = dataRestorasi.transaksi || [];
    daftarWishlist = dataRestorasi.wishlist || [];
    daftarTagihan = dataRestorasi.tagihan || [];
    daftarPiutang = dataRestorasi.piutang || [];
    daftarCatatan = dataRestorasi.catatan || [];

    simpanDataKeLokal();
    tampilkanData();
    tutupCustomModal();
    panggilCustomModal('Impor Berhasil! 🎉', 'Semua data lama berhasil ditimpa dengan data CSV!', null, 'success');
}

window.pemicuRestoreCSV = pemicuRestoreCSV;
window.eksekusiRestoreCSV = eksekusiRestoreCSV;
window.eksekusiOverwriteCSV = eksekusiOverwriteCSV;
