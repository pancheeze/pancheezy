"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, Github, Linkedin, Facebook, Send, CheckCircle2, Copy, Check } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { profile } from "@/lib/data";
import { fadeUp, staggerContainer } from "@/lib/utils";

type Status = "idle" | "loading" | "success" | "error";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  // Sends the message to /api/contact, which emails it to the site owner.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("visitor-fullname"),
          email: data.get("visitor-emailaddr"),
          message: data.get("message"),
          website: data.get("website"),
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "Your message couldn't be sent.");
      form.reset();
      setStatus("success");
      window.dispatchEvent(new Event("byte:celebrate")); // Byte (components/byte) cheers
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your message couldn't be sent.");
      setStatus("error");
    }
  };

  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${profile.email}`; // clipboard blocked: open the mail app instead
    }
  };

  const contactLinks = [
    { icon: Mail, label: "Email", href: `mailto:${profile.email}` },
    { icon: Github, label: "GitHub", href: profile.github },
    { icon: Linkedin, label: "LinkedIn", href: profile.linkedin },
    { icon: Facebook, label: "Facebook", href: profile.facebook },
  ];

  const fields = [
    { id: "visitor-fullname", label: "Name", type: "text", placeholder: "Your full name", maxLength: 100 },
    { id: "visitor-emailaddr", label: "Email", type: "email", placeholder: "you@example.com", maxLength: 200 },
  ];

  return (
    <section id="contact" className="section-padding relative">
      <div className="section-container">
        <SectionHeading
          eyebrow="Let's connect"
          title="Contact Me"
          description={profile.contactIntro}
        />

        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {/* Links as one compact row (icon-only on phones), then the email in plain text with a copy button. */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer(0.08)}
          >
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {contactLinks.map(({ icon: Icon, label, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noreferrer" : undefined}
                  variants={fadeUp}
                  whileHover={{ y: -3 }}
                  aria-label={label}
                  title={label}
                  className="glass-card flex h-11 items-center justify-center gap-2 text-text-secondary hover:text-white"
                >
                  <Icon size={17} className="text-primary" aria-hidden />
                  <span className="hidden text-sm font-medium sm:inline">{label}</span>
                </motion.a>
              ))}
            </div>
            <motion.p
              variants={fadeUp}
              className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-text-secondary"
            >
              <span className="hidden shrink-0 sm:inline">or email me directly:</span>
              <a href={`mailto:${profile.email}`} className="min-w-0 truncate text-white hover:text-primary">
                {profile.email}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                aria-label={copied ? "Email copied" : "Copy email address"}
                title={copied ? "Copied!" : "Copy"}
                className="shrink-0 rounded-md p-1.5 text-text-secondary transition-colors hover:bg-white/5 hover:text-primary"
              >
                {copied ? <Check size={14} className="text-secondary" /> : <Copy size={14} />}
              </button>
            </motion.p>
          </motion.div>

          <motion.form
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer(0.1)}
            onSubmit={handleSubmit}
            autoComplete="off"
            className="glass-card flex flex-col gap-5 p-6 sm:p-8"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {fields.map((field) => (
                <motion.div key={field.id} variants={fadeUp} className="relative">
                  <label
                    htmlFor={field.id}
                    className="mb-2 block text-xs font-medium text-text-secondary"
                  >
                    {field.label}
                  </label>
                  <motion.input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    maxLength={field.maxLength}
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder={field.placeholder}
                    onFocus={() => setFocused(field.id)}
                    onBlur={() => setFocused(null)}
                    animate={{
                      borderColor:
                        focused === field.id
                          ? "rgba(236,163,95,0.7)"
                          : "rgba(255,255,255,0.1)",
                      boxShadow:
                        focused === field.id
                          ? "0 0 0 4px rgba(236,163,95,0.15)"
                          : "0 0 0 0px rgba(236,163,95,0)",
                    }}
                    transition={{ duration: 0.25 }}
                    className="w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-text-secondary/50"
                  />
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} className="relative">
              <label
                htmlFor="message"
                className="mb-2 block text-xs font-medium text-text-secondary"
              >
                Message
              </label>
              <motion.textarea
                id="message"
                name="message"
                required
                maxLength={5000}
                rows={5}
                placeholder="Tell me about the OJT opportunity, a project, or just say hi..."
                onFocus={() => setFocused("message")}
                onBlur={() => setFocused(null)}
                animate={{
                  borderColor:
                    focused === "message"
                      ? "rgba(236,163,95,0.7)"
                      : "rgba(255,255,255,0.1)",
                  boxShadow:
                    focused === "message"
                      ? "0 0 0 4px rgba(236,163,95,0.15)"
                      : "0 0 0 0px rgba(236,163,95,0)",
                }}
                transition={{ duration: 0.25 }}
                className="w-full resize-none rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-text-secondary/50"
              />
            </motion.div>

            {/* Honeypot: hidden from people, but bots fill it in and get ignored. */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="website">Leave this field empty</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <motion.button
              variants={fadeUp}
              type="submit"
              disabled={status === "loading" || status === "success"}
              whileHover={{ scale: status === "idle" || status === "error" ? 1.02 : 1 }}
              whileTap={{ scale: status === "idle" || status === "error" ? 0.97 : 1 }}
              className="btn-primary mt-2 w-full sm:w-fit"
            >
              {(status === "idle" || status === "error") && (
                <>
                  <Send size={16} />
                  Send Message
                </>
              )}
              {status === "loading" && (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Sending...
                </>
              )}
              {status === "success" && (
                <>
                  <CheckCircle2 size={16} />
                  Message Sent
                </>
              )}
            </motion.button>

            <p role="status" aria-live="polite" className="min-h-[1.25rem] text-sm">
              {status === "success" && (
                <span className="text-secondary">Thanks! Your message is on its way. I&apos;ll reply soon.</span>
              )}
              {status === "error" && (
                <span className="text-[#E58A8A]">
                  {error} You can also email me at{" "}
                  <a href={`mailto:${profile.email}`} className="break-all underline hover:text-white">
                    {profile.email}
                  </a>
                  .
                </span>
              )}
            </p>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
