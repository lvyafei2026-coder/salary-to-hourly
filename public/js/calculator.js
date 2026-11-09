let currentMode = 'salary';

function t() { return (window.__i18n && window.__i18n.t) || {}; }

function fmt(n) {
  if (!isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtRound(n) {
  if (!isFinite(n)) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}

function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  document.querySelectorAll('.mode-panel').forEach(p => p.style.display = 'none');
  document.getElementById('mode-' + mode).style.display = 'block';
  calculate();
}

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('mode')) {
    const m = params.get('mode');
    if (['salary','hourly'].includes(m)) switchMode(m);
  }
  if (params.has('salary')) document.getElementById('annualSalary').value = params.get('salary');
  if (params.has('hourly')) document.getElementById('hourlyRate').value = params.get('hourly');
  if (params.has('hours')) document.getElementById('hoursPerWeek').value = params.get('hours');
  if (params.has('weeks')) document.getElementById('weeksPerYear').value = params.get('weeks');
  if (params.has('pto')) document.getElementById('ptoWeeks').value = params.get('pto');
  calculate();
}

function buildShareUrl() {
  const params = new URLSearchParams();
  params.set('mode', currentMode);
  if (currentMode === 'salary') params.set('salary', document.getElementById('annualSalary').value);
  else params.set('hourly', document.getElementById('hourlyRate').value);
  params.set('hours', document.getElementById('hoursPerWeek').value);
  const weeks = document.getElementById('weeksPerYear').value;
  if (weeks !== '52') params.set('weeks', weeks);
  const pto = document.getElementById('ptoWeeks').value;
  if (pto && parseFloat(pto) > 0) params.set('pto', pto);
  const base = window.location.origin + window.location.pathname;
  return base + '?' + params.toString();
}

function copyShareLink() {
  const url = buildShareUrl();
  navigator.clipboard.writeText(url).then(() => {
    const el = document.getElementById('shareCopied');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1800);
  }).catch(() => { prompt('Copy this link:', url); });
}

function calculate() {
  const tr = t();
  const hoursPerWeek = parseFloat(document.getElementById('hoursPerWeek').value) || 40;
  const weeksPerYear = parseFloat(document.getElementById('weeksPerYear').value) || 52;
  const ptoWeeks = parseFloat(document.getElementById('ptoWeeks').value) || 0;

  // Paid hours per year = (weeks worked + paid PTO weeks) × hours per week
  const paidWeeks = weeksPerYear;
  const totalHours = hoursPerWeek * paidWeeks;

  if (totalHours <= 0) {
    document.getElementById('result').classList.remove('show');
    return;
  }

  let annual, hourly;

  if (currentMode === 'salary') {
    annual = parseFloat(document.getElementById('annualSalary').value) || 0;
    hourly = annual / totalHours;
  } else {
    hourly = parseFloat(document.getElementById('hourlyRate').value) || 0;
    annual = hourly * totalHours;
  }

  // If PTO is entered, effective working weeks is (weeks - pto), but paid weeks stay 52.
  // So hourly "effective" rate stays the same because PTO hours are paid.
  // We just show the same hourly.

  const weekly = hourly * hoursPerWeek;
  const daily = hourly * 8;
  const biweekly = annual / 26;
  const semimonthly = annual / 24;
  const monthly = annual / 12;

  // Result label and main
  const resultLabel = document.getElementById('resultLabel');
  const resultMain = document.getElementById('resultMain');
  const resultSub = document.getElementById('resultSub');

  if (currentMode === 'salary') {
    resultLabel.textContent = tr.resultHourlyLabel || 'Equivalent hourly rate';
    resultMain.textContent = fmt(hourly) + ' / hr';
    resultSub.textContent = fmtRound(annual) + ' ' + (tr.perYear || 'per year') + ' · ' + totalHours.toLocaleString() + ' ' + (tr.hours || 'hours');
  } else {
    resultLabel.textContent = tr.resultSalaryLabel || 'Equivalent annual salary';
    resultMain.textContent = fmtRound(annual) + ' / yr';
    resultSub.textContent = fmt(hourly) + ' / hr · ' + totalHours.toLocaleString() + ' ' + (tr.hours || 'hours');
  }

  document.getElementById('bdHourly').textContent = fmt(hourly);
  document.getElementById('bdDaily').textContent = fmt(daily);
  document.getElementById('bdWeekly').textContent = fmt(weekly);
  document.getElementById('bdBiweekly').textContent = fmt(biweekly);
  document.getElementById('bdSemimonthly').textContent = fmt(semimonthly);
  document.getElementById('bdMonthly').textContent = fmt(monthly);
  document.getElementById('bdAnnual').textContent = fmtRound(annual);
  document.getElementById('bdTotalHours').textContent = totalHours.toLocaleString() + ' hrs';

  document.getElementById('result').classList.add('show');
}

window.switchMode = switchMode;
window.calculate = calculate;
window.copyShareLink = copyShareLink;
window.readUrlParams = readUrlParams;

document.addEventListener('DOMContentLoaded', function() {
  ['annualSalary','hourlyRate','hoursPerWeek','weeksPerYear','ptoWeeks'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculate);
  });
});