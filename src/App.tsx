import { useEffect, useState } from "react";
import {
  Download,
  LoaderCircle,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { createEmptyCV, defaultCV } from "./data/defaultCV";
import {
  api,
  type AuthUser,
  type BulletSuggestion,
  type Experience,
  type ResumeDraft,
} from "./services/api";
import "./App.css";

type SectionKey =
  "personal" | "experience" | "education" | "skills" | "languages" | "projects";
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <b aria-hidden="true"> *</b>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        spellCheck
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
function SectionHeading({
  title,
  description,
  onAdd,
}: {
  title: string;
  description: string;
  onAdd?: () => void;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {onAdd && (
        <button
          className="icon-button"
          type="button"
          title={`Add ${title}`}
          onClick={onAdd}
        >
          <Plus size={17} />
        </button>
      )}
    </div>
  );
}

function EnhanceButton({
  bullet,
  jobTitle,
  onApply,
}: {
  bullet: string;
  jobTitle?: string;
  onApply: (text: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<BulletSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const enhance = async () => {
    if (!bullet.trim()) {
      setError("Enter a bullet first.");
      setOpen(true);
      return;
    }
    setLoading(true);
    setError("");
    setOpen(true);
    try {
      setSuggestions(await api.enhanceBullet(bullet, jobTitle));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Enhancement failed. Check the API key or network.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <span className="enhance-wrap">
      <button
        className="enhance-button"
        type="button"
        title="Enhance bullet with Qwen"
        onClick={enhance}
        disabled={loading}
      >
        ✦ Enhance
      </button>
      {open && (
        <div className="suggestion-popover">
          <div className="suggestion-header">
            <strong>ATS suggestions</strong>
            <button
              type="button"
              aria-label="Close suggestions"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          {loading && (
            <div className="suggestion-skeletons">
              <span />
              <span />
            </div>
          )}
          {error && <p className="suggestion-error">{error}</p>}
          {!loading &&
            !error &&
            suggestions.map((suggestion) => (
              <div className="suggestion" key={suggestion.id}>
                <div>
                  <span className="suggestion-focus">{suggestion.focus}</span>
                  <p>{suggestion.text}</p>
                  <small>{suggestion.keywords.join(" · ")}</small>
                </div>
                <button
                  className="suggestion-apply"
                  type="button"
                  onClick={() => {
                    onApply(suggestion.text);
                    setOpen(false);
                  }}
                >
                  Apply
                </button>
              </div>
            ))}
        </div>
      )}
    </span>
  );
}

function ExperienceEditor({
  item,
  onUpdate,
  onRemove,
}: {
  item: Experience;
  onUpdate: (field: string, value: string | string[] | boolean) => void;
  onRemove: () => void;
}) {
  return (
    <div className="repeat-card">
      <button
        className="remove-button"
        type="button"
        title="Remove experience"
        onClick={onRemove}
      >
        <Trash2 size={15} />
      </button>
      <div className="form-grid">
        <Field
          label="Job title"
          required
          value={item.job_title}
          onChange={(value) => onUpdate("job_title", value)}
        />
        <Field
          label="Company"
          required
          value={item.company}
          onChange={(value) => onUpdate("company", value)}
        />
        <Field
          label="Location"
          value={item.location}
          onChange={(value) => onUpdate("location", value)}
        />
        <Field
          label="Start"
          type="month"
          value={item.start_date}
          onChange={(value) => onUpdate("start_date", value)}
        />
        <Field
          label="End"
          type="month"
          value={item.end_date}
          onChange={(value) => onUpdate("end_date", value)}
        />
      </div>
      <label className="check-field">
        <input
          type="checkbox"
          checked={item.is_current}
          onChange={(event) => onUpdate("is_current", event.target.checked)}
        />{" "}
        Current role
      </label>
      <div className="bullet-list">
        <span className="bullet-label">
          Achievements <small>Use 2-6 concise bullets</small>
        </span>
        {item.achievements.map((achievement, index) => (
          <div className="bullet-row" key={`${item.id}-bullet-${index}`}>
            <input
              className="bullet-input"
              value={achievement}
              spellCheck
              placeholder="Accomplished [X], measured by [Y], by doing [Z]"
              onChange={(event) =>
                onUpdate(
                  "achievements",
                  item.achievements.map((value, itemIndex) =>
                    itemIndex === index ? event.target.value : value,
                  ),
                )
              }
            />
            <EnhanceButton
              bullet={achievement}
              jobTitle={item.job_title}
              onApply={(text) =>
                onUpdate(
                  "achievements",
                  item.achievements.map((value, itemIndex) =>
                    itemIndex === index ? text : value,
                  ),
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthPanel({ onAuthenticated, initialNotice = "" }: { onAuthenticated: (user: AuthUser) => void; initialNotice?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ full_name: "", email: "", phone_number: "", location: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(initialNotice);
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (initialNotice) setNotice(initialNotice); }, [initialNotice]);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setNotice(""); setLoading(true);
    try {
      if (mode === "login") {
        onAuthenticated(await api.login(form.email, form.password));
      } else {
        const result = await api.register(form);
        setNotice(result.message);
        if (result.verification_email_sent) setMode("login");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Authentication failed. Check your details and try again.");
    } finally { setLoading(false); }
  };
  return <main className="auth-shell"><div className="auth-panel"><div className="auth-brand"><img className="brand-symbol" src="/seig-favicon.svg" alt="" /><img className="brand-wordmark" src="/seig-wordmark.svg" alt="Seig" /></div><h1>{mode === "login" ? "Sign in" : "Create account"}</h1><div className="auth-tabs"><button className={mode === "login" ? "active" : ""} type="button" onClick={() => { setMode("login"); setError(""); setNotice(""); }}>Sign in</button><button className={mode === "register" ? "active" : ""} type="button" onClick={() => { setMode("register"); setError(""); setNotice(""); }}>Create account</button></div><form onSubmit={submit}>{mode === "register" && <><label className="auth-field"><span>Full name</span><input required value={form.full_name} onChange={(event) => update("full_name", event.target.value)} /></label><label className="auth-field"><span>Phone</span><input required type="tel" value={form.phone_number} onChange={(event) => update("phone_number", event.target.value)} /></label></>}<label className="auth-field"><span>Email</span><input required type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} /></label><label className="auth-field"><span>Password</span><input required minLength={8} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(event) => update("password", event.target.value)} /></label>{error && <p className="auth-error" role="alert">{error}</p>}{notice && <p className="auth-success" role="status">{notice}</p>}<button className="button primary auth-submit" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={16} /> : null}{loading ? "Please wait..." : mode === "login" ? "Sign in to Seig" : "Create account"}</button></form></div></main>;
}

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authNotice, setAuthNotice] = useState("");
  const [resume, setResume] = useState<ResumeDraft>(() =>
    structuredClone(defaultCV),
  );
  const [activeSection, setActiveSection] = useState<SectionKey>("personal");
  const [notice, setNotice] = useState(
    "Starter profile loaded. Draft changes stay in this workspace.",
  );
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const pingBackend = () => { api.checkHealth().catch(() => undefined); };
    pingBackend();
    const interval = window.setInterval(pingBackend, 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!localStorage.getItem("leon_access_token")) { setAuthChecking(false); return; }
    api.me().then(setAuthUser).catch(() => api.logout()).finally(() => setAuthChecking(false));
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("verify_token");
    if (url.searchParams.get("verified") === "1") setAuthNotice("Email verified. You can sign in now.");
    if (!token) return;
    api.verifyEmail(token)
      .then((result) => setAuthNotice(result.message))
      .catch((requestError) => setAuthNotice(requestError instanceof Error ? requestError.message : "Email verification failed. Request a new verification email."))
      .finally(() => {
        url.searchParams.delete("verify_token");
        url.searchParams.delete("verified");
        window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
      });
  }, []);
  if (authChecking) return <main className="auth-shell"><LoaderCircle className="spin auth-loading" size={28} /></main>;
  if (!authUser) return <AuthPanel onAuthenticated={setAuthUser} initialNotice={authNotice} />;
  const update = (field: keyof ResumeDraft, value: string) =>
    setResume((current) => ({ ...current, [field]: value }));
  const updateItem = (
    section: "experiences" | "educations" | "skills" | "languages" | "projects",
    id: string | number,
    field: string,
    value: string | string[] | boolean,
  ) =>
    setResume((current) => ({
      ...current,
      [section]: current[section].map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  const addItem = (
    section: "experiences" | "educations" | "skills" | "languages" | "projects",
  ) =>
    setResume((current) => ({
      ...current,
      [section]: [
        ...current[section],
        {
          id: `${section}-${Date.now()}`,
          ...(section === "experiences"
            ? {
                company: "",
                job_title: "",
                location: "",
                start_date: "",
                end_date: "",
                is_current: false,
                achievements: ["", ""],
              }
            : section === "educations"
              ? {
                  institution: "",
                  degree: "",
                  field_of_study: "",
                  location: "",
                  start_date: "",
                  end_date: "",
                }
              : section === "skills"
                ? { name: "" }
                : section === "languages"
                  ? { name: "", proficiency: "" }
                  : { name: "", description: "", url: "", tech_stack: "" }),
        },
      ],
    }));
  const removeItem = (
    section: "experiences" | "educations" | "skills" | "languages" | "projects",
    id: string | number,
  ) =>
    setResume((current) => ({
      ...current,
      [section]: current[section].filter((item) => item.id !== id),
    }));
  const saveDraft = async () => {
    setBusy(true);
    setNotice("Saving draft to the Leon API...");
    try {
      await api.saveResume(resume);
      setNotice("Draft saved to the backend.");
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : "Draft could not be saved to the backend.");
    } finally {
      setBusy(false);
    }
  };
  const exportPdf = async () => {
    setBusy(true);
    setNotice("Preparing your ATS PDF...");
    try {
      await api.generatePdf(resume);
      setNotice("PDF downloaded successfully.");
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : "PDF export failed. Check the backend logs.");
    } finally {
      setBusy(false);
    }
  };
  const resetResume = () => {
    setResume(createEmptyCV());
    setNotice("Resume cleared. Start with a blank profile.");
  };
  const signOut = () => {
    const confirmed = window.confirm("Are you sure you want to sign out? You will need to sign in again to access your workspace.");
    if (!confirmed) return;
    api.logout();
    setAuthUser(null);
  };
  const sections: { key: SectionKey; label: string }[] = [
    { key: "personal", label: "Personal info" },
    { key: "experience", label: "Experience" },
    { key: "education", label: "Education" },
    { key: "skills", label: "Skills" },
    { key: "languages", label: "Languages" },
    { key: "projects", label: "Projects" },
  ];
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img className="brand-symbol" src="/seig-favicon.svg" alt="" />
          <img className="brand-wordmark" src="/seig-wordmark.svg" alt="Seig" />
        </div>
        <div className="top-actions">
          <button className="button secondary" type="button" onClick={signOut}>Sign out</button>
          <span className="save-state">
            <span className="status-dot" /> Auto-saved locally
          </span>
          <button
            className="button secondary"
            type="button"
            onClick={resetResume}
            disabled={busy}
          >
            <RotateCcw size={16} /> Clear / Reset
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={saveDraft}
            disabled={busy}
          >
            <Save size={16} /> Save draft
          </button>
          <button
            className="button primary"
            type="button"
            onClick={exportPdf}
            disabled={busy}
          >
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Download size={16} />
            )}{" "}
            {busy ? "Generating..." : "Download ATS Resume"}
          </button>
        </div>
      </header>
      <div className="workspace">
        <aside className="editor-pane">
          <div className="editor-intro">
            <span className="eyebrow">
              <Sparkles size={13} /> BUILD YOUR STORY
            </span>
            <h1>
              Make your next move
              <br />
              <em>look inevitable.</em>
            </h1>
            <p>
              Shape a clear, ATS-ready resume with a live document beside you.
            </p>
          </div>
          <nav className="section-nav" aria-label="Resume sections">
            {sections.map((section, index) => (
              <button
                key={section.key}
                type="button"
                className={activeSection === section.key ? "active" : ""}
                onClick={() => setActiveSection(section.key)}
              >
                <span className="nav-index">0{index + 1}</span>
                {section.label}
                <span className="nav-line" />
              </button>
            ))}
          </nav>
          <div className="notice">{notice}</div>
        </aside>
        <section className="form-pane" aria-label="Resume editor">
          {activeSection === "personal" && (
            <>
              <SectionHeading
                title="Personal information"
                description="Start with the details recruiters use to find you."
              />
              <div className="form-grid">
                <Field
                  label="Full name"
                  value={resume.full_name}
                  required
                  onChange={(value) => update("full_name", value)}
                />
                <Field
                  label="Target role"
                  value={resume.target_role}
                  required
                  onChange={(value) => update("target_role", value)}
                />
                <Field
                  label="Email"
                  value={resume.email}
                  type="email"
                  required
                  onChange={(value) => update("email", value)}
                />
                <Field
                  label="Phone"
                  value={resume.phone}
                  type="tel"
                  onChange={(value) => update("phone", value)}
                />
                <Field
                  label="Location"
                  value={resume.location}
                  onChange={(value) => update("location", value)}
                />
                <Field
                  label="LinkedIn"
                  value={resume.linkedin_url}
                  onChange={(value) => update("linkedin_url", value)}
                />
                <Field
                  label="GitHub"
                  value={resume.github_url}
                  onChange={(value) => update("github_url", value)}
                />
                <Field
                  label="Portfolio"
                  value={resume.portfolio_url}
                  onChange={(value) => update("portfolio_url", value)}
                />
              </div>
              <label className="field full-width">
                <span>Professional summary</span>
                <textarea
                  value={resume.professional_summary}
                  spellCheck
                  rows={5}
                  onChange={(event) =>
                    update("professional_summary", event.target.value)
                  }
                />
              </label>
            </>
          )}
          {activeSection === "experience" && (
            <>
              <SectionHeading
                title="Experience"
                description="Show the work and outcomes that make you valuable."
                onAdd={() => addItem("experiences")}
              />
              {resume.experiences.map((item) => (
                <ExperienceEditor
                  key={item.id}
                  item={item}
                  onUpdate={(field, value) =>
                    updateItem("experiences", item.id, field, value)
                  }
                  onRemove={() => removeItem("experiences", item.id)}
                />
              ))}
            </>
          )}
          {activeSection === "education" && (
            <>
              <SectionHeading
                title="Education"
                description="Add the academic context that supports your story."
                onAdd={() => addItem("educations")}
              />
              {resume.educations.map((item) => (
                <div className="repeat-card" key={item.id}>
                  <button
                    className="remove-button"
                    type="button"
                    title="Remove education"
                    onClick={() => removeItem("educations", item.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                  <div className="form-grid">
                    <Field
                      label="Institution"
                      required
                      value={item.institution}
                      onChange={(value) =>
                        updateItem("educations", item.id, "institution", value)
                      }
                    />
                    <Field
                      label="Degree"
                      value={item.degree}
                      onChange={(value) =>
                        updateItem("educations", item.id, "degree", value)
                      }
                    />
                    <Field
                      label="Field of study"
                      value={item.field_of_study}
                      onChange={(value) =>
                        updateItem(
                          "educations",
                          item.id,
                          "field_of_study",
                          value,
                        )
                      }
                    />
                    <Field
                      label="Location"
                      value={item.location}
                      onChange={(value) =>
                        updateItem("educations", item.id, "location", value)
                      }
                    />
                    <Field
                      label="Start"
                      type="month"
                      value={item.start_date}
                      onChange={(value) =>
                        updateItem("educations", item.id, "start_date", value)
                      }
                    />
                    <Field
                      label="End"
                      type="month"
                      value={item.end_date}
                      onChange={(value) =>
                        updateItem("educations", item.id, "end_date", value)
                      }
                    />
                  </div>
                </div>
              ))}
            </>
          )}
          {activeSection === "skills" && (
            <>
              <SectionHeading
                title="Skills"
                description="Use searchable, specific terms from the job descriptions you want."
                onAdd={() => addItem("skills")}
              />
              {resume.skills.map((item) => (
                <div className="repeat-card compact" key={item.id}>
                  <Field
                    label="Skills"
                    value={item.name}
                    placeholder="e.g. React, SQL, stakeholder management"
                    onChange={(value) =>
                      updateItem("skills", item.id, "name", value)
                    }
                  />
                  <button
                    className="remove-button"
                    type="button"
                    title="Remove skills"
                    onClick={() => removeItem("skills", item.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </>
          )}
          {activeSection === "languages" && (
            <>
              <SectionHeading
                title="Languages"
                description="Add languages and proficiency levels for a complete ATS profile."
                onAdd={() => addItem("languages")}
              />
              {resume.languages.map((item) => (
                <div className="repeat-card compact" key={item.id}>
                  <Field
                    label="Language"
                    value={item.name}
                    onChange={(value) => updateItem("languages", item.id, "name", value)}
                  />
                  <Field
                    label="Proficiency"
                    value={item.proficiency}
                    placeholder="Native, C1 Advanced"
                    onChange={(value) => updateItem("languages", item.id, "proficiency", value)}
                  />
                  <button
                    className="remove-button"
                    type="button"
                    title="Remove language"
                    onClick={() => removeItem("languages", item.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </>
          )}
          {activeSection === "projects" && (
            <>
              <SectionHeading
                title="Projects"
                description="Give your strongest work a concrete proof point."
                onAdd={() => addItem("projects")}
              />
              {resume.projects.map((item) => (
                <div className="repeat-card" key={item.id}>
                  <button
                    className="remove-button"
                    type="button"
                    title="Remove project"
                    onClick={() => removeItem("projects", item.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                  <div className="form-grid">
                    <Field
                      label="Project name"
                      value={item.name}
                      onChange={(value) =>
                        updateItem("projects", item.id, "name", value)
                      }
                    />
                    <Field
                      label="URL"
                      value={item.url}
                      onChange={(value) =>
                        updateItem("projects", item.id, "url", value)
                      }
                    />
                    <Field
                      label="Tech stack"
                      value={item.tech_stack}
                      onChange={(value) =>
                        updateItem("projects", item.id, "tech_stack", value)
                      }
                    />
                  </div>
                  <div className="project-enhance-row full-width">
                    <label className="field">
                      <span>Description</span>
                      <textarea
                        rows={3}
                        value={item.description}
                        spellCheck
                        onChange={(event) =>
                          updateItem(
                            "projects",
                            item.id,
                            "description",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <EnhanceButton
                      bullet={item.description}
                      jobTitle={item.name}
                      onApply={(text) =>
                        updateItem("projects", item.id, "description", text)
                      }
                    />
                  </div>
                  <button
                    className="remove-text"
                    type="button"
                    onClick={() => removeItem("projects", item.id)}
                  >
                    <Trash2 size={14} /> Remove project
                  </button>
                </div>
              ))}
            </>
          )}
        </section>
        <section className="preview-pane">
          <div className="preview-toolbar">
            <div>
              <span className="eyebrow">LIVE DOCUMENT</span>
              <strong>A4 / Classic ATS</strong>
            </div>
            <span className="preview-meta">
              {resume.full_name || "Your name"} ·{" "}
              {resume.target_role || "Target role"}
            </span>
          </div>
          <div className="paper-wrap">
            <article className="resume-paper">
              <header className="resume-header">
                <h2>{resume.full_name || "Your Name"}</h2>
                <p className="resume-title">{resume.target_role}</p>
                <p>
                  {[resume.location, resume.email, resume.phone].filter(Boolean).join(" · ")}
                </p>
                <p>
                  {[resume.linkedin_url, resume.github_url, resume.portfolio_url].filter(Boolean).join(" · ")}
                </p>
              </header>
              <PreviewSection title="SUMMARY">
                <p>{resume.professional_summary}</p>
              </PreviewSection>
              <PreviewSection title="EXPERIENCE">
                {resume.experiences.map((item) => (
                  <div className="resume-entry" key={item.id}>
                    <div className="entry-top">
                      <strong>{item.job_title || "Job title"}</strong>
                      <span>
                        {item.start_date || "Start"} —{" "}
                        {item.is_current ? "Present" : item.end_date || "End"}
                      </span>
                    </div>
                    <div className="entry-sub">
                      <b>{item.company || "Company"}</b>
                      <span>{item.location}</span>
                    </div>
                    <ul>
                      {item.achievements.filter(Boolean).map((achievement) => (
                        <li key={achievement}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </PreviewSection>
              <PreviewSection title="EDUCATION">
                {resume.educations.map((item) => (
                  <div className="resume-entry" key={item.id}>
                    <div className="entry-top">
                      <strong>{item.degree || "Degree"}</strong>
                      <span>
                        {item.start_date} — {item.end_date}
                      </span>
                    </div>
                    <div className="entry-sub">
                      <b>{item.institution || "Institution"}</b>
                      <span>{item.location}</span>
                    </div>
                  </div>
                ))}
              </PreviewSection>
              <PreviewSection title="SKILLS">
                <p>
                  {resume.skills
                    .map((item) => item.name)
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </PreviewSection>
              <PreviewSection title="LANGUAGES">
                <p>
                  {resume.languages
                    .map((item) => `${item.name}${item.proficiency ? ` (${item.proficiency})` : ""}`)
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </PreviewSection>
              <PreviewSection title="PROJECTS">
                {resume.projects.map((item) => (
                  <div className="resume-entry" key={item.id}>
                    <div className="entry-top">
                      <strong>{item.name || "Project name"}</strong>
                      <span>{item.url}</span>
                    </div>
                    <p>{item.description}</p>
                    <small>{item.tech_stack}</small>
                  </div>
                ))}
              </PreviewSection>
            </article>
          </div>
        </section>
      </div>
      <footer className="app-footer">
        <div>
          <span>© 2026 Mohammad Aldajeh. All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="resume-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export default App;
