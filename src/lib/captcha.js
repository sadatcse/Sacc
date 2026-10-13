// Math captcha for /login (server-only). Stateless: the answer is never sent to the browser — the token
// carries an HMAC of answer + expiry + nonce. Each token works once (nonces are remembered until they expire).
import crypto from 'node:crypto';

const TTL_MS = 10 * 60 * 1000;
const used = new Map(); // nonce → expiry

const sign = (payload) => crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev-captcha').update(`captcha:${payload}`).digest('base64url');
const rand = (min, max) => crypto.randomInt(min, max + 1);

export function createCaptcha() {
  const op = ['+', '-', '×'][rand(0, 2)];
  let a;
  let b;
  if (op === '×') [a, b] = [rand(2, 9), rand(2, 9)];
  else [a, b] = [rand(2, 20), rand(1, 15)];
  if (op === '-' && b > a) [a, b] = [b, a];
  const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
  const expires = Date.now() + TTL_MS;
  const nonce = crypto.randomBytes(9).toString('base64url');
  return { question: `${a} ${op} ${b}`, token: `${expires}.${nonce}.${sign(`${answer}.${expires}.${nonce}`)}` };
}

// true when `answer` solves the question behind `token`; the token is used up either way
export function verifyCaptcha(token, answer) {
  const [expires, nonce, mac] = String(token || '').split('.');
  if (!expires || !nonce || !mac || !(Number(expires) > Date.now()) || used.has(nonce)) return false;
  const now = Date.now();
  for (const [key, exp] of used) if (exp < now) used.delete(key);
  used.set(nonce, Number(expires));
  const value = String(answer ?? '').trim();
  if (!/^\d{1,3}$/.test(value)) return false;
  const expected = Buffer.from(sign(`${Number(value)}.${expires}.${nonce}`));
  const given = Buffer.from(mac);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}
