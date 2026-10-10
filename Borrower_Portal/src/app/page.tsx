import { ButtonLink } from '@/components/ui/button';
import { ArrowRightIcon, CheckIcon } from '@/components/ui/icons';

const FACTS = [
  { label: 'Loan amount', value: '₹50K – ₹5L' },
  { label: 'Tenure', value: '30 – 365 days' },
  { label: 'Interest', value: '12% p.a. simple' },
];

const STEPS = [
  { title: 'Create your account', body: 'Sign up with your email in under a minute.' },
  { title: 'Check eligibility', body: 'Share basic details — we tell you instantly if you qualify.' },
  { title: 'Upload salary slip', body: 'PDF, JPG or PNG up to 5 MB.' },
  { title: 'Choose amount & apply', body: 'See your exact repayment before you submit.' },
];

const ELIGIBILITY = [
  'Aged 23 to 50 years',
  'Monthly salary of ₹25,000 or more',
  'Valid individual PAN',
  'Salaried or self-employed',
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <section className="grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
            Short-term personal loans
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Funds when you need them, with no surprises.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-slate-600">
            Apply online in four quick steps. Your interest and total repayment are calculated live as you
            choose the amount and tenure.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/apply" size="lg">
              Start application <ArrowRightIcon className="size-4" />
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="lg">
              I already have an account
            </ButtonLink>
          </div>
          <dl className="grid max-w-lg grid-cols-3 gap-3 pt-4">
            {FACTS.map((fact) => (
              <div key={fact.label} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <dt className="text-xs text-slate-500">{fact.label}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-xl sm:p-8">
          <h2 className="text-lg font-semibold">Who can apply?</h2>
          <ul className="mt-4 space-y-3">
            {ELIGIBILITY.map((item) => (
              <li key={item} className="flex items-center gap-3 text-brand-50">
                <span className="flex size-6 items-center justify-center rounded-full bg-white/15">
                  <CheckIcon className="size-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-2xl bg-white/10 p-4 text-sm">
            <p className="font-medium">Example</p>
            <p className="mt-1 text-brand-100">
              ₹1,00,000 for 90 days → interest ₹2,958.90 → you repay <strong className="text-white">₹1,02,958.90</strong>
            </p>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                {index + 1}
              </span>
              <h3 className="mt-3 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
