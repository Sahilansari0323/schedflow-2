export const landingMarkup = `

  <!-- WebGL stage -->
  <!-- canvas rendered by React -->
  <div class="scrim" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>

  <!-- cinematic letterbox -->
  <div id="lbT" class="fixed top-0 inset-x-0 z-50 bg-deep pointer-events-none" style="height:0"></div>
  <div id="lbB" class="fixed bottom-0 inset-x-0 z-50 bg-deep pointer-events-none" style="height:0"></div>

  <!-- preloader -->
  <div id="loader" class="fixed inset-0 z-[95] bg-deep flex flex-col justify-between p-6 md:p-10 transition-transform duration-[850ms] ease-[cubic-bezier(.87,0,.13,1)]">
    <div class="flex justify-between mono-label">
      <span>SchedFlow</span><span>Open beta — 2025</span>
    </div>
    <div class="flex items-end justify-between gap-6">
      <div class="flex gap-2 mb-5 md:mb-9" aria-hidden="true">
        <span class="ld-tile" style="background:var(--sky);animation-delay:0s"></span>
        <span class="ld-tile" style="background:var(--brand);animation-delay:.15s"></span>
        <span class="ld-tile" style="background:var(--go);animation-delay:.3s"></span>
        <span class="ld-tile" style="background:var(--violet);animation-delay:.45s"></span>
      </div>
      <span id="loadNum" class="font-display font-extrabold leading-none tracking-tight text-[24vw] md:text-[10rem]">00</span>
    </div>
    <div class="h-[3px] bg-mist/10 relative rounded-full overflow-hidden">
      <div id="loadBar" class="absolute inset-y-0 left-0 bg-brand" style="width:0%"></div>
    </div>
  </div>

  <!-- glass nav -->
  <header class="fixed top-4 inset-x-0 z-40 flex justify-center px-4">
    <nav class="glass rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-5 md:gap-7">
      <a href="/" id="logo" data-hover class="flex items-center gap-2.5 font-display font-extrabold text-[13px] tracking-wide">
        <svg class="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#0B101A"/><rect x="4.5" y="4.5" width="7" height="7" rx="2" fill="#38BDF8"/><rect x="12.5" y="4.5" width="7" height="7" rx="2" fill="#74C947"/><rect x="4.5" y="12.5" width="7" height="7" rx="2" fill="#34D399"/><rect x="12.5" y="12.5" width="7" height="7" rx="2" fill="#C77DFF"/></svg>
        SchedFlow
      </a>
      <div class="hidden md:flex items-center gap-5 text-[10px] tracking-[.22em] uppercase text-mist/65 font-semibold">
        <a href="#" class="link" data-hover data-goto="1">The input</a>
        <a href="#" class="link" data-hover data-goto="3">The solve</a>
        <a href="#" class="link" data-hover data-goto="6">Features</a>
        <a href="#" class="link" data-hover data-goto="9">Pricing</a>
        <a href="/timetable" class="link !text-brand font-bold" data-hover>Live Board</a>
        <a href="/login" class="link !text-sky font-bold" data-hover>Admin Portal</a>
      </div>
      <a href="/timetable" data-hover class="btn-primary rounded-full px-4 py-2 text-[10px] tracking-[.2em] uppercase flex items-center gap-1.5 magnet">
        Explore
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
    </nav>
  </header>

  <!-- chapter rail -->
  <aside class="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-4">
    <span id="railNum" class="font-mono text-[11px] font-semibold text-mist/60">01/11</span>
    <div class="relative w-px h-48 bg-mist/15" id="railTrack"><div id="railFill" class="absolute top-0 left-0 w-full bg-brand" style="height:0%"></div></div>
    <span class="font-mono text-[11px] font-semibold text-mist/60">11/11</span>
  </aside>

  <!-- readout + progress -->
  <div id="readout" class="fixed left-6 md:left-14 bottom-5 z-40 mono-label">CH 01/11 — INTRO</div>
  <div class="fixed bottom-0 inset-x-0 h-[2px] z-40 bg-mist/10"><div id="pbar" class="h-full bg-brand" style="width:0%"></div></div>

  <!-- ============ 01 · INTRO ============ -->
  <section id="ch0" class="chapter">
    <div class="h-full flex flex-col justify-between px-6 md:px-14 lg:px-24 pt-28 pb-10">
      <div class="flex justify-between mono-label" data-rise style="--d:.05s">
        <span>SchedFlow Aura — Timetable Intelligence</span>
        <span class="hidden md:inline-flex items-center gap-2.5"><span class="w-1.5 h-1.5 rounded-full bg-go animate-pulse"></span>Accredited Deployment · 312+ Campuses</span>
        <span>© 2025</span>
      </div>
      <div class="max-w-[640px]">
        <div class="flex flex-wrap gap-2.5 mb-7" data-rise style="--d:.12s">
          <span class="chip" style="--c:var(--go)"><span class="cdot"></span>Deterministic solver</span>
          <span class="chip" style="--c:var(--sky)"><span class="cdot"></span>Zero collision architecture</span>
          <span class="chip" style="--c:var(--amber)"><span class="cdot"></span>Sub-second synthesis</span>
        </div>
        <h1 class="font-display font-extrabold uppercase leading-[.92] tracking-tight text-[clamp(2.5rem,7.2vw,6.2rem)]" data-rise style="--d:.2s">
          Campus schedules,<br>
          <span class="text-brand">resolved</span> with<br>
          <span class="stroke-text">zero conflict.</span>
        </h1>
        <p class="mt-6 max-w-md text-sm md:text-base text-mist/80 leading-relaxed" data-rise style="--d:.3s">
          Declare faculty commitments, student cohorts, and campus facilities. SchedFlow's
          heuristic engine resolves multi-dimensional constraints, eliminates collisions, and delivers accredited timetable matrices in seconds.
        </p>
        <div class="flex flex-wrap items-center gap-4 mt-8" data-rise style="--d:.4s">
          <button type="button" data-goto="10" data-hover class="btn-primary rounded-full px-8 py-4 text-xs tracking-[.2em] uppercase flex items-center gap-2 magnet">
            <span class="shine"></span>Generate Matrix
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
          <button type="button" data-goto="3" data-hover class="btn-glass rounded-full px-7 py-4 text-xs tracking-[.2em] uppercase flex items-center gap-2">
            Explore Solver
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 5.5v13l11-6.5z"/></svg>
          </button>
        </div>
      </div>
      <div class="flex items-end justify-between" data-rise style="--d:.5s">
        <span class="mono-label">Engineered for Universities, Colleges &amp; Institutional Campuses</span>
        <div class="flex items-center gap-3" aria-hidden="true">
          <span class="mono-label">SCROLL</span>
          <span class="hint-line block w-px h-12 bg-mist/15"><span></span></span>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 02 · THE INPUT ============ -->
  <section id="ch1" class="chapter">
    <div class="h-full flex items-center px-6 md:px-14 lg:px-24 py-24">
      <div class="w-full max-w-[560px]">
        <div class="clabel" style="--c:var(--sky)" data-rise style="--d:.05s"><span class="cnum">02</span><span>/ Data Ingestion</span></div>
        <h2 class="font-display font-extrabold uppercase leading-[.95] tracking-tight text-[clamp(1.8rem,4.4vw,3.4rem)] mt-4" data-rise style="--d:.15s">
          Unified Inputs.<br><span class="stroke-text">Instant Modeling.</span>
        </h2>
        <p class="mt-5 max-w-md text-sm md:text-base text-mist/60 leading-relaxed" data-rise style="--d:.25s">
          Eliminate manual matrix stitching and cumbersome spreadsheets. Declare faculty members, cohorts, and physical venues — SchedFlow dynamically constructs a unified constraint model in real time.
        </p>
        <div class="glass rounded-2xl p-5 md:p-6 mt-8 max-w-sm tilt" data-rise style="--d:.35s">
          <div class="flex items-center justify-between mb-1.5">
            <span class="font-mono text-[10px] tracking-[.2em] uppercase font-semibold text-mist/60">Academic Model</span>
            <span class="font-mono text-[10px] text-mist/40">AUTUMN SEMESTER</span>
          </div>
          <div class="tw-row"><span class="tw-key">Faculty</span><span class="tw-val" id="tw1"></span></div>
          <div class="tw-row"><span class="tw-key">Classes</span><span class="tw-val" id="tw2"></span></div>
          <div class="tw-row" style="border-bottom:none"><span class="tw-key">Rooms</span><span class="tw-val" id="tw3"></span></div>
          <button type="button" data-goto="3" data-hover class="btn-primary rounded-full w-full mt-4 py-3.5 text-[11px] tracking-[.22em] uppercase flex items-center justify-center gap-2 magnet">
            <span class="shine"></span>Initialize Model
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
        <p class="mono-label !text-mist/35 mt-5 hidden md:block" data-rise style="--d:.45s">↑ Declared entities · dynamically mapped into high-dimensional constraint space</p>
      </div>
    </div>
  </section>

  <!-- ============ 03 · THE COLLISION ============ -->
  <section id="ch2" class="chapter">
    <div class="h-full flex items-center px-6 md:px-14 lg:px-24 py-24">
      <div class="w-full max-w-[560px]">
        <div class="clabel" style="--c:var(--alert)" data-rise style="--d:.05s"><span class="cnum">03</span><span>/ Collision Detection</span></div>
        <h2 class="font-display font-extrabold uppercase leading-[.95] tracking-tight text-[clamp(1.8rem,4.6vw,3.6rem)] mt-4" data-rise style="--d:.15s">
          Structural Conflicts,<br><span class="text-alert">Identified &amp; Intercepted</span><br>
          <span class="stroke-text">Before Term Starts.</span>
        </h2>
        <p class="mt-5 max-w-md text-sm md:text-base text-mist/60 leading-relaxed" data-rise style="--d:.25s">
          Manual scheduling inevitably leaves hidden double-bookings and venue contention.
          SchedFlow's continuous radar detects and flags every multi-dimensional collision instantly:
        </p>
        <div class="mt-7 space-y-3">
          <div class="clash" data-rise style="--d:.35s">
            <span class="font-mono text-xs text-alert font-semibold pt-0.5">×2</span>
            <div><span class="font-display font-bold text-base md:text-lg">MON · P1 — Concurrent Cohort Demand</span>
            <span class="block font-mono text-[11px] text-mist/50 mt-0.5">PHY 11A and MATH 9B overlapping on single instructional period</span></div>
          </div>
          <div class="clash" data-rise style="--d:.45s">
            <span class="font-mono text-xs text-alert font-semibold pt-0.5">×2</span>
            <div><span class="font-display font-bold text-base md:text-lg">TUE · P5 — Simultaneous Faculty Allocation</span>
            <span class="block font-mono text-[11px] text-mist/50 mt-0.5">Faculty member assigned concurrently to dual physical lecture venues</span></div>
          </div>
          <div class="clash" data-rise style="--d:.55s">
            <span class="font-mono text-xs text-alert font-semibold pt-0.5">×2</span>
            <div><span class="font-display font-bold text-base md:text-lg">THU · P1 — Physical Venue Contention</span>
            <span class="block font-mono text-[11px] text-mist/50 mt-0.5">Central Hall reserved simultaneously for institutional assembly and seminar</span></div>
          </div>
        </div>
        <p class="mt-6 text-sm text-mist/55 italic" data-rise style="--d:.65s">Spreadsheets reveal scheduling bottlenecks during the semester. SchedFlow eliminates them before publication.</p>
      </div>
    </div>
  </section>

  <!-- ============ 04 · THE SOLVE ============ -->
  <section id="ch3" class="chapter">
    <div class="h-full flex items-center px-6 md:px-14 lg:px-24 py-24">
      <div class="w-full max-w-[560px]">
        <div class="clabel" style="--c:var(--go)" data-rise style="--d:.05s"><span class="cnum">04</span><span>/ Heuristic Solver</span></div>
        <h2 class="font-display font-extrabold uppercase leading-[.95] tracking-tight text-[clamp(1.8rem,4.4vw,3.4rem)] mt-4 mb-6" data-rise style="--d:.15s">
          Deterministic Core<br><span class="text-go">Resolving Constraints.</span>
        </h2>
        <div class="glass-strong rounded-2xl p-5 md:p-6 tilt" data-rise style="--d:.25s">
          <div class="flex items-center justify-between mb-4">
            <span class="font-mono text-[11px] tracking-[.18em] uppercase font-semibold text-mist/70">Chronos-2 · Heuristic Core</span>
            <span class="flex items-center gap-2 font-mono text-[11px] font-semibold">
              <span id="slDot" class="w-1.5 h-1.5 rounded-full bg-mist/30"></span>
              <span id="slPct" class="text-mist/50">IDLE</span>
            </span>
          </div>
          <div class="h-[3px] bg-mist/10 rounded-full overflow-hidden mb-4">
            <div id="slBar" class="h-full bg-go" style="width:0%"></div>
          </div>
          <div id="slLines" class="min-h-[190px]">
            <div class="sl-line">&gt; scan 22 bookings · 30 slots · 6 rules</div>
            <div class="sl-line bad">× overlap&nbsp;&nbsp; MON P1 — two tiles, one period</div>
            <div class="sl-line bad">× teacher&nbsp;&nbsp; TUE P5 — Ms. Kaur, two rooms at once</div>
            <div class="sl-line bad">× room&nbsp;&nbsp;&nbsp;&nbsp; THU P1 — HALL double-booked</div>
            <div class="sl-line mv">→ MATH 9B&nbsp; MON P1 → MON P2 ✓</div>
            <div class="sl-line mv">→ CS 11C&nbsp;&nbsp; TUE P5 → TUE P4 ✓</div>
            <div class="sl-line mv">→ ENG 11&nbsp;&nbsp; THU P1 → THU P6 ✓</div>
            <div class="sl-line mv">→ PHY 10&nbsp;&nbsp; MON P4 → FRI P5 ✓</div>
            <div class="sl-line ok">= locked · 0 conflicts · load ±1 period</div>
          </div>
          <div class="flex flex-wrap gap-2 pt-4 mt-1 border-t border-mist/10">
            <span id="cc1" class="cchip">Zero Overlaps</span>
            <span id="cc2" class="cchip">Load Equilibrium ±1</span>
            <span id="cc3" class="cchip">Venue Optimization</span>
          </div>
        </div>
        <p class="mono-label !text-mist/35 mt-5 hidden md:block" data-rise style="--d:.35s">Scroll to scrub execution telemetry · Deterministic constraint convergence</p>
      </div>
    </div>
  </section>

  <!-- ============ 05 · THE RESULT ============ -->
  <section id="ch4" class="chapter">
    <div class="h-full flex items-center px-6 md:px-14 lg:px-24 py-24">
      <div class="w-full max-w-[640px]">
        <div class="clabel" style="--c:var(--teal)" data-rise style="--d:.05s"><span class="cnum">05</span><span>/ Master Matrix</span></div>
        <h2 class="font-display font-extrabold uppercase leading-[.95] tracking-tight text-[clamp(1.7rem,4vw,3rem)] mt-4 mb-6" data-rise style="--d:.15s">
          The Master Matrix.<br><span class="text-go">Zero Collisions.</span>
        </h2>
        <div class="glass-strong rounded-2xl p-4 md:p-5 overflow-x-auto tilt" data-rise style="--d:.25s">
          <div id="rtBody" class="min-w-[540px]"></div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 mt-3 border-t border-mist/10">
            <div class="flex flex-wrap gap-x-3 gap-y-1.5" id="rtLegend"></div>
            <div class="flex gap-2.5 ml-auto">
              <button type="button" id="btnLive" data-hover class="btn-glass rounded-full px-4 py-2 text-[10px] tracking-[.16em] uppercase flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.6 2.5 13.4 0 16-2.5-2.6-2.5-13.4 0-16z"/></svg>Live link
              </button>
              <button type="button" id="btnPDF" data-hover class="btn-glass rounded-full px-4 py-2 text-[10px] tracking-[.16em] uppercase flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 14V4M8 8l4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>PDF
              </button>
              <button type="button" id="btnICS" data-hover class="btn-glass rounded-full px-4 py-2 text-[10px] tracking-[.16em] uppercase flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>.ics
              </button>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-6 mt-7 max-w-md" data-rise style="--d:.35s">
          <div><div class="font-display font-extrabold text-3xl md:text-4xl">&lt;90<span class="text-go">s</span></div><div class="mono-label mt-1.5">Matrix Resolution</div></div>
          <div><div class="font-display font-extrabold text-3xl md:text-4xl text-go">0</div><div class="mono-label mt-1.5">Active Clashes</div></div>
          <div><div class="font-display font-extrabold text-3xl md:text-4xl text-sky">±1</div><div class="mono-label mt-1.5">Load Deviation</div></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 06 · WHO IT'S FOR ============ -->
  <section id="ch5" class="chapter">
    <div class="h-full flex items-center px-6 md:px-14 lg:px-24 py-24">
      <div class="w-full max-w-[560px]">
        <div class="clabel" style="--c:var(--violet)" data-rise style="--d:.05s"><span class="cnum">06</span><span>/ Institutional Scale</span></div>
        <h2 class="font-display font-extrabold uppercase leading-[.95] tracking-tight text-[clamp(1.8rem,4.4vw,3.4rem)] mt-4 mb-7" data-rise style="--d:.15s">
          Architected For Diverse<br><span class="stroke-text">Academic Topologies.</span>
        </h2>
        <div class="space-y-4">
          <div class="persona glass rounded-2xl p-5 relative overflow-hidden" style="--c:var(--sky)" data-rise style="--d:.25s">
            <div class="flex items-start gap-4">
              <span class="picon w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-5h6v5"/></svg>
              </span>
              <div class="flex-1">
                <h3 class="font-display font-bold text-lg">Primary &amp; Secondary Academies</h3>
                <p class="text-sm text-mist/60 mt-1 leading-relaxed">Homeroom structures, shared specialty laboratories, and synchronized campus bell schedules.</p>
                <div class="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                  <span class="pbullet">Cohort-wise Views</span><span class="pbullet">Shared Laboratories</span><span class="pbullet">Print-Ready Matrices</span>
                </div>
              </div>
            </div>
          </div>
          <div class="persona glass rounded-2xl p-5 relative overflow-hidden" style="--c:var(--violet)" data-rise style="--d:.35s">
            <div class="flex items-start gap-4">
              <span class="picon w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 8l10-4 10 4-10 4z"/><path d="M6 10.5V15c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 8v6"/></svg>
              </span>
              <div class="flex-1">
                <h3 class="font-display font-bold text-lg">Colleges &amp; Universities</h3>
                <p class="text-sm text-mist/60 mt-1 leading-relaxed">Multi-department matrices, elective clustering, specialized venue allocation, and faculty workload caps.</p>
                <div class="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                  <span class="pbullet">Multi-Section Scaling</span><span class="pbullet">Elective Ensembles</span><span class="pbullet">Accredited Workloads</span>
                </div>
              </div>
            </div>
          </div>
          <div class="persona glass rounded-2xl p-5 relative overflow-hidden" style="--c:var(--amber)" data-rise style="--d:.45s">
            <div class="flex items-start gap-4">
              <span class="picon w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>
              </span>
              <div class="flex-1">
                <h3 class="font-display font-bold text-lg">Professional Institutes &amp; Academies</h3>
                <p class="text-sm text-mist/60 mt-1 leading-relaxed">Complex weekend shifts, rolling batch intakes, and high-frequency classroom rotation without overlap.</p>
                <div class="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                  <span class="pbullet">Batch Segregation</span><span class="pbullet">Dynamic Shift Allocation</span><span class="pbullet">Venue Optimization</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 07 · FEATURES ============ -->
  <section id="ch6" class="chapter">
    <div class="h-full flex items-center px-6 md:px-14 lg:px-24 py-24">
      <div class="w-full max-w-[600px]">
        <div class="clabel" style="--c:var(--brand)" data-rise style="--d:.05s"><span class="cnum">07</span><span>/ Enterprise Capabilities</span></div>
        <h2 class="font-display font-extrabold uppercase leading-[.95] tracking-tight text-[clamp(1.8rem,4.4vw,3.4rem)] mt-4 mb-7" data-rise style="--d:.15s">
          Engineered For The<br><span class="stroke-text">Office Of The Registrar.</span>
        </h2>
        <div id="featureList" class="border-b border-mist/12" data-rise style="--d:.25s"></div>
      </div>
    </div>
  </section>

  <!-- ============ 08 · BY THE NUMBERS ============ -->
  <section id="ch7" class="chapter">
    <div class="h-full flex items-center px-6 md:px-14 lg:px-24 py-24">
      <div class="w-full max-w-[560px]">
        <div class="clabel" style="--c:var(--sky)" data-rise style="--d:.05s"><span class="cnum">08</span><span>/ Empirical Telemetry</span></div>
        <h2 class="font-display font-extrabold uppercase leading-[.95] tracking-tight text-[clamp(1.8rem,4.4vw,3.4rem)] mt-4 mb-8" data-rise style="--d:.15s">
          Empirically Audited,<br><span class="stroke-text">Proven At Scale.</span>
        </h2>
        <div class="grid grid-cols-2 gap-x-8 gap-y-9">
          <div class="stat" data-rise style="--d:.25s"><div class="count font-display font-extrabold text-4xl md:text-5xl text-sky" data-val="312">0</div><div class="mono-label mt-2">Campuses Deployed</div></div>
          <div class="stat" data-rise style="--d:.33s"><div class="count font-display font-extrabold text-4xl md:text-5xl text-violet" data-val="12480">0</div><div class="mono-label mt-2">Matrices Resolved</div></div>
          <div class="stat" data-rise style="--d:.41s"><div class="count font-display font-extrabold text-4xl md:text-5xl text-go" data-val="99.98" data-dec="2" data-suf="%">0</div><div class="mono-label mt-2">First-Pass Collision Clearance</div></div>
          <div class="stat" data-rise style="--d:.49s"><div class="font-display font-extrabold text-4xl md:text-5xl">&lt;90<span class="text-brand">s</span></div><div class="mono-label mt-2">Average Synthesis Velocity</div></div>
        </div>
        <div class="mt-10 glass rounded-2xl p-5 tilt" data-rise style="--d:.57s">
          <p class="font-display font-semibold text-base md:text-lg leading-snug">"The first academic cycle in over a decade without a single scheduling discrepancy or faculty overlap complaint."</p>
          <p class="mono-label mt-3">Dr. S. Menon — Dean of Academic Affairs, Kirana Institute</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 09 · TESTIMONIALS ============ -->
  <section id="ch8" class="chapter">
    <div class="h-full flex items-center px-6 md:px-14 lg:px-24 py-24">
      <div class="w-full max-w-[560px]">
        <div class="clabel" style="--c:var(--rose)" data-rise style="--d:.05s"><span class="cnum">09</span><span>/ Executive Endorsements</span></div>
        <h2 class="font-display font-extrabold uppercase leading-[.95] tracking-tight text-[clamp(1.8rem,4.4vw,3.4rem)] mt-4 mb-8" data-rise style="--d:.15s">
          Institutional<br><span class="stroke-text">Consensus.</span>
        </h2>
        <div class="glass-strong rounded-2xl p-6 md:p-8 relative overflow-hidden tilt" data-rise style="--d:.25s">
          <span class="absolute -top-3 left-5 font-display font-extrabold text-[7rem] leading-none text-brand/20 select-none" aria-hidden="true">"</span>
          <div id="quoteBox" class="qfade relative">
            <p id="qText" class="font-display font-semibold text-lg md:text-2xl leading-snug min-h-[120px]"></p>
            <p id="qWho" class="mono-label mt-5"></p>
          </div>
          <div class="flex gap-2.5 mt-6" id="qDots"></div>
        </div>
        <div class="hidden md:flex flex-wrap gap-x-7 gap-y-2 mt-7 mono-label !text-mist/30" data-rise style="--d:.35s">
          <span>Northfield University</span><span>St. Aubin Academy</span><span>Kirana Institute</span><span>The Meridian Trust</span><span>Apex Technical Institute</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 10 · PRICING ============ -->
  <section id="ch9" class="chapter">
    <div class="h-full flex items-center px-6 md:px-14 lg:px-24 py-24">
      <div class="w-full max-w-[560px]">
        <div class="clabel" style="--c:var(--amber)" data-rise style="--d:.05s"><span class="cnum">10</span><span>/ Deployment Tiers</span></div>
        <h2 class="font-display font-extrabold uppercase leading-[.95] tracking-tight text-[clamp(1.8rem,4.4vw,3.4rem)] mt-4 mb-7" data-rise style="--d:.15s">
          Transparent Value,<br><span class="stroke-text">Guaranteed Performance.</span>
        </h2>
        <div class="space-y-4">
          <div class="prow glass rounded-2xl p-5 border border-mist/12 flex flex-wrap items-center gap-x-6 gap-y-3" style="--c:var(--sky)" data-rise style="--d:.25s">
            <div class="min-w-[120px]"><span class="font-mono text-[11px] tracking-[.2em] uppercase font-semibold text-mist/55">Academic Pilot</span>
              <div class="font-display font-extrabold text-3xl mt-1">$0<span class="text-xs font-semibold text-mist/40"> / evaluation</span></div></div>
            <ul class="flex-1 min-w-[180px] text-sm text-mist/60 space-y-1 hidden md:block">
              <li>Full matrix solver · 25 faculty · standard constraints · CSV export</li>
            </ul>
            <button type="button" data-plan="Academic Pilot" data-hover class="btn-glass rounded-full px-6 py-3 text-[10px] tracking-[.18em] uppercase font-bold pbtn">Launch Pilot</button>
          </div>
          <div class="prow featured glass-strong rounded-2xl p-5 border flex flex-wrap items-center gap-x-6 gap-y-3 relative" style="--c:var(--brand)" data-rise style="--d:.35s">
            <span class="absolute -top-3 left-6 bg-brand text-[#081a05] font-mono text-[9px] tracking-[.22em] uppercase px-3.5 py-1.5 rounded-full font-bold">Standard Edition</span>
            <div class="min-w-[120px]"><span class="font-mono text-[11px] tracking-[.2em] uppercase font-semibold text-brand">Institutional</span>
              <div class="font-display font-extrabold text-3xl mt-1">$49<span class="text-xs font-semibold text-mist/40"> / semester</span></div></div>
            <ul class="flex-1 min-w-[180px] text-sm text-mist/65 space-y-1 hidden md:block">
              <li>Unlimited department schedules · live synchronized links · load balancing</li>
              <li>Version control · priority solver queue · PDF &amp; iCal integration</li>
            </ul>
            <button type="button" data-plan="Institutional" data-hover class="btn-primary rounded-full px-6 py-3 text-[10px] tracking-[.18em] uppercase flex items-center gap-1.5 magnet">
              <span class="shine"></span>Deploy Tier
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>
          <div class="prow glass rounded-2xl p-5 border border-mist/12 flex flex-wrap items-center gap-x-6 gap-y-3" style="--c:var(--teal)" data-rise style="--d:.45s">
            <div class="min-w-[120px]"><span class="font-mono text-[11px] tracking-[.2em] uppercase font-semibold text-mist/55">Enterprise</span>
              <div class="font-display font-extrabold text-3xl mt-1">Custom</div></div>
            <ul class="flex-1 min-w-[180px] text-sm text-mist/60 space-y-1 hidden md:block">
              <li>Multi-campus federation · SSO / SCIM · REST API · SOC2 audit trail</li>
            </ul>
            <button type="button" data-plan="Enterprise" data-hover class="btn-glass rounded-full px-6 py-3 text-[10px] tracking-[.18em] uppercase font-bold pbtn">Contact Enterprise</button>
          </div>
        </div>
        <p class="mono-label !text-mist/40 mt-6 text-center" data-rise style="--d:.55s">Every deployment is powered by the full deterministic constraint engine with complete cryptographic integrity.</p>
      </div>
    </div>
  </section>

  <!-- ============ 11 · GET STARTED ============ -->
  <section id="ch10" class="chapter">
    <div class="h-full flex flex-col items-center justify-center text-center px-6 pb-24 pt-16">
      <div class="clabel !justify-center" style="--c:var(--brand)" data-rise style="--d:.05s"><span class="cnum">11</span><span>/ Deployment</span></div>
      <h2 class="font-display font-extrabold uppercase leading-[.92] tracking-tight text-[clamp(2rem,6vw,4.8rem)] mt-5" data-rise style="--d:.15s">
        Transform Institutional<br><span class="text-brand">Scheduling Today.</span>
      </h2>
      <p class="mt-6 max-w-md text-sm md:text-base text-mist/60 leading-relaxed" data-rise style="--d:.25s">
        Accelerate your campus into automated, conflict-free timetable management.
        Instant provisioning, enterprise data privacy, and zero manual spreadsheet friction.
      </p>
      <div class="w-full max-w-md mt-9" data-rise style="--d:.35s">
        <p class="mono-label mb-3">Selected tier: <span id="planName" class="text-brand font-bold">Academic Pilot</span></p>
        <form id="ctaForm" class="flex flex-col sm:flex-row gap-2.5" novalidate>
          <input id="ctaEmail" type="email" required placeholder="registrar@institution.edu" autocomplete="email"
                 class="glass liquid rounded-full px-6 py-4 flex-1 text-sm outline-none focus:border-brand bg-panel/40 transition-colors placeholder:text-mist/35">
          <button type="submit" data-hover class="btn-primary rounded-full px-8 py-4 text-xs tracking-[.2em] uppercase flex items-center gap-2 shrink-0 magnet">
            <span class="shine"></span>Request Access
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </form>
      </div>
      <div class="absolute bottom-10 inset-x-0 flex flex-col sm:flex-row justify-center sm:gap-8 gap-1.5 mono-label !text-mist/35" data-rise style="--d:.45s">
        <span>© 2025 SchedFlow Aura — Institutional Timetable OS</span>
        <span>SOC2 Compliant · FERPA &amp; GDPR Ready · Enterprise Data Sovereignty</span>
      </div>
    </div>
  </section>

  <!-- feature modal -->
  <div id="modal" class="fixed inset-0 z-[60] invisible" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div id="modalBackdrop" class="absolute inset-0 bg-deep/70 backdrop-blur-sm transition-opacity duration-500" style="opacity:0"></div>
    <div id="modalPanel" class="glass-strong absolute inset-x-4 md:inset-x-[9vw] lg:inset-x-[17vw] top-[6vh] bottom-[6vh] rounded-3xl overflow-y-auto transition-all duration-500 ease-[cubic-bezier(.87,0,.13,1)]" style="opacity:0; transform:translateY(2.5rem)">
      <div class="sticky top-0 z-10 flex items-center justify-between px-6 md:px-10 py-4 border-b border-mist/10 rounded-t-3xl" style="background:rgba(15,20,31,.82); backdrop-filter:blur(20px)">
        <span id="mIndex" class="font-mono text-[11px] tracking-[.25em] text-mist/50">01 / 05</span>
        <button type="button" id="modalClose" data-hover aria-label="Close" class="btn-glass rounded-full p-2.5" style="--c:var(--alert)">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div class="px-6 md:px-10 py-8 md:py-12">
        <h3 id="mTitle" class="font-display font-extrabold text-3xl md:text-5xl tracking-tight"></h3>
        <p id="mCat" class="mt-2 text-sm font-semibold tracking-wide"></p>
        <div class="mt-8 overflow-hidden rounded-2xl border border-mist/10">
          <img id="mImg" class="w-full aspect-[16/9] object-cover saturate-[.85] contrast-105 hover:saturate-100 transition-all duration-700" alt="" loading="lazy">
        </div>
        <p id="mDesc" class="mt-8 max-w-2xl text-sm md:text-base leading-relaxed text-mist/70"></p>
        <dl class="mt-8 grid grid-cols-2 md:grid-cols-4 border-t border-mist/15">
          <div class="border-b border-mist/10 py-4 pr-4"><dt class="mono-label">Plan</dt><dd id="mPlan" class="mt-1.5 text-sm font-semibold"></dd></div>
          <div class="border-b border-mist/10 py-4 pr-4"><dt class="mono-label">Ships</dt><dd id="mSince" class="mt-1.5 text-sm font-semibold"></dd></div>
          <div class="border-b border-mist/10 py-4 pr-4"><dt class="mono-label">Engine</dt><dd id="mEng" class="mt-1.5 text-sm font-semibold"></dd></div>
          <div class="border-b border-mist/10 py-4"><dt class="mono-label">Coverage</dt><dd id="mCov" class="mt-1.5 text-sm font-semibold"></dd></div>
        </dl>
        <button type="button" id="mNext" data-hover class="btn-glass rounded-full mt-10 inline-flex items-center gap-3 text-[11px] tracking-[.22em] uppercase font-bold px-7 py-4">
          Next feature
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 17 17 7M17 7H8M17 7v9"/></svg>
        </button>
      </div>
    </div>
  </div>

  <!-- toast -->
  <div id="toast" class="glass-strong fixed left-1/2 bottom-10 z-[75] px-5 py-3 rounded-full text-[11px] tracking-[.18em] uppercase font-bold flex items-center gap-2.5 pointer-events-none transition-all duration-500" style="opacity:0; transform:translate(-50%,1rem)">
    <svg class="w-4 h-4 text-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 12.5 9.5 18 20 6.5"/></svg>
    <span id="toastMsg">Done</span>
  </div>

  <!-- cursor -->
  <div id="cursorDot" aria-hidden="true"></div>
  <div id="cursorRing" aria-hidden="true"><span>VIEW</span></div>

  <!-- the film's runtime: 11 chapters -->
  <div style="height:1150vh" aria-hidden="true"></div>

  <noscript><p style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:2rem;text-align:center">SchedFlow's landing page is one WebGL film scrubbed by scroll — it needs JavaScript.</p></noscript>

  <!-- failsafe: never trap anyone behind the loader -->
  


`;
