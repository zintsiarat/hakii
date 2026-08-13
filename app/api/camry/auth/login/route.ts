import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {createAdminSession,hashAdminPassword} from '@/lib/admin-auth';
const schema=z.object({email:z.string().email(),password:z.string().min(1)});
export async function POST(req:Request){try{const x=schema.parse(await req.json());const admin=await db.adminAccount.findUnique({where:{email:x.email.toLowerCase()}});if(!admin||admin.status!=='ACTIVE'||admin.passwordHash!==hashAdminPassword(x.password))return NextResponse.json({error:'بيانات دخول CAMRY غير صحيحة'},{status:401});await createAdminSession(admin.id);return NextResponse.json({ok:true});}catch(e:any){return NextResponse.json({error:e?.message||'خطأ'},{status:400});}}
