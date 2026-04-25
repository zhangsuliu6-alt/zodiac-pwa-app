import React, { useEffect, useMemo, useRef, useState } from "react";

const ZODIACS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
const NUMBERS = Array.from({ length: 49 }, (_, i) => String(i + 1).padStart(2, "0"));
const TRAD = { 龍: "龙", 馬: "马", 雞: "鸡", 豬: "猪" };

const LATEST_API = "/api/latest";
const HISTORY_API_PREFIX = "/api/history/";
const WINDOW_SIZE = 30;
const TRAIN_MIN = 12;
const POLL_MS = 30000;

const RED = new Set(["01", "02", "07", "08", "12", "13", "18", "19", "23", "24", "29", "30", "34", "35", "40", "45", "46"]);
const BLUE = new Set(["03", "04", "09", "10", "14", "15", "20", "25", "26", "31", "36", "37", "41", "42", "47", "48"]);
const GREEN = new Set(["05", "06", "11", "16", "17", "21", "22", "27", "28", "32", "33", "38", "39", "43", "44", "49"]);

const COLORS = ["红波", "蓝波", "绿波"];
const BIG_SMALL = ["大", "小"];
const ODD_EVEN = ["单", "双"];
const HEADS = ["0头", "1头", "2头", "3头", "4头"];

const FALLBACK_ROWS = [
  { expect: "20260424378", openTime: "2026-04-24 18:51:00", openCode: "46,45,01,32,42,07,30", zodiac: "鸡,狗,马,猪,牛,鼠,牛" },
  { expect: "20260424377", openTime: "2026-04-24 18:48:00", openCode: "49,40,46,01,29,41,48", zodiac: "马,兔,鸡,马,虎,虎,羊" },
  { expect: "20260424376", openTime: "2026-04-24 18:45:00", openCode: "16,31,18,36,41,10,30", zodiac: "兔,鼠,牛,羊,虎,鸡,牛" },
  { expect: "20260424375", openTime: "2026-04-24 18:42:00", openCode: "33,09,28,27,19,07,46", zodiac: "狗,狗,兔,龙,鼠,鼠,鸡" },
  { expect: "20260424374", openTime: "2026-04-24 18:39:00", openCode: "29,13,08,39,43,37,26", zodiac: "虎,马,猪,龙,鼠,马,蛇" },
  { expect: "20260424373", openTime: "2026-04-24 18:36:00", openCode: "30,34,18,12,47,19,23", zodiac: "牛,鸡,牛,羊,猴,鼠,猴" },
  { expect: "20260424372", openTime: "2026-04-24 18:33:00", openCode: "19,49,23,04,24,38,47", zodiac: "鼠,马,猴,兔,羊,蛇,猴" },
  { expect: "20260424371", openTime: "2026-04-24 18:30:00", openCode: "22,33,10,27,39,04,38", zodiac: "鸡,狗,鸡,龙,龙,兔,蛇" },
  { expect: "20260424370", openTime: "2026-04-24 18:27:00", openCode: "38,34,48,28,36,31,35", zodiac: "蛇,鸡,羊,兔,羊,鼠,猴" },
  { expect: "20260424369", openTime: "2026-04-24 18:24:00", openCode: "23,16,45,41,14,31,30", zodiac: "猴,兔,狗,虎,蛇,鼠,牛" },
  { expect: "20260424368", openTime: "2026-04-24 18:21:00", openCode: "15,05,11,41,20,48,49", zodiac: "龙,虎,猴,虎,猪,羊,马" },
  { expect: "20260424367", openTime: "2026-04-24 18:18:00", openCode: "47,33,09,11,02,06,29", zodiac: "猴,狗,狗,猴,蛇,牛,虎" },
  { expect: "20260424366", openTime: "2026-04-24 18:15:00", openCode: "46,30,13,12,05,49,18", zodiac: "鸡,牛,马,羊,虎,马,牛" },
  { expect: "20260424365", openTime: "2026-04-24 18:12:00", openCode: "22,02,48,16,32,09,49", zodiac: "鸡,蛇,羊,兔,猪,狗,马" },
  { expect: "20260424364", openTime: "2026-04-24 18:09:00", openCode: "32,45,07,09,37,10,40", zodiac: "猪,狗,鼠,狗,马,鸡,兔" },
  { expect: "20260424363", openTime: "2026-04-24 18:06:00", openCode: "42,23,32,36,10,06,33", zodiac: "牛,猴,猪,羊,鸡,牛,狗" },
  { expect: "20260424362", openTime: "2026-04-24 18:03:00", openCode: "02,11,27,13,45,16,17", zodiac: "蛇,猴,龙,马,狗,兔,虎" },
  { expect: "20260424361", openTime: "2026-04-24 18:00:00", openCode: "28,40,48,16,11,45,03", zodiac: "兔,兔,羊,兔,猴,狗,龙" },
  { expect: "20260424360", openTime: "2026-04-24 17:57:00", openCode: "25,21,03,43,15,37,45", zodiac: "马,狗,龙,鼠,龙,马,狗" },
  { expect: "20260424359", openTime: "2026-04-24 17:54:00", openCode: "07,39,44,04,06,12,38", zodiac: "鼠,龙,猪,兔,牛,羊,蛇" }
];

const PING_MODELS = [
  { id: "freq30", name: "近30期高频", w: { issue: 18, occur: 4, recent5: 8, recent10: 6, special: 2, trend: 4, follow: 2 } },
  { id: "recent10", name: "近10期热肖", w: { issue: 8, occur: 3, recent5: 18, recent10: 14, special: 2, trend: 10, follow: 1 } },
  { id: "steady", name: "稳健热肖", w: { issue: 14, occur: 3, recent5: 10, recent10: 10, special: 3, trend: 7, follow: 3 } },
  { id: "trend", name: "趋势加强", w: { issue: 12, occur: 4, recent5: 12, recent10: 10, special: 4, trend: 12, follow: 2 } },
  { id: "specialWeak", name: "特码弱带动", w: { issue: 8, occur: 2, recent5: 10, recent10: 8, special: 8, trend: 5, follow: 4 } }
];

const CLASS_MODELS = [
  { id: "hot", name: "热度主导", w: { count: 15, recent5: 20, recent10: 8, streak: 6, follow: 7, trend: 8 } },
  { id: "recent", name: "近期加强", w: { count: 8, recent5: 32, recent10: 12, streak: 10, follow: 4, trend: 12 } },
  { id: "follow", name: "跟随加强", w: { count: 8, recent5: 12, recent10: 8, streak: 5, follow: 24, trend: 7 } },
  { id: "stable", name: "稳健均衡", w: { count: 12, recent5: 18, recent10: 10, streak: 8, follow: 12, trend: 9 } }
];

function simpleZodiac(value) {
  return String(value || "").trim().split("").map((ch) => TRAD[ch] || ch).join("");
}

function isDigit(ch) {
  return ch >= "0" && ch <= "9";
}

function onlyDigits(text) {
  const s = String(text || "");
  if (!s) return false;
  for (const ch of s) if (!isDigit(ch)) return false;
  return true;
}

function isSeparator(ch) {
  if (!ch) return true;
  const code = ch.charCodeAt(0);
  if (code <= 32 || code === 12288) return true;
  return "，、。；;|/,+:-_()[]{}".includes(ch);
}

function splitItems(value) {
  const text = String(value || "");
  const out = [];
  let buf = "";
  for (const ch of text) {
    if (isSeparator(ch)) {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function extractPairs(text) {
  const body = String(text || "");
  const pairs = [];
  let i = 0;
  while (i < body.length) {
    if (!isDigit(body[i])) {
      i += 1;
      continue;
    }
    let num = "";
    while (i < body.length && isDigit(body[i])) {
      num += body[i];
      i += 1;
    }
    while (i < body.length && isSeparator(body[i])) i += 1;
    const zodiac = simpleZodiac(body[i]);
    const n = Number(num);
    if (n >= 1 && n <= 49 && ZODIACS.includes(zodiac)) {
      pairs.push([String(n).padStart(2, "0"), zodiac]);
      i += 1;
    }
  }
  return pairs;
}

function normalizeRecord(row) {
  const codeRaw = row.openCode || row.open_code || row.code || row.codes || "";
  const zodiacRaw = row.zodiac || row.animals || row.shengxiao || "";
  const codeList = splitItems(codeRaw).map((n) => String(Number(n)).padStart(2, "0")).filter((n) => NUMBERS.includes(n));
  const zodiacList = splitItems(zodiacRaw).map(simpleZodiac).filter((z) => ZODIACS.includes(z));
  return {
    expect: String(row.expect || row.issue || row.period || row.qihao || ""),
    openTime: String(row.openTime || row.open_time || row.time || ""),
    openCode: codeList.join(","),
    zodiac: zodiacList.join(","),
    codeList,
    zodiacList
  };
}

function parseRows(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  try {
    const json = JSON.parse(raw);
    const arr = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : Array.isArray(json.result) ? json.result : [];
    return arr.map(normalizeRecord).filter((r) => r.codeList.length >= 7 && r.zodiacList.length >= 7);
  } catch (e) {
    // ignore and parse as plain text
  }
  const rows = [];
  for (const line of raw.split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean)) {
    const parts = splitItems(line);
    if (parts.length < 8) continue;
    const expect = parts[0];
    if (!onlyDigits(expect) || expect.length < 5) continue;
    const pairs = extractPairs(parts.slice(1).join(" "));
    if (pairs.length >= 7) {
      rows.push(normalizeRecord({
        expect,
        openCode: pairs.slice(0, 7).map((p) => p[0]).join(","),
        zodiac: pairs.slice(0, 7).map((p) => p[1]).join(",")
      }));
    }
  }
  return rows;
}

function unwrapApiRows(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.result)) return json.result;
  return [];
}

function uniqRows(rows) {
  const map = new Map();
  for (const row of rows) {
    if (row.expect) map.set(row.expect, row);
  }
  return [...map.values()].sort((a, b) => String(b.expect).localeCompare(String(a.expect)));
}

function chronological(rows) {
  return [...uniqRows(rows)].sort((a, b) => String(a.expect).localeCompare(String(b.expect)));
}

function latestRows(rows, n = WINDOW_SIZE) {
  return uniqRows(rows).slice(0, n);
}

function nextExpect(expect) {
  const s = String(expect || "");
  if (!onlyDigits(s)) return "";
  return String(Number(s) + 1).padStart(s.length, "0");
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function pct(a, b) {
  return b ? Math.round((a / b) * 100) : 0;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function ballColor(num) {
  if (RED.has(num)) return "红波";
  if (BLUE.has(num)) return "蓝波";
  if (GREEN.has(num)) return "绿波";
  return "";
}

function bigSmall(num) {
  return Number(num) >= 25 ? "大" : "小";
}

function oddEven(num) {
  return Number(num) % 2 === 1 ? "单" : "双";
}

function specialNum(row) {
  return row && row.codeList ? row.codeList[6] : "";
}

function headOfNum(num) {
  const n = Number(num);
  if (!n || n < 1 || n > 49) return "";
  return `${Math.floor(n / 10)}头`;
}

function classOfRow(row, type) {
  const n = specialNum(row);
  if (!n) return "";
  if (type === "color") return ballColor(n);
  if (type === "size") return bigSmall(n);
  return oddEven(n);
}

function baseRatings(models) {
  return Object.fromEntries(models.map((m) => [m.id, 1]));
}

function confidence(list) {
  if (!list || list.length < 2) return { level: "低", edge: 0 };
  const edge = round((list[0].score || 0) - (list[1].score || 0));
  if (edge >= 18) return { level: "高", edge };
  if (edge >= 8) return { level: "中", edge };
  return { level: "低", edge };
}

async function fetchLatestRowsFromApi() {
  const res = await fetch(LATEST_API, { cache: "no-store" });
  if (!res.ok) throw new Error(`最新接口HTTP ${res.status}`);
  const json = await res.json();
  return unwrapApiRows(json).map(normalizeRecord).filter((r) => r.codeList.length >= 7 && r.zodiacList.length >= 7);
}

async function fetchExpect(expect) {
  const res = await fetch(`${HISTORY_API_PREFIX}${expect}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`历史接口HTTP ${res.status}`);
  const json = await res.json();
  return unwrapApiRows(json).map(normalizeRecord).filter((r) => r.codeList.length >= 7 && r.zodiacList.length >= 7);
}

async function fetchLatest30() {
  const latest = await fetchLatestRowsFromApi();
  if (!latest.length) throw new Error("最新接口没有返回开奖记录");
  const latestExpect = Number(latest[0].expect);
  const rows = [...latest];
  for (let e = latestExpect - 1; e >= latestExpect - WINDOW_SIZE + 1; e--) {
    try {
      rows.push(...await fetchExpect(e));
    } catch (err) {
      // 单期失败不影响整体同步
    }
  }
  return latestRows(rows, WINDOW_SIZE);
}

function scorePingModel(rows, model) {
  const latest = latestRows(rows);
  const chrono = [...latest].reverse();
  const w = model.w;
  const stats = Object.fromEntries(ZODIACS.map((z) => [z, {
    label: z,
    issue: 0,
    occur: 0,
    recent5: 0,
    recent10: 0,
    special: 0,
    trend: 0,
    follow: 0,
    score: 0
  }]));

  chrono.forEach((row, index) => {
    const seen = new Set(row.zodiacList);
    const age = chrono.length - 1 - index;
    for (const z of seen) {
      if (stats[z]) {
        stats[z].issue += 1;
        if (age < 5) stats[z].recent5 += 1;
        if (age < 10) stats[z].recent10 += 1;
      }
    }
    for (const z of row.zodiacList) {
      if (stats[z]) stats[z].occur += 1;
    }
    const sp = row.zodiacList[6];
    if (stats[sp]) stats[sp].special += 1;
  });

  const half = Math.floor(chrono.length / 2);
  const older = chrono.slice(0, half);
  const newer = chrono.slice(half);
  for (const z of ZODIACS) {
    let oldHit = 0;
    let newHit = 0;
    for (const row of older) if (row.zodiacList.includes(z)) oldHit += 1;
    for (const row of newer) if (row.zodiacList.includes(z)) newHit += 1;
    stats[z].trend = Math.max(0, newHit - oldHit);
  }

  const lastSpecial = latest[0]?.zodiacList?.[6] || "";
  if (lastSpecial) {
    for (let i = 1; i < chrono.length; i++) {
      if (chrono[i - 1].zodiacList[6] === lastSpecial) {
        const seen = new Set(chrono[i].zodiacList);
        for (const z of seen) if (stats[z]) stats[z].follow += 1;
      }
    }
  }

  return ZODIACS.map((z) => {
    const s = stats[z];
    const score =
      s.issue * w.issue +
      s.occur * w.occur +
      s.recent5 * w.recent5 +
      s.recent10 * w.recent10 +
      s.special * w.special +
      s.trend * w.trend +
      s.follow * w.follow;
    return { ...s, score: round(score) };
  }).sort((a, b) => b.score - a.score);
}

function scorePing(rows, ratings) {
  const scores = Object.fromEntries(ZODIACS.map((z) => [z, 0]));
  for (const model of PING_MODELS) {
    const list = scorePingModel(rows, model);
    const max = Math.max(1, list[0]?.score || 1);
    list.forEach((item, index) => {
      const rankBonus = Math.max(0, 12 - index);
      scores[item.label] += ((item.score / max) * 100 + rankBonus * 3) * (ratings[model.id] || 1);
    });
  }
  const list = ZODIACS.map((z) => ({ label: z, score: round(scores[z]) })).sort((a, b) => b.score - a.score);
  return { list, pick: list[0] || { label: "-", score: 0 }, confidence: confidence(list) };
}

function scoreHeadForKill(rows) {
  const latest = latestRows(rows);
  const chrono = [...latest].reverse();
  const stats = Object.fromEntries(HEADS.map((h) => [h, {
    label: h,
    count: 0,
    recent5: 0,
    recent10: 0,
    follow: 0,
    trend: 0,
    score: 0
  }]));

  chrono.forEach((row, index) => {
    const h = headOfNum(specialNum(row));
    if (!stats[h]) return;
    const age = chrono.length - 1 - index;
    stats[h].count += 1;
    if (age < 5) stats[h].recent5 += 1;
    if (age < 10) stats[h].recent10 += 1;
  });

  const half = Math.floor(chrono.length / 2);
  const older = chrono.slice(0, half);
  const newer = chrono.slice(half);
  for (const h of HEADS) {
    let oldHit = 0;
    let newHit = 0;
    for (const row of older) if (headOfNum(specialNum(row)) === h) oldHit += 1;
    for (const row of newer) if (headOfNum(specialNum(row)) === h) newHit += 1;
    stats[h].trend = Math.max(0, newHit - oldHit);
  }

  const lastHead = headOfNum(specialNum(latest[0]));
  if (lastHead) {
    for (let i = 1; i < chrono.length; i++) {
      if (headOfNum(specialNum(chrono[i - 1])) === lastHead) {
        const nextHead = headOfNum(specialNum(chrono[i]));
        if (stats[nextHead]) stats[nextHead].follow += 1;
      }
    }
  }

  return HEADS.map((h) => {
    const s = stats[h];
    const score = s.count * 20 + s.recent5 * 24 + s.recent10 * 12 + s.trend * 10 + s.follow * 8;
    return { ...s, score: round(score) };
  }).sort((a, b) => b.score - a.score);
}

function scoreSpecialZodiacForKill(rows) {
  const latest = latestRows(rows);
  const chrono = [...latest].reverse();
  const stats = Object.fromEntries(ZODIACS.map((z) => [z, {
    label: z,
    count: 0,
    recent5: 0,
    recent10: 0,
    follow: 0,
    trend: 0,
    score: 0
  }]));

  chrono.forEach((row, index) => {
    const z = row.zodiacList[6];
    if (!stats[z]) return;
    const age = chrono.length - 1 - index;
    stats[z].count += 1;
    if (age < 5) stats[z].recent5 += 1;
    if (age < 10) stats[z].recent10 += 1;
  });

  const half = Math.floor(chrono.length / 2);
  const older = chrono.slice(0, half);
  const newer = chrono.slice(half);
  for (const z of ZODIACS) {
    let oldHit = 0;
    let newHit = 0;
    for (const row of older) if (row.zodiacList[6] === z) oldHit += 1;
    for (const row of newer) if (row.zodiacList[6] === z) newHit += 1;
    stats[z].trend = Math.max(0, newHit - oldHit);
  }

  const lastSpecial = latest[0]?.zodiacList?.[6] || "";
  if (lastSpecial) {
    for (let i = 1; i < chrono.length; i++) {
      if (chrono[i - 1].zodiacList[6] === lastSpecial) {
        const nextZ = chrono[i].zodiacList[6];
        if (stats[nextZ]) stats[nextZ].follow += 1;
      }
    }
  }

  return ZODIACS.map((z) => {
    const s = stats[z];
    const score = s.count * 22 + s.recent5 * 24 + s.recent10 * 12 + s.trend * 10 + s.follow * 8;
    return { ...s, score: round(score) };
  }).sort((a, b) => b.score - a.score);
}

function scoreClassModel(rows, model, labels, type) {
  const latest = latestRows(rows);
  const chrono = [...latest].reverse();
  const w = model.w;
  const stats = Object.fromEntries(labels.map((x) => [x, {
    label: x,
    count: 0,
    recent5: 0,
    recent10: 0,
    streak: 0,
    follow: 0,
    trend: 0,
    score: 0
  }]));

  chrono.forEach((row, index) => {
    const v = classOfRow(row, type);
    if (!stats[v]) return;
    const age = chrono.length - 1 - index;
    stats[v].count += 1;
    if (age < 5) stats[v].recent5 += 1;
    if (age < 10) stats[v].recent10 += 1;
  });

  const latestValue = latest[0] ? classOfRow(latest[0], type) : "";
  if (latestValue && stats[latestValue]) {
    for (const row of latest) {
      if (classOfRow(row, type) === latestValue) stats[latestValue].streak += 1;
      else break;
    }
  }

  if (latestValue) {
    for (let i = 1; i < chrono.length; i++) {
      if (classOfRow(chrono[i - 1], type) === latestValue) {
        const next = classOfRow(chrono[i], type);
        if (stats[next]) stats[next].follow += 1;
      }
    }
  }

  const half = Math.floor(chrono.length / 2);
  const older = chrono.slice(0, half);
  const newer = chrono.slice(half);
  for (const label of labels) {
    let oldHit = 0;
    let newHit = 0;
    for (const row of older) if (classOfRow(row, type) === label) oldHit += 1;
    for (const row of newer) if (classOfRow(row, type) === label) newHit += 1;
    stats[label].trend = Math.max(0, newHit - oldHit);
  }

  return labels.map((label) => {
    const s = stats[label];
    const score =
      s.count * w.count +
      s.recent5 * w.recent5 +
      s.recent10 * w.recent10 +
      s.streak * w.streak +
      s.follow * w.follow +
      s.trend * w.trend;
    return { ...s, score: round(score) };
  }).sort((a, b) => b.score - a.score);
}

function scoreClass(rows, labels, type, ratings) {
  const scores = Object.fromEntries(labels.map((x) => [x, 0]));
  for (const model of CLASS_MODELS) {
    const list = scoreClassModel(rows, model, labels, type);
    const max = Math.max(1, list[0]?.score || 1);
    list.forEach((item, index) => {
      const rankBonus = Math.max(0, labels.length - index);
      scores[item.label] += ((item.score / max) * 100 + rankBonus * 5) * (ratings[model.id] || 1);
    });
  }
  const list = labels.map((label) => ({ label, score: round(scores[label]) })).sort((a, b) => b.score - a.score);
  return { list, pick: list[0] || { label: "-", score: 0 }, confidence: confidence(list) };
}

function makePrediction(rows, pingRatings, classRatings) {
  const ping = scorePing(rows, pingRatings);
  const killHead = scoreHeadForKill(rows).slice(-1)[0]?.label || "-";
  const killZodiacs = scoreSpecialZodiacForKill(rows).slice(-4).map((x) => x.label);
  const color = scoreClass(rows, COLORS, "color", classRatings.color);
  const size = scoreClass(rows, BIG_SMALL, "size", classRatings.size);
  const parity = scoreClass(rows, ODD_EVEN, "parity", classRatings.parity);
  const latest = uniqRows(rows)[0];

  return {
    expect: latest ? nextExpect(latest.expect) : "",
    basedOn: latest ? latest.expect : "",
    time: new Date().toLocaleString(),
    ping: ping.pick.label,
    killHead,
    killZodiacs,
    color: color.list.slice(0, 2).map((x) => x.label),
    size: size.pick.label,
    parity: parity.pick.label,
    byPingModel: Object.fromEntries(PING_MODELS.map((m) => [m.id, scorePingModel(rows, m)[0]?.label || ""])),
    byColorModel: Object.fromEntries(CLASS_MODELS.map((m) => [m.id, scoreClassModel(rows, m, COLORS, "color").slice(0, 2).map((x) => x.label)])),
    bySizeModel: Object.fromEntries(CLASS_MODELS.map((m) => [m.id, scoreClassModel(rows, m, BIG_SMALL, "size")[0]?.label || ""])),
    byParityModel: Object.fromEntries(CLASS_MODELS.map((m) => [m.id, scoreClassModel(rows, m, ODD_EVEN, "parity")[0]?.label || ""]))
  };
}

function updateRatings(pred, actual, pingRatings, classRatings) {
  const newPing = { ...pingRatings };
  const newClass = {
    color: { ...classRatings.color },
    size: { ...classRatings.size },
    parity: { ...classRatings.parity }
  };
  const actualSet = new Set(actual.zodiacList);
  const actualColor = classOfRow(actual, "color");
  const actualSize = classOfRow(actual, "size");
  const actualParity = classOfRow(actual, "parity");

  for (const model of PING_MODELS) {
    newPing[model.id] = clamp((newPing[model.id] || 1) + (actualSet.has(pred.byPingModel?.[model.id]) ? 0.12 : -0.08), 0.25, 5);
  }

  for (const model of CLASS_MODELS) {
    const colorPick = pred.byColorModel?.[model.id] || [];
    newClass.color[model.id] = clamp((newClass.color[model.id] || 1) + (colorPick.includes(actualColor) ? 0.12 : -0.08), 0.25, 5);
    newClass.size[model.id] = clamp((newClass.size[model.id] || 1) + (pred.bySizeModel?.[model.id] === actualSize ? 0.1 : -0.06), 0.25, 5);
    newClass.parity[model.id] = clamp((newClass.parity[model.id] || 1) + (pred.byParityModel?.[model.id] === actualParity ? 0.1 : -0.06), 0.25, 5);
  }

  return { pingRatings: newPing, classRatings: newClass };
}

function trainRatings(rows) {
  const all = chronological(rows);
  let pingRatings = baseRatings(PING_MODELS);
  let classRatings = {
    color: baseRatings(CLASS_MODELS),
    size: baseRatings(CLASS_MODELS),
    parity: baseRatings(CLASS_MODELS)
  };

  for (let i = TRAIN_MIN; i < all.length; i++) {
    const train = all.slice(Math.max(0, i - WINDOW_SIZE), i);
    const actual = all[i];
    const pred = makePrediction(train, pingRatings, classRatings);
    const updated = updateRatings(pred, actual, pingRatings, classRatings);
    pingRatings = updated.pingRatings;
    classRatings = updated.classRatings;
  }

  return { pingRatings, classRatings };
}

function settledHistory(rows, pingRatings, classRatings) {
  const all = chronological(rows);
  const out = [];

  for (let i = Math.max(TRAIN_MIN, all.length - 10); i < all.length; i++) {
    const train = all.slice(Math.max(0, i - WINDOW_SIZE), i);
    const actual = all[i];
    if (train.length < TRAIN_MIN) continue;

    const pred = makePrediction(train, pingRatings, classRatings);
    const actualColor = classOfRow(actual, "color");
    const actualSize = classOfRow(actual, "size");
    const actualParity = classOfRow(actual, "parity");
    const predictedColors = Array.isArray(pred.color) ? pred.color : [pred.color];
    const killed = Array.isArray(pred.killZodiacs) ? pred.killZodiacs : [];
    const actualSet = new Set(actual.zodiacList);
    const actualSpecialZodiac = actual.zodiacList[6] || "";
    const actualHead = headOfNum(specialNum(actual));

    out.unshift({
      expect: actual.expect,
      basedOn: pred.basedOn,
      ping: pred.ping,
      killHead: pred.killHead,
      killZodiacs: killed,
      colors: predictedColors,
      size: pred.size,
      parity: pred.parity,
      actualNum: specialNum(actual),
      actualZodiacs: actual.zodiacList,
      actualSpecialZodiac,
      actualHead,
      actualColor,
      actualSize,
      actualParity,
      pingHit: actualSet.has(pred.ping),
      killHeadHit: pred.killHead && pred.killHead !== actualHead,
      killHit: killed.length === 4 && killed.every((z) => z !== actualSpecialZodiac),
      colorHit: predictedColors.includes(actualColor),
      sizeHit: pred.size === actualSize,
      parityHit: pred.parity === actualParity
    });
  }

  return out.slice(0, 10);
}

function historyStats(history) {
  const total = history.length;
  const count = (key) => history.filter((x) => x[key]).length;
  return {
    total,
    pingRate: pct(count("pingHit"), total),
    killHeadRate: pct(count("killHeadHit"), total),
    killRate: pct(count("killHit"), total),
    colorRate: pct(count("colorHit"), total),
    sizeRate: pct(count("sizeHit"), total),
    parityRate: pct(count("parityHit"), total)
  };
}

function RatingRows({ title, models, ratings }) {
  return (
    <div>
      <h3 className="mb-2 font-bold">{title}</h3>
      <div className="space-y-2">
        {models.map((m) => (
          <div key={m.id} className="rounded-2xl bg-slate-950/70 border border-white/10 p-3">
            <div className="flex items-center gap-3">
              <div className="w-28 text-sm">{m.name}</div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-slate-200"
                  style={{ width: `${clamp(((ratings[m.id] || 1) / 5) * 100, 4, 100)}%` }}
                />
              </div>
              <div className="w-12 text-right text-sm">{round(ratings[m.id] || 1)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ZodiacPredictionApp() {
  const [records, setRecords] = useState([]);
  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState("正在同步最新30期...");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastCheck, setLastCheck] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const fileRef = useRef(null);

  const trained = useMemo(() => trainRatings(records), [records]);
  const recent30 = useMemo(() => latestRows(records, WINDOW_SIZE), [records]);
  const prediction = useMemo(() => makePrediction(recent30, trained.pingRatings, trained.classRatings), [recent30, trained]);
  const ping = useMemo(() => scorePing(recent30, trained.pingRatings), [recent30, trained]);
  const color = useMemo(() => scoreClass(recent30, COLORS, "color", trained.classRatings.color), [recent30, trained]);
  const size = useMemo(() => scoreClass(recent30, BIG_SMALL, "size", trained.classRatings.size), [recent30, trained]);
  const parity = useMemo(() => scoreClass(recent30, ODD_EVEN, "parity", trained.classRatings.parity), [recent30, trained]);
  const history = useMemo(() => settledHistory(records, trained.pingRatings, trained.classRatings), [records, trained]);
  const stats = useMemo(() => historyStats(history), [history]);

  useEffect(() => {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("zodiac_open_ready_records_v1") || "[]").map(normalizeRecord);
    } catch (e) {
      saved = [];
    }
    setRecords(uniqRows([...saved, ...FALLBACK_ROWS.map(normalizeRecord)]));
    syncLatest30(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("zodiac_open_ready_records_v1", JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => syncLatest30(true), POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  async function syncLatest30(silent = false) {
    if (isSyncing) return;
    setIsSyncing(true);
    if (!silent) setStatus("正在同步最新30期...");

    try {
      const rows = await fetchLatest30();
      if (!rows.length) throw new Error("没有拿到最新30期");
      setRecords((old) => uniqRows([...old, ...rows]));
      setStatus(`已同步最新30期，最新期号：${rows[0].expect}`);
      setLastCheck(new Date().toLocaleTimeString());
    } catch (err) {
      if (!silent) setStatus(`同步失败：${err.message}。当前使用本地已保存数据。`);
    } finally {
      setIsSyncing(false);
    }
  }

  function importRows() {
    const rows = parseRows(importText);
    if (!rows.length) {
      setStatus("没有识别到有效数据");
      return;
    }
    setRecords((old) => uniqRows([...old, ...rows]));
    setStatus(`成功导入 ${rows.length} 条；预测已按最新30期刷新`);
  }

  function resetLocal() {
    localStorage.removeItem("zodiac_open_ready_records_v1");
    setRecords(uniqRows(FALLBACK_ROWS.map(normalizeRecord)));
    setStatus("已重置本地数据，正在重新同步最新30期...");
    syncLatest30(false);
  }

  function handleImage(file) {
    if (!file) return;
    setStatus("图片已接收；当前网页版不内置OCR，建议把图发给我转JSON，或用系统文字识别后粘贴文本。");
  }

  return (
    <div className="min-h-screen bg-[#070A14] text-slate-100 pb-24">
      <div className="mx-auto max-w-md px-4 pt-[env(safe-area-inset-top)]">
        <div className="sticky top-0 z-20 -mx-4 bg-[#070A14]/85 px-4 pt-3 pb-3 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">最新30期 · 打开即用</div>
              <div className="text-xl font-black tracking-tight">平特一肖预测</div>
            </div>
            <button
              onClick={() => syncLatest30(false)}
              className="rounded-full bg-white text-slate-950 px-4 py-2 text-sm font-bold active:scale-95 transition"
            >
              同步
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3 text-center shadow-lg shadow-black/10">
              <div className="text-xl font-black">{records.length}</div>
              <div className="mt-1 text-[11px] text-slate-400">累计期数</div>
            </div>
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3 text-center shadow-lg shadow-black/10">
              <div className="text-xl font-black">{recent30.length}</div>
              <div className="mt-1 text-[11px] text-slate-400">最新30期</div>
            </div>
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3 text-center shadow-lg shadow-black/10">
              <div className="text-xl font-black">{autoRefresh ? "开" : "关"}</div>
              <div className="mt-1 text-[11px] text-slate-400">自动更新</div>
            </div>
          </div>

          <section className="relative overflow-hidden rounded-[2rem] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/30 via-slate-900 to-slate-950 p-5 shadow-2xl shadow-indigo-950/40">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-indigo-100/80">下一期预测</div>
                <div className="mt-1 text-[11px] text-slate-400">预测 {prediction.expect || "-"} · 基于 {prediction.basedOn || "-"}</div>
              </div>
              <span className="rounded-full bg-black/25 px-3 py-1 text-[11px] text-slate-300 border border-white/10">
                {ping.confidence.level}信心
              </span>
            </div>

            <div className="relative mt-6 text-center">
              <div className="text-xs text-slate-400">平特一肖</div>
              <div className="mt-1 text-[6.5rem] leading-none font-black tracking-tighter drop-shadow-xl">
                {ping.pick.label}
              </div>
              <div className="mt-2 text-xs text-slate-300">分差：{ping.confidence.edge}</div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] bg-white/[0.06] border border-white/10 p-4 shadow-lg shadow-black/10">
              <div className="text-xs text-slate-400">杀一头</div>
              <div className="mt-3 flex items-end justify-between">
                <div className="text-4xl font-black text-orange-200">{prediction.killHead}</div>
                <div className="text-[11px] text-slate-500">排除</div>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white/[0.06] border border-white/10 p-4 shadow-lg shadow-black/10">
              <div className="text-xs text-slate-400">波色选2</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {color.list.slice(0, 2).map((item) => (
                  <span key={item.label} className="rounded-full bg-slate-800/90 px-3 py-1.5 text-sm font-bold border border-white/10">
                    {item.label}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">{color.confidence.level}信心</div>
            </div>

            <div className="rounded-[1.5rem] bg-white/[0.06] border border-white/10 p-4 shadow-lg shadow-black/10">
              <div className="text-xs text-slate-400">大小</div>
              <div className="mt-2 text-5xl font-black">{size.pick.label}</div>
              <div className="mt-1 text-[11px] text-slate-500">{size.confidence.level}信心</div>
            </div>

            <div className="rounded-[1.5rem] bg-white/[0.06] border border-white/10 p-4 shadow-lg shadow-black/10">
              <div className="text-xs text-slate-400">单双</div>
              <div className="mt-2 text-5xl font-black">{parity.pick.label}</div>
              <div className="mt-1 text-[11px] text-slate-500">{parity.confidence.level}信心</div>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-rose-950/25 border border-rose-500/20 p-4 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">杀4肖</div>
              <div className="text-[11px] text-rose-200/70">特码生肖排除</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(prediction.killZodiacs || []).map((z) => (
                <span key={z} className="rounded-2xl bg-rose-950/80 border border-rose-700/60 px-4 py-2 text-xl font-black text-rose-100">
                  {z}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] bg-white/[0.06] border border-white/10 p-4 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">近10期记录</h2>
              <span className="text-[11px] text-slate-500">正确率</span>
            </div>

            <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 whitespace-nowrap">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">肖 {stats.pingRate}%</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">杀头 {stats.killHeadRate}%</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">杀4肖 {stats.killRate}%</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">波 {stats.colorRate}%</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">大小 {stats.sizeRate}%</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">单双 {stats.parityRate}%</span>
            </div>

            <div className="mt-4 space-y-3">
              {history.length === 0 ? (
                <div className="rounded-2xl bg-black/20 p-4 text-sm text-slate-500">数据不足，暂时无法生成记录。</div>
              ) : (
                history.map((item) => (
                  <div key={item.expect} className="rounded-2xl bg-slate-950/70 border border-white/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold">第 {item.expect} 期</div>
                      <div className="text-[11px] text-slate-500">基于 {item.basedOn}</div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs leading-5">
                      <div>一肖：{item.ping} {item.pingHit ? "✅" : "❌"}</div>
                      <div>杀头：{item.killHead} {item.killHeadHit ? "✅" : "❌"}</div>
                      <div className="col-span-2">杀4肖：{(item.killZodiacs || []).join("/")} {item.killHit ? "✅" : "❌"}</div>
                      <div>波色：{(item.colors || []).join("/")} {item.colorHit ? "✅" : "❌"}</div>
                      <div>大小：{item.size} {item.sizeHit ? "✅" : "❌"}</div>
                      <div>单双：{item.parity} {item.parityHit ? "✅" : "❌"}</div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      实际特码：{item.actualNum} {item.actualSpecialZodiac} {item.actualColor} {item.actualSize}{item.actualParity}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <details className="rounded-[1.5rem] bg-white/[0.06] border border-white/10 p-4 shadow-lg shadow-black/10">
            <summary className="cursor-pointer text-base font-bold">数据同步与导入</summary>
            <div className="mt-4 space-y-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImage(e.target.files && e.target.files[0])}
              />

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => syncLatest30(false)} className="rounded-2xl bg-indigo-600 px-3 py-3 text-sm font-bold active:scale-95 transition">🔄 同步30期</button>
                <button onClick={resetLocal} className="rounded-2xl bg-slate-800 px-3 py-3 text-sm font-bold active:scale-95 transition">♻️ 重置</button>
                <button onClick={() => fileRef.current && fileRef.current.click()} className="rounded-2xl bg-emerald-600 px-3 py-3 text-sm font-bold active:scale-95 transition">📷 上传</button>
                <button onClick={importRows} className="rounded-2xl bg-slate-800 px-3 py-3 text-sm font-bold active:scale-95 transition">导入文本</button>
              </div>

              <label className="flex items-center justify-between rounded-2xl bg-slate-950/70 border border-white/10 p-4">
                <div>
                  <div className="text-sm font-bold">自动更新</div>
                  <div className="mt-1 text-xs text-slate-500">页面打开时每30秒检查一次</div>
                </div>
                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="h-5 w-5" />
              </label>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="粘贴JSON或开奖记录文本"
                className="w-full h-28 rounded-2xl bg-slate-950 border border-white/10 p-4 outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm text-slate-100 placeholder:text-slate-600"
              />

              <div className="rounded-2xl bg-slate-950/70 border border-white/10 p-3 text-xs text-slate-400">
                {status} {lastCheck ? `｜${lastCheck}` : ""}
              </div>
            </div>
          </details>

          <details className="rounded-[1.5rem] bg-white/[0.06] border border-white/10 p-4 shadow-lg shadow-black/10">
            <summary className="cursor-pointer text-base font-bold">最新使用数据</summary>
            <div className="mt-4 space-y-2 max-h-80 overflow-auto">
              {recent30.slice(0, 10).map((row) => (
                <div key={row.expect} className="rounded-2xl bg-slate-950/70 border border-white/10 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-bold">第 {row.expect} 期</span>
                    <span className="text-[11px] text-slate-500">{row.openTime}</span>
                  </div>
                  <div className="mt-2 text-slate-300 text-xs">{row.zodiacList.join(" ")}</div>
                  <div className="mt-1 text-slate-600 text-xs">{row.codeList.join(" ")}</div>
                </div>
              ))}
            </div>
          </details>

          <details className="rounded-[1.5rem] bg-white/[0.06] border border-white/10 p-4 shadow-lg shadow-black/10">
            <summary className="cursor-pointer text-base font-bold">模型权重（高级）</summary>
            <div className="mt-4 space-y-5">
              <RatingRows title="平特一肖" models={PING_MODELS} ratings={trained.pingRatings} />
              <RatingRows title="波色" models={CLASS_MODELS} ratings={trained.classRatings.color} />
              <RatingRows title="大小" models={CLASS_MODELS} ratings={trained.classRatings.size} />
              <RatingRows title="单双" models={CLASS_MODELS} ratings={trained.classRatings.parity} />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
