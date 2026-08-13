import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireAdmin} from '@/lib/admin-auth';

async function getAudit(id:string){
  const a=await db.auditLog.findUnique({where:{id:BigInt(id)}});
  if(!a||!a.targetId||a.targetType!=='post')return null;
  const post=await db.post.findUnique({where:{id:a.targetId},include:{author:{select:{displayName:true,username:true,hakiId:true}}}});
  return {a,post};
}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  try{await requireAdmin();const x=await getAudit((await params).id);if(!x)return NextResponse.json({error:'العملية غير قابلة للمعاينة'},{status:400});return NextResponse.json({id:x.a.id.toString(),action:x.a.action,targetId:x.a.targetId?.toString(),before:x.a.before,after:x.a.after,post:x.post});}
  catch(e:any){return NextResponse.json({error:e?.message||'غير مصرح'},{status:401})}
}

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  try{const admin=await requireAdmin();const x=await getAudit((await params).id);if(!x||!x.post)return NextResponse.json({error:'المنشور غير موجود'},{status:404});const b=(x.a.before||{}) as any;const before={hiddenAt:x.post.hiddenAt?.toISOString()??null,deletedAt:x.post.deletedAt?.toISOString()??null};const after={hiddenAt:b.hiddenAt??null,deletedAt:b.deletedAt??null};await db.$transaction([db.post.update({where:{id:x.a.targetId!},data:{hiddenAt:after.hiddenAt?new Date(after.hiddenAt):null,deletedAt:after.deletedAt?new Date(after.deletedAt):null}}),db.auditLog.create({data:{adminId:admin.id,action:'استعادة حالة سابقة',targetType:'post',targetId:x.a.targetId,before,after,reason:`استعادة العملية #${x.a.id}`}})]);return NextResponse.json({ok:true});}
  catch(e:any){return NextResponse.json({error:e?.message||'غير مصرح'},{status:401})}
}
