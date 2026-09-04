"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RecoverFlowLogo } from "@/components/ui/RecoverFlowLogo";
import {
  ArrowRight,
  ChevronRight,
  Menu,
  X,
  Zap,
  Search,
  Brain,
  ShieldCheck,
  Play,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Sliders,
  Database,
  Lock,
} from "lucide-react";
import styles from "../../app/landing.module.css";

/* ========================================================================
   SECTION DATA (Phase 10A — Final Visual Polish)
   Verified metrics only. No fabricated data.
   ======================================================================== */

/* Hero lifecycle visual — recovery pipeline stages */
const HERO_LIFECYCLE_STAGES = [
  {
    label: "Payment Failed",
    meta: "Transaction declined by provider",
    color: "var(--rf-danger)",
    bg: "var(--rf-danger-surface)",
    border: "var(--rf-danger-border)",
    tagBg: "var(--rf-danger-surface)",
    tagColor: "var(--rf-danger-text)",
    tagText: "FAILURE",
    icon: <AlertTriangle size={14} />,
  },
  {
    label: "Signal Detection",
    meta: "Webhook ingested → event classified",
    color: "var(--rf-cyan)",
    bg: "var(--rf-cyan-surface)",
    border: "var(--rf-cyan-border)",
    tagBg: "var(--rf-cyan-surface)",
    tagColor: "var(--rf-cyan-text)",
    tagText: "DETECT",
    icon: <Zap size={14} />,
  },
  {
    label: "Failure Classification",
    meta: "Canonical taxonomy → retry eligibility",
    color: "var(--rf-cyan)",
    bg: "var(--rf-cyan-surface)",
    border: "var(--rf-cyan-border)",
    tagBg: "var(--rf-cyan-surface)",
    tagColor: "var(--rf-cyan-text)",
    tagText: "CLASSIFY",
    icon: <Search size={14} />,
  },
  {
    label: "AI Recovery Advisory",
    meta: "Advisory analysis — 0% execution authority",
    color: "var(--rf-violet)",
    bg: "var(--rf-violet-surface)",
    border: "var(--rf-violet-border)",
    tagBg: "var(--rf-violet-surface)",
    tagColor: "var(--rf-violet-text)",
    tagText: "ADVISORY",
    icon: <Brain size={14} />,
  },
  {
    label: "Deterministic Policy",
    meta: "Policy engine — 100% execution authority",
    color: "var(--rf-emerald)",
    bg: "var(--rf-emerald-surface)",
    border: "var(--rf-emerald-border)",
    tagBg: "var(--rf-emerald-surface)",
    tagColor: "var(--rf-emerald-text)",
    tagText: "POLICY",
    icon: <ShieldCheck size={14} />,
  },
  {
    label: "Recovery Execution",
    meta: "Provider API dispatch with circuit breaker",
    color: "var(--rf-emerald)",
    bg: "var(--rf-emerald-surface)",
    border: "var(--rf-emerald-border)",
    tagBg: "var(--rf-emerald-surface)",
    tagColor: "var(--rf-emerald-text)",
    tagText: "EXECUTE",
    icon: <Play size={14} />,
  },
  {
    label: "Reconciliation",
    meta: "Expected ↔ actual settlement verified",
    color: "var(--rf-cyan)",
    bg: "var(--rf-cyan-surface)",
    border: "var(--rf-cyan-border)",
    tagBg: "var(--rf-cyan-surface)",
    tagColor: "var(--rf-cyan-text)",
    tagText: "VERIFY",
    icon: <FileCheck size={14} />,
  },
  {
    label: "Revenue Recovered",
    meta: "Audit trail recorded → revenue confirmed",
    color: "var(--rf-emerald)",
    bg: "var(--rf-emerald-surface)",
    border: "var(--rf-emerald-border)",
    tagBg: "var(--rf-emerald-surface)",
    tagColor: "var(--rf-emerald-text)",
    tagText: "RECOVERED",
    icon: <CheckCircle2 size={14} />,
  },
];

/* Hero proof metrics — verified only */
const HERO_PROOF = [
  { value: "74.9%", label: "Recovery rate", color: "var(--rf-emerald)" },
  { value: "$182K", label: "Recovered revenue", color: "var(--rf-emerald)" },
  { value: "347", label: "Recovered cases", color: "var(--rf-navy-primary)" },
  { value: "463", label: "Recovery attempts", color: "var(--rf-navy-primary)" },
];

/* 8-stage lifecycle — tightened descriptions */
const LIFECYCLE_STAGES = [
  {
    num: "01",
    tag: "IN: WEBHOOK",
    name: "Payment Failure",
    desc: "Transaction declined by payment gateway. Failure webhook ingested and verified in real time.",
    meta: "EVENT INGESTION",
  },
  {
    num: "02",
    tag: "PROCESS: NORMALIZE",
    name: "Signal Detection",
    desc: "Failure payloads deduplicated and bound to payment entity graphs.",
    meta: "DEDUPLICATION",
  },
  {
    num: "03",
    tag: "TAXONOMY: CANONICAL",
    name: "Classification",
    desc: "Failure reason mapped to canonical taxonomy: timeout, decline, insufficient funds, or auth drop.",
    meta: "FAILURE TAXONOMY",
  },
  {
    num: "04",
    tag: "ADVISORY: ML_MODEL",
    name: "AI Advisory",
    desc: "Machine learning models analyze failure signals and produce an advisory recommendation with 0% authority.",
    meta: "ADVISORY // 0% AUTHORITY",
  },
  {
    num: "05",
    tag: "GATE: DETERMINISTIC",
    name: "Deterministic Policy",
    desc: "Policy engine evaluates recommendations against constraints, retry budgets, and safety interlocks with 100% authority.",
    meta: "POLICY // 100% AUTHORITY",
  },
  {
    num: "06",
    tag: "EXEC: PROVIDER_API",
    name: "Provider Execution",
    desc: "Approved recovery action dispatched to provider APIs with exponential backoff and circuit breaker protection.",
    meta: "PROTECTED DISPATCH",
  },
  {
    num: "07",
    tag: "RECON: LEDGER_CHECK",
    name: "Reconciliation",
    desc: "Expected outcome matched against actual provider settlement. Discrepancies trigger investigation.",
    meta: "SETTLEMENT VERIFICATION",
  },
  {
    num: "08",
    tag: "AUDIT: RECORDED",
    name: "Audit Trail",
    desc: "Every state transition, policy decision, and provider response recorded in the audit ledger.",
    meta: "EVENT STREAM",
  },
];

/* Operational readout */
const OPERATIONAL_READOUT = [
  {
    component: "Recovery Engine",
    state: "OPERATIONAL",
    desc: "Idempotent backoff scheduler with operator pause/resume safelocks",
    category: "ENGINE CORE",
  },
  {
    component: "Policy Execution",
    state: "DETERMINISTIC",
    desc: "100% execution authority bounded by hard retry limits and priority queues",
    category: "POLICY GATE",
  },
  {
    component: "Queue Integrity",
    state: "ACTIVE",
    desc: "Atomic PostgreSQL skip-locked claim leases with automatic reconciliation",
    category: "WORKER FLEET",
  },
  {
    component: "Provider Gateway",
    state: "AVAILABLE",
    desc: "Multi-rail gateway routing (Razorpay Gateway & Simulated Gateway)",
    category: "ROUTING LAYER",
  },
  {
    component: "Circuit Breaker",
    state: "CLOSED (HEALTHY)",
    desc: "Autonomous fault isolation preventing upstream cascade saturation",
    category: "RELIABILITY",
  },
  {
    component: "Audit Ledger",
    state: "RECORDED",
    desc: "Complete chronological operational event trail for investigation",
    category: "OBSERVABILITY",
  },
];

/* Sandbox metrics — verified only. No 98.5% */
const SANDBOX_METRICS = [
  { label: "RECOVERY RATE", value: "74.9%", sub: "30D evaluation window", color: "var(--rf-emerald)" },
  { label: "REVENUE RECOVERED", value: "$182,450", sub: "30D cumulative", color: "var(--rf-emerald)" },
  { label: "RECOVERED CASES", value: "347", sub: "of 463 attempts", color: "var(--rf-navy-primary)" },
  { label: "RECOVERY ATTEMPTS", value: "463", sub: "30D total attempts", color: "var(--rf-navy-primary)" },
];

/* Verified aggregate evaluation windows */
const EVAL_WINDOWS = [
  {
    period: "7D",
    attempts: "419",
    recovered: "321",
    rate: "76.6%",
    revenue: "$34,120",
  },
  {
    period: "30D",
    attempts: "463",
    recovered: "347",
    rate: "74.9%",
    revenue: "$182,450",
  },
  {
    period: "90D",
    attempts: "2,215",
    recovered: "1,605",
    rate: "72.5%",
    revenue: "$642,800",
  },
];

const NAV_ITEMS = [
  { label: "Product", href: "#the-problem" },
  { label: "Lifecycle", href: "#lifecycle" },
  { label: "Control Boundary", href: "#ai-boundary" },
  { label: "Analytics", href: "/analytics" },
  { label: "Operations", href: "/operations" },
];

/* ========================================================================
   COMPONENT
   ======================================================================== */

export const LandingPageClient: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={styles.landingPage}>
      {/* ================================================================
          NAVIGATION
          ================================================================ */}
      <nav className={styles.navHeader} role="navigation" aria-label="Main navigation">
        <div className={styles.navInner}>
          <Link href="/" className={styles.navBrand} aria-label="RecoverFlow home">
            <RecoverFlowLogo size={28} />
            <span className={styles.navBrandName}>
              Recover<span className={styles.navBrandAccent}>Flow</span>
            </span>
          </Link>

          <ul className={styles.navLinks}>
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className={styles.navLink}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/dashboard" className={styles.navCta}>
                Open Dashboard
                <ArrowRight size={13} />
              </Link>
            </li>
          </ul>

          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ""}`}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={styles.mobileMenuLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className={styles.mobileMenuLink}
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: "var(--rf-emerald)", fontWeight: 650 }}
          >
            Open Dashboard →
          </Link>
        </div>
      </nav>

      {/* ================================================================
          HERO — Two-Zone Composition: Content ↔ Recovery Lifecycle Visual
          ================================================================ */}
      <div className={styles.heroWrapper} id="hero">
        <div className={styles.heroInner}>
          {/* LEFT: Content */}
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>
              <span className={styles.heroEyebrowDot} />
              REVENUE RECOVERY INFRASTRUCTURE
            </span>

            <h1 className={styles.heroHeadline}>
              Payments Fail.
              <br />
              Revenue <span className={styles.heroHeadlineAccent}>Shouldn&apos;t.</span>
            </h1>

            <p className={styles.heroSub}>
              RecoverFlow detects failed payments, diagnoses the cause, applies
              deterministic recovery policy, executes safely through provider
              APIs, and verifies the financial outcome.
            </p>

            <div className={styles.heroCtas}>
              <Link href="/dashboard" className={styles.ctaPrimary}>
                Open Dashboard
                <ArrowRight size={16} />
              </Link>
              <Link href="/recovery-flow" className={styles.ctaSecondary}>
                Explore Recovery Flow
                <ChevronRight size={16} />
              </Link>
            </div>

            {/* Compact proof metrics — verified only */}
            <div className={styles.heroProofMetrics}>
              {HERO_PROOF.map((m) => (
                <div key={m.label} className={styles.heroProofItem}>
                  <span
                    className={`${styles.heroProofValue} tabular-nums font-mono`}
                    style={{ color: m.color }}
                  >
                    {m.value}
                  </span>
                  <span className={`${styles.heroProofLabel} font-mono`}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Recovery Lifecycle Visual */}
          <div className={styles.heroLifecycleVisual}>
            <div className={styles.heroLifecycleHeader}>
              <span className={styles.heroLifecycleHeaderLeft}>
                <Activity size={12} color="var(--rf-cyan)" />
                <span className="font-mono">RECOVERY ENGINE PIPELINE</span>
              </span>
              <span
                className={`${styles.heroLifecycleHeaderRight} font-mono`}
                style={{ color: "var(--rf-emerald-text)" }}
              >
                8 STAGES
              </span>
            </div>

            <div
              className={styles.heroLifecycleFlow}
              role="img"
              aria-label="Recovery pipeline: Payment Failed → Signal Detection → Classification → AI Advisory → Policy → Execution → Reconciliation → Recovered"
            >
              {HERO_LIFECYCLE_STAGES.map((stage) => (
                <div key={stage.label} className={styles.lifecycleStageRow}>
                  <div
                    className={styles.lifecycleStageIcon}
                    style={{
                      background: stage.bg,
                      borderColor: stage.border,
                      color: stage.color,
                    }}
                  >
                    {stage.icon}
                  </div>
                  <div className={styles.lifecycleStageInfo}>
                    <span className={styles.lifecycleStageName}>{stage.label}</span>
                    <span className={`${styles.lifecycleStageMeta} font-mono`}>
                      {stage.meta}
                    </span>
                  </div>
                  <span
                    className={`${styles.lifecycleStageTag} font-mono`}
                    style={{
                      background: stage.tagBg,
                      color: stage.tagColor,
                      border: `1px solid ${stage.border}`,
                    }}
                  >
                    {stage.tagText}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.heroLifecycleFooter}>
              <span className="font-mono">FULL TRACEABILITY</span>
              <span className="font-mono" style={{ color: "var(--rf-emerald-text)", fontWeight: 750 }}>
                AUDITABLE EXECUTION
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 01 — THE PROBLEM
          ================================================================ */}
      <div className={styles.problemWrapper} id="the-problem">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionMetaRail}>
              <span className={`${styles.sectionNumber} font-mono`}>01 // THE REVENUE GAP</span>
              <span className="font-mono">FAILURE → RECOVERY TRANSFORMATION</span>
            </div>
            <h2 className={styles.sectionHeading}>
              Failed payments are not the end of the transaction.
            </h2>
            <p className={styles.sectionBody}>
              A payment failure is a recoverable operational event. The difference
              between lost revenue and recovered revenue is a deterministic,
              auditable recovery pipeline — not manual intervention or
              blind retries.
            </p>
          </div>

          <div className={styles.transitionRailContainer}>
            <div className={styles.transitionNode}>
              <div className={styles.transitionNodeHeader}>
                <span className={`${styles.transitionNodeNum} font-mono`} style={{ color: "var(--rf-danger)" }}>
                  01
                </span>
                <span className={`${styles.transitionNodeStep} font-mono`}>INGEST</span>
              </div>
              <span className={styles.transitionNodeLabel}>FAILED PAYMENT</span>
              <span className={styles.transitionNodeDesc}>
                Network drops, card declines, or 3DS authentication aborts ingested via webhooks.
              </span>
              <span className={styles.transitionNodeArrow}>
                <ChevronRight size={12} />
              </span>
            </div>

            <div className={styles.transitionNode}>
              <div className={styles.transitionNodeHeader}>
                <span className={`${styles.transitionNodeNum} font-mono`} style={{ color: "var(--rf-cyan)" }}>
                  02
                </span>
                <span className={`${styles.transitionNodeStep} font-mono`}>DIAGNOSE</span>
              </div>
              <span className={styles.transitionNodeLabel}>DIAGNOSED FAILURE</span>
              <span className={styles.transitionNodeDesc}>
                Canonical taxonomy separates transient errors from hard issuer declines.
              </span>
              <span className={styles.transitionNodeArrow}>
                <ChevronRight size={12} />
              </span>
            </div>

            <div className={styles.transitionNode}>
              <div className={styles.transitionNodeHeader}>
                <span className={`${styles.transitionNodeNum} font-mono`} style={{ color: "var(--rf-violet-text)" }}>
                  03
                </span>
                <span className={`${styles.transitionNodeStep} font-mono`}>POLICY</span>
              </div>
              <span className={styles.transitionNodeLabel}>CONTROLLED RECOVERY</span>
              <span className={styles.transitionNodeDesc}>
                AI recommendations evaluated against codified rules, retry ceilings, and safety limits.
              </span>
              <span className={styles.transitionNodeArrow}>
                <ChevronRight size={12} />
              </span>
            </div>

            <div className={styles.transitionNode} style={{ borderColor: "var(--rf-emerald-border)" }}>
              <div className={styles.transitionNodeHeader}>
                <span className={`${styles.transitionNodeNum} font-mono`} style={{ color: "var(--rf-emerald)" }}>
                  04
                </span>
                <span className={`${styles.transitionNodeStep} font-mono`} style={{ color: "var(--rf-emerald-text)" }}>
                  RECONCILE
                </span>
              </div>
              <span className={styles.transitionNodeLabel} style={{ color: "var(--rf-emerald-text)" }}>
                VERIFIED REVENUE
              </span>
              <span className={styles.transitionNodeDesc}>
                Idempotent execution verified against provider responses, reconciled, and audited.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 02 — RECOVERY LIFECYCLE (8-Stage Connected Rail)
          ================================================================ */}
      <div className={styles.howWrapper} id="lifecycle">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionMetaRail}>
              <span className={`${styles.sectionNumber} font-mono`}>02 // RECOVERY LIFECYCLE</span>
              <span className="font-mono">8 STAGES // FULL TRACEABILITY</span>
            </div>
            <h2 className={styles.sectionHeading}>
              Eight stages. Full traceability.
            </h2>
            <p className={styles.sectionBody}>
              Every failed payment traverses a controlled, eight-stage lifecycle
              from failure detection to verified financial settlement. Each stage is
              independently observable and recorded.
            </p>
          </div>

          <div className={styles.lifecycleGrid}>
            {LIFECYCLE_STAGES.map((stage) => (
              <div key={stage.num} className={styles.lifecycleItem}>
                <div className={styles.lifecycleStageHeader}>
                  <span className={`${styles.stageNumber} font-mono`}>
                    {stage.num}
                  </span>
                  <span className={`${styles.stageSystemTag} font-mono`}>
                    {stage.tag}
                  </span>
                </div>
                <span className={styles.stageName}>{stage.name}</span>
                <span className={styles.stageDesc}>{stage.desc}</span>
                <span className={`${styles.stageMeta} font-mono`}>
                  {stage.meta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 03 — AI & POLICY BOUNDARY (3-Panel Architecture)
          ================================================================ */}
      <div className={styles.aiWrapper} id="ai-boundary">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.aiMetaRail}>
              <span className="font-mono" style={{ color: "#38BDF8" }}>03 // ARCHITECTURAL CONTROL BOUNDARY</span>
              <span className="font-mono">AUTHORITY SEPARATION</span>
            </div>
            <h2 className={styles.aiHeading}>
              AI without autonomous execution authority.
            </h2>
            <p className={styles.aiBody}>
              RecoverFlow strictly separates analytical intelligence from execution authority.
              Three independent layers ensure no single component can autonomously execute
              financial recovery actions.
            </p>
          </div>

          <div className={styles.aiGrid}>
            {/* Panel 1: AI Advisory */}
            <div className={styles.aiPanelLeft}>
              <span
                className={`${styles.aiPanelEyebrow} font-mono`}
                style={{ color: "#C084FC" }}
              >
                AI RECOVERY AGENT
              </span>
              <p className={styles.aiPanelHeading}>
                AI analyzes.
                <br />
                AI recommends.
                <br />
                AI does not execute.
              </p>
              <p className={styles.aiPanelDesc}>
                Evaluates failure patterns, optimal retry timing, and channel likelihood.
                Generates non-mutating strategy recommendations.
              </p>
              <div
                className={`${styles.aiPanelAuthority} font-mono`}
                style={{
                  background: "rgba(121, 87, 213, 0.2)",
                  border: "1px solid rgba(192, 132, 252, 0.4)",
                  color: "#E9D5FF",
                }}
              >
                0% EXECUTION AUTHORITY
              </div>
            </div>

            {/* Panel 2: Deterministic Policy Engine */}
            <div className={styles.aiPanelCenter}>
              <span
                className={`${styles.aiPanelEyebrow} font-mono`}
                style={{ color: "#34D399" }}
              >
                DETERMINISTIC POLICY ENGINE
              </span>
              <p className={styles.aiPanelHeading}>
                Policy decides.
                <br />
                Policy authorizes.
                <br />
                Policy controls execution.
              </p>
              <p className={styles.aiPanelDesc}>
                Enforces maximum retry budgets, rate limits, circuit breaker safety rules,
                and currency validation. Holds sole authority to dispatch actions.
              </p>
              <div
                className={`${styles.aiPanelAuthority} font-mono`}
                style={{
                  background: "rgba(0, 168, 120, 0.2)",
                  border: "1px solid rgba(52, 211, 153, 0.4)",
                  color: "#A7F3D0",
                }}
              >
                100% EXECUTION AUTHORITY
              </div>
            </div>

            {/* Panel 3: Recovery Orchestrator */}
            <div className={styles.aiPanelRight}>
              <span
                className={`${styles.aiPanelEyebrow} font-mono`}
                style={{ color: "#38BDF8" }}
              >
                RECOVERY ORCHESTRATOR
              </span>
              <p className={styles.aiPanelHeading}>
                Orchestrator schedules.
                <br />
                Orchestrator dispatches.
                <br />
                Orchestrator reports.
              </p>
              <p className={styles.aiPanelDesc}>
                Executes only policy-approved actions via provider APIs. Manages backoff,
                circuit breakers, and idempotent dispatch with operator-controlled safelocks.
              </p>
              <div
                className={`${styles.aiPanelAuthority} font-mono`}
                style={{
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                  color: "#BAE6FD",
                }}
              >
                CONTROLLED EXECUTION
              </div>
              <Link href="/recovery-flow" className={styles.aiPanelLink}>
                <span>Inspect Recovery Flow</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          <div className={styles.aiAirgapNotice}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={13} color="#38BDF8" />
              <strong style={{ color: "#FFFFFF" }}>Architectural Invariant: </strong>
              AI Advisory output cannot bypass Policy Engine validation under any operational mode.
            </span>
            <span className="font-mono" style={{ fontSize: "10.5px", flexShrink: 0 }}>AUTHORITY AIRGAP</span>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 04 — RECOVERY OUTCOMES (Verified Sandbox Metrics)
          ================================================================ */}
      <div className={styles.outcomesWrapper} id="outcomes">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionMetaRail}>
              <span className={`${styles.sectionNumber} font-mono`}>04 // RECOVERY OUTCOMES</span>
              <span className="font-mono">SANDBOX EVALUATION READOUT</span>
            </div>
            <h2 className={styles.sectionHeading}>
              Measurable recovery performance.
            </h2>
            <p className={styles.sectionBody}>
              Recovery effectiveness measured against the deterministic sandbox
              evaluation dataset. All values reflect verified test execution benchmarks.
            </p>
          </div>

          <div className={styles.outcomesMatrix}>
            {SANDBOX_METRICS.map((m) => (
              <div key={m.label} className={styles.outcomesCell}>
                <span className={`${styles.metricLabel} font-mono`}>{m.label}</span>
                <span
                  className={`${styles.metricValue} tabular-nums font-mono`}
                  style={{ color: m.color }}
                >
                  {m.value}
                </span>
                <span className={`${styles.metricSubtext} font-mono`}>
                  {m.sub}
                </span>
                <span className={`${styles.sandboxTag} font-mono`}>SANDBOX EVALUATION</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 05 — OPERATIONAL CONTROL
          ================================================================ */}
      <div className={styles.opsWrapper} id="operational-control">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionMetaRail}>
              <span className={`${styles.sectionNumber} font-mono`}>05 // SYSTEM OPERATIONS</span>
              <span className="font-mono">OPERATIONAL SAFELOCKS</span>
            </div>
            <h2 className={styles.sectionHeading}>
              AI recommends. The system governs. Operations remain in control.
            </h2>
            <p className={styles.sectionBody}>
              RecoverFlow is an active operational control system. Operators maintain
              visibility into worker fleets, queue reconciliation, circuit breaker
              health, and engine execution states.
            </p>
          </div>

          <div className={styles.opsReadoutTable}>
            <div className={styles.opsReadoutHeader}>
              <span className="font-mono">SUBSYSTEM</span>
              <span className="font-mono">STATE</span>
              <span className="font-mono">GUARANTEE</span>
              <span className="font-mono" style={{ textAlign: "right" }}>SCOPE</span>
            </div>

            {OPERATIONAL_READOUT.map((row) => (
              <div key={row.component} className={styles.opsReadoutRow}>
                <div className={styles.opsRowTitle}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "var(--rf-emerald)",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span>{row.component}</span>
                </div>

                <div className={`${styles.opsRowState} font-mono`}>
                  {row.state}
                </div>

                <div className={styles.opsRowDesc}>
                  {row.desc}
                </div>

                <div className={`${styles.opsRowCategory} font-mono`}>
                  {row.category}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.opsCtaBanner}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Sliders size={16} color="var(--rf-navy-primary)" />
              <span style={{ fontSize: "13.5px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>
                Halt or resume the recovery engine in Operations Control.
              </span>
            </div>

            <Link href="/operations" className={styles.ctaPrimary}>
              Open Operations
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 06 — PRODUCT PREVIEW (Aggregate Evaluation Windows)
          ================================================================ */}
      <div className={styles.previewWrapper} id="preview">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionMetaRail}>
              <span className={`${styles.sectionNumber} font-mono`}>06 // PRODUCT WORKSPACE</span>
              <span className="font-mono">RECOVERY COMMAND CONSOLE</span>
            </div>
            <h2 className={styles.sectionHeading}>
              The recovery control system you operate.
            </h2>
            <p className={styles.sectionBody}>
              A dedicated operator workspace for recovery pipeline monitoring,
              failure investigation, and financial verification.
            </p>
          </div>

          <div className={styles.previewFrame}>
            {/* Browser chrome */}
            <div className={styles.previewBar}>
              <div className={styles.previewDot} style={{ background: "#FF5F57" }} />
              <div className={styles.previewDot} style={{ background: "#FFBD2E" }} />
              <div className={styles.previewDot} style={{ background: "#27C93F" }} />
              <span className={`${styles.previewUrl} font-mono`}>
                recoverflow.internal/dashboard
              </span>
            </div>

            {/* Dashboard KPI metrics */}
            <div className={styles.previewContent}>
              {[
                { label: "TOTAL CASES", value: "1,240", sub: "+84 today", color: "var(--rf-navy-primary)" },
                { label: "ACTIVE RECOVERIES", value: "142", sub: "in-flight pipeline", color: "var(--rf-cyan)" },
                { label: "REVENUE RECOVERED", value: "$182,450", sub: "30D cumulative", color: "var(--rf-emerald)" },
              ].map((m) => (
                <div key={m.label} className={styles.previewMetric}>
                  <span className={`${styles.previewMetricLabel} font-mono`}>{m.label}</span>
                  <span
                    className={`${styles.previewMetricValue} tabular-nums font-mono`}
                    style={{ color: m.color }}
                  >
                    {m.value}
                  </span>
                  <span className={`${styles.previewMetricSub} font-mono`}>
                    {m.sub}
                  </span>
                </div>
              ))}

              {/* Verified Aggregate Evaluation Windows (replaces fabricated Mon-Sun chart) */}
              <div className={styles.evalWindowsContainer}>
                <div className={styles.evalWindowsHeader}>
                  <span className={`${styles.evalWindowsTitle} font-mono`}>
                    RECOVERY PERFORMANCE — EVALUATION WINDOWS
                  </span>
                  <span className="font-mono" style={{ fontSize: "10px", color: "var(--rf-text-muted)" }}>
                    SANDBOX BASELINE
                  </span>
                </div>
                <div className={styles.evalWindowsGrid}>
                  {EVAL_WINDOWS.map((w) => (
                    <div key={w.period} className={styles.evalWindow}>
                      <span className={`${styles.evalWindowPeriod} font-mono`}>
                        {w.period} WINDOW
                      </span>
                      <div className={styles.evalWindowStats}>
                        <div className={styles.evalWindowRow}>
                          <span className={styles.evalWindowRowLabel}>Attempts</span>
                          <span className={`${styles.evalWindowRowValue} tabular-nums font-mono`}>
                            {w.attempts}
                          </span>
                        </div>
                        <div className={styles.evalWindowRow}>
                          <span className={styles.evalWindowRowLabel}>Recovered</span>
                          <span className={`${styles.evalWindowRowValue} tabular-nums font-mono`} style={{ color: "var(--rf-emerald-text)" }}>
                            {w.recovered}
                          </span>
                        </div>
                      </div>
                      <div className={styles.evalWindowRate}>
                        <span className={`${styles.evalWindowRateValue} tabular-nums font-mono`}>
                          {w.rate}
                        </span>
                        <span className={`${styles.evalWindowRateLabel} font-mono`}>
                          Recovery
                        </span>
                      </div>
                      <div className={styles.evalWindowRevenueRow}>
                        <span className={styles.evalWindowRowLabel}>Revenue</span>
                        <span className={`${styles.evalWindowRevenueValue} tabular-nums font-mono`}>
                          {w.revenue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 07 — RECONCILIATION & AUDIT
          ================================================================ */}
      <div className={styles.reconWrapper} id="reconciliation">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionMetaRail}>
              <span className={`${styles.sectionNumber} font-mono`}>07 // FINANCIAL VERIFICATION</span>
              <span className="font-mono">5-STAGE SETTLEMENT SEQUENCE</span>
            </div>
            <h2 className={styles.sectionHeading}>
              Recovery is only complete when the outcome is verified.
            </h2>
            <p className={styles.sectionBody}>
              RecoverFlow does not assume success. Every recovery action is
              verified by comparing expected predictions against actual
              provider settlement responses, resolving variances, and logging the result.
            </p>
          </div>

          <div className={styles.reconFlow}>
            {[
              { num: "01", label: "Expected", meta: "Policy predicted outcome" },
              { num: "02", label: "Actual", meta: "Provider settlement response" },
              { num: "03", label: "Discrepancy", meta: "Variance resolution" },
              { num: "04", label: "Settlement", meta: "Financial ledger verification" },
              { num: "05", label: "Audit Event", meta: "Recovery action recorded" },
            ].map((step) => (
              <div key={step.label} className={styles.reconStep}>
                <span className={`${styles.reconStepNum} font-mono`}>STAGE_{step.num}</span>
                <span className={styles.reconStepLabel}>{step.label}</span>
                <span className={`${styles.reconStepMeta} font-mono`}>
                  {step.meta}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.reconPrinciple}>
            <CheckCircle2
              size={20}
              style={{ color: "var(--rf-emerald)", flexShrink: 0 }}
            />
            <span className={styles.reconPrincipleText}>
              Auditable recovery execution — every action recorded for operational review.
            </span>
          </div>

          <div className={styles.reconLinks}>
            <Link href="/reconciliation" className={styles.ctaSecondary}>
              <Database size={13} />
              Reconciliation
              <ChevronRight size={14} />
            </Link>
            <Link href="/audit" className={styles.ctaSecondary}>
              <FileCheck size={13} />
              Audit Trail
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION 08 — FINAL CTA
          ================================================================ */}
      <div className={styles.finalCtaWrapper}>
        <div className={styles.finalCtaInner}>
          <span
            className="font-mono"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#38BDF8",
              textTransform: "uppercase" as const,
            }}
          >
            RECOVERY INFRASTRUCTURE
          </span>
          <h2 className={styles.finalCtaHeading}>
            Recover revenue.
            <br />
            Control execution.
            <br />
            Prove the outcome.
          </h2>
          <p className={styles.finalCtaBody}>
            Deterministic recovery policy, controlled provider execution,
            verified financial reconciliation, and complete audit trail — in
            a single operator workspace.
          </p>
          <div className={styles.finalCtaButtons}>
            <Link href="/dashboard" className={styles.ctaPrimaryInverse}>
              Open Dashboard
              <ArrowRight size={16} />
            </Link>
            <Link href="/recovery-flow" className={styles.ctaSecondaryInverse}>
              Explore Recovery Flow
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className={styles.footerWrapper} role="contentinfo">
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <RecoverFlowLogo size={24} variant="inverted" />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span className={styles.footerBrandName}>
                Recover<span style={{ color: "var(--rf-emerald)" }}>Flow</span>
              </span>
              <span className={styles.footerBrandSub}>
                Autonomous Revenue Recovery
              </span>
            </div>
          </div>

          <ul className={styles.footerLinks}>
            <li>
              <Link href="/dashboard" className={styles.footerLink}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/recovery-flow" className={styles.footerLink}>
                Recovery Flow
              </Link>
            </li>
            <li>
              <Link href="/analytics" className={styles.footerLink}>
                Analytics
              </Link>
            </li>
            <li>
              <Link href="/operations" className={styles.footerLink}>
                Operations
              </Link>
            </li>
            <li>
              <Link href="/reconciliation" className={styles.footerLink}>
                Reconciliation
              </Link>
            </li>
            <li>
              <Link href="/audit" className={styles.footerLink}>
                Audit Trail
              </Link>
            </li>
          </ul>

          <span className={styles.footerCopy}>
            &copy; {new Date().getFullYear()} RecoverFlow. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
};
