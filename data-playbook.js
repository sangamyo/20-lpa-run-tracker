// Interview prep, negotiation, accountability, templates, red flags, cheatsheet.
window.FLAGS = {
  missed2: { title: "2 missed days in a row", fix: "Tomorrow is a reset day: clear the revisit queue first, then 2 new problems. For the next 4 days add +1 problem per day until the week's target is back on pace. Tell Claude in tonight's report." },
  lowProblems: { title: "Fewer than 5 problems in a week", fix: "Next week's problem target goes up by half the deficit. Project hours drop to 2 for that week. Minimum 2 problems every day, no exceptions." },
  zeroApps: { title: "Zero applications in a week", fix: "Next day: a 2-hour apply block before any DSA. 15 applications + 10 referral asks, logged in Applications." },
  revisitPile: { title: "More than 6 revisits overdue", fix: "No new problems tomorrow. Clear the whole revisit queue first; it's where retention comes from." },
  lowEnergy: { title: "Energy 2 or below for 3 logged days", fix: "Sleep 8 hours, run 2 minimum viable days, exercise 30 min daily, then resume. If it persists, run the plan at 80%, never at 0%." },
  followups: { title: "Follow-ups overdue", fix: "First 15 minutes tomorrow: send every overdue follow-up (Template E) and set new next-action dates." },
  noContest: { title: "No contest for 2 weeks", fix: "Schedule a virtual contest on Saturday morning and log it. Contests are your OA rehearsal." },
  noCallbacks: { title: "20+ applications in 14 days, no responses", fix: "The resume or targeting is the problem. Paste your resume to Claude for review and move half your effort to referrals and founder DMs." },
  lowMocks: { title: "Last 2 mocks averaged below 3", fix: "Redo 5 problems from the weakest pattern, then re-mock within 4 days." },
  lowWeek: { title: "Last week scored below 60% of targets", fix: "On Sunday, cut scope (not sleep). Ask Claude to re-plan next week with numbers." },
  behind: { title: "Behind the problem plan", fix: "Backlog from earlier weeks comes first. Add 1 extra problem per day until the backlog is zero." }
};

window.MOCK_CRITERIA = ["Clarification", "Approach (brute to optimal)", "Code correctness", "Code quality", "Testing / dry run", "Communication", "Time management"];

window.PLAYBOOK = [
  { id: "protocol", title: "Accountability protocol", html: `
<p>Every night, save Tonight's tracker on the Today tab. Then either tap <b>Copy report for Claude</b> and paste it in the chat, or just tell Claude <b>"check my tracker"</b>. Claude reads this page's data directly.</p>
<ol>
<li>Claude scores your day out of 10 and says why.</li>
<li>Gaps are named without softening.</li>
<li>Tomorrow's plan is fixed based on what you missed.</li>
<li>You get 3 specific tasks for tomorrow, each with a time limit.</li>
<li>If you're behind, you get a catch-up plan with numbers.</li>
</ol>
<p><b>Sundays:</b> fill in the Review tab, then send it. Claude runs the weekly review and updates next week's targets.</p>
<p><b>Stuck on a problem:</b> ask for Hint 1, then Hint 2, then the approach. You only get the full solution if you ask for it explicitly.</p>
<p><b>Scoring guide:</b> 10 = every target hit plus tracker. 7–8 = core hit, one area short. 5–6 = minimum viable day. 3–4 = DSA or applications skipped. 0–2 = no log.</p>` },

  { id: "rounds", title: "Round-by-round guide", html: `
<h4>Online assessment (60–90 min)</h4>
<p>2–3 problems on HackerRank, HackerEarth or Codility, sometimes with CS or aptitude MCQs. Read every problem first and solve the easiest one first. If you can't find the optimal solution, submit brute force for partial test cases. Never leave a problem blank. Use fast input (<code>sys.stdin.readline</code>) and check edge cases: empty input, one element, duplicates, negatives, the largest n.</p>
<h4>DSA round (45–60 min)</h4>
<ol><li>Restate the problem and ask about input size, duplicates, negatives and empty input (2–3 min).</li>
<li>Work through 2 examples, including an edge case.</li>
<li>Give brute force + complexity out loud.</li>
<li>Name the pattern, then optimise.</li>
<li>Get agreement on the approach before coding.</li>
<li>Write clean code with good names.</li>
<li>Dry-run your example line by line, then test edge cases.</li>
<li>State the final time and space complexity.</li></ol>
<p>Keep talking. Silence for more than 60 seconds reads as stuck.</p>
<h4>Project / tech round (45–60 min)</h4>
<p>Expect a deep dive into one project: architecture, why each choice, failure cases, scaling, what you'd change, your numbers. Draw the diagram. Follow-ups are usually REST design, DB indexing, caching, auth (JWT vs sessions), async in FastAPI, Docker, and how you test.</p>
<h4>Machine coding / LLD (90–120 min; Flipkart, Swiggy, Razorpay, Zepto)</h4>
<p>Build a working, modular in-memory app (Splitwise, parking lot, snake and ladder). The grade is on working code, separation of concerns, extensibility (interfaces/strategy) and a runnable demo. Don't over-engineer. Get a working version by minute 60, then refine.</p>
<h4>System design (startups ask light HLD)</h4>
<p>Requirements (5 min), estimates (3), API (5), data model (5), diagram (10), deep dive on 2 components (12), bottlenecks and trade-offs (5). Lead with design #8 (robot episode ingestion) whenever you get the choice.</p>
<h4>Take-home</h4>
<p>Stay inside the timebox. Include a README with decisions and trade-offs, tests, and a deployed link if quick. When you submit, send a 3-line note covering what you'd do with more time.</p>
<h4>HR / hiring manager</h4>
<p>Motivation, behaviour (answer in STAR: Situation, Task, Action, Result) and compensation. Answers are below.</p>` },

  { id: "pitch", title: "2-minute pitches", html: `
<h4>Addverb VLA work (2 min)</h4>
<p><b>Structure:</b> context 20 s, problem 20 s, what I built 40 s, result 20 s, link to their role 20 s.</p>
<blockquote>"At Addverb I'm on the Advanced Robotics team in the CEO Office. The team trains Vision-Language-Action models. These take camera images and an instruction like 'put the red block in the bin' and output robot-arm actions. They're only as good as their demonstration data, so I own the data side.<br><br>
The problem: collecting teleoperated demos was slow and error-prone. Operators ran manual steps every episode, and bad episodes with dropped frames or desynced cameras were only found during training.<br><br>
I automated the collection workflow with Bash and Python: session setup, recording [N] camera streams plus joint states, validation and upload. Then I added quality checks that flag frame drops, timestamp gaps and failed episodes right after recording.<br><br>
Result: per-episode overhead went from [X] to [Y] minutes, we reached [N] episodes a day, and [Z]% of bad episodes were caught before training.<br><br>
It taught me that ML training data is a backend problem: throughput, validation, storage formats. I'm applying the same idea to LLM fine-tuning data in my project DataLens, and it's the kind of work I want to do at [Company]."</blockquote>
<p><b>Prepare answers for these follow-ups:</b> What is a VLA and how does it differ from an LLM? Which data format did you use, and why? How do you sync timestamps across cameras? What was the hardest bug? How would you scale to 100 robots? What can't you share? (Answer: "That's internal, but the pattern was…")</p>
<h4>PureWashr (60 s)</h4>
<blockquote>"PureWashr is a [what it does] startup recognised by Startup India. As full-stack developer I built [feature 1, 2, 3] with Next.js, Node and MongoDB for [N] users. The hardest part was [problem]; I solved it by [indexing / caching / redesign], which [result]."</blockquote>
<h4>DataLens (90 s)</h4>
<blockquote>"DataLens is a data-quality platform for LLM fine-tuning datasets. You import an instruction dataset from Hugging Face, like databricks-dolly-15k, and Redis background workers run 8 checks on every sample: empty or too short, length outliers, exact duplicates, near-duplicates with MinHash/LSH, PII with the matching spans highlighted, non-English text, refusal boilerplate and formatting problems. A React + TypeScript UI lets you browse flagged samples and search in plain English, then export a clean train/val split as JSONL or chat format. Stack: FastAPI, Postgres with pgvector, Redis + arq, S3-compatible storage, Docker Compose. The interesting design choice was [the LLM producing a validated filter JSON instead of raw SQL, with a rule-based fallback when the LLM fails]. Import of [N] samples takes [T]; QC on [N] samples takes [T]."</blockquote>` },

  { id: "hr", title: "HR answers", html: `
<h4>Tell me about yourself (60–90 s)</h4>
<p>Present (Addverb, VLA data), then past (PureWashr full-stack, Credex), then proof (DataLens), then why this role. End on why you're talking to them.</p>
<h4>Strengths</h4>
<blockquote>"I ship end-to-end and automate repetitive work. At Addverb I turned a manual teleop routine into scripts that cut [X] minutes per episode. I also learn new domains fast: I went from zero robotics background to owning VLA data collection in [N] weeks."</blockquote>
<h4>Weakness (honest, with fix and evidence)</h4>
<blockquote>"My DSA fundamentals were weaker than my practical skills. In October I started a structured plan: [N] problems by pattern, weekly contests, spaced revisits. My contest result went from [X] to [Y]. I still have to be deliberate about practising under time pressure."</blockquote>
<h4>Why leave Addverb / why not stay?</h4>
<blockquote>"My internship ended on 18 November. [If no PPO: the team isn't hiring for a full-time role in my area right now.] I want a full-time backend or AI-infra role where I own production systems, and [Company] is where I can do that."</blockquote>
<p>Never criticise Addverb.</p>
<h4>Why this company?</h4>
<p>Give 3 specifics: (1) the product or problem, (2) the tech or engineering culture (a blog post, an open-source repo), (3) how your experience maps onto their work. Prepare this per company, in Notes on its Applications row.</p>
<h4>Gap after November</h4>
<blockquote>"Since the internship ended I've prepared full-time and shipped DataLens. Here's the live link and what I learned building it."</blockquote>
<h4>Other offers?</h4>
<blockquote>"I'm in process with a few companies. [Company] is my top choice because [specific reason]."</blockquote>
<p>Be truthful, and never invent an offer.</p>
<h4>5 years?</h4>
<blockquote>"A strong backend / ML-infra engineer who owns a critical system end to end, and mentors juniors."</blockquote>` },

  { id: "negotiation", title: "Salary negotiation", html: `
<h4>Know the parts of a CTC</h4>
<ul><li><b>Base (fixed):</b> what matters most.</li>
<li><b>Variable / performance bonus:</b> often 10–20% and not guaranteed.</li>
<li><b>Joining bonus:</b> one-time, often clawed back if you leave within 12 months.</li>
<li><b>ESOPs / RSUs:</b> usually 4-year vesting with a 1-year cliff. At startups, value them at 0–25% unless there's liquidity.</li>
<li><b>Employer PF and insurance:</b> often counted inside the CTC.</li></ul>
<p>Compare offers on two numbers: <b>Fixed</b> = base, and <b>Year-1 cash</b> = base + expected bonus + joining bonus.</p>
<h4>Scripts</h4>
<p><b>Asked for expected CTC early:</b></p>
<blockquote>"I'd like to understand the full scope first. Could you share the budgeted range for this role?"</blockquote>
<p>If forced: "Based on market data for backend/AI roles with my experience, I'm looking at 20–24 LPA fixed, flexible on the overall structure."</p>
<p><b>Asked for current CTC:</b></p>
<blockquote>"I'm an intern on a stipend, so it isn't a useful comparison. I'd prefer to align on the role's market range."</blockquote>
<p><b>Offer received:</b></p>
<blockquote>"Thank you, I'm excited about this. Could you share the breakdown: fixed base, variable, joining bonus, ESOP details (number, strike price, vesting, cliff) and benefits? I'd like 2–3 days to review."</blockquote>
<p><b>Counter:</b></p>
<blockquote>"I'd love to join. Based on [a competing offer of X / market data for similar roles], is there flexibility to bring the fixed component to [X]? If base is fixed, a joining bonus of [Y] would close the gap."</blockquote>
<p><b>If they say no:</b> ask for a joining bonus, a 6-month compensation review in writing, more ESOPs, a start date or remote days. Ask once per component.</p>
<p><b>Deadline extension:</b></p>
<blockquote>"I have one process concluding by [date]. Could I have until [date] to give you a final answer?"</blockquote>
<p><b>Notice period:</b> you're an immediate joiner. Say so; it's leverage with startups.</p>
<h4>Rules</h4>
<ul><li>Never lie about competing offers.</li>
<li>Get the final offer in writing before you decline others.</li>
<li>Be warm and specific, and bundle your asks into one message.</li></ul>` },

  { id: "mocks", title: "Weekly mock format", html: `
<ul><li><b>DSA mock (45 min):</b> 5 min intro, 35 min on one unseen medium from a company-tagged list, 5 min feedback.</li>
<li><b>Project mock (30 min):</b> pitch, then 20 min of deep-dive questions.</li>
<li><b>SD mock (45 min):</b> one design from the list, using the template.</li>
<li><b>HR mock (20 min):</b> 6 questions from HR answers, said out loud.</li></ul>
<p><b>Interviewer options:</b> a friend or senior, peers from LinkedIn/Discord DSA groups, or Claude in chat ("act as interviewer for a 45-min DSA mock"). Record your screen and audio, and watch 5 minutes of it afterwards.</p>
<p><b>Scoring:</b> rate each criterion 1–5 using the form below. Pass bar: average 3.5 or higher with no 1s.</p>` }
];

window.TEMPLATES = [
  ["A. Referral request (engineer you don't know)", `Hi [Name], I'm Hari Om, a 2026 CSE grad on the Advanced Robotics team at Addverb, working on data collection for VLA robot models. I'm applying for [Role] at [Company] ([Job ID/link]).

Relevant: I've built backend/data pipelines in Python/FastAPI and shipped full-stack features at a startup. My project DataLens [link] imports LLM fine-tuning datasets from Hugging Face and flags duplicates, PII and formatting issues in every sample.

Would you be open to referring me? Resume attached. I can send a 3-line summary for the form. Thanks either way!`],
  ["B. College senior", `Hi [Name], I'm Hari Om from [college], 2026 batch. Saw you're at [Company], congrats! I'm interning at Addverb on robot-learning data infra and applying for [Role] ([link]).

Could you refer me if you think I'm a fit? Resume + 3-line summary below. Happy to take any advice on their interview process too.`],
  ["C. Cold email to recruiter", `Subject: [Role] – 2026 grad, robotics data infra + full-stack, immediate joiner

Hi [Name], I applied for [Role] ([Job ID]). Quick summary:
• Addverb Advanced Robotics: automated teleop data collection for VLA models ([result])
• PureWashr: shipped [feature] with Next.js/Node/MongoDB for [N] users
• Building DataLens, a data-quality platform for LLM training datasets (FastAPI, Postgres/pgvector, Redis workers, React, LLM search): [link]

Available from 19 Nov 2026. Resume attached. Could you let me know if my profile fits this or another open role?
Hari Om · [phone] · [LinkedIn]`],
  ["D. LinkedIn DM to founder / eng lead", `Hi [Name], I work on VLA robot data collection at Addverb and I'm building DataLens [link], which imports, quality-checks and searches LLM fine-tuning datasets. Saw [Company] is hiring for [role / area]. I'd love to contribute. Open to a quick chat or a take-home?`],
  ["E. Follow-up (5–7 days, once)", `Hi [Name], following up on my note about [Role] ([link]). Since then I've [shipped X / solved Y]. Happy to share more or take an assessment. Thanks for your time!`],
  ["F. Addverb colleagues (Week 6–7)", `Hi [Name], my internship ends on 18 Nov and I'm looking for full-time backend/AI roles. Two asks, only if you're comfortable:
1) a short LinkedIn recommendation about [specific work we did together], and
2) if you know anyone hiring at [companies], an intro would mean a lot.
Thanks for everything on [project]!`],
  ["G. Addverb manager: conversion ask (Week 1)", `Hi [Name], I've really enjoyed the VLA data work. Before my internship ends on 18 Nov, I wanted to ask whether there's a possibility of a full-time role on the team, and what the process and timeline would be. I'd like to plan my search around that. Happy to discuss whenever you're free.`],
  ["H. After an interview round (same day)", `Hi [Name], thanks for today's conversation on [topic]. I enjoyed discussing [specific thing]. One addition to my answer on [X]: [1 line]. Looking forward to next steps.`],
  ["LinkedIn headline", `Software Engineer · Python, Java, FastAPI, Node.js, React · Robotics data automation intern @ Addverb · Open to Software Engineer and AI Engineer roles · Immediate joiner`],
  ["LinkedIn About", `Software engineer who builds backend systems and full-stack products.

At Addverb's Advanced Robotics team (CEO Office) I worked on data collection for Vision-Language-Action models. I automated the teleoperation pipeline and built quality checks that [result].

Before that I shipped full-stack features at PureWashr (Next.js, Node, MongoDB) for [N] users, and interned at Credex.

Currently building DataLens, an open-source data-quality platform for LLM fine-tuning datasets: import from Hugging Face, 8 automatic checks per sample (duplicates, near-duplicates, PII, language, refusals, formatting), natural-language search and clean train/val export (FastAPI, Postgres/pgvector, Redis workers, React). [link]

Looking for Software Engineer and AI Engineer roles. Available from 19 Nov 2026.
Python · FastAPI · Node.js · React · PostgreSQL · Docker · LLM APIs`],
  ["Resume bullets: Addverb", `• Automated the teleoperation data-collection workflow (session setup, multi-camera recording, validation, upload) with Bash + Python, cutting operator overhead per episode from [X] to [Y] min and raising throughput to [N] episodes/day.
• Collected and curated [N]+ teleoperated manipulation demonstrations across [K] tasks on [robot arm], with [C] synchronized camera streams + joint states, used to train Vision-Language-Action (VLA) models.
• Built data-quality checks (frame drops, timestamp desync, failed-episode tagging) that flagged [X]% of bad episodes before training and reduced re-collection by [Y]%.
• Standardised dataset format and metadata ([LeRobot / RLDS / HDF5]) across [N] operators, so the ML team could train without manual cleanup.`],
  ["Resume bullets: PureWashr + Credex", `PureWashr
• Built and shipped [booking/order flow, admin dashboard] with Next.js/React, Node.js and MongoDB, serving [N] customers / [N] orders per month.
• Designed REST APIs for [orders, slots, payments], cutting p95 latency from [X] ms to [Y] ms through [indexing / caching / pagination].
• Integrated [payments / notifications / LLM support], improving [metric] by [X]%.

Credex
• Built [feature/tool] using [tech], used by [N users / internal team], [result].
• Automated [process] with Python [+ LLM API], saving ~[X] hours/week.`]
];

window.CHEATSHEET = `from collections import Counter, defaultdict, deque, OrderedDict
from functools import cache, lru_cache, reduce
from itertools import accumulate, combinations, permutations, product, pairwise
import heapq, bisect, math, sys
from math import inf

# Lists / strings
g = [[0] * m for _ in range(n)]       # 2-D CORRECT  ([[0]*m]*n shares rows!)
a.sort(key=lambda x: (x[1], -x[0]))   # multi-key sort
a[::-1]; a[i:j]                       # slicing COPIES: O(k)
"".join(parts)                        # never += strings in a loop
ord(c) - ord('a'); chr(97 + i); list(zip(*matrix))   # transpose
prefix = list(accumulate(a, initial=0))   # sum(a[i:j]) = prefix[j] - prefix[i]

# Dict / Counter
cnt = Counter(s); cnt.most_common(k)
cnt[c] -= 1
if cnt[c] == 0: del cnt[c]            # needed if you use len(cnt)
d = defaultdict(list); d[k].append(v)

# Deque / heap / bisect
q = deque([start]); q.append(x); q.popleft()     # list.pop(0) is O(n)
heapq.heappush(h, (prio, idx, item)); heapq.heappop(h)
heapq.heappush(h, -x)                 # max-heap via negation
bisect.bisect_left(a, x)  # first index >= x
bisect.bisect_right(a, x) # first index > x

# Recursion / DP
sys.setrecursionlimit(10**6)
@cache
def dp(i, j): ...

# Binary search on the answer
lo, hi = 1, max(piles)
while lo < hi:
    mid = (lo + hi) // 2
    if ok(mid): hi = mid
    else: lo = mid + 1

# Grid
DIRS = [(1,0),(-1,0),(0,1),(0,-1)]
if 0 <= nr < R and 0 <= nc < C: ...

# Numbers
-(-a // b)    # ceil division
int(a / b)    # truncate toward zero; a // b floors (-7 // 2 == -4)
divmod(a, b); pow(a, b, mod); x.bit_count()

# Fast input for OAs
input = sys.stdin.readline

# MISTAKES THAT COST MARKS
# def f(x, acc=[])        -> acc=None, then acc = acc or []
# res.append(path)        -> res.append(path[:])
# deep recursion crash    -> iterative stack or setrecursionlimit
# a[1:] inside recursion  -> pass indices
# x in list inside loops  -> use a set
# heap of nodes           -> (val, i, node) tie-breaker
# modify dict while iterating -> iterate list(d.items())
# 'is' for values         -> '==' (is only for None)`;
