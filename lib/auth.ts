import {cookies} from 'next/headers'; import crypto from 'crypto'; import {db} from './db';
const secret=process.env.SESSION_SECRET||'dev-only-change-me';
export function hashPassword(p:string){return crypto.createHash('sha256').update(secret+'|'+p).digest('hex')}
export function hashToken(t:string){return crypto.createHash('sha256').update(secret+'|'+t).digest('hex')}
export async function createSession(userId:bigint){const raw=crypto.randomBytes(32).toString('hex');await db.session.create({data:{userId,tokenHash:hashToken(raw),expiresAt:new Date(Date.now()+30*864e5)}});(await cookies()).set('haki_session',raw,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:30*86400});}
export async function currentUser(){const raw=(await cookies()).get('haki_session')?.value;if(!raw)return null;const s=await db.session.findUnique({where:{tokenHash:hashToken(raw)},include:{user:true}});if(!s||s.expiresAt.getTime()<Date.now()){if(s)await db.session.delete({where:{id:s.id}});return null}return s.user}
export async function requireUser(){const u=await currentUser();if(!u)throw new Error('UNAUTHORIZED');return u}
export async function clearSession(){const raw=(await cookies()).get('haki_session')?.value;if(raw)await db.session.deleteMany({where:{tokenHash:hashToken(raw)}});(await cookies()).delete('haki_session')}
