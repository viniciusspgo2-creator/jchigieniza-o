'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { compressImage } from '@/lib/client-image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Loader2, MessageCircle, Paperclip, PartyPopper, X, UserCheck, BadgeCheck, Lock, CreditCard } from 'lucide-react';
import { trackEvent } from './analytics';
import { Reveal } from './reveal';

type ServiceOpt = { slug: string; name: string };
type SlotOpt = { slot: string; available: boolean };

const PERIODS = [
  { value: 'MANHA', label: 'Manhã (8h–12h)' },
  { value: 'TARDE', label: 'Tarde (12h–18h)' },
  { value: 'NOITE', label: 'Noite (após 18h, sujeito a disponibilidade)' },
];

const REINFORCEMENT = [
  { icon: UserCheck, title: 'Resposta humana', text: 'Sua solicitação cai direto com o time da JC, que confirma o horário com você.' },
  { icon: BadgeCheck, title: 'Sem compromisso', text: 'O envio não gera cobrança — o orçamento é avaliado antes.' },
  { icon: Lock, title: 'Seus dados protegidos', text: 'Usamos seus dados apenas para responder a esta solicitação.' },
];

export function BookingSection({ intro, payments = [] }: { intro: { title: string; text: string }; payments?: string[] }) {
  return (
    <section id="agendamento" className="scroll-mt-24 bg-ice py-20 sm:py-24 lg:py-32" aria-labelledby="agendamento-titulo">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-action">Agendamento</p>
            <h2
              id="agendamento-titulo"
              className="font-display mt-3 text-balance text-[2rem] font-extrabold leading-[1.12] text-deep sm:text-[2.6rem]"
            >
              {intro.title}
            </h2>
            <p className="mt-5 max-w-md text-pretty text-[17px] leading-relaxed text-ink-soft">{intro.text}</p>

            {payments.length > 0 && (
              <Reveal delay={0.08}>
                <div className="mt-7 rounded-[22px] border border-aqua-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-aqua-50 text-brand" aria-hidden="true">
                      <CreditCard className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-display text-[15.5px] font-bold text-deep">Pagamento facilitado</p>
                      <p className="mt-0.5 text-sm leading-snug text-ink-soft">Escolha a forma mais prática para você.</p>
                    </div>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label="Formas de pagamento aceitas">
                    {payments.map((p) => (
                      <li
                        key={p}
                        className="inline-flex items-center gap-1.5 rounded-full bg-aqua-50 px-3.5 py-1.5 text-[12.5px] font-bold text-brand-700 ring-1 ring-aqua-200"
                      >
                        <Check className="h-3 w-3" aria-hidden="true" strokeWidth={3.5} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}

            <ul className="mt-4 flex flex-col gap-4">
              {REINFORCEMENT.map(({ icon: Icon, title, text }, i) => (
                <Reveal as="li" key={title} delay={0.07 * i}>
                  <div className="flex items-start gap-4 rounded-[22px] border border-border bg-white p-5 transition-all duration-300 hover:border-aqua-200 hover:shadow-soft">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-aqua-50 text-brand" aria-hidden="true">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-display text-[15.5px] font-bold text-deep">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>

          <BookingForm />
        </div>
      </div>
    </section>
  );
}

function BookingForm() {
  const [services, setServices] = useState<ServiceOpt[]>([]);
  const loadedServices = useRef(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ protocol: string; whatsappUrl: string } | null>(null);
  const [slots, setSlots] = useState<SlotOpt[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const reduced = useReducedMotion();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    serviceSlug: '',
    itemCount: '1',
    district: '',
    streetAddress: '',
    addressRef: '',
    preferredDate: '',
    timeSlot: '',
    period: '',
    notes: '',
    privacyAccepted: false,
  });

  const today = useMemo(() => {
    const n = new Date();
    // fuso SP aproximado no cliente para o atributo min
    const sp = new Date(n.getTime() - 3 * 3600_000);
    return sp.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (loadedServices.current) return;
    loadedServices.current = true;
    fetch('/api/servicos-publicos')
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []))
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  };

  const validStep0 = form.name.trim().length >= 3 && form.phone.replace(/\D/g, '').length >= 10 && form.serviceSlug;
  const validStep1 = form.district.trim().length >= 2 && form.streetAddress.trim().length >= 3;
  const validStep2 = form.preferredDate && (form.timeSlot || form.period) && form.privacyAccepted;

  const loadSlots = async (date: string) => {
    setSlots(null);
    setForm((f) => ({ ...f, timeSlot: '' }));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    setLoadingSlots(true);
    try {
      const r = await fetch(`/api/agendamento?date=${date}`);
      const d = await r.json();
      setSlots(d.slots ?? []);
    } catch {
      setSlots(null);
    } finally {
      setLoadingSlots(false);
    }
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 4 - photos.length);
    if (picked.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      const compressed = await Promise.all(picked.map((f) => compressImage(f)));
      compressed.forEach((f) => fd.append('files', f));
      const r = await fetch('/api/uploads/public', { method: 'POST', body: fd });
      const d = await r.json();
      if (!d.ok) {
        setError(d.error ?? 'Não foi possível enviar as fotos.');
        return;
      }
      setPhotos((p) => [...p, ...picked].slice(0, 4));
    } catch {
      setError('Falha no envio das fotos. Você pode seguir sem elas.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        name: form.name.trim(),
        phone: form.phone,
        serviceSlug: form.serviceSlug,
        itemCount: Number(form.itemCount) || 1,
        district: form.district.trim(),
        streetAddress: form.streetAddress.trim(),
        addressRef: form.addressRef.trim(),
        preferredDate: form.preferredDate,
        timeSlot: form.timeSlot || `PERIODO_${form.period}`,
        period: form.timeSlot ? null : form.period,
        notes: form.notes.trim(),
        privacyAccepted: true,
      };
      const r = await fetch('/api/agendamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!d.ok) {
        setError(d.error ?? 'Não foi possível enviar. Tente novamente ou chame no WhatsApp.');
        return;
      }
      trackEvent('BOOKING_SUBMIT');
      setSuccess({ protocol: d.protocol, whatsappUrl: d.whatsappUrl });
    } catch {
      setError('Falha de conexão. Tente novamente ou chame no WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ['Você', 'Endereço', 'Horário'];
  const canNext = step === 0 ? validStep0 : step === 1 ? validStep1 : validStep2;
  const progress = success ? 100 : ((step + 1) / steps.length) * 100;

  if (success) {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[28px] border border-aqua-100 bg-white p-8 text-center shadow-lift sm:p-12"
      >
        <span className="mx-auto inline-flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-aqua-100 to-aqua-50 text-brand">
          <PartyPopper className="h-9 w-9" aria-hidden="true" />
        </span>
        <h3 className="font-display mt-6 text-[1.75rem] font-extrabold text-deep">Solicitação recebida!</h3>
        <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-ink-soft">
          Protocolo <strong className="rounded-lg bg-ice px-2.5 py-1 font-mono text-[15px] text-deep">{success.protocol}</strong>
          <br />
          Guarde esse número. Nossa equipe vai analisar e <strong className="text-deep">confirmar o horário com você</strong> — o envio não
          garante automaticamente a vaga na agenda.
        </p>
        <a
          href={success.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('WHATSAPP_CLICK', 'pos-agendamento')}
          className="mt-8 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-action px-8 text-base font-bold text-white shadow-cta transition-all hover:bg-action-600 hover:shadow-cta-lg"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          Continuar no WhatsApp (opcional)
        </a>
        <button
          type="button"
          onClick={() => {
            setSuccess(null);
            setStep(0);
          }}
          className="mt-5 block w-full text-center text-sm font-semibold text-brand underline underline-offset-4 transition-colors hover:text-brand-700"
        >
          Enviar outra solicitação
        </button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-[28px] border border-border bg-white p-6 shadow-lift sm:p-9">
      {/* barra de progresso */}
      <div className="mb-2">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-deep">
            Etapa {step + 1} de {steps.length}
            <span className="ml-2 font-semibold text-ink-soft">— {steps[step]}</span>
          </p>
          <p className="text-xs font-bold text-ink-soft/70">{Math.round(progress)}%</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ice-2" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do formulário">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand to-aqua-300"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduced ? false : { opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? undefined : { opacity: 0, x: -18 }}
          transition={{ duration: 0.2 }}
          className="mt-7 space-y-5"
        >
          {step === 0 && (
            <>
              <Field label="Seu nome">
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  autoComplete="name"
                  placeholder="Como podemos te chamar?"
                  className={inputCls}
                />
              </Field>
              <Field label="WhatsApp com DDD">
                <input
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(62) 99999-9999"
                  className={inputCls}
                />
              </Field>
              <Field label="Serviço desejado">
                <select value={form.serviceSlug} onChange={(e) => set('serviceSlug', e.target.value)} className={inputCls}>
                  <option value="">Selecione o serviço…</option>
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Quantidade de itens">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.itemCount}
                  onChange={(e) => set('itemCount', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Bairro">
                <input
                  value={form.district}
                  onChange={(e) => set('district', e.target.value)}
                  placeholder="Ex.: Setor Morada do Sol"
                  className={inputCls}
                />
              </Field>
              <Field label="Endereço (rua e número)">
                <input
                  value={form.streetAddress}
                  onChange={(e) => set('streetAddress', e.target.value)}
                  autoComplete="street-address"
                  placeholder="Rua, número"
                  className={inputCls}
                />
              </Field>
              <Field label="Ponto de referência (opcional)">
                <input
                  value={form.addressRef}
                  onChange={(e) => set('addressRef', e.target.value)}
                  placeholder="Ex.: portão azul, ao lado da praça"
                  className={inputCls}
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Data preferencial">
                <input
                  type="date"
                  min={today}
                  value={form.preferredDate}
                  onChange={(e) => {
                    set('preferredDate', e.target.value);
                    loadSlots(e.target.value);
                  }}
                  className={inputCls}
                />
              </Field>

              {loadingSlots && (
                <p className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Buscando horários…
                </p>
              )}

              {slots && slots.length > 0 && (
                <Field label="Janela de horário (opcional)">
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Janelas de horário">
                    {slots.map((s) => (
                      <button
                        key={s.slot}
                        type="button"
                        disabled={!s.available}
                        onClick={() => set('timeSlot', form.timeSlot === s.slot ? '' : s.slot)}
                        className={`min-h-[52px] rounded-full border-2 px-5 text-sm font-bold transition-all duration-200 ${
                          form.timeSlot === s.slot
                            ? 'border-brand bg-brand text-white shadow-soft'
                            : s.available
                              ? 'border-border bg-white text-deep hover:border-brand hover:text-brand'
                              : 'cursor-not-allowed border-border/50 bg-ice text-ink-soft/35 line-through'
                        }`}
                      >
                        {s.slot}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {!form.timeSlot && (
                <Field label="Período de preferência">
                  <div className="grid gap-2.5">
                    {PERIODS.map((p) => (
                      <label
                        key={p.value}
                        className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 px-5 py-4 text-[15px] font-semibold transition-colors duration-200 ${
                          form.period === p.value
                            ? 'border-brand bg-aqua-50 text-deep'
                            : 'border-border bg-white text-ink-soft hover:border-aqua-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="periodo"
                          value={p.value}
                          checked={form.period === p.value}
                          onChange={() => set('period', p.value)}
                          className="h-4.5 w-4.5 accent-[#0F63C8]"
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </Field>
              )}

              <Field label="Observações (opcional)">
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                  placeholder="Ex.: sofá suede com mancha de café no assento; tem cachorro em casa."
                  className={`${inputCls} resize-none py-3.5`}
                />
              </Field>

              <Field label="Fotos (opcional, até 4 — ajuda na avaliação)">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex min-h-[52px] cursor-pointer items-center gap-2 rounded-full border-2 border-border bg-white px-5 py-3 text-sm font-bold text-deep transition-colors hover:border-brand hover:text-brand">
                    {uploading ? <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" /> : <Paperclip className="h-4.5 w-4.5" aria-hidden="true" />}
                    Anexar fotos
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => onPickFiles(e.target.files)}
                      disabled={uploading || photos.length >= 4}
                    />
                  </label>
                  {photos.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-ice px-3.5 py-2 text-xs font-semibold text-ink-soft">
                      {f.name.length > 18 ? `${f.name.slice(0, 15)}…` : f.name}
                      <button type="button" aria-label={`Remover foto ${f.name}`} onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}>
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              </Field>

              <label
                className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border-2 px-5 py-4 transition-colors ${
                  form.privacyAccepted ? 'border-aqua-200 bg-aqua-50/70' : 'border-border bg-ice'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.privacyAccepted}
                  onChange={(e) => set('privacyAccepted', e.target.checked)}
                  className="mt-0.5 h-[18px] w-[18px] accent-[#0F63C8]"
                />
                <span className="text-[13.5px] leading-relaxed text-ink-soft">
                  Li e concordo com o{' '}
                  <a href="/privacidade" target="_blank" className="font-bold text-brand underline underline-offset-2">
                    aviso de privacidade
                  </a>
                  . Meus dados serão usados apenas para responder a esta solicitação.
                </span>
              </label>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-semibold text-action">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="inline-flex min-h-[52px] items-center gap-1.5 rounded-full border-2 border-border px-6 text-[15px] font-bold text-ink-soft transition-colors hover:border-deep hover:text-deep"
          >
            <ChevronLeft className="h-4.5 w-4.5" aria-hidden="true" /> Voltar
          </button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep(step + 1)}
            className="inline-flex min-h-[56px] items-center gap-2 rounded-full bg-deep px-8 text-base font-bold text-white transition-all hover:bg-deep-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continuar <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            disabled={!canNext || submitting}
            onClick={submit}
            className="inline-flex min-h-[56px] items-center gap-2 rounded-full bg-action px-8 text-base font-bold text-white shadow-cta transition-all hover:bg-action-600 hover:shadow-cta-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <MessageCircle className="h-5 w-5" aria-hidden="true" />}
            Enviar solicitação
          </button>
        )}
      </div>
    </div>
  );
}

const inputCls =
  'min-h-[52px] w-full rounded-2xl border-2 border-border bg-white px-4.5 py-3 text-[15.5px] text-deep placeholder:text-ink-soft/45 outline-none transition-all duration-200 focus:border-brand focus:ring-4 focus:ring-brand/10';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-bold text-deep">{label}</span>
      {children}
    </label>
  );
}
