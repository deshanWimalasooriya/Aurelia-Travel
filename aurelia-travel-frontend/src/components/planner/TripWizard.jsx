import React, { useState } from 'react';
import {
  Sparkles, MapPin, Map, LocateFixed, Calendar, Users, BedDouble, Car, Bus, Bike, Train,
  ArrowLeft, ArrowRight, Check, Minus, Plus, X, AlertCircle, Coffee, Mountain, Landmark,
  Heart, Crown, DollarSign, CloudSun, KeyRound
} from 'lucide-react';
import { tripLength } from './tripUtils';
import { useCurrency, convertFromUSD, convertToUSD } from '../../context/currencyCore';
import { CurrencyToggle } from '../../context/CurrencyContext';

/**
 * Guided 4-step trip form for the AI travel agent.
 *   1. Route      – from / to (type a town, use GPS, or pick on the map)
 *   2. Dates      – start + end date, total budget
 *   3. Travellers – adults, kids, rooms, must-have amenities
 *   4. Style      – vibe, transport (own vehicle vs arranged), description, weather
 * All state lives in TravelPage; this component only renders and validates.
 */

const POPULAR_DESTINATIONS = ['Galle', 'Kandy', 'Ella', 'Sigiriya', 'Mirissa', 'Nuwara Eliya', 'Trincomalee', 'Jaffna'];

const VIBES = [
  { id: 'Relaxing', label: 'Chill', icon: Coffee },
  { id: 'Adventure', label: 'Adventure', icon: Mountain },
  { id: 'Culture', label: 'Culture', icon: Landmark },
  { id: 'Romantic', label: 'Romantic', icon: Heart },
  { id: 'Luxury', label: 'Luxury', icon: Crown }
];

const HIRED_TRANSPORT = [
  { id: 'Private Van', label: 'Private van', icon: Bus },
  { id: 'Car with Driver', label: 'Car + driver', icon: Car },
  { id: 'Tuk-Tuk', label: 'Tuk-tuk', icon: Bike },
  { id: 'Train & Bus', label: 'Train & bus', icon: Train }
];

// Names match the master `amenities` table so Aurelia hotels can be matched
const HOTEL_AMENITIES = ['WiFi', 'Pool', 'Parking', 'Air Conditioning', 'Restaurant', 'Spa', 'Gym', 'Room Service'];

const STEPS = [
  { title: 'Route', heading: 'Where are you going?' },
  { title: 'Dates', heading: 'When, and how much?' },
  { title: 'Travellers', heading: "Who's coming?" },
  { title: 'Style', heading: 'What kind of trip?' }
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const fieldClass =
  'w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400';
const labelClass = 'text-sm font-semibold text-slate-700 dark:text-slate-200 flex flex-col gap-1.5';
const chipClass = (selected) =>
  `px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
    selected
      ? 'bg-blue-600 text-white shadow-sm'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
  }`;

// --- Small building blocks -------------------------------------------------

const Stepper = ({ label, hint, value, min, max, onChange, icon }) => (
  <div className="flex items-center justify-between gap-3 py-1">
    <div className="flex items-center gap-2 min-w-0">
      {React.createElement(icon, { size: 16, className: 'text-indigo-500 flex-shrink-0' })}
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</div>
        {hint && <div className="text-[11px] text-slate-400">{hint}</div>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Fewer ${label.toLowerCase()}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
      >
        <Minus size={14} />
      </button>
      <span className="w-6 text-center text-sm font-bold text-slate-900 dark:text-white" aria-live="polite">{value}</span>
      <button
        type="button"
        aria-label={`More ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
);

const PlaceField = ({ label, color, value, placeholder, onChange, onBlur, onPick, picking, onGPS, status }) => (
  <div className={labelClass}>
    <span className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      aria-label={label}
      className={fieldClass}
    />
    <div className="flex items-center gap-1.5">
      {onGPS && (
        <button type="button" onClick={onGPS} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
          <LocateFixed size={12} /> My location
        </button>
      )}
      <button
        type="button"
        onClick={onPick}
        aria-pressed={picking}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
          picking ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        <Map size={12} /> {picking ? 'Click the map…' : 'Pick on map'}
      </button>
      {status && <span className="text-[11px] text-slate-400 ml-auto truncate">{status}</span>}
    </div>
  </div>
);

// --- Main component --------------------------------------------------------

export default function TripWizard({
  form, setForm, pickTarget, onPickOnMap, onGPS, onPlaceCommit, placeStatus,
  onSubmit, loading, error, onClearError
}) {
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState(null);
  const { currency, format } = useCurrency();

  const update = (patch) => setForm(prev => ({ ...prev, ...patch }));
  const days = tripLength(form.startDate, form.endDate);
  const nights = Math.max(0, days - 1);
  const guests = form.adults + form.children;
  const perNight = nights > 0 ? Math.round(form.budgetUSD / nights) : form.budgetUSD;

  const setPeople = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      const total = next.adults + next.children;
      // Suggest 1 room per 2 adults until the user sets rooms themselves
      if (!prev.roomsTouched) next.rooms = Math.max(1, Math.ceil(next.adults / 2));
      next.rooms = Math.min(next.rooms, total);
      next.guests = total;
      return next;
    });
  };

  const validate = (i) => {
    if (i === 0) {
      if (form.startLocation.trim().length < 2) return 'Tell us where you start from.';
      if (form.destinationCity.trim().length < 2) return 'Tell us where you want to go.';
    }
    if (i === 1) {
      if (!form.startDate || !form.endDate) return 'Choose your start and end dates.';
      if (days < 1) return 'The end date must be on or after the start date.';
      if (days > 14) return 'Trips can be up to 14 days.';
      if (form.budgetUSD < 20) return `Enter a budget of at least ${format(20)}.`;
    }
    if (i === 2 && form.rooms < 1) return 'You need at least one room.';
    return null;
  };

  const goTo = (target) => {
    // Moving forward requires every earlier step to be valid
    for (let i = step; i < target; i++) {
      const msg = validate(i);
      if (msg) { setStep(i); setStepError(msg); return; }
    }
    setStepError(null);
    setStep(target);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Enter in a text field submits the form: on earlier steps, treat it as "Next"
    if (step < STEPS.length - 1) { goTo(step + 1); return; }
    for (let i = 0; i < STEPS.length; i++) {
      const msg = validate(i);
      if (msg) { setStep(i); setStepError(msg); return; }
    }
    setStepError(null);
    onSubmit();
  };

  const isLast = step === STEPS.length - 1;
  const shownError = stepError || error;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Sparkles size={16} />
          <span className="text-[11px] font-black tracking-wider uppercase">AI Trip Planner</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{STEPS[step].heading}</h2>
      </div>

      {/* Step indicator */}
      <ol className="grid grid-cols-4 gap-1.5 list-none" aria-label="Planner steps">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => goTo(i)}
              aria-current={i === step ? 'step' : undefined}
              className="w-full flex flex-col items-start gap-1 cursor-pointer"
            >
              <span className={`h-1.5 w-full rounded-full ${i <= step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
              <span className={`text-[11px] font-semibold flex items-center gap-1 ${i === step ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                {i < step && <Check size={11} />}{i + 1}. {s.title}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {shownError && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><AlertCircle size={14} className="flex-shrink-0" />{shownError}</span>
          <button type="button" aria-label="Dismiss" onClick={() => { setStepError(null); onClearError?.(); }} className="cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {/* ---------------- STEP 1: ROUTE ---------------- */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <PlaceField
            label="Starting from"
            color="#2563eb"
            value={form.startLocation}
            placeholder="e.g. Colombo"
            onChange={(v) => update({ startLocation: v })}
            onBlur={() => onPlaceCommit('start')}
            onPick={() => onPickOnMap(pickTarget === 'start' ? null : 'start')}
            picking={pickTarget === 'start'}
            onGPS={onGPS}
            status={placeStatus.start}
          />
          <PlaceField
            label="Going to"
            color="#10b981"
            value={form.destinationCity}
            placeholder="Any town, e.g. Ella"
            onChange={(v) => update({ destinationCity: v })}
            onBlur={() => onPlaceCommit('end')}
            onPick={() => onPickOnMap(pickTarget === 'end' ? null : 'end')}
            picking={pickTarget === 'end'}
            status={placeStatus.end}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Popular</span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_DESTINATIONS.map((city) => (
                <button
                  key={city}
                  type="button"
                  className={chipClass(form.destinationCity === city)}
                  onClick={() => { update({ destinationCity: city }); onPlaceCommit('end', city); }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- STEP 2: DATES & BUDGET ---------------- */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              <span className="flex items-center gap-1.5"><Calendar size={15} className="text-blue-600" />Start</span>
              <input
                type="date"
                value={form.startDate}
                min={todayISO()}
                onChange={(e) => {
                  const startDate = e.target.value;
                  update({ startDate, endDate: form.endDate < startDate ? startDate : form.endDate });
                }}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5"><Calendar size={15} className="text-blue-600" />End</span>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || todayISO()}
                onChange={(e) => update({ endDate: e.target.value })}
                className={fieldClass}
              />
            </label>
          </div>
          {days > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
              {days} {days === 1 ? 'day' : 'days'}{nights > 0 && `, ${nights} ${nights === 1 ? 'night' : 'nights'}`}
            </p>
          )}

          <div className={labelClass}>
            <div className="flex items-center justify-between">
              <label htmlFor="trip-budget" className="flex items-center gap-1.5"><DollarSign size={15} className="text-emerald-500" />Total budget ({currency})</label>
              <CurrencyToggle />
            </div>
            {/* Typed in the chosen currency, always stored in USD */}
            <input
              id="trip-budget"
              type="number"
              min="0"
              step={currency === 'LKR' ? 1000 : 10}
              value={Math.round(convertFromUSD(form.budgetUSD, currency))}
              onChange={(e) => update({ budgetUSD: convertToUSD(Number(e.target.value), currency) })}
              className={fieldClass}
            />
            <input
              type="range"
              min="50"
              max="3000"
              step="25"
              value={Math.min(Math.round(form.budgetUSD), 3000)}
              onChange={(e) => update({ budgetUSD: Number(e.target.value) })}
              aria-label="Budget slider"
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[11px] font-normal text-slate-400">
              About {format(perNight)} per {nights > 0 ? 'night' : 'day'} for the whole group.
            </span>
          </div>
        </div>
      )}

      {/* ---------------- STEP 3: TRAVELLERS & ROOMS ---------------- */}
      {step === 2 && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 divide-y divide-slate-100 dark:divide-slate-800">
            <Stepper label="Adults" hint="Age 13+" icon={Users} value={form.adults} min={1} max={12} onChange={(v) => setPeople('adults', v)} />
            <Stepper label="Kids" hint="Age 0–12" icon={Users} value={form.children} min={0} max={10} onChange={(v) => setPeople('children', v)} />
            <Stepper
              label="Rooms"
              hint="How many hotel rooms you need"
              icon={BedDouble}
              value={form.rooms}
              min={1}
              max={Math.max(1, guests)}
              onChange={(v) => update({ rooms: v, roomsTouched: true })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Must-have at the hotel <span className="text-[11px] font-normal text-slate-400">(optional)</span></span>
            <div className="flex flex-wrap gap-1.5">
              {HOTEL_AMENITIES.map((name) => {
                const selected = form.amenities.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={selected}
                    className={chipClass(selected)}
                    onClick={() => update({ amenities: selected ? form.amenities.filter(a => a !== name) : [...form.amenities, name] })}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- STEP 4: STYLE ---------------- */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Trip vibe</span>
            <div className="grid grid-cols-5 gap-1.5">
              {VIBES.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={form.vibe === id}
                  onClick={() => update({ vibe: id })}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    form.vibe === id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {React.createElement(icon, { size: 16 })}{label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Transport</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { own: true, title: 'I have my own vehicle', icon: KeyRound },
                { own: false, title: 'Arrange transport for me', icon: Bus }
              ].map(({ own, title, icon }) => (
                <button
                  key={title}
                  type="button"
                  aria-pressed={form.ownTransport === own}
                  onClick={() => update({ ownTransport: own })}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-left transition cursor-pointer border ${
                    form.ownTransport === own
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {React.createElement(icon, { size: 16, className: 'flex-shrink-0' })}{title}
                </button>
              ))}
            </div>
            {!form.ownTransport && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {HIRED_TRANSPORT.map(({ id, label, icon }) => (
                  <button key={id} type="button" aria-pressed={form.transportMode === id} className={`${chipClass(form.transportMode === id)} flex items-center gap-1`} onClick={() => update({ transportMode: id })}>
                    {React.createElement(icon, { size: 12 })}{label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className={labelClass}>
            <span>Tell the planner about your trip <span className="text-[11px] font-normal text-slate-400">(optional)</span></span>
            <textarea
              rows={3}
              maxLength={500}
              value={form.tripDescription}
              onChange={(e) => update({ tripDescription: e.target.value })}
              placeholder="e.g. Family trip, we love waterfalls and tea estates, easy walks only"
              className={`${fieldClass} resize-none`}
            />
          </label>

          <label className={labelClass}>
            <span className="flex items-center gap-1.5"><CloudSun size={15} className="text-amber-500" />Weather preference <span className="text-[11px] font-normal text-slate-400">(optional)</span></span>
            <input
              type="text"
              maxLength={200}
              value={form.weatherPreference}
              onChange={(e) => update({ weatherPreference: e.target.value })}
              placeholder="e.g. avoid rainy beach days"
              className={fieldClass}
            />
          </label>

          {/* Review */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5"><MapPin size={13} />{form.startLocation} → {form.destinationCity}</div>
            <div>{form.startDate} to {form.endDate} · {days} {days === 1 ? 'day' : 'days'} · {format(form.budgetUSD)}</div>
            <div>
              {form.adults} {form.adults === 1 ? 'adult' : 'adults'}
              {form.children > 0 && `, ${form.children} ${form.children === 1 ? 'kid' : 'kids'}`}
              {' · '}{form.rooms} {form.rooms === 1 ? 'room' : 'rooms'}
              {' · '}{form.ownTransport ? 'own vehicle' : form.transportMode}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-2 pt-1">
        {step > 0 && (
          <button
            type="button"
            onClick={() => { setStepError(null); setStep(step - 1); }}
            className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <ArrowLeft size={15} /> Back
          </button>
        )}
        {/* Distinct keys: React must NOT reuse the "Next" <button> as the submit
            button, or the click that opens the last step would also submit. */}
        {isLast ? (
          <button
            key="submit"
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={16} />{loading ? 'Planning your trip…' : 'Plan my trip'}
          </button>
        ) : (
          <button
            key="next"
            type="button"
            onClick={() => goTo(step + 1)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            Next: {STEPS[step + 1].title} <ArrowRight size={15} />
          </button>
        )}
      </div>
    </form>
  );
}
