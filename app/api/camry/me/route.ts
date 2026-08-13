import {NextResponse} from 'next/server';
import {currentAdmin} from '@/lib/admin-auth';
import {json} from '@/lib/serialize';
export async function GET(){const a=await currentAdmin();return NextResponse.json(json(a?{id:a.id,name:a.name,email:a.email,status:a.status,roles:a.roles.map((r:any)=>({id:r.role.id,name:r.role.name,permissions:r.role.permissions.map((p:any)=>p.permission.key)}))}:null));}
