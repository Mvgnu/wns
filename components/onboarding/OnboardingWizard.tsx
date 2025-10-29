'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingState } from '@/lib/onboarding/service';
import { useSession } from 'next-auth/react';

// feature: onboarding-growth
// intent: deliver a client-side multi-step wizard that syncs interests,
//         location, and availability preferences via the onboarding API.

type WizardProps = {
  initialState: OnboardingState;
};

type InterestDraft = {
  sport: string;
  intensity?: string;
  tags?: string[];
};

type AvailabilityDraft = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  availabilityType?: string;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function OnboardingWizard({ initialState }: WizardProps) {
  const router = useRouter();
  const { update } = useSession();
  const [state, setState] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [interestDrafts, setInterestDrafts] = useState<InterestDraft[]>(
    initialState.interests.length > 0
      ? initialState.interests
      : [{ sport: '', intensity: '', tags: [] }]
  );
  const [locationDraft, setLocationDraft] = useState({
    locationName: initialState.location.locationName ?? '',
    city: initialState.location.city ?? '',
    state: initialState.location.state ?? '',
    country: initialState.location.country ?? '',
    travelRadius: initialState.travelRadius ?? 10,
    discoveryGoals: initialState.discoveryGoals.join(', '),
  });
  const [availabilityDrafts, setAvailabilityDrafts] = useState<AvailabilityDraft[]>(
    initialState.availability.length > 0
      ? initialState.availability
      : [{ dayOfWeek: 1, startTime: '18:00', endTime: '20:00', availabilityType: 'in-person' }]
  );

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  useEffect(() => {
    setInterestDrafts(
      state.interests.length > 0 ? state.interests : [{ sport: '', intensity: '', tags: [] }]
    );
    setLocationDraft({
      locationName: state.location.locationName ?? '',
      city: state.location.city ?? '',
      state: state.location.state ?? '',
      country: state.location.country ?? '',
      travelRadius: state.travelRadius ?? 10,
      discoveryGoals: state.discoveryGoals.join(', '),
    });
    setAvailabilityDrafts(
      state.availability.length > 0
        ? state.availability
        : [{ dayOfWeek: 1, startTime: '18:00', endTime: '20:00', availabilityType: 'in-person' }]
    );
  }, [state]);

  useEffect(() => {
    if (state.status === 'completed') {
      router.replace('/');
    }
  }, [state.status, router]);

  async function mutateStep(step: string, payload: Record<string, unknown>) {
    try {
      setError(null);
      const response = await fetch(`/api/onboarding/${step}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error ?? 'Failed to update onboarding');
      }

      const data = (await response.json()) as OnboardingState;
      setState(data);

      if (step === 'complete') {
        await update({
          user: {
            onboardingStatus: 'completed',
            onboardingStep: 'complete',
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected onboarding error');
    }
  }

  const currentStep = useMemo(() => state.currentStep ?? 'interests', [state.currentStep]);

  const disableControls = isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-8 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900">Lass uns dein Erlebnis personalisieren</h1>
        <p className="mt-2 text-slate-600">
          Wir nutzen deine Angaben, um dir relevante Gruppen, Events und Trainingszeiten vorzuschlagen.
        </p>
      </header>

      <ProgressIndicator currentStep={currentStep} />

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {currentStep === 'interests' && (
        <InterestsStep
          drafts={interestDrafts}
          onChange={setInterestDrafts}
          onSubmit={() => {
            const payload = interestDrafts
              .filter(item => item.sport.trim().length > 0)
              .map(item => ({
                sport: item.sport.trim(),
                intensity: item.intensity?.trim() || undefined,
                tags: item.tags?.map(tag => tag.trim()).filter(Boolean) ?? [],
              }));

            startTransition(() => {
              mutateStep('interests', { interests: payload });
            });
          }}
          disabled={disableControls}
        />
      )}

      {currentStep === 'location' && (
        <LocationStep
          draft={locationDraft}
          onChange={setLocationDraft}
          onSubmit={() => {
            const goals = locationDraft.discoveryGoals
              .split(',')
              .map(entry => entry.trim())
              .filter(Boolean);
            startTransition(() => {
              mutateStep('location', {
                location: {
                  ...locationDraft,
                  travelRadius: Number(locationDraft.travelRadius) || null,
                  discoveryGoals: goals,
                },
              });
            });
          }}
          disabled={disableControls}
        />
      )}

      {currentStep === 'availability' && (
        <AvailabilityStep
          drafts={availabilityDrafts}
          onChange={setAvailabilityDrafts}
          onSubmit={() => {
            const payload = availabilityDrafts
              .filter(slot => slot.startTime && slot.endTime)
              .map(slot => ({
                ...slot,
                dayOfWeek: Number(slot.dayOfWeek),
              }));
            startTransition(() => {
              mutateStep('availability', { availability: payload });
            });
          }}
          disabled={disableControls}
        />
      )}

      {currentStep === 'complete' && (
        <CompletionStep
          referralCode={state.referralCode}
          onFinish={() => {
            startTransition(() => {
              mutateStep('complete', {});
            });
          }}
          disabled={disableControls}
        />
      )}
    </div>
  );
}

type InterestsStepProps = {
  drafts: InterestDraft[];
  disabled: boolean;
  onChange: (drafts: InterestDraft[]) => void;
  onSubmit: () => void;
};

function InterestsStep({ drafts, onChange, onSubmit, disabled }: InterestsStepProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Welche Sportarten begeistern dich?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Füge mehrere Sportarten hinzu, um noch bessere Empfehlungen zu erhalten.
        </p>
      </div>

      <div className="space-y-4">
        {drafts.map((draft, index) => (
          <div key={index} className="rounded border border-slate-200 p-4">
            <label className="block text-sm font-medium text-slate-700">
              Sportart
              <input
                type="text"
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={draft.sport}
                disabled={disabled}
                onChange={event => {
                  const next = [...drafts];
                  next[index] = { ...next[index], sport: event.target.value };
                  onChange(next);
                }}
              />
            </label>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Intensität (optional)
                <input
                  type="text"
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                  value={draft.intensity ?? ''}
                  disabled={disabled}
                  onChange={event => {
                    const next = [...drafts];
                    next[index] = { ...next[index], intensity: event.target.value };
                    onChange(next);
                  }}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Tags (Komma getrennt)
                <input
                  type="text"
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                  value={(draft.tags ?? []).join(', ')}
                  disabled={disabled}
                  onChange={event => {
                    const tags = event.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                    const next = [...drafts];
                    next[index] = { ...next[index], tags };
                    onChange(next);
                  }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          disabled={disabled}
          onClick={() => onChange([...drafts, { sport: '', intensity: '', tags: [] }])}
        >
          + Sport hinzufügen
        </button>
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
          disabled={disabled}
          onClick={onSubmit}
        >
          Speichern & weiter
        </button>
      </div>
    </section>
  );
}

type LocationStepProps = {
  draft: {
    locationName?: string;
    city?: string;
    state?: string;
    country?: string;
    travelRadius?: number | null;
    discoveryGoals: string;
  };
  disabled: boolean;
  onChange: (draft: LocationStepProps['draft']) => void;
  onSubmit: () => void;
};

function LocationStep({ draft, onChange, onSubmit, disabled }: LocationStepProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Wo bist du aktiv?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Wir schlagen dir Gruppen und Events innerhalb deines bevorzugten Radius vor.
        </p>
      </div>

      <label className="text-sm font-medium text-slate-700">
        Lieblingsspot oder Viertel (optional)
        <input
          type="text"
          className="mt-1 w-full rounded border border-slate-300 p-2"
          value={draft.locationName ?? ''}
          disabled={disabled}
          onChange={event => onChange({ ...draft, locationName: event.target.value })}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Stadt
          <input
            type="text"
            className="mt-1 w-full rounded border border-slate-300 p-2"
            value={draft.city ?? ''}
            disabled={disabled}
            onChange={event => onChange({ ...draft, city: event.target.value })}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Bundesland
          <input
            type="text"
            className="mt-1 w-full rounded border border-slate-300 p-2"
            value={draft.state ?? ''}
            disabled={disabled}
            onChange={event => onChange({ ...draft, state: event.target.value })}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Land
          <input
            type="text"
            className="mt-1 w-full rounded border border-slate-300 p-2"
            value={draft.country ?? ''}
            disabled={disabled}
            onChange={event => onChange({ ...draft, country: event.target.value })}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Radius (km)
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded border border-slate-300 p-2"
            value={draft.travelRadius ?? 0}
            disabled={disabled}
            onChange={event => onChange({ ...draft, travelRadius: Number(event.target.value) })}
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Ziele (Komma getrennt)
        <input
          type="text"
          className="mt-1 w-full rounded border border-slate-300 p-2"
          value={draft.discoveryGoals}
          disabled={disabled}
          onChange={event => onChange({ ...draft, discoveryGoals: event.target.value })}
        />
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
          disabled={disabled}
          onClick={onSubmit}
        >
          Speichern & weiter
        </button>
      </div>
    </section>
  );
}

type AvailabilityStepProps = {
  drafts: AvailabilityDraft[];
  disabled: boolean;
  onChange: (drafts: AvailabilityDraft[]) => void;
  onSubmit: () => void;
};

function AvailabilityStep({ drafts, onChange, onSubmit, disabled }: AvailabilityStepProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Wann passt es dir am besten?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Diese Zeiten helfen uns, dir passende Trainings und Treffen vorzuschlagen.
        </p>
      </div>

      <div className="space-y-4">
        {drafts.map((draft, index) => (
          <div key={index} className="grid gap-3 rounded border border-slate-200 p-4 md:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">
              Tag
              <select
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={draft.dayOfWeek}
                disabled={disabled}
                onChange={event => {
                  const next = [...drafts];
                  next[index] = { ...next[index], dayOfWeek: Number(event.target.value) };
                  onChange(next);
                }}
              >
                {DAYS.map((day, idx) => (
                  <option key={day} value={idx}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Start
              <input
                type="time"
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={draft.startTime}
                disabled={disabled}
                onChange={event => {
                  const next = [...drafts];
                  next[index] = { ...next[index], startTime: event.target.value };
                  onChange(next);
                }}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Ende
              <input
                type="time"
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={draft.endTime}
                disabled={disabled}
                onChange={event => {
                  const next = [...drafts];
                  next[index] = { ...next[index], endTime: event.target.value };
                  onChange(next);
                }}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Art
              <select
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={draft.availabilityType ?? 'in-person'}
                disabled={disabled}
                onChange={event => {
                  const next = [...drafts];
                  next[index] = { ...next[index], availabilityType: event.target.value };
                  onChange(next);
                }}
              >
                <option value="in-person">Vor Ort</option>
                <option value="virtual">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          disabled={disabled}
          onClick={() => onChange([...drafts, { dayOfWeek: 2, startTime: '19:00', endTime: '21:00', availabilityType: 'in-person' }])}
        >
          + Zeitfenster hinzufügen
        </button>
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
          disabled={disabled}
          onClick={onSubmit}
        >
          Speichern & weiter
        </button>
      </div>
    </section>
  );
}

type CompletionProps = {
  referralCode: string;
  disabled: boolean;
  onFinish: () => void;
};

function CompletionStep({ referralCode, onFinish, disabled }: CompletionProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Bereit loszulegen!</h2>
        <p className="mt-1 text-sm text-slate-600">
          Deine Angaben sind gespeichert. Teile deinen persönlichen Empfehlungscode mit Freunden und sammle Belohnungen.
        </p>
      </div>

      <div className="rounded border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-medium text-emerald-700">Dein Empfehlungscode</p>
        <p className="mt-1 text-2xl font-semibold text-emerald-800">{referralCode}</p>
      </div>

      <button
        type="button"
        className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
        disabled={disabled}
        onClick={onFinish}
      >
        Onboarding abschließen
      </button>
    </section>
  );
}

type ProgressProps = {
  currentStep: string;
};

function ProgressIndicator({ currentStep }: ProgressProps) {
  const steps = [
    { id: 'interests', label: 'Interessen' },
    { id: 'location', label: 'Ort' },
    { id: 'availability', label: 'Verfügbarkeit' },
    { id: 'complete', label: 'Fertig' },
  ];

  return (
    <ol className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = steps.findIndex(item => item.id === currentStep) > index;
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                isActive
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : isComplete
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-300 bg-white text-slate-600'
              }`}
            >
              {index + 1}
            </span>
            <span className={isActive ? 'text-slate-900' : ''}>{step.label}</span>
            {index < steps.length - 1 && <span className="text-slate-300">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
