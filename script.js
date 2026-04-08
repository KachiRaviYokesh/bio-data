// ==================== SLIDE TITLE ====================
(function() {
    var titles = ["Angular Developer", "Frontend Developer", "UI Developer"];
    var typedEl = document.getElementById("typedText");
    var idx = 0;

    typedEl.textContent = titles[0];
    typedEl.classList.add("slide-in");

    setInterval(function() {
        typedEl.classList.remove("slide-in");
        typedEl.classList.add("slide-out");

        setTimeout(function() {
            idx = (idx + 1) % titles.length;
            typedEl.textContent = titles[idx];
            typedEl.classList.remove("slide-out");
            typedEl.classList.add("slide-enter");

            // Force reflow then animate in
            void typedEl.offsetWidth;
            typedEl.classList.remove("slide-enter");
            typedEl.classList.add("slide-in");
        }, 400);
    }, 2000);
})();

// ==================== ELEMENTS ====================
var navbar = document.getElementById("navbar");
var horizontalOuter = document.querySelector(".horizontal-outer");
var horizontalInner = document.querySelector(".horizontal-inner");
var panels = document.querySelectorAll(".horizontal-inner > *");
var numPanels = panels.length;
var navItems = document.querySelectorAll(".nav-links a");
var panelIds = Array.from(panels).map(function(p) { return p.id; });

function isDesktop() {
    return window.innerWidth > 950;
}

// ==================== SET NAVBAR HEIGHT CSS VAR ====================
function setNavbarHeight() {
    var h = navbar.offsetHeight;
    document.documentElement.style.setProperty("--navbar-h", h + "px");
}

var scrollSpacer = document.querySelector(".scroll-spacer");

// ==================== SETUP ====================
function setup() {
    setNavbarHeight();
    if (isDesktop()) {
        var panelHeight = horizontalOuter.clientHeight;
        scrollSpacer.style.height = (numPanels * panelHeight) + "px";
    } else {
        scrollSpacer.style.height = "0";
        horizontalInner.style.transform = "none";
    }
}

// ==================== SCROLL ON .horizontal-outer ====================
function onScroll() {
    navbar.classList.toggle("scrolled", horizontalOuter.scrollTop > 50);

    if (isDesktop()) {
        updateHorizontal();
    } else {
        updateMobileNav();
    }

    checkResumeVisible();
}

function updateHorizontal() {
    var scrollTop = horizontalOuter.scrollTop;
    var maxScroll = horizontalOuter.scrollHeight - horizontalOuter.clientHeight;
    if (maxScroll <= 0) return;

    var progress = Math.min(scrollTop / maxScroll, 1);
    var rawIndex = progress * (numPanels - 1);
    var frac = rawIndex - Math.floor(rawIndex);

    // Snap: once a panel is 60% visible, snap it to full width
    var snappedIndex;
    if (frac >= 0.60) {
        snappedIndex = Math.ceil(rawIndex);
    } else if (frac <= 0.40) {
        snappedIndex = Math.floor(rawIndex);
    } else {
        // Between 40%-60%: linear movement
        snappedIndex = rawIndex;
    }

    var tx = -snappedIndex * window.innerWidth;
    horizontalInner.style.transform = "translateX(" + tx + "px)";

    // Panel is fully snapped when snappedIndex is a whole number
    var isSnapped = (snappedIndex === Math.floor(snappedIndex));
    var activeIdx = Math.round(snappedIndex);

    // Enable scroll only on the fully snapped panel
    var prevActive = getActivePanel();
    for (var i = 0; i < numPanels; i++) {
        if (isSnapped && i === activeIdx) {
            panels[i].classList.add("panel-active");
        } else {
            panels[i].classList.remove("panel-active");
        }
    }
    // Reset lock when active panel changes
    if (activeIdx !== prevActive) {
        resetPanelLock();
    }

    // Active nav
    var activeId = panelIds[activeIdx];

    navItems.forEach(function(item) {
        item.classList.remove("active");
        if (item.getAttribute("href") === "#" + activeId) {
            item.classList.add("active");
        }
    });
}

// ==================== MOBILE NAV ====================
var navSections = ["hero", "about", "skills", "experience", "projects", "education", "location", "resume"];

function updateMobileNav() {
    var scrollPos = horizontalOuter.scrollTop + navbar.offsetHeight + 20;
    var currentId = "";

    document.querySelectorAll("header, section").forEach(function(sec) {
        var top = sec.offsetTop;
        var bottom = top + sec.offsetHeight;
        if (scrollPos >= top && scrollPos < bottom) {
            var id = sec.getAttribute("id");
            if (navSections.indexOf(id) !== -1) currentId = id;
        }
    });

    if (!currentId) {
        var closestAbove = "";
        var closestDist = Infinity;
        navSections.forEach(function(id) {
            var sec = document.getElementById(id);
            if (sec) {
                var dist = scrollPos - sec.offsetTop;
                if (dist >= 0 && dist < closestDist) {
                    closestDist = dist;
                    closestAbove = id;
                }
            }
        });
        currentId = closestAbove;
    }

    if (horizontalOuter.clientHeight + horizontalOuter.scrollTop >= horizontalOuter.scrollHeight - 50) {
        currentId = "resume";
    }

    navItems.forEach(function(item) {
        item.classList.remove("active");
        if (item.getAttribute("href") === "#" + currentId) {
            item.classList.add("active");
        }
    });
}

// ==================== NAV CLICK ====================
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener("click", function(e) {
        var targetId = anchor.getAttribute("href").substring(1);
        if (!targetId) return;
        e.preventDefault();

        if (isDesktop()) {
            var idx = panelIds.indexOf(targetId);
            if (idx >= 0) {
                // Reset all panels scroll to top
                for (var i = 0; i < numPanels; i++) {
                    panels[i].scrollTop = 0;
                }
                resetPanelLock();
                var maxScroll = horizontalOuter.scrollHeight - horizontalOuter.clientHeight;
                var targetY = (idx / (numPanels - 1)) * maxScroll;
                horizontalOuter.scrollTo({ top: targetY, behavior: "smooth" });
            }
        } else {
            var el = document.getElementById(targetId);
            if (el) {
                var offset = navbar.offsetHeight + 10;
                horizontalOuter.scrollTo({ top: el.offsetTop - offset, behavior: "smooth" });
            }
        }
    });
});

// ==================== PANEL SCROLL LOCK ====================
// When a panel is snapped and has overflow, lock horizontal scroll.
// Wheel events scroll the panel instead. Once panel is fully scrolled
// (top or bottom), release lock so horizontal scroll resumes.

var panelLocked = false;
var lockedPanelIdx = -1;

function getActivePanel() {
    for (var i = 0; i < numPanels; i++) {
        if (panels[i].classList.contains("panel-active")) return i;
    }
    return -1;
}

function hasPanelOverflow(idx) {
    if (idx < 0) return false;
    return panels[idx].scrollHeight > panels[idx].clientHeight + 2;
}

function isPanelAtTop(idx) {
    return panels[idx].scrollTop <= 0;
}

function isPanelAtBottom(idx) {
    var p = panels[idx];
    return p.scrollTop + p.clientHeight >= p.scrollHeight - 2;
}

// Scroll dampening factor — lower = slower scroll
var SCROLL_DAMPEN = 0.35;

horizontalOuter.addEventListener("wheel", function(e) {
    // Allow native shift+scroll for horizontal scrolling (e.g. resume wrapper)
    if (e.shiftKey) return;

    e.preventDefault();

    var sign = e.deltaY > 0 ? 1 : -1;
    var dampenedDelta = (Math.abs(e.deltaY) * SCROLL_DAMPEN + 100) * sign;
    

    if (isDesktop()) {
        var activeIdx = getActivePanel();

        // Check if panel is active and has overflow
        if (activeIdx >= 0 && hasPanelOverflow(activeIdx)) {
            var scrollingDown = e.deltaY > 0;
            var scrollingUp = e.deltaY < 0;

            // Lock panel if it has room to scroll
            if (!panelLocked) {
                if (scrollingDown && !isPanelAtBottom(activeIdx)) {
                    panelLocked = true;
                    lockedPanelIdx = activeIdx;
                } else if (scrollingUp && !isPanelAtTop(activeIdx)) {
                    panelLocked = true;
                    lockedPanelIdx = activeIdx;
                }
            }

            if (panelLocked && lockedPanelIdx === activeIdx) {
                var atTop = isPanelAtTop(lockedPanelIdx);
                var atBottom = isPanelAtBottom(lockedPanelIdx);

                // Release lock if fully scrolled
                if (scrollingDown && atBottom) {
                    panelLocked = false;
                    lockedPanelIdx = -1;
                } else if (scrollingUp && atTop) {
                    panelLocked = false;
                    lockedPanelIdx = -1;
                } else {
                    // Scroll panel content with reduced dampening (-50 from base)
                    var panelDelta = (Math.abs(e.deltaY) * SCROLL_DAMPEN + 50) * sign;
                    panels[lockedPanelIdx].scrollBy({ top: panelDelta, behavior: "smooth" });
                    return;
                }
            }
        }
    }

    // Scroll horizontal-outer with higher efficiency
    var outerDelta = (Math.abs(e.deltaY) * SCROLL_DAMPEN + 200) * sign;
    horizontalOuter.scrollBy({ top: outerDelta, behavior: "smooth" });
}, { passive: false });

// Reset lock when panel changes
function resetPanelLock() {
    panelLocked = false;
    lockedPanelIdx = -1;
}

// ==================== BURGER MENU ====================
var menuToggle = document.getElementById("menuToggle");
var navLinksEl = document.getElementById("navLinks");
var navOverlay = document.getElementById("navOverlay");

function closeMenu() {
    menuToggle.classList.remove("active");
    navLinksEl.classList.remove("open");
    navOverlay.classList.remove("active");
}

menuToggle.addEventListener("click", function() {
    menuToggle.classList.toggle("active");
    navLinksEl.classList.toggle("open");
    navOverlay.classList.toggle("active");
});

navOverlay.addEventListener("click", closeMenu);

navLinksEl.querySelectorAll("a").forEach(function(link) {
    link.addEventListener("click", closeMenu);
});

// ==================== RESUME DOWNLOAD BTNS (FLOATING) ====================
var resumeFloatBtns = document.getElementById("resumeFloatBtns");
var resumeDownloadBtn = document.getElementById("resumeDownloadBtn");
var resumeDownloadPdf = document.getElementById("resumeDownloadPdf");

function checkResumeVisible() {
    var resumeNav = document.querySelector('.nav-links a[href="#resume"]');
    var isActive = resumeNav && resumeNav.classList.contains("active");
    resumeFloatBtns.classList.toggle("visible", isActive);
}

// Download as PNG
resumeDownloadBtn.addEventListener("click", function() {
    var resumePage = document.getElementById("resumePage");
    resumeFloatBtns.classList.remove("visible");

    html2canvas(resumePage, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
    }).then(function(canvas) {
        var link = document.createElement("a");
        link.download = "Resume.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        resumeFloatBtns.classList.add("visible");
    }).catch(function() {
        resumeFloatBtns.classList.add("visible");
    });
});

// Download as editable text PDF (single full page)
resumeDownloadPdf.addEventListener("click", function() {
    var JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!JsPDF) {
        alert("PDF library failed to load. Please check your internet connection.");
        return;
    }

    var pdf = new JsPDF("p", "mm", "a4");
    var pageW = 210;
    var pageH = 297;
    var m = 12;
    var cW = pageW - m * 2;
    var black = [0, 0, 0];
    var dark = [40, 40, 40];
    var gray = [90, 90, 90];
    var y = 11;
    var lh = 3.2;
    var secGap = 2.8;

    function line(yPos) {
        pdf.setDrawColor(160, 160, 160);
        pdf.setLineWidth(0.2);
        pdf.line(m, yPos, pageW - m, yPos);
    }

    function wrap(text, x, yPos, maxW) {
        var lines = pdf.splitTextToSize(text, maxW);
        for (var i = 0; i < lines.length; i++) {
            pdf.text(lines[i], x, yPos);
            yPos += lh;
        }
        return yPos;
    }

    // ===== HEADER =====
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(black[0], black[1], black[2]);
    pdf.text("Rahul Sharma", m, y);

    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(gray[0], gray[1], gray[2]);
    pdf.text("Frontend Developer (Angular)", m, y);

    y += secGap;
    line(y);
    y += secGap;

    // ===== PROFESSIONAL SUMMARY =====
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(black[0], black[1], black[2]);
    y += secGap;
    pdf.text("PROFESSIONAL SUMMARY", m, y);
    y += secGap * 2;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.8);
    pdf.setTextColor(dark[0], dark[1], dark[2]);
    y = wrap(
        "Frontend Developer with 4+ years of experience building scalable, high-performance web applications using Angular, TypeScript, and modern UI frameworks. Expertise in developing reusable component architectures, dynamic forms, and responsive interfaces. Proven ability to optimize UI performance, integrate REST APIs, and deliver clean, maintainable code in Agile environments.",
        m, y, cW
    );

    y += secGap * 0.25;
    line(y);
    y += secGap;

    // ===== TECHNICAL SKILLS =====
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(black[0], black[1], black[2]);
    y += secGap;
    pdf.text("TECHNICAL SKILLS", m, y);
    y += secGap * 2;

    var skills = [
        ["Frontend Core", "HTML, CSS, JavaScript, TypeScript, SCSS/SASS, Grid & Flexbox"],
        ["Angular", "Angular (v16+), Angular Material, Signals"],
        ["Frameworks & Libraries", "Bootstrap, Tailwind CSS, DaisyUI, PrimeNG, ngx-datatable"],
        ["UI Development", "Reusable Components, Clean Code, UI Bug Fixing, Dynamic Forms, Form Validation, Responsive Design, Cross-Browser Compatibility, Performance Optimization (Lazy Loading)"],
        ["UI Tools", "Figma, Photoshop, Adobe XD"],
        ["Tools", "Git, GitHub, VS Code"],
        ["AI", "ChatGPT, Gemini CLI, Claude CLI"]
    ];

    pdf.setFontSize(8.8);
    var skillLabelWidth = 40;
    for (var s = 0; s < skills.length; s++) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(black[0], black[1], black[2]);
        pdf.text(skills[s][0] + ":", m, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(dark[0], dark[1], dark[2]);
        var valX = m + skillLabelWidth;
        var valW = cW - skillLabelWidth;
        var valLines = pdf.splitTextToSize(skills[s][1], valW);
        for (var vl = 0; vl < valLines.length; vl++) {
            pdf.text(valLines[vl], valX, y);
            if (vl < valLines.length - 1) y += lh;
        }
        y += 3.2;
    }

    y += secGap * 0.25;
    line(y);
    y += secGap;

    // ===== GITHUB =====
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(black[0], black[1], black[2]);
    y += secGap;
    pdf.text("GITHUB", m, y);
    y += secGap * 2;

    var githubLinks = [
        { label: "Personal", url: "https://github.com/rahul-sharma-dev",  display: "github.com/rahul-sharma-dev" },
        { label: "Work",     url: "https://github.com/rahul-sharma-work", display: "github.com/rahul-sharma-work" }
    ];

    pdf.setFontSize(8.8);
    var ghLabelWidth = 40;
    for (var g = 0; g < githubLinks.length; g++) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(black[0], black[1], black[2]);
        pdf.text(githubLinks[g].label + ":", m, y);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 102, 204);
        var gX = m + ghLabelWidth;
        pdf.textWithLink(githubLinks[g].display, gX, y, { url: githubLinks[g].url });
        var gW = pdf.getTextWidth(githubLinks[g].display);
        pdf.setDrawColor(0, 102, 204);
        pdf.setLineWidth(0.2);
        pdf.line(gX, y + 0.6, gX + gW, y + 0.6);

        y += 3.2;
    }
    pdf.setTextColor(dark[0], dark[1], dark[2]);

    y += secGap * 0.25;
    line(y);
    y += secGap;

    // ===== WORK EXPERIENCE =====
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(black[0], black[1], black[2]);
    y += secGap;
    pdf.text("WORK EXPERIENCE", m, y);
    y += secGap * 2;

    var experiences = [
        {
            role: "Frontend Developer (Angular)",
            company: "Stellar Innovations Pvt Ltd",
            date: "Jun 2024 \u2013 Present",
            points: [
                "Developed responsive and scalable web applications using Angular, TypeScript, and SCSS, improving UI consistency across devices",
                "Built reusable component libraries, reducing development time by ~25%",
                "Implemented dynamic forms and validations, enhancing user data accuracy and reducing input errors",
                "Integrated REST APIs for real-time data handling and seamless backend communication",
                "Optimized UI performance using lazy loading and efficient change detection, improving page load speed",
                "Utilized Angular Material, PrimeNG, and Tailwind CSS to deliver modern, accessible UI components"
            ]
        },
        {
            role: "UI/UX Designer & Developer",
            company: "Sardonyx Technologies Pvt Ltd",
            date: "Aug 2021 \u2013 Feb 2024",
            points: [
                "Designed and developed responsive user interfaces using HTML, CSS, Bootstrap, and JavaScript",
                "Created wireframes and prototypes in Figma, accelerating design-to-development workflow",
                "Converted UI/UX designs into functional applications with cross-browser compatibility",
                "Collaborated with backend teams to integrate APIs and ensure smooth data flow",
                "Improved user experience through UI enhancements and bug fixes, reducing user-reported issues",
            ]
        },
        {
            role: "Transaction Processing Representative",
            company: "Accenture",
            date: "Aug 2018 \u2013 Sep 2020",
            points: [
                "Processed and validated US healthcare claims with high accuracy under strict SLA timelines",
                "Ensured compliance with HIPAA regulations and data security standards"
            ]
        }
    ];

    pdf.setFontSize(8.8);
    for (var e = 0; e < experiences.length; e++) {
        var exp = experiences[e];
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(black[0], black[1], black[2]);
        pdf.text(exp.role, m, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(dark[0], dark[1], dark[2]);
        pdf.text(exp.date, pageW - m, y, { align: "right" });
        y += 3.8;

        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(gray[0], gray[1], gray[2]);
        pdf.text(exp.company, m, y);
        y += 4;

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(dark[0], dark[1], dark[2]);
        for (var p = 0; p < exp.points.length; p++) {
            pdf.text("\u2022  " + exp.points[p], m + 3, y);
            y += lh;
        }
        y += 1.5;
    }

    y += secGap * 0.05;
    line(y);
    y += secGap;

    // ===== PROJECTS =====
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(black[0], black[1], black[2]);
    y += secGap;
    pdf.text("PROJECTS", m, y);
    y += secGap * 2;

    var projects = [
        ["SIRA \u2014 Security Industry Regulatory Agency", "Developed Angular-based government application for managing licenses and approvals. Implemented CRUD operations and form validation for secure data handling. Tech: Angular, TypeScript, SCSS, REST APIs."],
        ["ULRS \u2014 Universal Loan Review System", "Built system to automate PDF data extraction and loan processing workflows. Improved efficiency by reducing manual data handling. Tech: Angular, JavaScript, API Integration."],
        ["Ultra Table \u2014 Dynamic Table Library", "Developed reusable data table component with sorting, filtering, and pagination. Replaced ngx-datatable, improving flexibility and customization. Tech: Angular, TypeScript."],
        ["TPS \u2014 Title Production Service", "U.S.-based platform for land purchasing and registration with live verification by authorized officers and licensed broker assistance."]
    ];

    pdf.setFontSize(8.8);
    for (var pr = 0; pr < projects.length; pr++) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(black[0], black[1], black[2]);
        pdf.text(projects[pr][0], m, y);
        y += 3.6;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(dark[0], dark[1], dark[2]);

        var sentences = pr === projects.length - 1
            ? [projects[pr][1].replace(/\.\s*$/, "")]
            : projects[pr][1].split(".");
        for (var sn = 0; sn < sentences.length; sn++) {
            var sentence = sentences[sn].trim();
            if (!sentence) continue;
            var bulletLines = pdf.splitTextToSize("\u2022  " + sentence, cW - 3);
            for (var bl = 0; bl < bulletLines.length; bl++) {
                pdf.text(bulletLines[bl], m + 3, y);
                y += lh;
            }
        }
        y += 1.2;
    }

    y += secGap * 0.05;
    line(y);
    y += secGap;

    // ===== EDUCATION =====
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(black[0], black[1], black[2]);
    y += secGap;
    pdf.text("EDUCATION", m, y);
    y += secGap * 2;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.8);
    pdf.setTextColor(black[0], black[1], black[2]);
    pdf.text("Bachelor of Computer Applications (BCA)", m, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(dark[0], dark[1], dark[2]);
    pdf.text("2015 \u2013 2018  |  CGPA: 6.5/10", pageW - m, y, { align: "right" });
    y += 3.6;
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(gray[0], gray[1], gray[2]);
    pdf.text("Ponnaiyah Ramajayam Institute of Science & Technology, Madurai, Tamil Nadu", m, y);

    y += secGap * 1.25;
    line(y);
    y += secGap;

    // ===== CONTACT & LOCATION =====
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(black[0], black[1], black[2]);
    y += secGap;
    pdf.text("CONTACT & LOCATION", m, y);
    y += secGap * 2;

    pdf.setFontSize(8.8);
    var contactLabelWidth = 40;
    var contactRows = [
        ["Name:",  "Rahul Sharma"],
        ["Phone:", "+91 98765 43210"],
        ["Email:", "rahul.sharma.dev@gmail.com"],
        ["Present Address:", "4th Seaward Road, Valmiki Nagar, Thiruvanmiyur, Chennai"],
        ["Permanent Address:", "18 Raghava Veera Avenue, Poes Garden, Chennai, Tamil Nadu, 600086"]
    ];
    for (var c = 0; c < contactRows.length; c++) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(black[0], black[1], black[2]);
        pdf.text(contactRows[c][0], m, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(dark[0], dark[1], dark[2]);
        pdf.text(contactRows[c][1], m + contactLabelWidth, y);
        y += 3.2;
    }

    // pdf.setFont("helvetica", "bold");
    // pdf.setTextColor(black[0], black[1], black[2]);
    // pdf.text("Present Address:", m, y);
    // pdf.setFont("helvetica", "italic");
    // pdf.setTextColor(gray[0], gray[1], gray[2]);
    // var paLW = pdf.getTextWidth("Present Address:  ");
    // pdf.text("(Current)", m + paLW, y);
    // pdf.setFont("helvetica", "normal");
    // pdf.setTextColor(dark[0], dark[1], dark[2]);
    // var paValX = m + paLW + pdf.getTextWidth("(Current)  ");
    // pdf.text("4th Seaward Road, Valmiki Nagar, Thiruvanmiyur, Chennai", paValX, y);

    // y += 4;

    // pdf.setFont("helvetica", "bold");
    // pdf.setTextColor(black[0], black[1], black[2]);
    // pdf.text("Permanent Address:", m, y);
    // pdf.setFont("helvetica", "normal");
    // pdf.setTextColor(dark[0], dark[1], dark[2]);
    // var prLW = pdf.getTextWidth("Permanent Address:  ");
    // pdf.text("18 Raghava Veera Avenue, Poes Garden, Chennai, Tamil Nadu, 600086", m + prLW, y);

    pdf.save("Rahul_Sharma_Resume.pdf");
});

// ==================== INIT ====================
horizontalOuter.addEventListener("scroll", onScroll);
window.addEventListener("resize", function() {
    setup();
    onScroll();
});

setup();
onScroll();

// ==================== AUTO-UPDATE CURRENT COMPANY EXPERIENCE ====================
document.querySelectorAll(".total-exp[data-start]").forEach(function(el) {
    var parts = el.getAttribute("data-start").split("-");
    var startYear = parseInt(parts[0]);
    var startMonth = parseInt(parts[1]);
    var now = new Date();
    var totalMonths = (now.getFullYear() - startYear) * 12 + (now.getMonth() + 1 - startMonth);
    var years = Math.floor(totalMonths / 12);
    var months = totalMonths % 12;
    var text = "";
    if (years > 0) text += years + " Yr" + (years > 1 ? "s" : "");
    if (years > 0 && months > 0) text += " ";
    if (months > 0) text += months + " Mo" + (months > 1 ? "s" : "");
    if (!text) text = "< 1 Mo";
    el.textContent = text;
});

// ==================== INIT STATS ====================
document.querySelectorAll(".stat-number").forEach(function(el) {
    el.textContent = el.getAttribute("data-target");
});


// ==================== PROJECT FILTER ====================
document.querySelectorAll(".filter-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
        document.querySelectorAll(".filter-btn").forEach(function(b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var filter = btn.getAttribute("data-filter");
        document.querySelectorAll(".project-card").forEach(function(card) {
            if (filter === "all" || card.getAttribute("data-category") === filter) {
                card.classList.remove("hidden");
            } else {
                card.classList.add("hidden");
            }
        });
    });
});

// ==================== ABOUT ME — 5 RAPID CLICKS TO SHOW/HIDE ====================
var aboutmeCard = document.getElementById("aboutmeCard");
var resumePageEl = document.getElementById("resumePage");
var resumeClickCount = 0;
var resumeLastClick = 0;
var aboutmeClickCount = 0;
var aboutmeLastClick = 0;

function resetAllClickCounts() {
    resumeClickCount = 0;
    aboutmeClickCount = 0;
}

document.addEventListener("scroll", resetAllClickCounts, true);
document.addEventListener("mousemove", resetAllClickCounts, true);
document.addEventListener("wheel", resetAllClickCounts, true);
document.addEventListener("touchmove", resetAllClickCounts, true);

resumePageEl.addEventListener("click", function() {
    var now = Date.now();
    if (now - resumeLastClick > 500) {
        resumeClickCount = 0;
    }
    resumeLastClick = now;
    resumeClickCount++;

    if (resumeClickCount >= 5) {
        resumeClickCount = 0;
        aboutmeCard.style.display = "block";
    }
});

aboutmeCard.addEventListener("click", function(e) {
    e.stopPropagation();
    var now = Date.now();
    if (now - aboutmeLastClick > 500) {
        aboutmeClickCount = 0;
    }
    aboutmeLastClick = now;
    aboutmeClickCount++;

    if (aboutmeClickCount >= 5) {
        aboutmeClickCount = 0;
        aboutmeCard.style.display = "none";
    }
});
