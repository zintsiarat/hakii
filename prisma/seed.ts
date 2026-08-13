import {PrismaClient} from '@prisma/client';
import crypto from 'crypto';
const db=new PrismaClient();
const secret=process.env.SESSION_SECRET||'dev-only-change-me';
const hash=(p:string)=>crypto.createHash('sha256').update(secret+'|'+p).digest('hex');

const permissions=[
 ['users.view','مشاهدة المستخدمين'],['users.manage','إدارة المستخدمين'],['content.view','مشاهدة المحتوى'],['content.moderate','إدارة المحتوى'],['reports.manage','إدارة البلاغات'],['verification.manage','إدارة التوثيق'],['team.manage','إدارة فريق CAMRY'],['roles.manage','إدارة الأدوار والصلاحيات'],['audit.view','مشاهدة سجل العمليات'],['audit.undo','التراجع عن العمليات'],['settings.manage','إدارة إعدادات المنصة']
] as const;

async function main(){
  for(const [key,description] of permissions)await db.permission.upsert({where:{key},update:{description},create:{key,description}});
  const ownerRole=await db.role.upsert({where:{name:'مالك المنصة'},update:{description:'صلاحيات كاملة'},create:{name:'مالك المنصة',description:'صلاحيات كاملة'}});
  for(const [key] of permissions){const perm=await db.permission.findUniqueOrThrow({where:{key}});await db.rolePermission.upsert({where:{roleId_permissionId:{roleId:ownerRole.id,permissionId:perm.id}},update:{},create:{roleId:ownerRole.id,permissionId:perm.id}})}
  const email=(process.env.CAMRY_OWNER_EMAIL||'owner@example.com').toLowerCase();
  const password=process.env.CAMRY_OWNER_PASSWORD||'change-this-password';
  const admin=await db.adminAccount.upsert({where:{email},update:{name:'مالك حَكي',passwordHash:hash(password),status:'ACTIVE'},create:{email,name:'مالك حَكي',passwordHash:hash(password),status:'ACTIVE'}});
  await db.adminRole.upsert({where:{adminId_roleId:{adminId:admin.id,roleId:ownerRole.id}},update:{},create:{adminId:admin.id,roleId:ownerRole.id}});

  const u=await db.user.upsert({where:{email:'demo@haki.local'},update:{},create:{email:'demo@haki.local',username:'haki_demo',displayName:'مستخدم حَكي',passwordHash:hash('demo123456'),hakiId:100000001n}});
  if(!(await db.post.count({where:{authorId:u.id}})))await db.post.createMany({data:[{authorId:u.id,text:'مرحبًا بكم في حَكي 👋'},{authorId:u.id,text:'هذا منشور تجريبي محفوظ في PostgreSQL.'}]});
  console.log('Demo user: demo@haki.local / demo123456');
  console.log(`CAMRY owner: ${email} / ${password}`);
}
main().finally(()=>db.$disconnect());
