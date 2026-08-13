import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireAdmin} from '@/lib/admin-auth';
import {json} from '@/lib/serialize';
export async function GET(){try{await requireAdmin();const [users,posts,audit]=await Promise.all([db.user.findMany({orderBy:{createdAt:'desc'},take:100,select:{id:true,hakiId:true,username:true,displayName:true,status:true}}),db.post.findMany({orderBy:{createdAt:'desc'},take:100,select:{id:true,text:true,authorId:true,createdAt:true,hiddenAt:true,deletedAt:true}}),db.auditLog.findMany({orderBy:{createdAt:'desc'},take:100,select:{id:true,action:true,targetType:true,targetId:true,before:true,after:true,createdAt:true}})]);return NextResponse.json(json({users,posts,audit}))}catch(e:any){return NextResponse.json({error:e?.message||'غير مصرح'},{status:401})}}
