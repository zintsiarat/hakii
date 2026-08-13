import {cookies} from 'next/headers';
import crypto from 'crypto';
import {db} from './db';

const secret=process.env.SESSION_SECRET||'dev-only-change-me';
const hash=(v:string)=>crypto.createHash('sha256').update(secret+'|'+v).digest('hex');

export function hashAdminPassword(p:string){return hash(p)}
export function hashAdminToken(t:string){return hash(t)}

export async function createAdminSession(adminId:bigint){
  const raw=crypto.randomBytes(32).toString('hex');
  await db.adminSession.create({data:{adminId,tokenHash:hashAdminToken(raw),expiresAt:new Date(Date.now()+12*60*60*1000)}});
  (await cookies()).set('camry_session',raw,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:12*60*60});
}

export async function currentAdmin(){
  const raw=(await cookies()).get('camry_session')?.value;
  if(!raw)return null;
  const s=await db.adminSession.findUnique({
    where:{tokenHash:hashAdminToken(raw)},
    include:{
      admin:{
        include:{
          roles:{
            include:{
              role:{
                include:{permissions:{include:{permission:true}}}
              }
            }
          }
        }
      }
    }
  });
  if(!s||s.expiresAt.getTime()<Date.now()||s.admin.status!=='ACTIVE'){
    if(s)await db.adminSession.delete({where:{id:s.id}});
    return null;
  }
  return s.admin;
}

export async function requireAdmin(){
  const a=await currentAdmin();
  if(!a)throw new Error('CAMRY_UNAUTHORIZED');
  return a;
}

export async function clearAdminSession(){
  const raw=(await cookies()).get('camry_session')?.value;
  if(raw)await db.adminSession.deleteMany({where:{tokenHash:hashAdminToken(raw)}});
  (await cookies()).delete('camry_session');
}

export function hasPermission(admin:any,key:string){
  if(admin.email===process.env.CAMRY_OWNER_EMAIL)return true;
  return admin.roles?.some((ar:any)=>ar.role?.permissions?.some((rp:any)=>rp.permission.key===key))||false;
}
